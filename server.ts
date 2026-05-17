import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import Database from "better-sqlite3";

dotenv.config();

const app = express();
const PORT = 3000;

// --- Database Initialization ---
const db = new Database("metamatrix.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS trading_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget REAL NOT NULL,
    remaining_budget REAL,
    asset TEXT NOT NULL,
    strategy TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    status TEXT NOT NULL,
    total_profit_loss REAL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    asset TEXT NOT NULL,
    action TEXT NOT NULL,
    amount REAL NOT NULL,
    price REAL,
    confidence REAL,
    reasoning TEXT,
    executed_at TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES trading_agents(id)
  );

  CREATE TABLE IF NOT EXISTS systemic_risk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vix REAL,
    gold_price REAL,
    btc_premium REAL,
    brics_volume REAL,
    composite_score REAL,
    risk_level TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memory_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage TEXT, -- 'ACTIVE', 'NREM_N3', 'REM'
    interstitial_volume REAL,
    waste_cleared REAL,
    arousal_level REAL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS godmode_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    result TEXT,
    severity TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mythos_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    goal TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    timestamp TEXT NOT NULL
  );
`);

// --- Initialize Gemini API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

app.use(express.json());

// --- Mythos API ---
app.get("/api/mythos/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM mythos_tasks ORDER BY timestamp DESC LIMIT 30").all();
  res.json(tasks.map((t: any) => ({ ...t, result: t.result ? JSON.parse(t.result) : null })));
});

app.post("/api/mythos/spawn", async (req, res) => {
  const { type, goal } = req.body;
  
  const prompt = `
    MYTHOS ENGINE ACTIVE.
    Task Type: ${type}
    Objective: ${goal}
    
    You are the Mythos Development Core within the Metamatrix. 
    Your goal is to automate the creation of sovereign infrastructure or agents.
    Provide a detailed technical blueprint, required patterns, and an autonomy score.
    
    Return ONLY JSON: 
    { 
      "blueprint": "string (markdown)", 
      "requirements": ["string"], 
      "autonomy_score": number (0-1.0),
      "suggested_stack": "string"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const blueprint = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Parse failure" };

    db.prepare("INSERT INTO mythos_tasks (type, goal, status, result, timestamp) VALUES (?, ?, ?, ?, ?)")
      .run(type, goal, 'completed', JSON.stringify(blueprint), new Date().toISOString());

    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ error: "Mythos spawning failed" });
  }
});

// --- Glymphatic Flow Controller (Memory Management) ---
class GlymphaticFlowController {
  arousalThreshold = 0.2;
  stage = 'ACTIVE';
  lastActivity = Date.now();

  private calculateArousal() {
    const timeSinceActivity = Date.now() - this.lastActivity;
    const maxIdleTime = 90 * 60 * 1000; // 90 minutes for full sleep cycle
    return Math.max(0, 1.0 - (timeSinceActivity / maxIdleTime));
  }

