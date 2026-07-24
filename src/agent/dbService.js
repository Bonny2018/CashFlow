import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

// Local storage fallbacks when Supabase is unconfigured/offline
const LOCAL_SESSIONS_KEY = 'IPO_CHAT_SESSIONS';
const LOCAL_MESSAGES_KEY = 'IPO_CHAT_MESSAGES';
const LOCAL_AUDIT_LOGS_KEY = 'IPO_SECURITY_AUDIT_LOGS';
const LOCAL_CHECKPOINTS_KEY = 'IPO_LANGGRAPH_CHECKPOINTS';

function getLocalItem(key, defaultValue = []) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    }
    return defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function setLocalItem(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// ----------------------------------------------------
// Chat Sessions Management
// ----------------------------------------------------
export async function createChatSession(userEmail = 'guest@ipoledger.com', title = 'New Chat Session') {
  const newSession = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Date.now(),
    user_email: userEmail,
    title,
    system_prompt_version: 'v1.0',
    metadata: { created_by: 'AgentChatbot' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([newSession])
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase session create failed, fallback to local:', err);
    }
  }

  // Fallback to localStorage
  const sessions = getLocalItem(LOCAL_SESSIONS_KEY, []);
  sessions.unshift(newSession);
  setLocalItem(LOCAL_SESSIONS_KEY, sessions);
  return newSession;
}

export async function getChatSessions(userEmail = 'guest@ipoledger.com') {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('Supabase fetch sessions failed, fallback to local:', err);
    }
  }

  return getLocalItem(LOCAL_SESSIONS_KEY, []);
}

export async function updateChatSessionTitle(sessionId, title) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (err) {
      console.warn('Supabase update session title error:', err);
    }
  }

  const sessions = getLocalItem(LOCAL_SESSIONS_KEY, []);
  const updated = sessions.map(s => s.id === sessionId ? { ...s, title, updated_at: new Date().toISOString() } : s);
  setLocalItem(LOCAL_SESSIONS_KEY, updated);
}

export async function deleteChatSession(sessionId) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('chat_messages').delete().eq('session_id', sessionId);
      await supabase.from('chat_sessions').delete().eq('id', sessionId);
    } catch (err) {
      console.warn('Supabase delete session error:', err);
    }
  }

  const sessions = getLocalItem(LOCAL_SESSIONS_KEY, []);
  const filteredSessions = sessions.filter(s => s.id !== sessionId);
  setLocalItem(LOCAL_SESSIONS_KEY, filteredSessions);

  const messages = getLocalItem(LOCAL_MESSAGES_KEY, []);
  const filteredMessages = messages.filter(m => m.session_id !== sessionId);
  setLocalItem(LOCAL_MESSAGES_KEY, filteredMessages);
}

export async function deleteAllChatSessions(userEmail = 'guest@ipoledger.com') {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('chat_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('Supabase clear all sessions error:', err);
    }
  }

  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(LOCAL_SESSIONS_KEY);
      localStorage.removeItem(LOCAL_MESSAGES_KEY);
    }
  } catch (err) {
    console.error('LocalStorage removeItem error:', err);
  }
}

// ----------------------------------------------------
// Chat Messages Persistence
// ----------------------------------------------------
export async function saveChatMessage({ sessionId, role, content, guardrailStatus = { passed: true }, toolsUsed = [], langsmithTraceId = null }) {
  const msgObj = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    session_id: sessionId,
    role,
    content,
    guardrail_status: guardrailStatus,
    tools_used: toolsUsed,
    langsmith_trace_id: langsmithTraceId,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([msgObj])
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase save message error:', err);
    }
  }

  const allMsgs = getLocalItem(LOCAL_MESSAGES_KEY, []);
  allMsgs.push(msgObj);
  setLocalItem(LOCAL_MESSAGES_KEY, allMsgs);
  return msgObj;
}

export async function getChatMessages(sessionId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase get messages error:', err);
    }
  }

  const allMsgs = getLocalItem(LOCAL_MESSAGES_KEY, []);
  return allMsgs.filter(m => m.session_id === sessionId);
}

// ----------------------------------------------------
// AI Security Audit Logs
// ----------------------------------------------------
export async function logSecurityAuditEvent({ sessionId = null, userEmail = 'guest@ipoledger.com', eventType, threatLevel = 'MEDIUM', inputText, sanitizedText, actionTaken, details = {} }) {
  const auditEvent = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'audit_' + Date.now(),
    session_id: sessionId,
    user_email: userEmail,
    event_type: eventType,
    threat_level: threatLevel,
    input_text: inputText,
    sanitized_text: sanitizedText,
    action_taken: actionTaken,
    details,
    timestamp: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('security_audit_logs').insert([auditEvent]);
    } catch (err) {
      console.warn('Supabase security log insert error:', err);
    }
  }

  const logs = getLocalItem(LOCAL_AUDIT_LOGS_KEY, []);
  logs.unshift(auditEvent);
  setLocalItem(LOCAL_AUDIT_LOGS_KEY, logs.slice(0, 100)); // keep last 100
  return auditEvent;
}

export async function getSecurityAuditLogs() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase get audit logs error:', err);
    }
  }

  return getLocalItem(LOCAL_AUDIT_LOGS_KEY, []);
}

// ----------------------------------------------------
// LangGraph State Checkpointer Database Storage
// ----------------------------------------------------
export async function saveLangGraphCheckpoint(threadId, checkpointNs, checkpointId, checkpointData, parentCheckpointId = null, metadata = {}) {
  const row = {
    thread_id: threadId,
    checkpoint_ns: checkpointNs || '',
    checkpoint_id: checkpointId,
    parent_checkpoint_id: parentCheckpointId,
    checkpoint: checkpointData,
    metadata,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('langgraph_checkpoints').upsert([row]);
    } catch (err) {
      console.warn('Supabase save checkpoint error:', err);
    }
  }

  const checkpoints = getLocalItem(LOCAL_CHECKPOINTS_KEY, {});
  const key = `${threadId}:${checkpointNs || ''}:${checkpointId}`;
  checkpoints[key] = row;
  setLocalItem(LOCAL_CHECKPOINTS_KEY, checkpoints);
}

export async function getLangGraphCheckpoint(threadId, checkpointNs, checkpointId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('langgraph_checkpoints')
        .select('*')
        .eq('thread_id', threadId)
        .eq('checkpoint_ns', checkpointNs || '')
        .eq('checkpoint_id', checkpointId)
        .maybeSingle();
      if (!error && data) return data.checkpoint;
    } catch (err) {
      console.warn('Supabase get checkpoint error:', err);
    }
  }

  const checkpoints = getLocalItem(LOCAL_CHECKPOINTS_KEY, {});
  const key = `${threadId}:${checkpointNs || ''}:${checkpointId}`;
  return checkpoints[key]?.checkpoint || null;
}
