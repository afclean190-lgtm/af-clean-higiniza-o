import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "afclean.db"));
db.pragma('journal_mode = WAL');

// Initialize Database
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

// Migration: Add new columns if they don't exist
try {
  db.prepare("ALTER TABLE appointments ADD COLUMN before_photos TEXT DEFAULT '[]'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE appointments ADD COLUMN after_photos TEXT DEFAULT '[]'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE appointments ADD COLUMN service_type TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  
  // Request Logging
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/appointments", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM appointments ORDER BY date DESC").all();
      res.json(rows);
    } catch (error: any) {
      console.error("[Server] Get appointments error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/appointments", (req, res) => {
    const { 
      customer_name, address, phone, date, price, 
      payment_method, installments, service_type,
      before_photos, after_photos 
    } = req.body;
    
    try {
      const beforePhotosStr = Array.isArray(before_photos) ? JSON.stringify(before_photos) : (before_photos || '[]');
      const afterPhotosStr = Array.isArray(after_photos) ? JSON.stringify(after_photos) : (after_photos || '[]');
      
      const info = db.prepare(
        "INSERT INTO appointments (customer_name, address, phone, date, price, payment_method, installments, service_type, before_photos, after_photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        customer_name, address, phone, date, price || 0, 
        payment_method || 'Dinheiro', installments || 1, 
        service_type || 'Limpeza de Sófá',
        beforePhotosStr, afterPhotosStr
      );
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      console.error("[Server] Create appointment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/appointments/:id", (req, res) => {
    const id = Number(req.params.id);
    const updates = { ...req.body };
    
    // Remove id from updates if present
    delete (updates as any).id;
    
    // Stringify photo arrays if present
    if (updates.before_photos && Array.isArray(updates.before_photos)) {
      updates.before_photos = JSON.stringify(updates.before_photos);
    }
    if (updates.after_photos && Array.isArray(updates.after_photos)) {
      updates.after_photos = JSON.stringify(updates.after_photos);
    }
    
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    
    if (keys.length === 0) return res.status(400).json({ error: "No updates provided" });

    try {
      const setClause = keys.map(key => `${key} = ?`).join(", ");
      const result = db.prepare(`UPDATE appointments SET ${setClause} WHERE id = ?`).run(...values, id);
      console.log(`[Server] Update appointment ${id} result:`, result);
      res.json({ success: true, changes: result.changes });
    } catch (error: any) {
      console.error("[Server] Update appointment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/appointments/:id", (req, res) => {
    const id = Number(req.params.id);
    console.log(`[Server] Request to delete appointment ID: ${id}`);
    try {
      const stmt = db.prepare("DELETE FROM appointments WHERE id = ?");
      const info = stmt.run(id);
      
      console.log(`[Server] Delete appointment result:`, info);
      
      res.json({ 
        success: true, 
        message: info.changes > 0 ? "Deleted successfully" : "No record found to delete",
        changes: info.changes 
      });
    } catch (error: any) {
      console.error("[Server] Delete appointment error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Financials API
  app.get("/api/financials", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM financials ORDER BY date DESC").all();
      res.json(rows);
    } catch (error: any) {
      console.error("[Server] Get financials error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/financials", (req, res) => {
    const { type, description, amount, date } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO financials (type, description, amount, date) VALUES (?, ?, ?, ?)"
      ).run(type, description, amount, date);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      console.error("[Server] Create financial error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/financials/:id", (req, res) => {
    const id = Number(req.params.id);
    const updates = { ...req.body };
    delete (updates as any).id;
    
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    
    if (keys.length === 0) return res.status(400).json({ error: "No updates provided" });

    try {
      const setClause = keys.map(key => `${key} = ?`).join(", ");
      const result = db.prepare(`UPDATE financials SET ${setClause} WHERE id = ?`).run(...values, id);
      console.log(`[Server] Update financial ${id} result:`, result);
      res.json({ success: true, changes: result.changes });
    } catch (error: any) {
      console.error("[Server] Update financial error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/financials", (req, res) => {
    try {
      const info = db.prepare("DELETE FROM financials").run();
      console.log(`[Server] Clear financials result:`, info);
      res.json({ success: true, changes: info.changes });
    } catch (error: any) {
      console.error("[Server] Clear financials error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/financials/:id", (req, res) => {
    const id = Number(req.params.id);
    console.log(`[Server] Request to delete financial ID: ${id}`);
    try {
      const stmt = db.prepare("DELETE FROM financials WHERE id = ?");
      const info = stmt.run(id);
      
      console.log(`[Server] Delete financial result:`, info);
      
      res.json({ 
        success: true, 
        message: info.changes > 0 ? "Deleted successfully" : "No record found to delete",
        changes: info.changes 
      });
    } catch (error: any) {
      console.error("[Server] Delete financial error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Settings API
  app.get("/api/settings", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM settings").all();
      const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
      res.json(settings);
    } catch (error: any) {
      console.error("[Server] Get settings error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const { key, value } = req.body;
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Server] Update settings error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    console.log(`[Server] Production mode: serving static files from ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