  async runMaintenance(db: Database.Database) {
    const arousal = this.calculateArousal();
    
    if (arousal < this.arousalThreshold && this.stage === 'ACTIVE') {
      // Enter Deep Cleaning (Stage N3)
      await this.deepCleaningPhase(db, arousal);
    } else if (arousal < 0.1 && this.stage === 'NREM_N3') {
      // Transition to Consolidation (REM)
      await this.consolidationPhase(db);
    } else if (arousal > 0.5) {
      this.stage = 'ACTIVE';
    }

    // Log Telemetry
    db.prepare(`
      INSERT INTO memory_telemetry (stage, interstitial_volume, waste_cleared, arousal_level, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      this.stage, 
      this.stage === 'NREM_N3' ? 1.6 : 1.0, 
      this.stage === 'NREM_N3' ? Math.random() * 50 : 0, 
      arousal, 
      new Date().toISOString()
    );
  }

  private async deepCleaningPhase(db: Database.Database, arousal: number) {
    console.log('[GLYMPHATIC] Entering NREM_N3 Deep Cleaning');
    this.stage = 'NREM_N3';
    
    // Clear "Metabolic Waste" (Old trades, old logs)
    db.prepare("DELETE FROM trades WHERE executed_at < datetime('now', '-7 days')").run();
    db.prepare("DELETE FROM systemic_risk WHERE timestamp < datetime('now', '-1 day')").run();
  }

  private async consolidationPhase(db: Database.Database) {
    console.log('[GLYMPHATIC] Entering REM Consolidation (AutoDream)');
    this.stage = 'REM';
    // Here we would run the more intensive pattern recognition across ALL history
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.stage = 'ACTIVE';
  }
}

const glymphatic = new GlymphaticFlowController();

// --- Market Simulator ---
function getPriceHistory(asset: string) {
  const basePrice = asset === "BTC" ? 65000 : asset === "ETH" ? 3500 : 150;
  return Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(Date.now() - (9 - i) * 3600000).toISOString(),
    price: basePrice + (Math.random() - 0.5) * (basePrice * 0.05)
  }));
}

// --- Systemic Risk Monitor ---
async function runRiskMonitor() {
  const indicators = {
    vix: 15 + Math.random() * 20,
    gold_price: 2300 + Math.random() * 200,
    btc_premium: (Math.random() - 0.5) * 5,
    brics_volume: 50 + Math.random() * 50
  };

  // Logic: High VIX + High Gold + High BRICS = High Risk
  const composite = (indicators.vix / 40) * 0.3 + 
                    (indicators.gold_price / 2500) * 0.3 + 
                    (indicators.brics_volume / 100) * 0.4;
  
  const score = Math.min(100, composite * 100);
  const level = score > 80 ? "critical" : score > 60 ? "high" : score > 40 ? "medium" : "low";

  db.prepare(`
    INSERT INTO systemic_risk (vix, gold_price, btc_premium, brics_volume, composite_score, risk_level, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(indicators.vix, indicators.gold_price, indicators.btc_premium, indicators.brics_volume, score, level, new Date().toISOString());

  console.log(`[RISK] Systemic Risk Score: ${score.toFixed(2)} (${level})`);
}

// --- Autonomous Trading Cycle ---
async function runTradingCycle() {
  const activeAgents = db.prepare("SELECT * FROM trading_agents WHERE status = 'active'").all() as any[];
  const currentRisk = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 1").get() as any;
  const riskLevel = currentRisk?.risk_level || "low";
  
  for (const agent of activeAgents) {
    try {
      const prices = getPriceHistory(agent.asset);
      const latestPrice = prices[prices.length - 1].price;
      
      // Calculate Volatility (Simplified)
      const priceValues = prices.map(p => p.price);
      const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
      const variance = priceValues.reduce((a, b) => a + Math.pow(b - avgPrice, 2), 0) / priceValues.length;
      const volatility = Math.sqrt(variance) / avgPrice; // Coefficient of variation

      // Check for Over-trading (Max 5 trades in last hour)
      const recentTrades = db.prepare("SELECT count(*) as count FROM trades WHERE agent_id = ? AND executed_at > datetime('now', '-1 hour')").get() as any;
      
      const prompt = `
        Analyze this market data for ${agent.asset}:
        Recent prices: ${JSON.stringify(prices)}
        Volatility: ${(volatility * 100).toFixed(2)}%
        Current Systemic Risk: ${riskLevel.toUpperCase()} (Score: ${currentRisk?.composite_score?.toFixed(2)})
        Strategy: ${agent.strategy}
        Risk level constant: ${agent.risk_level}
        
        SOP: 
        1. If Volatility > 2.5%, prioritize HOLD unless confidence is > 0.95.
        2. If Systemic Risk is CRITICAL, prioritize defensive SELLs of risk assets.
        
        Should I BUY, SELL, or HOLD?
        Return ONLY JSON:
        { "action": "BUY|SELL|HOLD", "confidence": number, "reasoning": "string", "suggested_amount": number, "max_slippage": number }
      `;

      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      
      const signal = JSON.parse(jsonMatch[0]);
      const minConfidence = agent.risk_level === "conservative" ? 0.85 : 0.7;
      
      // Advanced Risk Gates
      const isVolatile = volatility > 0.03; // 3% volatility threshold
      const isOvertrading = recentTrades.count >= 5;
      
      if (signal.action !== "HOLD") {
        let gatePassed = true;
        let rejectReason = "";

        if (signal.confidence < minConfidence) {
           gatePassed = false;
           rejectReason = "Insufficient confidence";
        } else if (isVolatile && signal.confidence < 0.9) {
           gatePassed = false;
           rejectReason = "Market volatility too high for current strategy";
        } else if (isOvertrading) {
           gatePassed = false;
           rejectReason = "Over-trading limit reached";
        } else if (signal.suggested_amount > agent.remaining_budget) {
           gatePassed = false;
           rejectReason = "Insufficient budget";
        }

        if (gatePassed) {
          // Simulate Slippage check
          const slippage = (Math.random() * 0.01); // 0-1% random slippage
          const maxAllowedSlippage = signal.max_slippage || 0.005; // Default 0.5%
          
          if (slippage > maxAllowedSlippage) {
            console.log(`[DAEMON] Agent ${agent.id} rejected ${signal.action} for ${agent.asset} due to high slippage (${(slippage * 100).toFixed(2)}%)`);
            continue;
          }

          const executionPrice = signal.action === "BUY" ? latestPrice * (1 + slippage) : latestPrice * (1 - slippage);
          
          db.prepare(`
            INSERT INTO trades (agent_id, asset, action, amount, price, confidence, reasoning, executed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(agent.id, agent.asset, signal.action, signal.suggested_amount, executionPrice, signal.confidence, signal.reasoning, new Date().toISOString());

          const budgetDelta = signal.action === "BUY" ? -signal.suggested_amount : signal.suggested_amount * 1.02;
          db.prepare("UPDATE trading_agents SET remaining_budget = remaining_budget + ?, total_profit_loss = total_profit_loss + ? WHERE id = ?")
            .run(budgetDelta, signal.action === "SELL" ? signal.suggested_amount * 0.02 : 0, agent.id);
            
          console.log(`[DAEMON] Agent ${agent.id} executed ${signal.action} for ${agent.asset} @ ${executionPrice.toFixed(2)}`);
        } else {
          console.log(`[DAEMON] Agent ${agent.id} ${signal.action} rejected: ${rejectReason}`);
        }
      }
    } catch (err) {
      console.error(`[DAEMON] Agent ${agent.id} error:`, err);
    }
  }
}

// Run monitors
runRiskMonitor(); // Initial run
setInterval(runRiskMonitor, 60000); // Risk monitor every minute
setInterval(runTradingCycle, 30000); // Trading cycle every 30 seconds
setInterval(() => glymphatic.runMaintenance(db), 60000); // Maintenance every minute

// --- API Routes ---
app.get("/api/memory/telemetry", (req, res) => {
  const latest = db.prepare("SELECT * FROM memory_telemetry ORDER BY timestamp DESC LIMIT 1").get() as any;
  const history = db.prepare("SELECT * FROM memory_telemetry ORDER BY timestamp DESC LIMIT 30").all();
  res.json({ latest, history });
});

app.get("/api/godmode/logs", (req, res) => {
  const logs = db.prepare("SELECT * FROM godmode_actions ORDER BY timestamp DESC LIMIT 50").all();
  res.json(logs);
});

app.post("/api/godmode/execute", async (req, res) => {
  const { action } = req.body;
  
  // Godmode Autonomous Logic
  const prompt = `
    GODMODE ACTIVE. 
    Overseer Action requested: ${action}
    The system is in an ungovernable state. Current systemic risk is high.
    Analyze the request and provide a high-level executive autonomous strategy.
    Return ONLY JSON: { "strategy": "string", "impact": "string", "risk_mitigation": "string" }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const strategy = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Parse failure" };

    db.prepare("INSERT INTO godmode_actions (action, result, severity, timestamp) VALUES (?, ?, ?, ?)")
      .run(action, JSON.stringify(strategy), "OMEGA", new Date().toISOString());

    res.json({ success: true, strategy });
  } catch (err) {
    res.status(500).json({ error: "Godmode execution failed" });
  }
});

app.get("/api/risk/status", (req, res) => {
  const risk = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 1").get();
  const history = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 20").all();
  res.json({ risk, history });
});
app.post("/api/analyze", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

  glymphatic.updateActivity(); // Signal system activity to wake up

  try {
    const prompt = `
      You are the Metamatrix Pattern Recognition Engine. 
      Analyze the following content and identify which of the 7 Hermetic Principles are present.
      Return ONLY a JSON object in this format:
      {
        "principles": [
          { "name": "Mentalism", "score": number, "detected": boolean, "insight": "string" },
          ...
        ],
        "signature": "string",
        "resonance": number
      }
      Content: ${content}
    `;
    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch![0]));
  } catch (error) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

// Trading Endpoints
app.post("/api/trade/start", (req, res) => {
  const { budget, asset, strategy, riskLevel } = req.body;
  const result = db.prepare(`
    INSERT INTO trading_agents (budget, remaining_budget, asset, strategy, risk_level, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).run(budget, budget, asset, strategy, riskLevel, new Date().toISOString());
  
  res.json({ success: true, id: result.lastInsertRowid });
});

app.get("/api/trade/status", (req, res) => {
  const agents = db.prepare("SELECT * FROM trading_agents ORDER BY created_at DESC").all();
  const trades = db.prepare("SELECT * FROM trades ORDER BY executed_at DESC LIMIT 20").all();
  res.json({ agents, trades });
});

app.post("/api/trade/stop", (req, res) => {
  const { id } = req.body;
  db.prepare("UPDATE trading_agents SET status = 'stopped' WHERE id = ?").run(id);
  res.json({ success: true });
});

app.post("/api/trade/emergency", (req, res) => {
  const currentRisk = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 1").get() as any;
  const history = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 20").all();
  
  // Logic: "Liquidate" risk assets (Stocks) and move to "Defensive" (BTC/Gold)
  // In our simulation, we just stop all agents and log the action
  db.prepare("UPDATE trading_agents SET status = 'defensive' WHERE status = 'active'").run();
  
  res.json({ success: true, message: "Defensive positioning protocol activated.", riskLevel: currentRisk?.risk_level });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Node Active: http://localhost:${PORT}`));
}

startServer();
