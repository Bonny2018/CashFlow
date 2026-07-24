import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  History, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Activity,
  ChevronRight,
  Database,
  Trash2
} from 'lucide-react';
import { 
  createChatSession, 
  getChatSessions, 
  getChatMessages, 
  saveChatMessage, 
  getSecurityAuditLogs,
  updateChatSessionTitle,
  deleteChatSession,
  deleteAllChatSessions
} from '../agent/dbService.js';
import { processAgentRequest } from '../agent/agentEngine.js';
import { isLangSmithActive } from '../agent/langsmithConfig.js';

// Status badge formatter for table cells & text
function renderFormattedCellText(text) {
  if (typeof text !== 'string') return text;

  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  if (upper === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        ⏳ PENDING
      </span>
    );
  }
  if (upper === 'ALLOTTED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        ✅ ALLOTTED
      </span>
    );
  }
  if (upper === 'NOT_ALLOTTED' || upper === 'REJECTED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
        ❌ NOT ALLOTTED
      </span>
    );
  }
  if (upper === 'OPEN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
        🟢 OPEN
      </span>
    );
  }

  return text;
}

// Custom Markdown UI Components mapping
const customMarkdownComponents = {
  h3: ({ children }) => (
    <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mt-3 mb-2">
      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{children}</span>
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-semibold text-emerald-400 mt-2.5 mb-1.5 flex items-center gap-1">
      <span>{children}</span>
    </h4>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-2 pl-1 text-slate-300 text-xs">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 bg-slate-950/40 border border-slate-800/60 p-2 rounded-lg text-[11px] leading-relaxed">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </li>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
      <table className="w-full text-left text-xs border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-800/60 text-slate-200">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-850/60 transition duration-150">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-300">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[11px] whitespace-nowrap">
      {renderFormattedCellText(children)}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  code: ({ inline, children }) => (
    <code className="px-1.5 py-0.5 rounded bg-slate-950 text-teal-300 border border-slate-800 font-mono text-[10px]">
      {children}
    </code>
  ),
  a: ({ href, children }) => {
    const isData = href && href.startsWith('data:');
    return (
      <a
        href={href}
        target={isData ? '_blank' : '_self'}
        download={href && href.startsWith('data:application/') ? 'IPO_Ledger_Export.xlsx' : undefined}
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all font-bold text-xs shadow-md my-1 cursor-pointer"
      >
        <span>{children}</span>
      </a>
    );
  }
};

export default function AgentChatbot({ isOpen, onClose, user }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  const userEmail = user?.email || 'guest@ipoledger.com';

  useEffect(() => {
    if (isOpen) {
      initSession();
    }
  }, [isOpen]);

  const initSession = async () => {
    const fetchedSessions = await getChatSessions(userEmail);
    setSessions(fetchedSessions);

    if (fetchedSessions.length > 0) {
      setActiveSessionId(fetchedSessions[0].id);
      loadMessages(fetchedSessions[0].id);
    } else {
      handleNewSession();
    }

    const logs = await getSecurityAuditLogs();
    setAuditLogs(logs);
  };

  const loadMessages = async (sessionId) => {
    const msgs = await getChatMessages(sessionId);
    setMessages(msgs);
    scrollToBottom();
  };

  const handleNewSession = async () => {
    const newSess = await createChatSession(userEmail, `New Conversation`);
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setMessages([]);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sessionId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await deleteChatSession(sessionId);
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);

    if (sessionId === activeSessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        loadMessages(remaining[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  const handleClearAll = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await deleteAllChatSessions(userEmail);
    setSessions([]);
    setMessages([]);
    setActiveSessionId(null);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (queryText = null) => {
    const query = queryText || inputQuery;
    if (!query.trim() || loading) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const newSess = await createChatSession(userEmail, 'New Conversation');
      setSessions([newSess]);
      targetSessionId = newSess.id;
      setActiveSessionId(newSess.id);
    }

    setInputQuery('');
    setLoading(true);

    // Auto-update session title if it's default
    const activeSess = sessions.find(s => s.id === targetSessionId);
    if (!activeSess || activeSess.title === 'New Conversation' || activeSess.title.startsWith('Chat ')) {
      const newTitle = query.slice(0, 30) + (query.length > 30 ? '...' : '');
      await updateChatSessionTitle(targetSessionId, newTitle);
      setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, title: newTitle } : s));
    }

    const userMsg = await saveChatMessage({
      sessionId: targetSessionId,
      role: 'user',
      content: query
    });

    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    try {
      setActiveTool('Running AI Guardrails & LangGraph Engine...');
      const agentRes = await processAgentRequest({
        sessionId: targetSessionId,
        userEmail,
        userQuery: query
      });

      await loadMessages(targetSessionId);

      if (agentRes.blocked) {
        const logs = await getSecurityAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Agent chat error:', err);
    } finally {
      setLoading(false);
      setActiveTool(null);
      scrollToBottom();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
      expanded ? 'w-[94vw] h-[92vh] max-w-6xl' : 'w-[480px] sm:w-[540px] h-[680px]'
    }`}>
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-slate-100">IPO Ledger AI Assistant</h3>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Guardrails Active</span>
              {isLangSmithActive() && (
                <>
                  <span>•</span>
                  <span className="text-teal-400 font-mono text-[10px]">LangSmith Traced</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            title="View Guardrail Security Audit Logs"
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ${showAuditLogs ? 'bg-slate-800 text-amber-400' : ''}`}
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Chat Sessions History"
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ${showHistory ? 'bg-slate-800 text-emerald-400' : ''}`}
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Minimize' : 'Maximize'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            title="Close Assistant (Saves History)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col min-h-0 bg-slate-950/50">
        
        {/* Sessions Overlay Drawer */}
        {showHistory && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-4 flex flex-col border-b border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-400" />
                Saved Conversations ({sessions.length})
              </h4>
              <div className="flex items-center space-x-2">
                {sessions.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    title="Clear all chat history"
                    className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={handleNewSession}
                  className="flex items-center space-x-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium px-2.5 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No saved conversations found. Click "New Chat" to start one!
                </div>
              ) : (
                sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      loadMessages(s.id);
                      setShowHistory(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer group ${
                      s.id === activeSessionId
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-col flex-1 truncate pr-2">
                      <span className="text-xs font-medium truncate">{s.title}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(s.created_at).toLocaleDateString()} • {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      title="Delete this conversation"
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Guardrail Audit Logs Overlay */}
        {showAuditLogs && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-4 flex flex-col border-b border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                AI Guardrail Security Audit Events
              </h4>
              <button
                onClick={() => setShowAuditLogs(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No guardrail security violations detected yet. All queries clean.
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-400">{log.event_type}</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                        {log.threat_level} THREAT
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                      {log.sanitized_text || log.input_text}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Action: <strong className="text-emerald-400">{log.action_taken}</strong></span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">How can I assist your financial ledger today?</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Powered by LangChain, LangGraph state execution, and real-time AI security guardrails.
              </p>

              {/* Suggestion Chips */}
              <div className="grid grid-cols-1 gap-2 w-full mt-6">
                {[
                  "What is Mohit Jain's balance?",
                  "Which IPO is bought?",
                  "What is my total IPO profit?",
                  "Show recent money transfers.",
                  "Calculate my estimated STCG tax liability for FY 24-25."
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="text-left text-xs bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-emerald-300 p-2.5 rounded-xl transition flex items-center justify-between group"
                  >
                    <span>{chip}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isBlocked = msg.guardrail_status && !msg.guardrail_status.passed;

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[90%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/20 font-medium'
                    : isBlocked
                    ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-bl-none'
                    : 'bg-slate-900/95 border border-slate-800/90 text-slate-200 rounded-bl-none shadow-lg'
                }`}>
                  
                  {/* Rich Markdown UI Component Renderer */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={customMarkdownComponents}
                    >
                      {(msg.content || '').replace(/\n*---\n####\s*📥\s*Download Format Options:[\s\S]*$/m, '').replace(/\*Click either link above[\s\S]*?\*$/m, '')}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator with Tool Status */}
          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs py-2.5 px-3.5 bg-slate-900/80 border border-slate-800 rounded-xl w-fit shadow-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span className="font-mono text-[11px] text-slate-300">
                {activeTool || 'Processing LangGraph agent pipeline...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask AI Assistant about IPOs, parties, balances, or tax..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-400">
              <Database className="w-3 h-3 text-emerald-400" />
              Auto-Saved in DB & History
            </span>
            <span>Guardrail Protected</span>
          </div>
        </div>

      </div>
    </div>
  );
}
