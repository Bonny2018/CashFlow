# 📊 IPO Pro — Allotment & Money Flow Ledger System

> **A full-stack agentic AI-powered IPO management, money flow tracking, and tax collection platform built with React, LangChain/LangGraph, Supabase, and TailwindCSS.**

---

## 📋 Table of Contents

- [System Overview](#-system-overview)
- [Architecture Diagram](#-architecture-diagram)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Core Modules](#-core-modules)
  - [1. Frontend (React + TailwindCSS)](#1-frontend-react--tailwindcss)
  - [2. AI Agent Engine (LangChain + LangGraph)](#2-ai-agent-engine-langchain--langgraph)
  - [3. Guardrails Security Layer](#3-guardrails-security-layer)
  - [4. Database Layer (Supabase + LocalStorage Fallback)](#4-database-layer-supabase--localstorage-fallback)
  - [5. Authentication & Role Management](#5-authentication--role-management)
- [Database Schema](#-database-schema)
- [AI Chatbot Agent — How It Works](#-ai-chatbot-agent--how-it-works)
- [Pages & Features](#-pages--features)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)

---

## 🏗 System Overview

IPO Pro is a comprehensive IPO management and financial ledger system designed for tracking:

- **IPO Applications** — Track which family members applied for which IPOs, lots, amounts, and allotment results
- **Party/Member Accounts** — Manage PAN, Demat, bank details, and real-time balance calculations
- **Money Flow Transactions** — Full audit trail of inter-party money transfers (UPI, NEFT, Cash)
- **Tax / ITR Management** — Calculate STCG tax liability per party, track payments and dues
- **AI Assistant Chatbot** — Natural language querying of all system data with guardrail protection
- **Graphical Analytics** — Charts and visualizations of IPO performance and financial metrics
- **Excel Sheet View** — Spreadsheet-style data management for power users

---

## 🧩 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Dashboard │ │IPO Apps  │ │Parties   │ │Money Flow│ │ITR/Tax   │    │
│  │  Page    │ │  Page    │ │ Ledger   │ │  Page    │ │ Manager  │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │             │            │             │            │          │
│  ┌────┴─────┐ ┌─────┴────┐ ┌────┴─────┐ ┌────┴─────┐                 │
│  │Graphs &  │ │Excel     │ │Supabase  │ │AI Agent  │                 │
│  │Analytics │ │Grid View │ │Setup     │ │Chatbot   │                 │
│  └──────────┘ └──────────┘ └──────────┘ └────┬─────┘                 │
│                                               │                       │
│  ┌────────────────────┐  ┌────────────────────┤                       │
│  │  Navbar Component  │  │  Auth Modal        │                       │
│  └────────────────────┘  └────────────────────┘                       │
├────────────────────────────────────────────────────────────────────────┤
│                       AI AGENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Agent Engine (agentEngine.js)                 │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐  │  │
│  │  │ Input    │→ │ Intent       │→ │ Tool     │→ │ Output    │  │  │
│  │  │Guardrail │  │ Detection &  │  │Execution │  │ Guardrail │  │  │
│  │  │          │  │ Routing      │  │          │  │           │  │  │
│  │  └──────────┘  └──────────────┘  └──────────┘  └───────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────────────────┐  │
│  │ LangGraph     │ │ LangSmith    │ │ LangChain Structured Tools  │  │
│  │ State Graph   │ │ Tracing      │ │ (8 Financial Tools + Zod)   │  │
│  └───────────────┘ └──────────────┘ └─────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                       │
│  ┌─────────────────────────┐  ┌────────────────────────────────────┐  │
│  │   Supabase (PostgreSQL) │  │  LocalStorage Fallback (Offline)   │  │
│  │  • parties              │  │  • Same data model as Supabase     │  │
│  │  • ipos                 │  │  • Auto-syncs when DB reconnects   │  │
│  │  • ipo_applications     │  │  • Zero-config development mode    │  │
│  │  • money_transactions   │  └────────────────────────────────────┘  │
│  │  • tax_records          │                                          │
│  │  • tax_payments         │  ┌────────────────────────────────────┐  │
│  │  • chat_sessions        │  │  Security Audit Logs               │  │
│  │  • chat_messages        │  │  • Prompt injection attempts       │  │
│  │  • security_audit_logs  │  │  • PII detection events            │  │
│  │  • langgraph_checkpoints│  │  • Output leak prevention          │  │
│  └─────────────────────────┘  └────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | React 18 + Vite | UI framework & dev server |
| **Styling** | TailwindCSS 3 | Utility-first CSS styling |
| **Icons** | Lucide React | Modern icon library |
| **Charts** | Recharts | Data visualization & analytics |
| **Markdown** | React-Markdown + remark-gfm | Rich chatbot response rendering |
| **AI Agent** | LangChain Core + LangGraph | Agentic orchestration pipeline |
| **Tool Schema** | Zod | Runtime type validation for agent tools |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted relational database |
| **Auth** | Supabase Auth + Hardcoded Admin | User authentication & role management |
| **Observability** | LangSmith | Agent tracing & debugging |
| **Deployment** | Vercel | Production hosting |
| **Excel** | SheetJS (xlsx) | Spreadsheet data processing |

---

## 📁 Project Structure

```
RAJ/
├── index.html                      # Entry HTML (Vite SPA)
├── package.json                    # Dependencies & scripts
├── vite.config.js                  # Vite bundler config
├── tailwind.config.js              # TailwindCSS config
├── postcss.config.js               # PostCSS config
├── vercel.json                     # Vercel deployment config
├── .env                            # Environment variables (LangSmith)
├── .env.local                      # Local env overrides (Supabase)
│
├── src/
│   ├── main.jsx                    # React app entry point
│   ├── App.jsx                     # Root component (routing, state, layout)
│   ├── index.css                   # Global styles
│   │
│   ├── components/
│   │   ├── Navbar.jsx              # Top navigation bar with all tabs
│   │   ├── AuthModal.jsx           # Login/Signup modal (Supabase + Admin bypass)
│   │   └── AgentChatbot.jsx        # AI Assistant chat panel (full UI)
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx           # Main dashboard with KPI cards & recent activity
│   │   ├── Applications.jsx        # IPO applications management page
│   │   ├── PartiesLedger.jsx       # Party members & account management
│   │   ├── MoneyFlow.jsx           # Inter-party money transfer tracking
│   │   ├── ITRManager.jsx          # Tax calculation, payments & ITR tracking
│   │   ├── ExcelGrid.jsx           # Spreadsheet-style data grid view
│   │   ├── GraphicalAnalytics.jsx  # Charts & visual analytics
│   │   └── SupabaseSetup.jsx       # Database connection setup page
│   │
│   ├── agent/
│   │   ├── agentEngine.js          # ★ Core agentic engine (intent routing + tool calls)
│   │   ├── tools.js                # LangChain DynamicStructuredTools (8 tools)
│   │   ├── graph.js                # LangGraph StateGraph pipeline definition
│   │   ├── checkpointer.js         # LangGraph state checkpointer (Supabase persistence)
│   │   ├── dbService.js            # Chat session, message & audit DB operations
│   │   ├── langsmithConfig.js      # LangSmith tracing & observability config
│   │   ├── exportUtils.js          # Excel & PDF export utilities
│   │   └── guardrails/
│   │       ├── inputGuardrail.js   # Input validation (injection, PII, length)
│   │       ├── outputGuardrail.js  # Output validation (credential leak, SQL errors)
│   │       └── securityAudit.js    # Centralized security audit event logger
│   │
│   ├── services/
│   │   └── store.js                # Unified data store (Supabase + localStorage)
│   │
│   └── lib/
│       ├── supabase.js             # Supabase client initialization
│       └── schema.sql              # Complete database DDL schema
│
└── server/
    └── index.js                    # Express.js backend (optional)
```

---

## 🧱 Core Modules

### 1. Frontend (React + TailwindCSS)

The frontend is a single-page application (SPA) built with **React 18** and **Vite**.

**Navigation Flow:**
```
App.jsx (Root)
 ├── Navbar.jsx (Tab-based navigation)
 ├── AuthModal.jsx (Login/Signup)
 ├── AgentChatbot.jsx (AI Assistant slide-out panel)
 │
 └── Active Page (based on selected tab):
      ├── Dashboard        → Overview cards, recent applications, quick stats
      ├── Graphs & Charts  → Recharts-based analytics & visualizations
      ├── Excel Sheet      → Spreadsheet-style editable data grid
      ├── IPO Applications → Full CRUD for IPO application management
      ├── Party Accounts   → Member registration, PAN, Demat, bank details
      ├── Money Flow       → Inter-party transfer logging & audit trail
      ├── ITR / Tax        → Tax calculator, payment tracker, due reports
      └── Supabase Setup   → Database connection configuration UI
```

**State Management:**
- All application state lives in `App.jsx` using React `useState` hooks
- Data is fetched on mount via `fetchStoreData()` from the unified store
- CRUD operations flow through `store.js` → Supabase (or localStorage fallback)
- Real-time sync happens via Supabase subscriptions when connected

---

### 2. AI Agent Engine (LangChain + LangGraph)

The AI Agent is the intelligent chatbot that answers natural language questions about system data.

**File:** `src/agent/agentEngine.js`

**Processing Pipeline:**

```
User Query
    │
    ▼
┌─────────────────────────────┐
│  STEP 1: Input Guardrail    │  ← Blocks injections, redacts PII
│  (inputGuardrail.js)        │
└──────────┬──────────────────┘
           │ (passed)
           ▼
┌─────────────────────────────┐
│  STEP 2: Intent Detection   │  ← Keyword matching + entity extraction
│  + Tool Execution           │
│                             │
│  Scenarios Handled:         │
│  1. Party-specific query    │  "What is Mohit's balance?"
│  2. IPO-specific query      │  "Tell me about Indo Mim IPO"
│  3. Allotted IPOs           │  "Which IPOs got allotted?"
│  4. Bought/Applied IPOs     │  "Which IPOs are bought?"
│  5. Profit summary          │  "What is my total profit?"
│  6. Party balances          │  "Show all party balances"
│  7. Money transfers         │  "Show money flow transactions"
│  8. Market listings         │  "What IPOs are open?"
│  9. Tax / ITR summary       │  "What is my tax status?"
│  10. Database status        │  "Is Supabase connected?"
│  11. Analytics queries      │  "Show IPO performance graph"
│  12. Dashboard overview     │  "Show system stats"
│  13. Out-of-domain (RAG)    │  "What is the weather?" → BLOCKED
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  STEP 3: Output Guardrail   │  ← Redacts credentials, hides DB errors
│  (outputGuardrail.js)       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  STEP 4: DB Persistence     │  ← Saves to chat_messages table
│  + LangSmith Telemetry      │     Attaches trace ID for observability
└─────────────────────────────┘
```

**LangChain Structured Tools (8 Tools):**

| # | Tool Name | Description |
|:--|:----------|:------------|
| 1 | `get_party_balances` | Retrieves party details, PAN (masked), demat info, and calculated balances |
| 2 | `get_ipo_applications` | IPO applications with allotment status, profit/loss calculations |
| 3 | `get_money_transactions` | Inter-party money transfer audit log |
| 4 | `get_ipo_market_listings` | All registered IPO companies with bidding windows |
| 5 | `get_itr_tax_summary` | Tax calculations per party for a given financial year |
| 6 | `get_database_status` | Supabase connection health and schema table status |
| 7 | `get_system_dashboard_summary` | Aggregated KPI metrics (capital, profit, parties count) |
| 8 | `get_analytics_data` | Chart-ready data for graphical analytics |

Each tool uses **Zod schema validation** for input parameters and returns JSON responses.

---

### 3. Guardrails Security Layer

The system implements a **dual-layer AI security guardrail system**:

#### Input Guardrail (`inputGuardrail.js`)
```
User Input
    │
    ├── Prompt Injection Detection (10 regex patterns)
    │   • "ignore previous instructions"
    │   • "you are now in DAN mode"
    │   • "reveal system prompt"
    │   • SQL injection patterns
    │   • XSS script tags
    │   → BLOCKED if detected (threat: HIGH)
    │
    ├── PII Sanitization (4 categories)
    │   • PAN Card numbers → [REDACTED_PAN]
    │   • Credit card numbers → [REDACTED_CARD]
    │   • Aadhaar/SSN → [REDACTED_ID]
    │   • API keys → [REDACTED_KEY]
    │   → SANITIZED and allowed through
    │
    └── Length Validation
        • Max 4000 characters
        → BLOCKED if exceeded (threat: MEDIUM)
```

#### Output Guardrail (`outputGuardrail.js`)
```
Agent Response
    │
    ├── Credential Leak Prevention
    │   • Supabase keys (sb_publishable_...)
    │   • JWT tokens (eyJ...)
    │   • Postgres connection strings
    │   • LangChain/OpenAI API keys
    │   → [REDACTED_CREDENTIAL]
    │
    └── Database Error Hiding
        • PostgrestError, SQLState, etc.
        → Generic safe error message
```

#### Security Audit Logger (`securityAudit.js`)
All guardrail events are persisted to the `security_audit_logs` table with:
- Event type (PROMPT_INJECTION, PII_DETECTED, OUTPUT_LEAK_PREVENTED)
- Threat level (LOW, MEDIUM, HIGH, CRITICAL)
- Original input text
- Sanitized text
- Action taken (BLOCKED, SANITIZED, AUDITED)

---

### 4. Database Layer (Supabase + LocalStorage Fallback)

The system uses a **dual-storage architecture** that works both online and offline:

```
Data Request
    │
    ├── Supabase Configured? ──YES──→ PostgreSQL (Cloud)
    │                                  • Full ACID transactions
    │                                  • Row Level Security (RLS)
    │                                  • Real-time subscriptions
    │                                  • Auth integration
    │
    └── NO ──→ LocalStorage (Browser)
               • JSON serialization
               • Zero-config development
               • Automatic fallback
               • Same API interface
```

**Connection Management (`supabase.js`):**
- Reads credentials from `localStorage` (custom override) or `.env` variables
- Validates key format (JWT or `sb_publishable_` prefix)
- Exports `isSupabaseConfigured` flag for runtime switching
- `updateSupabaseCredentials()` allows dynamic reconnection via UI

---

### 5. Authentication & Role Management

```
Login Flow
    │
    ├── Hardcoded Admin Bypass
    │   • admin@gmail.com / admin123 → Full admin access
    │   • mohitjain12104@gmail.com / mohit123 → Full admin access
    │
    ├── Supabase Auth (when configured)
    │   • Email/Password signup & login
    │   • Session persistence via Supabase
    │
    └── Guest Mode
        • Default "User (Your Data View)" role
        • Read access to all data
        • AI chatbot access
```

**Role-Based Access:**
- **Admin**: Full CRUD on all data, AI chatbot, all pages
- **User**: View data, AI chatbot queries, limited write access
- **Guest**: Read-only dashboard view

---

## 🗄 Database Schema

The system uses **10 PostgreSQL tables** in Supabase:

| # | Table | Purpose |
|:--|:------|:--------|
| 1 | `parties` | Family members/clients with PAN, Demat, bank details |
| 2 | `ipos` | IPO company registrations with bidding dates and lot sizes |
| 3 | `ipo_applications` | Applications linking parties → IPOs with allotment tracking |
| 4 | `money_transactions` | Inter-party money transfers with audit trail |
| 5 | `tax_records` | Per-party tax rate overrides and FY-specific settings |
| 6 | `tax_payments` | Individual tax/fee payment records |
| 7 | `chat_sessions` | AI chatbot conversation sessions |
| 8 | `chat_messages` | Individual chat messages with guardrail status metadata |
| 9 | `security_audit_logs` | AI security events (injections, PII, leaks) |
| 10 | `langgraph_checkpoints` | LangGraph persistent state checkpoints |

**Entity Relationship:**
```
parties ──┬── ipo_applications ──── ipos
          ├── money_transactions (from_party_id, to_party_id)
          ├── tax_records
          └── tax_payments

chat_sessions ──── chat_messages
               └── security_audit_logs

langgraph_checkpoints (standalone)
```

All tables have **Row Level Security (RLS)** enabled with open policies (family-use app with admin bypass authentication).

---

## 🤖 AI Chatbot Agent — How It Works

### Chat Session Management

```
User Opens Chatbot
    │
    ├── Load existing sessions from DB
    ├── Create new session (or resume last)
    ├── Display message history
    │
    └── User types query
         │
         ├── Save user message to DB
         ├── processAgentRequest() ← Agent Engine
         ├── Save assistant response to DB
         └── Render response with ReactMarkdown
```

### Conversation Persistence
- **Sessions**: Stored in `chat_sessions` table, identified by UUID
- **Messages**: Stored in `chat_messages` with role, content, guardrail status, tools used
- **History**: Users can view past sessions, switch between them, delete sessions
- **Clear All**: Wipes all sessions and messages for the user

### Response Rendering
- **ReactMarkdown** with GitHub-flavored markdown (tables, bold, code, lists)
- Custom styled components for headers, tables, list items, code blocks
- Real-time "thinking" indicator with tool execution status

---

## 📄 Pages & Features

### 1. Dashboard (`Dashboard.jsx`)
- KPI cards: Total Applied, Allotted Value, Refund Received
- Recent Applications & Allotments table
- Quick navigation to other sections

### 2. IPO Applications (`Applications.jsx`)
- Full CRUD for IPO applications
- Apply for IPOs with party selection, lot size, amount
- Track allotment status (PENDING → ALLOTTED / NOT_ALLOTTED)
- Profit/loss calculation per application

### 3. Party Accounts (`PartiesLedger.jsx`)
- Register family members with PAN, Demat, bank details
- View calculated balances (initial + received - sent)
- Edit and delete party records

### 4. Money Flow (`MoneyFlow.jsx`)
- Log inter-party money transfers
- Support for UPI, NEFT, Cash, Cheque payment modes
- Transaction types: IPO_FUNDING, REFUND, PROFIT_SHARE, etc.
- Full audit trail with timestamps

### 5. ITR / Tax Manager (`ITRManager.jsx`)
- Automatic STCG tax calculation per party
- Custom tax rates and gain overrides
- Payment tracking with reference numbers
- Dues summary and pending collection reports

### 6. Graphs & Charts (`GraphicalAnalytics.jsx`)
- Recharts-based interactive visualizations
- IPO application trends, profit distribution
- Party-wise capital allocation breakdown

### 7. Excel Sheet (`ExcelGrid.jsx`)
- Spreadsheet-style data grid for power users
- Sortable, filterable columns
- Quick data entry mode

### 8. Supabase Setup (`SupabaseSetup.jsx`)
- Live database connection status
- Credential input for Supabase URL & Anon Key
- Schema health verification
- One-click reconnection

---

## 🔐 Environment Variables

### `.env` (LangSmith Tracing)
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=ipo-ledger-agent
```

### `.env.local` (Supabase)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (optional — works offline with localStorage)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd RAJ

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your LangSmith and Supabase credentials

# Start development server
npm run dev
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor in Supabase Dashboard
3. Copy and paste the contents of `src/lib/schema.sql`
4. Execute the SQL to create all tables with RLS policies
5. Copy your Supabase URL and Anon Key to `.env.local`

### Running

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)

# Production build
npm run build        # Build for production
npm run preview      # Preview production build locally
```

---

## 🌐 Deployment

The app is configured for **Vercel** deployment:

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Deploy with:
```bash
vercel --prod
```

---

## 📊 System Data Flow Summary

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│   User   │───→│  React   │───→│  Store.js    │───→│ Supabase │
│ Browser  │←───│  Pages   │←───│  (Unified)   │←───│PostgreSQL│
└──────────┘    └──────────┘    └──────────────┘    └──────────┘
     │                                                    ▲
     │          ┌──────────┐    ┌──────────────┐          │
     └─────────→│ AI Agent │───→│  LangChain   │──────────┘
                │ Chatbot  │←───│  Tools       │
                └──────────┘    └──────────────┘
                     │
              ┌──────┴──────┐
              │  Guardrails │
              │  Security   │
              └─────────────┘
```

---

**Built with ❤️ for IPO portfolio management and financial tracking.**
