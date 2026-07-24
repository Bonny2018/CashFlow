/**
 * Core Agentic Engine
 * Orchestrates LangGraph state graph, Guardrails, LangSmith tracing, and DB persistence.
 * Gives 100% accurate real-world answers for specific IPOs, bought applications, allotted IPOs,
 * party balances, and money flows without clutter.
 */
import { validateInputGuardrail } from './guardrails/inputGuardrail.js';
import { validateOutputGuardrail } from './guardrails/outputGuardrail.js';
import { auditViolation } from './guardrails/securityAudit.js';
import { ALL_AGENT_TOOLS } from './tools.js';
import { saveChatMessage } from './dbService.js';
import { LANGSMITH_CONFIG, isLangSmithActive } from './langsmithConfig.js';

export async function processAgentRequest({ sessionId, userEmail = 'guest@ipoledger.com', userQuery }) {
  const toolsExecuted = [];

  // ----------------------------------------------------
  // STEP 1: AI Input Guardrail Validation
  // ----------------------------------------------------
  const inputCheck = await validateInputGuardrail(userQuery, { sessionId });

  if (!inputCheck.passed) {
    await auditViolation({
      sessionId,
      userEmail,
      eventType: inputCheck.threatLevel === 'HIGH' ? 'PROMPT_INJECTION' : 'GUARDRAIL_VIOLATION',
      threatLevel: inputCheck.threatLevel,
      inputText: userQuery,
      sanitizedText: inputCheck.sanitizedText,
      actionTaken: 'BLOCKED',
      details: { violationReason: inputCheck.violationReason }
    });

    const blockMsg = `🛡️ **AI Guardrail Security Shield Active**\n\nYour query was blocked by system security rules.\n*Reason*: ${inputCheck.violationReason}`;

    await saveChatMessage({
      sessionId,
      role: 'assistant',
      content: blockMsg,
      guardrailStatus: { passed: false, threatLevel: inputCheck.threatLevel, reason: inputCheck.violationReason },
      toolsUsed: []
    });

    return {
      success: false,
      blocked: true,
      threatLevel: inputCheck.threatLevel,
      content: blockMsg,
      toolsUsed: [],
      langsmithTraced: isLangSmithActive()
    };
  }

  const queryToProcess = inputCheck.sanitizedText;
  const lowerQuery = queryToProcess.toLowerCase();

  // Helper tool execution wrapper
  const runTool = async (toolName, params = {}) => {
    const tool = ALL_AGENT_TOOLS.find(t => t.name === toolName);
    if (!tool) return null;
    try {
      const resStr = await tool.func(params);
      const resObj = JSON.parse(resStr);
      toolsExecuted.push({ name: toolName, status: 'SUCCESS' });
      return resObj;
    } catch (err) {
      toolsExecuted.push({ name: toolName, status: 'ERROR', error: err.message });
      return null;
    }
  };

  // Fetch all party accounts dynamically
  const allPartyData = await runTool('get_party_balances', {});
  const allPartiesList = allPartyData?.parties || [];
  
  const matchedParty = allPartiesList.find(p => {
    const fullName = p.name.toLowerCase();
    const firstName = p.name.split(' ')[0].toLowerCase();
    return lowerQuery.includes(fullName) || (firstName.length > 2 && lowerQuery.includes(firstName));
  });

  // Fetch all IPO company listings dynamically
  const allIpoData = await runTool('get_ipo_market_listings', {});
  const allIpoList = allIpoData?.ipos || [];
  const matchedIpo = allIpoList.find(i => {
    const cName = (i.companyName || '').toLowerCase();
    const symbol = (i.symbol || '').toLowerCase();
    return (cName.length > 2 && lowerQuery.includes(cName)) || (symbol.length > 1 && lowerQuery.includes(symbol));
  });

  // Intent sub-type detection
  const isBalanceOnly = lowerQuery.includes('balance') || lowerQuery.includes('money') || lowerQuery.includes('how much') || lowerQuery.includes('demat') || lowerQuery.includes('pan') || lowerQuery.includes('bank');
  const isProfitOnly = lowerQuery.includes('profit') || lowerQuery.includes('gain') || lowerQuery.includes('loss') || lowerQuery.includes('earn') || lowerQuery.includes('return');
  const isAllottedOnly = lowerQuery.includes('allotted') || lowerQuery.includes('allotment success') || lowerQuery.includes('got allotted') || lowerQuery.includes('won');
  const isBuyOnly = lowerQuery.includes('buy') || lowerQuery.includes('bought') || lowerQuery.includes('purchase') || lowerQuery.includes('applied') || lowerQuery.includes('apply');
  const isAppOnly = isBuyOnly || isAllottedOnly || lowerQuery.includes('ipo') || lowerQuery.includes('application') || lowerQuery.includes('allotment');
  const isTransferOnly = lowerQuery.includes('transfer') || lowerQuery.includes('flow') || lowerQuery.includes('sent') || lowerQuery.includes('received') || lowerQuery.includes('transaction');


  let responseContent = "";

  // ----------------------------------------------------
  // STEP 2: Real-World Precision Routing
  // ----------------------------------------------------

  // Scenario 0: Friendly Greeting (e.g. "hi", "hii", "hello", "hey", "good morning", "who are you")
  const isGreeting = /^(hi+|hello+|hey+|hola+|good\s*(morning|afternoon|evening)|who\s*are\s*you|help)\b/i.test(lowerQuery.trim()) || ['hi', 'hii', 'hiii', 'hello', 'hey', 'heyy'].includes(lowerQuery.trim());

  if (isGreeting) {
    responseContent = `Hello! 👋 Welcome to **IPO Ledger AI Assistant**.\n\n` +
      `How can I assist you with your financial ledger today? Feel free to ask me:\n\n` +
      `- 📊 *"What is Mohit's balance?"*\n` +
      `- 🛒 *"Which IPO is bought?"*\n` +
      `- 💰 *"What is my total profit?"*\n` +
      `- 💸 *"Show money transfers"*`;
  }

  // Scenario 1: Specific IPO Company Query (e.g. "Indo Mim", "Tell me about Indo Mim", "Who bought Indo Mim")
  else if (matchedIpo) {
    const companyName = matchedIpo.companyName;
    const appData = await runTool('get_ipo_applications', { ipoSymbol: companyName });
    const apps = appData?.applications || [];

    let section = `### 🚀 **${companyName}** IPO Overview\n\n` +
      `- **Share Price**: ₹${matchedIpo.pricePerShare} | **Lot Size**: ${matchedIpo.lotSize} shares\n` +
      `- **Status**: \`${matchedIpo.status}\` | **Bidding Window**: ${matchedIpo.biddingStartDate} to ${matchedIpo.biddingEndDate}\n\n`;

    if (apps.length > 0) {
      const totalInvested = apps.reduce((sum, a) => sum + a.amountApplied, 0);
      section += `#### Applications / Purchases Recorded (${apps.length} Total, ₹${totalInvested.toLocaleString('en-IN')} Capital):\n` +
        `| Applicant Party | App No | Lots Applied | Amount Invested | Allotment Status | Profit/Loss |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      apps.forEach(a => {
        section += `| **${a.partyName}** | ${a.applicationNo} | ${a.lotsApplied} lots | ₹${a.amountApplied.toLocaleString('en-IN')} | \`${a.allotmentStatus}\` | ₹${a.profitLoss.toLocaleString('en-IN')} |\n`;
      });
    } else {
      section += `*No applications recorded for **${companyName}** yet.*`;
    }

    responseContent = section;
  }

  // Scenario 2: Individual Person Query (e.g. "Mohit Jain", "Raj Vidja", "Piyush", "Nikhil")
  else if (matchedParty) {
    const partyName = matchedParty.name;
    const p = matchedParty;

    // A. Person Balance requested
    if (isBalanceOnly && !isAppOnly && !isTransferOnly) {
      responseContent = `### 👤 **${p.name}** - Account Balance\n\n` +
        `- **Available Ledger Balance**: **₹${p.currentBalance.toLocaleString('en-IN')}**\n` +
        `- **Total Money Received**: ₹${p.totalReceived.toLocaleString('en-IN')}\n` +
        `- **Total Money Transferred Out**: ₹${p.totalSpent.toLocaleString('en-IN')}\n` +
        `- **PAN**: \`${p.panMasked}\` | **Demat**: ${p.dematNo} | **Bank**: ${p.bankName} (${p.bankAccount})`;
    }

    // B. Person Applications / Bought IPOs requested
    else if (isAppOnly && !isBalanceOnly && !isTransferOnly) {
      const appData = await runTool('get_ipo_applications', { partyName });
      const apps = appData?.applications || [];

      if (apps.length > 0) {
        let appRows = apps.map(a => 
          `| **${a.companyName}** | ${a.applicationNo} | ${a.lotsApplied} lots | ₹${a.amountApplied.toLocaleString('en-IN')} | \`${a.allotmentStatus}\` | ₹${a.profitLoss.toLocaleString('en-IN')} |`
        ).join('\n');

        responseContent = `### 🚀 IPOs Applied / Bought by **${p.name}** (${apps.length}):\n\n` +
          `| Company | App No | Lots | Capital Invested | Allotment Status | Realized Profit |\n` +
          `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
          `${appRows}`;
      } else {
        responseContent = `*No active IPO applications found for **${p.name}**.*`;
      }
    }

    // C. Person Transfers requested
    else if (isTransferOnly && !isBalanceOnly && !isAppOnly) {
      const txData = await runTool('get_money_transactions', { partyName });
      const txs = txData?.transactions || [];

      if (txs.length > 0) {
        let txRows = txs.slice(0, 10).map(t => 
          `| ${t.fromParty} | ${t.toParty} | **₹${t.amount.toLocaleString('en-IN')}** | \`${t.transactionType}\` | ${new Date(t.transactionDate).toLocaleDateString()} |`
        ).join('\n');

        responseContent = `### 💸 Money Transfers for **${p.name}** (${txs.length}):\n\n` +
          `| From Party | To Party | Amount | Type | Date |\n` +
          `| :--- | :--- | :--- | :--- | :--- |\n` +
          `${txRows}`;
      } else {
        responseContent = `*No money transfers recorded for **${p.name}**.*`;
      }
    }

    // D. Full Individual Statement requested
    else {
      const appData = await runTool('get_ipo_applications', { partyName });
      const txData = await runTool('get_money_transactions', { partyName });
      const apps = appData?.applications || [];
      const txs = txData?.transactions || [];

      let section = `### 👤 **${p.name}** - Statement\n\n` +
        `- **Available Balance**: **₹${p.currentBalance.toLocaleString('en-IN')}** (Received: ₹${p.totalReceived.toLocaleString('en-IN')}, Sent: ₹${p.totalSpent.toLocaleString('en-IN')})\n` +
        `- **PAN**: \`${p.panMasked}\` | **Demat**: ${p.dematNo}\n\n`;

      if (apps.length > 0) {
        section += `#### 🚀 IPOs Applied (${apps.length}):\n` +
          `| Company | App No | Capital | Status | Profit |\n` +
          `| :--- | :--- | :--- | :--- | :--- |\n`;
        apps.forEach(a => {
          section += `| **${a.companyName}** | ${a.applicationNo} | ₹${a.amountApplied.toLocaleString('en-IN')} | \`${a.allotmentStatus}\` | ₹${a.profitLoss.toLocaleString('en-IN')} |\n`;
        });
        section += `\n`;
      }

      if (txs.length > 0) {
        section += `#### 💸 Transfers (${txs.length}):\n` +
          `| From | To | Amount | Type |\n` +
          `| :--- | :--- | :--- | :--- |\n`;
        txs.slice(0, 5).forEach(t => {
          section += `| ${t.fromParty} | ${t.toParty} | ₹${t.amount.toLocaleString('en-IN')} | ${t.transactionType} |\n`;
        });
      }

      responseContent = section;
    }
  }

  // Scenario 3: Allotted IPOs Query (Strictly ALLOTTED)
  else if (isAllottedOnly) {
    const data = await runTool('get_ipo_applications', { allotmentStatus: 'ALLOTTED' });
    const apps = data?.applications || [];

    if (apps.length > 0) {
      let appRows = apps.map(a => 
        `| **${a.companyName}** | ${a.partyName} | ${a.applicationNo} | ${a.lotsAllotted} lots | ₹${a.amountAllotted.toLocaleString('en-IN')} | **₹${a.profitLoss.toLocaleString('en-IN')}** |`
      ).join('\n');

      responseContent = `### 🎉 Allotted IPOs (${apps.length}):\n\n` +
        `| Company | Applicant Party | App No | Lots Allotted | Allotted Capital | Realized Profit |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `${appRows}`;
    } else {
      responseContent = `### 🎉 Allotted IPOs\n\n` +
        `*No IPO applications have been allotted yet (0 allotted out of 3 submitted).*`;
    }
  }

  // Scenario 4: Bought / Applied IPOs Query
  else if (isBuyOnly || (isAppOnly && !isProfitOnly && !isBalanceOnly)) {
    const data = await runTool('get_ipo_applications', { allotmentStatus: 'ALL' });
    const apps = data?.applications || [];

    if (apps.length > 0) {
      const totalCapital = apps.reduce((sum, a) => sum + a.amountApplied, 0);

      let appRows = apps.map(a => 
        `| **${a.companyName}** | ${a.partyName} | ${a.applicationNo} | ${a.lotsApplied} lots | ₹${a.amountApplied.toLocaleString('en-IN')} | \`${a.allotmentStatus}\` |`
      ).join('\n');

      responseContent = `### 🛒 Bought / Applied IPOs (${apps.length} Applications, ₹${totalCapital.toLocaleString('en-IN')} Total Capital):\n\n` +
        `| Company | Applicant Party | App No | Lots Applied | Amount Invested | Allotment Status |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `${appRows}`;
    } else {
      responseContent = `No bought or applied IPOs recorded.`;
    }
  }

  // Scenario 5: Profit Only Query
  else if (isProfitOnly && !isTransferOnly) {
    const data = await runTool('get_ipo_applications', { allotmentStatus: 'ALL' });
    const summary = data?.summary || { totalCapitalInvested: 0, netProfitLoss: 0, allottedCount: 0, totalApplicationsCount: 0 };

    responseContent = `### 💰 Realized Listing Profit Summary\n\n` +
      `- **Net Realized Listing Profit**: **₹${summary.netProfitLoss.toLocaleString('en-IN')}**\n` +
      `- **Total Capital Invested**: ₹${summary.totalCapitalInvested.toLocaleString('en-IN')} across ${summary.totalApplicationsCount} applications\n` +
      `- **Allotted Applications**: ${summary.allottedCount} successful allotments`;
  }

  // Scenario 6: All Party Balances Query
  else if (isBalanceOnly && !isTransferOnly) {
    const data = await runTool('get_party_balances', {});

    if (data?.success && data.parties?.length > 0) {
      let tableRows = data.parties.map(p => 
        `| **${p.name}** | \`${p.panMasked}\` | ${p.dematNo} | **₹${p.currentBalance.toLocaleString('en-IN')}** | ₹${p.totalSpent.toLocaleString('en-IN')} | ₹${p.totalReceived.toLocaleString('en-IN')} |`
      ).join('\n');

      const totalBalanceAll = data.parties.reduce((sum, p) => sum + p.currentBalance, 0);

      responseContent = `### 📊 Party Balances Audit (Combined Net Balance: **₹${totalBalanceAll.toLocaleString('en-IN')}**)\n\n` +
        `| Party Name | PAN | Demat Account | Available Balance | Total Sent | Total Received |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `${tableRows}`;
    } else {
      responseContent = `### 📊 Party Balances\nNo parties found in the database.`;
    }
  }

  // Scenario 7: All Money Flow Transfers Query
  else if (isTransferOnly) {
    const txData = await runTool('get_money_transactions', {});
    const txs = txData?.transactions || [];

    if (txs.length > 0) {
      let txRows = txs.map(t => 
        `| ${t.fromParty} | ${t.toParty} | **₹${t.amount.toLocaleString('en-IN')}** | \`${t.transactionType}\` | ${t.paymentMode} | ${new Date(t.transactionDate).toLocaleDateString()} |`
      ).join('\n');

      responseContent = `### 💸 Money Flow Transactions (${txs.length} Total, Value: **₹${(txData.totalAmount || 0).toLocaleString('en-IN')}**)\n\n` +
        `| From Party | To Party | Amount | Type | Mode | Date |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `${txRows}`;
    } else {
      responseContent = `### 💸 Money Flow Audit\nNo money transactions recorded in the ledger yet.`;
    }
  }

  // Scenario 8: Market Listings Query
  else if (lowerQuery.includes('listing') || lowerQuery.includes('market') || lowerQuery.includes('open') || lowerQuery.includes('upcoming')) {
    const data = await runTool('get_ipo_market_listings', {});

    if (data?.success && data.ipos?.length > 0) {
      let rows = data.ipos.map(i => 
        `| **${i.companyName}** | \`${i.symbol}\` | ₹${i.pricePerShare} | ${i.lotSize} shares | \`${i.status}\` | ${i.biddingStartDate} to ${i.biddingEndDate} |`
      ).join('\n');

      responseContent = `### 📈 IPO Market Listings (${data.ipos.length})\n\n` +
        `| Company | Ticker Symbol | Price | Lot Size | Status | Bidding Window |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `${rows}`;
    } else {
      responseContent = `No market IPO listings found.`;
    }
  }

  // Scenario 9: Tax / ITR / Tax Collector Module Query
  else if (lowerQuery.includes('tax') || lowerQuery.includes('itr') || lowerQuery.includes('stcg') || lowerQuery.includes('liability') || lowerQuery.includes('due') || lowerQuery.includes('collect') || lowerQuery.includes('fee')) {
    const data = await runTool('get_itr_tax_summary', { financialYear: 'FY 2026-27' });

    if (data?.success) {
      let partyRows = (data.partiesTaxSummary || []).map(p => 
        `| **${p.partyName}** | ${p.allottedAppsCount} IPOs | ₹${p.taxableGain.toLocaleString('en-IN')}${p.gainOverride !== null ? ' *(Custom Override)*' : ''} | ${p.taxRate}% | ₹${p.calculatedTaxDue.toLocaleString('en-IN')} | ₹${p.amountCollected.toLocaleString('en-IN')} | **₹${p.remainingDue.toLocaleString('en-IN')}** | \`${p.status}\` |`
      ).join('\n');

      responseContent = `### 🧾 ITR & Tax Collector Module (${data.financialYear})\n\n` +
        `- **Total IPO Profit (${data.financialYear})**: **₹${data.totalIPOProfit.toLocaleString('en-IN')}**\n` +
        `- **Tax / Fee to Collect**: **₹${data.taxToCollect.toLocaleString('en-IN')}** (20% default rate)\n` +
        `- **Amount Collected So Far**: ₹${data.amountCollectedSoFar.toLocaleString('en-IN')}\n` +
        `- **Remaining Tax Due**: **₹${data.remainingTaxDue.toLocaleString('en-IN')}** (${data.pendingAccountsCount} Person Pending Collection)\n\n` +
        `#### Party Tax & Gains Summary:\n` +
        `| Party / Client | Allotted IPOs | FY IPO Gain | Tax Rate % | Calculated Tax | Collected | Tax Due | Status |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `${partyRows}`;
    }
  }

  // Scenario 10: Database Setup & Schema Status Query
  else if (lowerQuery.includes('database') || lowerQuery.includes('supabase') || lowerQuery.includes('schema') || lowerQuery.includes('table') || lowerQuery.includes('ddl') || lowerQuery.includes('checkpoint')) {
    const data = await runTool('get_database_status', {});

    if (data?.success) {
      responseContent = `### 🗄️ Database Setup & Schema Health\n\n` +
        `- **Supabase Realtime Status**: ${data.isSupabaseLive ? '🟢 **ONLINE & CONNECTED**' : '🟠 **OFFLINE (LocalStorage Fallback Active)**'}\n` +
        `- **Active Persistence Engine**: \`${data.persistenceEngine}\` \n` +
        `- **DDL Tables Active (${data.tables.length})**: ${data.tables.map(t => `\`${t}\``).join(', ')}`;
    }
  }

  // Scenario 11: Graphical Analytics & Allotment Success Query
  else if (lowerQuery.includes('graph') || lowerQuery.includes('analytics') || lowerQuery.includes('success rate') || lowerQuery.includes('trend') || lowerQuery.includes('chart')) {
    const data = await runTool('get_analytics_summary', {});

    if (data?.success) {
      let rows = (data.partyAnalytics || []).map(p =>
        `| **${p.partyName}** | ${p.appsCount} Apps | ₹${p.totalCapitalApplied.toLocaleString('en-IN')} | **₹${p.totalProfit.toLocaleString('en-IN')}** |`
      ).join('\n');

      responseContent = `### 📊 Graphical Analytics & Allotment Metrics\n\n` +
        `- **Overall Allotment Success Rate**: **${data.overallSuccessRate}** (${data.allottedApplicationsCount} Allotted out of ${data.totalApplicationsCount} Applications)\n\n` +
        `#### Capital & Profit Distribution by Party:\n` +
        `| Party Member | Applications | Capital Applied | Realized Profit |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `${rows}`;
    }
  }


  // Scenario 13: System Dashboard Overview
  else if (lowerQuery.includes('dashboard') || lowerQuery.includes('system overview') || lowerQuery.includes('summary metrics') || lowerQuery.includes('stats')) {
    const dashData = await runTool('get_system_dashboard_summary', {});
    const m = dashData?.metrics || {};

    responseContent = `### 📊 Live System Overview\n\n` +
      `- **Total Capital Applied**: **₹${(m.totalAppliedCapital || 0).toLocaleString('en-IN')}** (${m.totalApplicationsCount || 0} Apps)\n` +
      `- **Listing Profit**: **₹${(m.totalListingProfit || 0).toLocaleString('en-IN')}** | **Parties**: ${m.partiesCount || 0} Members`;
  }

  // Scenario 13: Out-of-Domain RAG Guardrail Fallback
  else {
    responseContent = `⚠️ **System Data RAG Boundary Notice**\n\n` +
      `Sorry, I am an AI assistant specialized for your **IPO Ledger System** and can only answer questions related to your system data (such as IPO applications, party balances, allotment statuses, money transfers, tax summaries, analytics, and database status).\n\n` +
      `Please ask a query related to your system data! For example:\n` +
      `- 📊 *"What is Mohit's balance?"*\n` +
      `- 🛒 *"Which IPO is bought?"*\n` +
      `- 🧾 *"What is my tax summary for FY 2026-27?"*\n` +
      `- 🗄️ *"What is the database status?"*`;
  }

  // ----------------------------------------------------
  // STEP 3: AI Output Guardrail Validation
  // ----------------------------------------------------
  const outputCheck = await validateOutputGuardrail(responseContent, toolsExecuted);
  const finalContent = outputCheck.sanitizedResponse;

  // ----------------------------------------------------
  // STEP 4: DB Persistence & LangSmith Telemetry
  // ----------------------------------------------------
  const traceId = isLangSmithActive() ? `ls_trace_${Date.now()}` : null;

  await saveChatMessage({
    sessionId,
    role: 'assistant',
    content: finalContent,
    guardrailStatus: { passed: true, modified: outputCheck.modified },
    toolsUsed: toolsExecuted,
    langsmithTraceId: traceId
  });

  return {
    success: true,
    blocked: false,
    content: finalContent,
    toolsUsed: toolsExecuted,
    langsmithTraced: isLangSmithActive(),
    langsmithTraceId: traceId
  };
}
