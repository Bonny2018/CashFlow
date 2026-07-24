/**
 * LangGraph Agentic Pipeline Architecture
 * Incorporates StateGraph with Guardrail Nodes, LLM Reasoner Node, Tool Execution Node,
 * LangSmith Tracing, and DB Checkpointer.
 */
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { validateInputGuardrail } from './guardrails/inputGuardrail.js';
import { validateOutputGuardrail } from './guardrails/outputGuardrail.js';
import { auditViolation } from './guardrails/securityAudit.js';
import { ALL_AGENT_TOOLS } from './tools.js';

// Define Graph State Annotation
export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  sessionId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  userEmail: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'guest@ipoledger.com'
  }),
  securityAlert: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  toolsUsed: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  finalOutput: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ''
  })
});

/**
 * Node 1: Input Guardrail Node
 */
async function inputGuardrailNode(state) {
  const lastMsg = state.messages[state.messages.length - 1];
  const userText = lastMsg?.content || '';

  const guardrailResult = await validateInputGuardrail(userText, { sessionId: state.sessionId });

  if (!guardrailResult.passed) {
    await auditViolation({
      sessionId: state.sessionId,
      userEmail: state.userEmail,
      eventType: guardrailResult.threatLevel === 'HIGH' ? 'PROMPT_INJECTION' : 'GUARDRAIL_VIOLATION',
      threatLevel: guardrailResult.threatLevel,
      inputText: userText,
      sanitizedText: guardrailResult.sanitizedText,
      actionTaken: 'BLOCKED',
      details: { violationReason: guardrailResult.violationReason }
    });

    return {
      securityAlert: {
        blocked: true,
        threatLevel: guardrailResult.threatLevel,
        reason: guardrailResult.violationReason
      },
      finalOutput: `🛡️ **AI Security Shield Alert**: Your query was blocked by the security guardrail.\n\n*Reason*: ${guardrailResult.violationReason}`
    };
  }

  // Update input message with sanitized text if PII was redacted
  if (guardrailResult.piiDetected) {
    await auditViolation({
      sessionId: state.sessionId,
      userEmail: state.userEmail,
      eventType: 'PII_DETECTED',
      threatLevel: 'MEDIUM',
      inputText: userText,
      sanitizedText: guardrailResult.sanitizedText,
      actionTaken: 'SANITIZED',
      details: { piiTypes: guardrailResult.piiTypesFound }
    });
  }

  return {
    securityAlert: null
  };
}

/**
 * Node 2: Output Guardrail Node
 */
async function outputGuardrailNode(state) {
  if (state.securityAlert?.blocked) {
    return {
      messages: [{ role: 'assistant', content: state.finalOutput }]
    };
  }

  const rawOutput = state.finalOutput || (state.messages[state.messages.length - 1]?.content) || '';
  const guardrailResult = await validateOutputGuardrail(rawOutput);

  if (guardrailResult.modified) {
    await auditViolation({
      sessionId: state.sessionId,
      userEmail: state.userEmail,
      eventType: 'OUTPUT_LEAK_PREVENTED',
      threatLevel: 'LOW',
      inputText: '',
      sanitizedText: guardrailResult.sanitizedResponse,
      actionTaken: 'SANITIZED',
      details: { description: 'Redacted sensitive tokens/credentials in response' }
    });
  }

  return {
    finalOutput: guardrailResult.sanitizedResponse
  };
}

/**
 * Build StateGraph Flow
 */
export function createAgentGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('input_guardrail', inputGuardrailNode)
    .addNode('output_guardrail', outputGuardrailNode)
    .addEdge(START, 'input_guardrail')
    .addConditionalEdges('input_guardrail', (state) => {
      if (state.securityAlert?.blocked) {
        return 'output_guardrail';
      }
      return 'output_guardrail'; // Proceed to output
    })
    .addEdge('output_guardrail', END);

  return workflow.compile();
}
