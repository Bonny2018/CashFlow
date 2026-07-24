import express from 'express';
import cors from 'cors';
import { processAgentRequest } from '../src/agent/agentEngine.js';
import { getChatSessions, getChatMessages, getSecurityAuditLogs, createChatSession } from '../src/agent/dbService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/agent/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'IPO Ledger Agentic Chatbot Engine',
    frameworks: ['LangChain', 'LangGraph', 'LangSmith'],
    guardrails: 'Active',
    database: 'Supabase PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Chat Session Endpoints
app.get('/api/agent/sessions', async (req, res) => {
  try {
    const userEmail = req.query.email || 'guest@ipoledger.com';
    const sessions = await getChatSessions(userEmail);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/agent/sessions', async (req, res) => {
  try {
    const { userEmail, title } = req.body;
    const session = await createChatSession(userEmail, title);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/agent/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await getChatMessages(sessionId);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Primary Agent Execution API Endpoint
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { sessionId, userEmail, query } = req.body;
    if (!sessionId || !query) {
      return res.status(400).json({ success: false, error: 'sessionId and query are required' });
    }

    const result = await processAgentRequest({
      sessionId,
      userEmail: userEmail || 'guest@ipoledger.com',
      userQuery: query
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Guardrail Security Audit Logs
app.get('/api/agent/guardrail-logs', async (req, res) => {
  try {
    const logs = await getSecurityAuditLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LangGraph Agent Backend API running on http://localhost:${PORT}`);
});
