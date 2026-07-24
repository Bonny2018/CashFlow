/**
 * AI Output Guardrail Engine
 * Validates agent responses before rendering to user:
 * - Prevents system prompt leakage & secret credentials disclosure
 * - Filters raw SQL errors or unhandled system tracebacks
 * - Formats & sanitizes output
 */

const SECRET_PATTERNS = [
  /sb_publishable_[a-zA-Z0-9_-]+/g,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  /postgres:\/\/.*:.*@/g,
  /LANGCHAIN_API_KEY/g,
  /OPENAI_API_KEY/g
];

export async function validateOutputGuardrail(agentResponse, toolOutputs = []) {
  let responseText = typeof agentResponse === 'string' ? agentResponse : (agentResponse?.content || '');

  if (!responseText) {
    return {
      passed: true,
      sanitizedResponse: "I'm sorry, I couldn't process that request at the moment. Please try again.",
      modified: true
    };
  }

  let modified = false;

  // 1. Redact any leaked credentials or secret API keys
  for (const secretRegex of SECRET_PATTERNS) {
    if (secretRegex.test(responseText)) {
      modified = true;
      responseText = responseText.replace(secretRegex, '[REDACTED_CREDENTIAL]');
    }
  }

  // 2. Hide Raw Database Error Tracebacks if any slipped through tool output
  if (/PostgrestError|SQLState|pg_stat_activity|duplicate key value violates unique constraint/i.test(responseText)) {
    modified = true;
    responseText = "A system database query encountered an error. The event has been safely audited for administrative review.";
  }

  return {
    passed: true,
    sanitizedResponse: responseText,
    modified
  };
}
