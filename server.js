import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database file
const dbPath = path.join(__dirname, 'ipo_ledger.db');
const db = new Database(dbPath);

console.log(`[SQLite] Connected to SQLite database at ${dbPath}`);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    name TEXT NOT NULL,
    pan TEXT,
    demat_no TEXT,
    bank_name TEXT,
    bank_account TEXT,
    upi_id TEXT,
    initial_balance REAL DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ipos (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    company_name TEXT NOT NULL,
    symbol TEXT,
    price_per_share REAL NOT NULL,
    lot_size INTEGER DEFAULT 1,
    bidding_start_date TEXT,
    bidding_end_date TEXT,
    allotment_date TEXT,
    listing_date TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ipo_applications (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    ipo_id TEXT NOT NULL,
    party_id TEXT NOT NULL,
    application_no TEXT,
    lots_applied INTEGER DEFAULT 1,
    shares_applied INTEGER NOT NULL,
    amount_applied REAL NOT NULL,
    allotment_status TEXT DEFAULT 'PENDING',
    lots_allotted INTEGER DEFAULT 0,
    shares_allotted INTEGER DEFAULT 0,
    amount_allotted REAL DEFAULT 0,
    refund_amount REAL DEFAULT 0,
    profit_loss REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'PAID',
    application_date TEXT,
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS money_transactions (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    application_id TEXT,
    from_party_id TEXT NOT NULL,
    to_party_id TEXT NOT NULL,
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL,
    payment_mode TEXT DEFAULT 'UPI',
    transaction_date TEXT,
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tax_records (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    party_id TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    tax_rate REAL DEFAULT 20,
    fee_per_allotment REAL DEFAULT 0,
    gain_override REAL,
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tax_payments (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    party_id TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT DEFAULT 'UPI',
    payment_date TEXT,
    reference_no TEXT,
    notes TEXT,
    created_at TEXT
  );
`);

// Graceful column migrations for existing databases
try { db.exec("ALTER TABLE parties ADD COLUMN user_email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE ipos ADD COLUMN user_email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE ipo_applications ADD COLUMN user_email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE money_transactions ADD COLUMN user_email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE tax_records ADD COLUMN user_email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE tax_payments ADD COLUMN user_email TEXT;"); } catch (e) {}

// API ROUTE: FETCH ALL DATA
app.get('/api/data', (req, res) => {
  try {
    const parties = db.prepare('SELECT * FROM parties ORDER BY created_at DESC').all();
    const ipos = db.prepare('SELECT * FROM ipos ORDER BY created_at DESC').all();
    const applications = db.prepare('SELECT * FROM ipo_applications ORDER BY application_date DESC').all();
    const transactions = db.prepare('SELECT * FROM money_transactions ORDER BY transaction_date DESC').all();
    const taxRecords = db.prepare('SELECT * FROM tax_records ORDER BY created_at DESC').all();
    const taxPayments = db.prepare('SELECT * FROM tax_payments ORDER BY payment_date DESC').all();

    res.json({ parties, ipos, applications, transactions, taxRecords, taxPayments, database: 'SQLite (ipo_ledger.db)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: WIPE ALL DATA
app.post('/api/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM tax_payments').run();
    db.prepare('DELETE FROM tax_records').run();
    db.prepare('DELETE FROM money_transactions').run();
    db.prepare('DELETE FROM ipo_applications').run();
    db.prepare('DELETE FROM ipos').run();
    db.prepare('DELETE FROM parties').run();

    console.log('[SQLite] All data wiped successfully.');
    res.json({ success: true, message: 'All tables wiped successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT PARTY
app.post('/api/parties', (req, res) => {
  try {
    const p = req.body;
    const stmt = db.prepare(`
      INSERT INTO parties (id, user_email, name, pan, demat_no, bank_name, bank_account, upi_id, initial_balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_email=excluded.user_email,
        name=excluded.name,
        pan=excluded.pan,
        demat_no=excluded.demat_no,
        bank_name=excluded.bank_name,
        bank_account=excluded.bank_account,
        upi_id=excluded.upi_id,
        initial_balance=excluded.initial_balance
    `);
    stmt.run(p.id, p.user_email || null, p.name, p.pan, p.demat_no, p.bank_name, p.bank_account, p.upi_id, p.initial_balance, p.created_at || new Date().toISOString());
    res.json({ success: true, party: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: DELETE PARTY
app.delete('/api/parties/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM parties WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT IPO
app.post('/api/ipos', (req, res) => {
  try {
    const i = req.body;
    const stmt = db.prepare(`
      INSERT INTO ipos (id, user_email, company_name, symbol, price_per_share, lot_size, bidding_start_date, bidding_end_date, allotment_date, listing_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_email=excluded.user_email,
        company_name=excluded.company_name,
        symbol=excluded.symbol,
        price_per_share=excluded.price_per_share,
        lot_size=excluded.lot_size,
        status=excluded.status
    `);
    stmt.run(i.id, i.user_email || null, i.company_name, i.symbol, i.price_per_share, i.lot_size, i.bidding_start_date, i.bidding_end_date, i.allotment_date, i.listing_date, i.status, i.created_at || new Date().toISOString());
    res.json({ success: true, ipo: i });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: DELETE IPO
app.delete('/api/ipos/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM ipos WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT APPLICATION
app.post('/api/applications', (req, res) => {
  try {
    const a = req.body;
    const stmt = db.prepare(`
      INSERT INTO ipo_applications (id, user_email, ipo_id, party_id, application_no, lots_applied, shares_applied, amount_applied, allotment_status, lots_allotted, shares_allotted, amount_allotted, refund_amount, profit_loss, payment_status, application_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_email=excluded.user_email,
        allotment_status=excluded.allotment_status,
        lots_allotted=excluded.lots_allotted,
        shares_allotted=excluded.shares_allotted,
        amount_allotted=excluded.amount_allotted,
        refund_amount=excluded.refund_amount,
        profit_loss=excluded.profit_loss,
        payment_status=excluded.payment_status,
        notes=excluded.notes
    `);
    stmt.run(a.id, a.user_email || null, a.ipo_id, a.party_id, a.application_no, a.lots_applied, a.shares_applied, a.amount_applied, a.allotment_status, a.lots_allotted, a.shares_allotted, a.amount_allotted, a.refund_amount, a.profit_loss, a.payment_status, a.application_date, a.notes, a.created_at || new Date().toISOString());
    res.json({ success: true, application: a });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: DELETE APPLICATION
app.delete('/api/applications/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM ipo_applications WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT TRANSACTION
app.post('/api/transactions', (req, res) => {
  try {
    const t = req.body;
    const stmt = db.prepare(`
      INSERT INTO money_transactions (id, user_email, application_id, from_party_id, to_party_id, amount, transaction_type, payment_mode, transaction_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_email=excluded.user_email,
        amount=excluded.amount,
        notes=excluded.notes
    `);
    stmt.run(t.id, t.user_email || null, t.application_id, t.from_party_id, t.to_party_id, t.amount, t.transaction_type, t.payment_mode, t.transaction_date, t.notes, t.created_at || new Date().toISOString());
    res.json({ success: true, transaction: t });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: DELETE TRANSACTION
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM money_transactions WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT TAX RECORD
app.post('/api/tax-records', (req, res) => {
  try {
    const tr = req.body;
    const stmt = db.prepare(`
      INSERT INTO tax_records (id, user_email, party_id, financial_year, tax_rate, fee_per_allotment, gain_override, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_email=excluded.user_email,
        tax_rate=excluded.tax_rate,
        fee_per_allotment=excluded.fee_per_allotment,
        gain_override=excluded.gain_override,
        notes=excluded.notes
    `);
    stmt.run(tr.id, tr.user_email || null, tr.party_id, tr.financial_year, tr.tax_rate ?? 20, tr.fee_per_allotment ?? 0, tr.gain_override ?? null, tr.notes || '', tr.created_at || new Date().toISOString());
    res.json({ success: true, taxRecord: tr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT TAX PAYMENT
app.post('/api/tax-payments', (req, res) => {
  try {
    const tp = req.body;
    const stmt = db.prepare(`
      INSERT INTO tax_payments (id, user_email, party_id, financial_year, amount, payment_mode, payment_date, reference_no, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_email=excluded.user_email,
        amount=excluded.amount,
        payment_mode=excluded.payment_mode,
        payment_date=excluded.payment_date,
        reference_no=excluded.reference_no,
        notes=excluded.notes
    `);
    stmt.run(tp.id, tp.user_email || null, tp.party_id, tp.financial_year, tp.amount, tp.payment_mode || 'UPI', tp.payment_date || new Date().toISOString(), tp.reference_no || '', tp.notes || '', tp.created_at || new Date().toISOString());
    res.json({ success: true, taxPayment: tp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: DELETE TAX PAYMENT
app.delete('/api/tax-payments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM tax_payments WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 IPO SQLite Database Server running at http://0.0.0.0:${PORT}`);
});
