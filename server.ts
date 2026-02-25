import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

async function startServer() {
  const app = express();
  
  // 1. Basic Middleware
  app.use(express.json({ limit: '50mb' }));
  
  // 2. Health Check (Immediate response for load balancers)
  app.get("/health", (req, res) => {
    console.log("[Server] Health check request received.");
    res.status(200).send("OK");
  });

  // 3. Database Initialization
  let db: Database.Database;
  try {
    const dbPath = path.join(__dirname, "afclean.db");
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        date TEXT,
        status TEXT DEFAULT 'pending',
        before_photos TEXT DEFAULT '[]',
        after_photos TEXT DEFAULT '[]',
        signature TEXT,
        price REAL DEFAULT 0,
        payment_method TEXT,
        installments INTEGER DEFAULT 1,
        service_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS financials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT CHECK(type IN ('income', 'expense')),
        description TEXT,
        amount REAL,
        date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    console.log("[Server] Database connected and initialized.");
  } catch (error) {
    console.error("[Server] Database error:", error);
    // Continue so server can respond with errors instead of being down
  }

  // 4. API Routes
  const api = express.Router();

  api.get("/appointments", (req, res) => {
    console.log("[Server] GET /api/appointments");
    try {
      const rows = db.prepare("SELECT * FROM appointments ORDER BY date DESC").all();
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.post("/appointments", (req, res) => {
    console.log("[Server] POST /api/appointments");
    try {
      const { customer_name, address, phone, date, price, payment_method, installments, service_type, before_photos, after_photos } = req.body;
      const beforeStr = Array.isArray(before_photos) ? JSON.stringify(before_photos) : (before_photos || '[]');
      const afterStr = Array.isArray(after_photos) ? JSON.stringify(after_photos) : (after_photos || '[]');
      const info = db.prepare(`
        INSERT INTO appointments (customer_name, address, phone, date, price, payment_method, installments, service_type, before_photos, after_photos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(customer_name, address, phone, date, price || 0, payment_method || 'Dinheiro', installments || 1, service_type || 'Limpeza', beforeStr, afterStr);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.patch("/appointments/:id", (req, res) => {
    console.log(`[Server] PATCH /api/appointments/${req.params.id}`);
    try {
      const id = Number(req.params.id);
      const updates = { ...req.body };
      delete (updates as any).id;
      if (updates.before_photos && Array.isArray(updates.before_photos)) updates.before_photos = JSON.stringify(updates.before_photos);
      if (updates.after_photos && Array.isArray(updates.after_photos)) updates.after_photos = JSON.stringify(updates.after_photos);
      
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      if (keys.length === 0) return res.status(400).json({ error: "No updates" });
      
      const setClause = keys.map(k => `${k} = ?`).join(", ");
      db.prepare(`UPDATE appointments SET ${setClause} WHERE id = ?`).run(...values, id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.delete("/appointments/:id", (req, res) => {
    console.log(`[Server] DELETE /api/appointments/${req.params.id}`);
    try {
      db.prepare("DELETE FROM appointments WHERE id = ?").run(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.get("/financials", (req, res) => {
    console.log("[Server] GET /api/financials");
    try {
      res.json(db.prepare("SELECT * FROM financials ORDER BY date DESC").all());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.post("/financials", (req, res) => {
    console.log("[Server] POST /api/financials");
    try {
      const { type, description, amount, date } = req.body;
      const info = db.prepare("INSERT INTO financials (type, description, amount, date) VALUES (?, ?, ?, ?)").run(type, description, amount, date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.delete("/financials/:id", (req, res) => {
    console.log(`[Server] DELETE /api/financials/${req.params.id}`);
    try {
      db.prepare("DELETE FROM financials WHERE id = ?").run(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.get("/settings", (req, res) => {
    console.log("[Server] GET /api/settings");
    try {
      const rows = db.prepare("SELECT * FROM settings").all();
      res.json(rows.reduce((acc: any, r: any) => ({ ...acc, [r.key]: r.value }), {}));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  api.post("/settings", (req, res) => {
    console.log("[Server] POST /api/settings");
    try {
      const { key, value } = req.body;
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.use("/api", api);

  // 5. Static Files & SPA Fallback
  const isProd = process.env.NODE_ENV === "production" || fs.existsSync(path.join(__dirname, "dist"));
  
  if (isProd) {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) return res.status(404).json({ error: "API Route Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Production mode: Serving static files.");
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    console.log("[Server] Development mode: Vite middleware active.");
  }

  // 6. Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[Server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  // 7. Start Listening
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => console.error("[Server] Fatal error:", err));
