var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_generative_ai = require("@google/generative-ai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_plaid = require("plaid");
var import_module = require("module");
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_meta = {};
var require2 = (0, import_module.createRequire)(import_meta.url);
var paypal = require2("@paypal/checkout-server-sdk");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var firestore;
try {
  const firebaseConfigFile = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (require2("fs").existsSync(firebaseConfigFile)) {
    const firebaseConfig = JSON.parse(require2("fs").readFileSync(firebaseConfigFile, "utf8"));
    if (!import_firebase_admin.default.apps.length) {
      import_firebase_admin.default.initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
    firestore = import_firebase_admin.default.firestore(firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("Firebase config not found at", firebaseConfigFile);
  }
} catch (err) {
  console.error("Firebase initialization failed:", err);
}
var paypalClient;
try {
  const paypalEnv = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || "sb",
    process.env.PAYPAL_CLIENT_SECRET || "sb"
  );
  paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);
} catch (err) {
  console.error("PayPal client initialization failed:", err);
}
var plaidConfig = new import_plaid.Configuration({
  basePath: import_plaid.PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
      "Plaid-Version": "2020-09-14"
    }
  }
});
var plaidClient = new import_plaid.PlaidApi(plaidConfig);
var db = new import_better_sqlite3.default("metamatrix.db");
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

  CREATE TABLE IF NOT EXISTS vault_secrets (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
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
var genAI = new import_generative_ai.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
var model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
app.use(import_express.default.json());
app.post("/api/sovereignty/link-token", async (req, res) => {
  try {
    const config = {
      user: { client_user_id: "metamatrix_sovereign_1" },
      client_name: "Metamatrix Sanctuary Node",
      products: [import_plaid.Products.Auth, import_plaid.Products.Transactions],
      country_codes: [import_plaid.CountryCode.Us],
      language: "en"
    };
    const response = await plaidClient.linkTokenCreate(config);
    res.json(response.data);
  } catch (err) {
    console.error("[PLAID] Token error:", err.response?.data || err.message);
    res.status(500).json({ error: "Sovereign link failed", details: err.response?.data || err.message });
  }
});
app.post("/api/sovereignty/exchange-token", async (req, res) => {
  const { public_token } = req.body;
  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;
    db.prepare("INSERT OR REPLACE INTO vault_secrets (key, value, updated_at) VALUES (?, ?, ?)").run("PLAID_ACCESS_TOKEN", access_token, (/* @__PURE__ */ new Date()).toISOString());
    res.json({ success: true, item_id });
  } catch (err) {
    res.status(500).json({ error: "Exchange failed" });
  }
});
app.get("/api/sovereignty/status", async (req, res) => {
  const plaidToken = db.prepare("SELECT value FROM vault_secrets WHERE key = 'PLAID_ACCESS_TOKEN'").get();
  const alpacaKey = process.env.ALPACA_API_KEY;
  let alpacaStatus = "DISCONNECTED";
  if (alpacaKey) {
    try {
      const alpacaRes = await fetch(`${process.env.ALPACA_BASE_URL}/v2/account`, {
        headers: {
          "APCA-API-KEY-ID": alpacaKey,
          "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY || ""
        }
      });
      if (alpacaRes.ok) alpacaStatus = "CONNECTED";
    } catch (e) {
      alpacaStatus = "ERROR";
    }
  }
  res.json({
    bank: plaidToken ? "CONNECTED" : "DISCONNECTED",
    exchange: alpacaStatus,
    paypal: process.env.PAYPAL_CLIENT_ID ? "CONFIGURED" : "OFFLINE",
    mode: alpacaStatus === "CONNECTED" ? "LIVE_EXECUTION" : "SIMULATED"
  });
});
app.post("/api/sovereignty/paypal/create-order", async (req, res) => {
  if (!paypalClient) return res.status(500).json({ error: "PayPal client not initialized" });
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: req.body.amount || "10.00" }
      }]
    });
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/sovereignty/paypal/capture-order", async (req, res) => {
  if (!paypalClient) return res.status(500).json({ error: "PayPal client not initialized" });
  const { orderId, agentId } = req.body;
  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const capture = await paypalClient.execute(request);
    const amount = capture.result.purchase_units[0].payments.captures[0].amount.value;
    if (agentId) {
      db.prepare("UPDATE trading_agents SET remaining_budget = remaining_budget + ? WHERE id = ?").run(parseFloat(amount), agentId);
    }
    db.prepare("INSERT INTO godmode_actions (action, result, severity, timestamp) VALUES (?, ?, ?, ?)").run("PAYPAL_FUNDING", `Captured $${amount} via ${orderId}`, "BETA", (/* @__PURE__ */ new Date()).toISOString());
    res.json({ success: true, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/bridge/notebooklm", async (req, res) => {
  const { title, context } = req.body;
  const prompt = `
    NOTEBOOKLM SEMANTIC BRIDGE ACTIVE.
    Source: ${title}
    Context Length: ${context.length} characters.
    
    Objective: Extract hyper-dense semantic patterns for the Correspondence Engine.
    Look for high-dimensional resonances and "hidden" infrastructure nodes described in the text.
    
    Text Segment: ${context.substring(0, 1e3)}...
    
    Return ONLY JSON: 
    { 
      "ingested_patterns": ["string"], 
      "sovereignty_alignment": number (0-1.0),
      "notebook_synergy": "string"
    }
  `;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const strategy = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Parse failure" };
    if (firestore) {
      await firestore.collection("notebooks").add({
        title: title || "Untitled Pattern",
        content: context,
        ingested_at: import_firebase_admin.default.firestore.FieldValue.serverTimestamp(),
        patterns: strategy.ingested_patterns || []
      });
    }
    res.json({ success: true, strategy });
  } catch (err) {
    res.status(500).json({ error: "NotebookLM bridge failed" });
  }
});
app.get("/api/bridge/notebooks", async (req, res) => {
  if (!firestore) return res.json([]);
  try {
    const snapshot = await firestore.collection("notebooks").orderBy("ingested_at", "desc").limit(10).get();
    const notebooks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(notebooks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notebooks" });
  }
});
app.get("/api/mythos/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM mythos_tasks ORDER BY timestamp DESC LIMIT 30").all();
  res.json(tasks.map((t) => ({ ...t, result: t.result ? JSON.parse(t.result) : null })));
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
    db.prepare("INSERT INTO mythos_tasks (type, goal, status, result, timestamp) VALUES (?, ?, ?, ?, ?)").run(type, goal, "completed", JSON.stringify(blueprint), (/* @__PURE__ */ new Date()).toISOString());
    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ error: "Mythos spawning failed" });
  }
});
var GlymphaticFlowController = class {
  constructor() {
    this.arousalThreshold = 0.2;
    this.stage = "ACTIVE";
    this.lastActivity = Date.now();
  }
  calculateArousal() {
    const timeSinceActivity = Date.now() - this.lastActivity;
    const maxIdleTime = 90 * 60 * 1e3;
    return Math.max(0, 1 - timeSinceActivity / maxIdleTime);
  }
  async runMaintenance(db2) {
    const arousal = this.calculateArousal();
    if (arousal < this.arousalThreshold && this.stage === "ACTIVE") {
      await this.deepCleaningPhase(db2, arousal);
    } else if (arousal < 0.1 && this.stage === "NREM_N3") {
      await this.consolidationPhase(db2);
    } else if (arousal > 0.5) {
      this.stage = "ACTIVE";
    }
    db2.prepare(`
      INSERT INTO memory_telemetry (stage, interstitial_volume, waste_cleared, arousal_level, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      this.stage,
      this.stage === "NREM_N3" ? 1.6 : 1,
      this.stage === "NREM_N3" ? Math.random() * 50 : 0,
      arousal,
      (/* @__PURE__ */ new Date()).toISOString()
    );
  }
  async deepCleaningPhase(db2, arousal) {
    console.log("[GLYMPHATIC] Entering NREM_N3 Deep Cleaning");
    this.stage = "NREM_N3";
    db2.prepare("DELETE FROM trades WHERE executed_at < datetime('now', '-7 days')").run();
    db2.prepare("DELETE FROM systemic_risk WHERE timestamp < datetime('now', '-1 day')").run();
  }
  async consolidationPhase(db2) {
    console.log("[GLYMPHATIC] Entering REM Consolidation (AutoDream)");
    this.stage = "REM";
  }
  updateActivity() {
    this.lastActivity = Date.now();
    this.stage = "ACTIVE";
  }
};
var glymphatic = new GlymphaticFlowController();
function getPriceHistory(asset) {
  const basePrice = asset === "BTC" ? 65e3 : asset === "ETH" ? 3500 : 150;
  return Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(Date.now() - (9 - i) * 36e5).toISOString(),
    price: basePrice + (Math.random() - 0.5) * (basePrice * 0.05)
  }));
}
async function runRiskMonitor() {
  const indicators = {
    vix: 15 + Math.random() * 20,
    gold_price: 2300 + Math.random() * 200,
    btc_premium: (Math.random() - 0.5) * 5,
    brics_volume: 50 + Math.random() * 50
  };
  const composite = indicators.vix / 40 * 0.3 + indicators.gold_price / 2500 * 0.3 + indicators.brics_volume / 100 * 0.4;
  const score = Math.min(100, composite * 100);
  const level = score > 80 ? "critical" : score > 60 ? "high" : score > 40 ? "medium" : "low";
  db.prepare(`
    INSERT INTO systemic_risk (vix, gold_price, btc_premium, brics_volume, composite_score, risk_level, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(indicators.vix, indicators.gold_price, indicators.btc_premium, indicators.brics_volume, score, level, (/* @__PURE__ */ new Date()).toISOString());
  console.log(`[RISK] Systemic Risk Score: ${score.toFixed(2)} (${level})`);
}
async function runTradingCycle() {
  const activeAgents = db.prepare("SELECT * FROM trading_agents WHERE status = 'active'").all();
  const currentRisk = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 1").get();
  const riskLevel = currentRisk?.risk_level || "low";
  for (const agent of activeAgents) {
    try {
      const prices = getPriceHistory(agent.asset);
      const latestPrice = prices[prices.length - 1].price;
      const priceValues = prices.map((p) => p.price);
      const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
      const variance = priceValues.reduce((a, b) => a + Math.pow(b - avgPrice, 2), 0) / priceValues.length;
      const volatility = Math.sqrt(variance) / avgPrice;
      const recentTrades = db.prepare("SELECT count(*) as count FROM trades WHERE agent_id = ? AND executed_at > datetime('now', '-1 hour')").get();
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
      const isVolatile = volatility > 0.03;
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
          const slippage = Math.random() * 0.01;
          const maxAllowedSlippage = signal.max_slippage || 5e-3;
          if (slippage > maxAllowedSlippage) {
            console.log(`[DAEMON] Agent ${agent.id} rejected ${signal.action} for ${agent.asset} due to high slippage (${(slippage * 100).toFixed(2)}%)`);
            continue;
          }
          const executionPrice = signal.action === "BUY" ? latestPrice * (1 + slippage) : latestPrice * (1 - slippage);
          db.prepare(`
            INSERT INTO trades (agent_id, asset, action, amount, price, confidence, reasoning, executed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(agent.id, agent.asset, signal.action, signal.suggested_amount, executionPrice, signal.confidence, signal.reasoning, (/* @__PURE__ */ new Date()).toISOString());
          const budgetDelta = signal.action === "BUY" ? -signal.suggested_amount : signal.suggested_amount * 1.02;
          db.prepare("UPDATE trading_agents SET remaining_budget = remaining_budget + ?, total_profit_loss = total_profit_loss + ? WHERE id = ?").run(budgetDelta, signal.action === "SELL" ? signal.suggested_amount * 0.02 : 0, agent.id);
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
runRiskMonitor();
setInterval(runRiskMonitor, 6e4);
setInterval(runTradingCycle, 3e4);
setInterval(() => glymphatic.runMaintenance(db), 6e4);
app.get("/api/memory/telemetry", (req, res) => {
  const latest = db.prepare("SELECT * FROM memory_telemetry ORDER BY timestamp DESC LIMIT 1").get();
  const history = db.prepare("SELECT * FROM memory_telemetry ORDER BY timestamp DESC LIMIT 30").all();
  res.json({ latest, history });
});
app.get("/api/godmode/logs", (req, res) => {
  const logs = db.prepare("SELECT * FROM godmode_actions ORDER BY timestamp DESC LIMIT 50").all();
  res.json(logs);
});
app.post("/api/godmode/execute", async (req, res) => {
  const { action } = req.body;
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
    db.prepare("INSERT INTO godmode_actions (action, result, severity, timestamp) VALUES (?, ?, ?, ?)").run(action, JSON.stringify(strategy), "OMEGA", (/* @__PURE__ */ new Date()).toISOString());
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
  glymphatic.updateActivity();
  try {
    const prompt = `
      You are the Metamatrix Correspondence Engine. 
      Analyze the following content and identify which of the 7 Hermetic Principles are present.
      Check for cross-resonances with recently ingested NotebookLM patterns.
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
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ error: "Analysis failed" });
  }
});
app.post("/api/trade/start", (req, res) => {
  const { budget, asset, strategy, riskLevel } = req.body;
  const result = db.prepare(`
    INSERT INTO trading_agents (budget, remaining_budget, asset, strategy, risk_level, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).run(budget, budget, asset, strategy, riskLevel, (/* @__PURE__ */ new Date()).toISOString());
  res.json({ success: true, id: result.lastInsertRowid });
});
app.post("/api/trade/fund", (req, res) => {
  const { agentId, amount } = req.body;
  if (!agentId || !amount) return res.status(400).json({ error: "Missing parameters" });
  try {
    db.prepare("UPDATE trading_agents SET remaining_budget = remaining_budget + ? WHERE id = ?").run(amount, agentId);
    res.json({ success: true, message: `Successfully injected $${amount} simulated capital.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Funding failed" });
  }
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
  const currentRisk = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 1").get();
  const history = db.prepare("SELECT * FROM systemic_risk ORDER BY timestamp DESC LIMIT 20").all();
  db.prepare("UPDATE trading_agents SET status = 'defensive' WHERE status = 'active'").run();
  res.json({ success: true, message: "Defensive positioning protocol activated.", riskLevel: currentRisk?.risk_level });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => res.sendFile(import_path.default.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Node Active: http://localhost:${PORT}`));
}
startServer();
