/**
 * LangSmith Tracing & Observability Configuration
 * Enables tracing for LangChain models, tools, and LangGraph agent runs.
 */

const getEnvVar = (nodeKey, viteKey, defaultVal = '') => {
  if (typeof process !== 'undefined' && process.env?.[nodeKey]) {
    return process.env[nodeKey];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.[viteKey]) {
    return import.meta.env[viteKey];
  }
  return defaultVal;
};

export const LANGSMITH_CONFIG = {
  tracingEnabled: getEnvVar('LANGCHAIN_TRACING_V2', 'VITE_LANGCHAIN_TRACING_V2', 'true') === 'true',
  endpoint: getEnvVar('LANGCHAIN_ENDPOINT', 'VITE_LANGCHAIN_ENDPOINT', 'https://api.smith.langchain.com'),
  apiKey: getEnvVar('LANGCHAIN_API_KEY', 'VITE_LANGCHAIN_API_KEY', ''),
  project: getEnvVar('LANGCHAIN_PROJECT', 'VITE_LANGCHAIN_PROJECT', 'ipo-ledger-agent')
};

export function isLangSmithActive() {
  return Boolean(LANGSMITH_CONFIG.apiKey && LANGSMITH_CONFIG.apiKey.length > 5);
}

export function getLangSmithRunMetadata(sessionId, userEmail) {
  return {
    tags: ['ipo-ledger', 'agentic-chatbot', 'langgraph', 'guardrails-v1'],
    metadata: {
      session_id: sessionId,
      user_email: userEmail,
      environment: 'production',
      app: 'IPO Ledger Pro'
    }
  };
}
