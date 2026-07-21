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
`);

// API ROUTE: FETCH ALL DATA
app.get('/api/data', (req, res) => {
  try {
    const parties = db.prepare('SELECT * FROM parties ORDER BY created_at DESC').all();
    const ipos = db.prepare('SELECT * FROM ipos ORDER BY created_at DESC').all();
    const applications = db.prepare('SELECT * FROM ipo_applications ORDER BY application_date DESC').all();
    const transactions = db.prepare('SELECT * FROM money_transactions ORDER BY transaction_date DESC').all();

    res.json({ parties, ipos, applications, transactions, database: 'SQLite (ipo_ledger.db)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: WIPE ALL DATA
app.post('/api/reset', (req, res) => {
  try {
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
      INSERT INTO parties (id, name, pan, demat_no, bank_name, bank_account, upi_id, initial_balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        pan=excluded.pan,
        demat_no=excluded.demat_no,
        bank_name=excluded.bank_name,
        bank_account=excluded.bank_account,
        upi_id=excluded.upi_id,
        initial_balance=excluded.initial_balance
    `);
    stmt.run(p.id, p.name, p.pan, p.demat_no, p.bank_name, p.bank_account, p.upi_id, p.initial_balance, p.created_at || new Date().toISOString());
    res.json({ success: true, party: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT IPO
app.post('/api/ipos', (req, res) => {
  try {
    const i = req.body;
    const stmt = db.prepare(`
      INSERT INTO ipos (id, company_name, symbol, price_per_share, lot_size, bidding_start_date, bidding_end_date, allotment_date, listing_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        company_name=excluded.company_name,
        symbol=excluded.symbol,
        price_per_share=excluded.price_per_share,
        lot_size=excluded.lot_size,
        status=excluded.status
    `);
    stmt.run(i.id, i.company_name, i.symbol, i.price_per_share, i.lot_size, i.bidding_start_date, i.bidding_end_date, i.allotment_date, i.listing_date, i.status, i.created_at || new Date().toISOString());
    res.json({ success: true, ipo: i });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT APPLICATION
app.post('/api/applications', (req, res) => {
  try {
    const a = req.body;
    const stmt = db.prepare(`
      INSERT INTO ipo_applications (id, ipo_id, party_id, application_no, lots_applied, shares_applied, amount_applied, allotment_status, lots_allotted, shares_allotted, amount_allotted, refund_amount, profit_loss, payment_status, application_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        allotment_status=excluded.allotment_status,
        lots_allotted=excluded.lots_allotted,
        shares_allotted=excluded.shares_allotted,
        amount_allotted=excluded.amount_allotted,
        refund_amount=excluded.refund_amount,
        profit_loss=excluded.profit_loss,
        payment_status=excluded.payment_status,
        notes=excluded.notes
    `);
    stmt.run(a.id, a.ipo_id, a.party_id, a.application_no, a.lots_applied, a.shares_applied, a.amount_applied, a.allotment_status, a.lots_allotted, a.shares_allotted, a.amount_allotted, a.refund_amount, a.profit_loss, a.payment_status, a.application_date, a.notes, a.created_at || new Date().toISOString());
    res.json({ success: true, application: a });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ROUTE: UPSERT TRANSACTION
app.post('/api/transactions', (req, res) => {
  try {
    const t = req.body;
    const stmt = db.prepare(`
      INSERT INTO money_transactions (id, application_id, from_party_id, to_party_id, amount, transaction_type, payment_mode, transaction_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        amount=excluded.amount,
        notes=excluded.notes
    `);
    stmt.run(t.id, t.application_id, t.from_party_id, t.to_party_id, t.amount, t.transaction_type, t.payment_mode, t.transaction_date, t.notes, t.created_at || new Date().toISOString());
    res.json({ success: true, transaction: t });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 IPO SQLite Database Server running at http://localhost:${PORT}`);
});
