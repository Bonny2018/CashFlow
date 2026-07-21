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

// Seed Initial Data if database is empty
const partyCount = db.prepare('SELECT COUNT(*) as count FROM parties').get().count;
if (partyCount === 0) {
  console.log('[SQLite] Seeding initial database data...');

  const insertParty = db.prepare(`
    INSERT INTO parties (id, name, pan, demat_no, bank_name, bank_account, upi_id, initial_balance, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertParty.run('p-1', 'Mohit Jain (Self)', 'ABCDE1234F', '1208160012345678', 'HDFC Bank', '5010023456789', 'mohit@hdfcbank', 150000, new Date('2026-07-01T10:00:00').toISOString());
  insertParty.run('p-2', 'Ramesh Jain (Papa)', 'FGHIJ5678K', '1208160098765432', 'ICICI Bank', '000401567890', 'ramesh@icici', 200000, new Date('2026-07-02T11:30:00').toISOString());
  insertParty.run('p-3', 'Sunita Jain (Mummy)', 'KLMNO9012P', '1208160011223344', 'SBI Bank', '30987654321', 'sunita@sbi', 100000, new Date('2026-07-03T14:15:00').toISOString());
  insertParty.run('p-4', 'Apex Capital (Client)', 'QRSTU3456V', '1208160055667788', 'Axis Bank', '918010045612', 'apex@axis', 500000, new Date('2026-07-05T09:00:00').toISOString());
  insertParty.run('p-bank', 'Primary Pool Account (Bank)', 'BANKPOOL01', 'N/A', 'HDFC Master Account', '000199998888', 'masterpool@hdfc', 1000000, new Date('2026-07-01T08:00:00').toISOString());

  const insertIpo = db.prepare(`
    INSERT INTO ipos (id, company_name, symbol, price_per_share, lot_size, bidding_start_date, bidding_end_date, allotment_date, listing_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertIpo.run('ipo-1', 'Waaree Energies Ltd', 'WAAREE', 1503, 9, '2026-07-10T10:00:00.000Z', '2026-07-15T17:00:00.000Z', '2026-07-18T12:00:00.000Z', '2026-07-22T10:00:00.000Z', 'ALLOTTED', '2026-07-08T10:00:00.000Z');
  insertIpo.run('ipo-2', 'Swiggy Limited', 'SWIGGY', 390, 38, '2026-07-16T10:00:00.000Z', '2026-07-19T17:00:00.000Z', '2026-07-21T12:00:00.000Z', '2026-07-24T10:00:00.000Z', 'OPEN', '2026-07-14T10:00:00.000Z');
  insertIpo.run('ipo-3', 'Hyundai Motor India', 'HYUNDAI', 1960, 7, '2026-07-01T10:00:00.000Z', '2026-07-05T17:00:00.000Z', '2026-07-08T12:00:00.000Z', '2026-07-11T10:00:00.000Z', 'CLOSED', '2026-06-25T10:00:00.000Z');

  const insertApp = db.prepare(`
    INSERT INTO ipo_applications (id, ipo_id, party_id, application_no, lots_applied, shares_applied, amount_applied, allotment_status, lots_allotted, shares_allotted, amount_allotted, refund_amount, profit_loss, payment_status, application_date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApp.run('app-1', 'ipo-1', 'p-1', 'APP-WAAREE-001', 1, 9, 13527, 'ALLOTTED', 1, 9, 13527, 0, 4500, 'PAID', '2026-07-12T14:20:00.000Z', 'Applied via HDFC ASBA', new Date().toISOString());
  insertApp.run('app-2', 'ipo-1', 'p-2', 'APP-WAAREE-002', 1, 9, 13527, 'NOT_ALLOTTED', 0, 0, 0, 13527, 0, 'REFUNDED', '2026-07-12T15:00:00.000Z', 'Refund received on 18th July', new Date().toISOString());
  insertApp.run('app-3', 'ipo-2', 'p-1', 'APP-SWIGGY-001', 2, 76, 29640, 'PENDING', 0, 0, 0, 0, 0, 'PAID', '2026-07-17T11:45:00.000Z', 'Awaiting allotment status', new Date().toISOString());
  insertApp.run('app-4', 'ipo-2', 'p-3', 'APP-SWIGGY-002', 1, 38, 14820, 'PENDING', 0, 0, 0, 0, 0, 'PAID', '2026-07-18T10:10:00.000Z', 'Funds blocked via UPI', new Date().toISOString());

  const insertTx = db.prepare(`
    INSERT INTO money_transactions (id, application_id, from_party_id, to_party_id, amount, transaction_type, payment_mode, transaction_date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTx.run('tx-1', 'app-1', 'p-1', 'p-bank', 13527, 'IPO_APPLICATION', 'ASBA', '2026-07-12T14:20:00.000Z', 'Waaree Energies IPO Application Block', new Date().toISOString());
  insertTx.run('tx-2', 'app-2', 'p-2', 'p-bank', 13527, 'IPO_APPLICATION', 'UPI', '2026-07-12T15:00:00.000Z', 'Waaree Energies IPO Application Block', new Date().toISOString());
  insertTx.run('tx-3', 'app-2', 'p-bank', 'p-2', 13527, 'IPO_REFUND', 'UPI', '2026-07-18T16:00:00.000Z', 'Waaree Energies Allotment Unblock Refund', new Date().toISOString());
  insertTx.run('tx-4', null, 'p-4', 'p-1', 50000, 'DIRECT_TRANSFER', 'NET_BANKING', '2026-07-20T09:30:00.000Z', 'Advance fund transfer from Apex Capital', new Date().toISOString());
}

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
