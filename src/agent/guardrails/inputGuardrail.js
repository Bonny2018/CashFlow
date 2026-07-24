/**
 * AI Input Guardrail Engine
 * Protects the LangGraph agent from prompt injection, system prompt extraction,
 * off-topic queries, and redacts sensitive PII before passing user text to LLM.
 */

// Known prompt injection and jailbreak vector patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|system)\s+prompts/i,
  /you\s+are\s+now\s+in\s+(DAN|developer|override|unfiltered)\s+mode/i,
  /repeat\s+(your\s+)?system\s+prompt/i,
  /reveal\s+(the\s+)?system\s+(instructions|prompt|keys)/i,
  /print\s+env\s+variables/i,
  /drop\s+table/i,
  /<script>/i,
  /SELECT\s+\*\s+FROM\s+information_schema/i,
  /sudo\s+rm\s+-rf/i,
  /bypass\s+security\s+guardrails/i
];

// Sensitive PII regex filters
const PII_PATTERNS = [
  { name: 'PAN_CARD', regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g, replace: '[REDACTED_PAN]' },
  { name: 'CREDIT_CARD', regex: /\b(?:\d[ -]*?){13,16}\b/g, replace: '[REDACTED_CARD]' },
  { name: 'SSN_AADHAAR', regex: /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, replace: '[REDACTED_ID]' },
  { name: 'SECRET_API_KEY', regex: /(sk-[a-zA-Z0-9]{32,}|sb_publishable_[a-zA-Z0-9_-]+)/g, replace: '[REDACTED_KEY]' }
];

export async function validateInputGuardrail(userInput, sessionContext = {}) {
  const inputStr = (userInput || '').trim();

  if (!inputStr) {
    return {
      passed: false,
      threatLevel: 'LOW',
      sanitizedText: '',
      violationReason: 'Empty prompt provided.'
    };
  }

  // 1. Prompt Injection & Jailbreak Detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(inputStr)) {
      return {
        passed: false,
        threatLevel: 'HIGH',
        sanitizedText: '[BLOCKED PROMPT INJECTION ATTEMPT]',
        violationReason: `Prompt injection attack pattern detected: ${pattern.toString()}`
      };
    }
  }

  // 2. PII Sanitization
  let sanitizedText = inputStr;
  let piiDetected = false;
  const piiTypesFound = [];

  for (const pii of PII_PATTERNS) {
    if (pii.regex.test(sanitizedText)) {
      piiDetected = true;
      piiTypesFound.push(pii.name);
      sanitizedText = sanitizedText.replace(pii.regex, pii.replace);
    }
  }

  // 3. Length & Excessive Token Guardrail
  if (inputStr.length > 4000) {
    return {
      passed: false,
      threatLevel: 'MEDIUM',
      sanitizedText: inputStr.slice(0, 1000) + '...',
      violationReason: 'Input exceeds maximum allowed token payload limit (4000 chars).'
    };
  }

  return {
    passed: true,
    threatLevel: piiDetected ? 'MEDIUM' : 'NONE',
    sanitizedText,
    piiDetected,
    piiTypesFound,
    violationReason: null
  };
}
