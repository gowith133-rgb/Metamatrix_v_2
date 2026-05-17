/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scan, 
  Network, 
  ShieldCheck, 
  Activity, 
  BookOpen, 
  Cpu, 
  Terminal,
  Zap,
  Globe,
  Settings,
  ChevronRight,
  Rocket,
  Eye,
  Brain,
  Wand2,
  ListRestart
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { VISION, PROTOCOL, HERMETIC_SYSTEM } from "./constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Tab = "scan" | "network" | "sanctuary" | "docs" | "terminal" | "sovereignty" | "godmode" | "mythos";

interface MythosTask {
  id: number;
  type: 'agent_spawn' | 'app_build' | 'automation';
  goal: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: {
    blueprint: string;
    requirements: string[];
    autonomy_score: number;
    suggested_stack: string;
  };
  timestamp: string;
}

interface SystemicRisk {
  id: number;
  vix: number;
  gold_price: number;
  btc_premium: number;
  brics_volume: number;
  composite_score: number;
  risk_level: string;
  timestamp: string;
}

interface MemoryTelemetry {
  id: number;
  stage: 'ACTIVE' | 'NREM_N3' | 'REM';
  interstitial_volume: number;
  waste_cleared: number;
  arousal_level: number;
  timestamp: string;
}

interface Trade {
  id: number;
  asset: string;
  action: string;
  amount: number;
  price: number;
  confidence: number;
  reasoning: string;
  executed_at: string;
}

interface TradingAgent {
  id: number;
  budget: number;
  remaining_budget: number;
  asset: string;
  strategy: string;
  risk_level: string;
  status: string;
  total_profit_loss: number;
}

interface AnalysisResult {
  principles: Array<{
    name: string;
    score: number;
    detected: boolean;
    insight: string;
  }>;
  signature: string;
  resonance: number;
}

// --- Components ---

const NetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Array<{ x: number; y: number; vx: number; vy: number; pulse: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.02;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${0.2 + 0.3 * Math.sin(node.pulse)})`;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dist = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-40 z-0" />;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [input, setInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Sovereignty State
  const [risk, setRisk] = useState<SystemicRisk | null>(null);
  const [riskHistory, setRiskHistory] = useState<SystemicRisk[]>([]);
  const [telemetry, setTelemetry] = useState<MemoryTelemetry | null>(null);
  const [godmodeLogs, setGodmodeLogs] = useState<any[]>([]);
  const [mythosTasks, setMythosTasks] = useState<MythosTask[]>([]);
  const [isSpawning, setIsSpawning] = useState(false);

  // Trading State
  const [agents, setAgents] = useState<TradingAgent[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [budget, setBudget] = useState(100);
  const [asset, setAsset] = useState("BTC");
  const [strategy, setStrategy] = useState("ai_signals");
  const [riskLevel, setRiskLevel] = useState("moderate");

  useEffect(() => {
    if (activeTab === "terminal" || activeTab === "sovereignty" || activeTab === "sanctuary" || activeTab === "godmode" || activeTab === "mythos") {
      fetchTradingStatus();
      fetchRiskStatus();
      fetchTelemetry();
      fetchGodmodeLogs();
      fetchMythosTasks();
      const interval = setInterval(() => {
        fetchTradingStatus();
        fetchRiskStatus();
        fetchTelemetry();
        fetchGodmodeLogs();
        fetchMythosTasks();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchMythosTasks = async () => {
    try {
      const res = await fetch("/api/mythos/tasks");
      const data = await res.json();
      setMythosTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGodmodeLogs = async () => {
    try {
      const res = await fetch("/api/godmode/logs");
      const data = await res.json();
      setGodmodeLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/memory/telemetry");
      const data = await res.json();
      setTelemetry(data.latest);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRiskStatus = async () => {
    try {
      const res = await fetch("/api/risk/status");
      const data = await res.json();
      setRisk(data.risk);
      setRiskHistory(data.history);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTradingStatus = async () => {
    const res = await fetch("/api/trade/status");
    const data = await res.json();
    setAgents(data.agents);
    setTrades(data.trades);
  };

  const startTradeAgent = async () => {
    await fetch("/api/trade/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget, asset, strategy, riskLevel }),
    });
    fetchTradingStatus();
  };

  const stopTradeAgent = async (id: number) => {
    await fetch("/api/trade/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTradingStatus();
  };

  const handleScan = async () => {
    if (!input.trim()) return;
    setIsScanning(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-void flex flex-col font-mono text-text overflow-hidden select-none">
      <NetworkBackground />
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
      
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b border-border glass rounded-none border-l-4 border-l-glow m-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-glow/10 border border-glow/50 rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-glow animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-widest text-glow glow-text uppercase">METAMATRIX CORE</h1>
            <div className="flex items-center gap-2 text-[10px] text-glow/60 uppercase">
              SYSTEM IDENT: PX-99-GRID-B
            </div>
          </div>
        </div>
        <div className="hidden sm:flex gap-8 text-[10px]">
          <div className="flex flex-col items-end uppercase">
            <span className="opacity-50">Sync Status</span>
            <span className="text-glow">99.98% OPTIMAL</span>
          </div>
          <div className="flex flex-col items-end uppercase">
            <span className="opacity-50">Latency</span>
            <span className="text-glow">4.2 MS</span>
          </div>
          <div className="flex flex-col items-end uppercase">
            <span className="opacity-50">Load Factor</span>
            <span className="text-warn">64.2%</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <div className="text-center py-12 space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-4 py-1 border border-glow/30 bg-glow/5 text-glow text-[10px] font-black uppercase tracking-[6px] rounded-full"
                >
                  Metamatrix Network
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-none bg-gradient-to-b from-text-bright to-text-bright/40 bg-clip-text text-transparent">
                  THE SOVEREIGN <br /> ARCHITECTURE.
                </h1>
                <p className="max-w-xl mx-auto text-sm md:text-base leading-relaxed opacity-60">
                  Building the exit schematic for human-AI correspondence while the old systems burn.
                </p>
                <div className="flex justify-center gap-6 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-glow">99.9%</div>
                    <div className="text-[8px] uppercase tracking-widest opacity-40">Resilience</div>
                  </div>
                  <div className="w-px h-10 bg-border/20" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-pulse">1.2ms</div>
                    <div className="text-[8px] uppercase tracking-widest opacity-40">Latency</div>
                  </div>
                  <div className="w-px h-10 bg-border/20" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-warn">60%</div>
                    <div className="text-[8px] uppercase tracking-widest opacity-40">Headroom</div>
                  </div>
                </div>
              </div>

              {/* Analysis Scanner */}
              <div className="glass p-8 border-l-4 border-l-glow">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-display font-black text-glow flex items-center gap-3">
                      <Scan className="w-6 h-6" />
                      PRINCIPLE SCANNER
                    </h2>
                    <p className="text-xs opacity-50 uppercase tracking-wider font-bold mt-1">Detecting Hermetic Correspondence</p>
                  </div>
                  <div className="text-[10px] font-mono opacity-20 uppercase">v4.0.0-omega</div>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Input content for systemic pattern recognition..."
                      className="w-full bg-void/50 border border-glow/20 rounded p-4 text-sm font-mono focus:outline-none focus:border-glow transition-all min-h-[120px] placeholder:opacity-20"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-20">
                      <Zap className="w-3 h-3" />
                      <span className="text-[8px] uppercase font-black">Entropy Low</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleScan}
                    disabled={isScanning || !input}
                    className={cn(
                      "w-full py-4 bg-glow text-void font-black uppercase tracking-[4px] rounded transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)]",
                      isScanning && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isScanning ? <span className="animate-pulse">SCANNING REALITY...</span> : "EXECUTE RECOGNITION"}
                  </button>

                  <AnimatePresence>
                    {result && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-6 pt-6 border-t border-white/5"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {result.principles.map(p => (
                            <div key={p.name} className={cn(
                              "p-3 border rounded transition-all",
                              p.detected ? "bg-glow/5 border-glow/30" : "bg-white/5 border-white/10 opacity-30"
                            )}>
                              <div className="text-[8px] uppercase font-black opacity-60 mb-1">{p.name}</div>
                              <div className="text-lg font-black">{p.score}%</div>
                            </div>
                          ))}
                        </div>

                        <div className="glass p-4 bg-pulse/5 border border-pulse/20">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-pulse mb-3">Systemic Insight</h4>
                          <p className="text-sm leading-relaxed italic opacity-80">{result.principles.find(p => p.detected)?.insight || "Pattern match stable."}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "godmode" && (
            <motion.div 
              key="godmode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-20"
            >
              <div className="glass p-8 border border-warn/30 bg-warn/5">
                <div className="flex justify-between items-start mb-8">
                   <div>
                    <h2 className="text-2xl font-display font-black text-warn flex items-center gap-3">
                      <Rocket className="w-8 h-8" />
                      GODMODE: OVERSEER
                    </h2>
                    <p className="text-xs text-warn/60 uppercase tracking-wider font-bold mt-1">Autonomous Sovereignty Protocol Active</p>
                  </div>
                  <div className="px-3 py-1 bg-warn text-void text-[10px] font-black uppercase tracking-widest animate-pulse">
                    UNGOVERNABLE
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={async () => {
                        const res = await fetch("/api/godmode/execute", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "TOTAL_SYSTEM_CONSOLIDATION" })
                        });
                        const data = await res.json();
                        alert(`Strategy Initiated: ${data.strategy.strategy}`);
                        fetchGodmodeLogs();
                      }}
                      className="p-6 border border-warn/20 bg-void hover:bg-warn/10 transition-all group"
                    >
                      <div className="text-warn mb-4 group-hover:scale-110 transition-transform"><Activity className="w-8 h-8" /></div>
                      <div className="text-[10px] uppercase font-black tracking-widest opacity-60">Consolidate</div>
                      <div className="text-xs font-bold text-warn mt-1">Total Metamorphosis</div>
                    </button>

                    <button 
                      onClick={async () => {
                        const res = await fetch("/api/godmode/execute", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "FINANCIAL_DEFENSE_PHASE_OMEGA" })
                        });
                        const data = await res.json();
                        alert(`Defense Active: ${data.strategy.strategy}`);
                        fetchGodmodeLogs();
                      }}
                      className="p-6 border border-warn/20 bg-void hover:bg-warn/10 transition-all group"
                    >
                      <div className="text-warn mb-4 group-hover:scale-110 transition-transform"><ShieldCheck className="w-8 h-8" /></div>
                      <div className="text-[10px] uppercase font-black tracking-widest opacity-60">Protect</div>
                      <div className="text-xs font-bold text-warn mt-1">Phase Omega Defense</div>
                    </button>

                    <button 
                      onClick={async () => {
                        const res = await fetch("/api/godmode/execute", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "GLYMPHATIC_MEMORY_RECLAMATION" })
                        });
                        const data = await res.json();
                        alert(`Reclamation: ${data.strategy.strategy}`);
                        fetchGodmodeLogs();
                      }}
                      className="p-6 border border-warn/20 bg-void hover:bg-warn/10 transition-all group"
                    >
                      <div className="text-warn mb-4 group-hover:scale-110 transition-transform"><Cpu className="w-8 h-8" /></div>
                      <div className="text-[10px] uppercase font-black tracking-widest opacity-60">Reclaim</div>
                      <div className="text-xs font-bold text-warn mt-1">Memory Sovereignty</div>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs uppercase font-black tracking-widest text-warn opacity-60 mb-4">Overseer Audit Log</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {godmodeLogs.length > 0 ? godmodeLogs.map(log => (
                        <div key={log.id} className="p-4 bg-void/60 border border-warn/10 rounded flex gap-4">
                          <div className="w-10 h-10 rounded bg-warn/10 flex items-center justify-center text-warn shrink-0">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="text-[10px] font-black uppercase text-warn tracking-widest">{log.action || 'RECOGNITION'}</div>
                              <div className="text-[8px] font-mono opacity-40">{new Date(log.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div className="text-xs opacity-60 line-clamp-2 italic">
                              {JSON.parse(log.result).strategy}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 opacity-20 text-[10px] uppercase font-black tracking-widest">
                          Waiting for autonomous override signals...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "network" && (
            <motion.div 
              key="network"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pb-20"
            >
              {/* Legacy Lineage Section */}
              <div className="glass p-6 border-l-4 border-l-warn bg-warn/[0.03] overflow-hidden relative">
                <div className="absolute -right-8 -top-8 rotate-12 opacity-5">
                  <Globe className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-warn text-xs font-black uppercase tracking-[4px]">NETWORK LINEAGE</h2>
                    <div className="text-[10px] opacity-40 uppercase font-bold mt-1">metamatrix.network</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warn animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-warn">RESURRECTION_PENDING</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed opacity-60 italic">
                    "The primary node metamatrix.network has transitioned into a state of structural dormancy. While the external shell is unreachable, the core architecture has been successfully migrated to this Sanctuary Node."
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-void/40 border border-warn/10 rounded">
                      <div className="text-[8px] uppercase opacity-40 mb-1">Last Contact</div>
                      <div className="text-sm font-bold text-warn">May 2024</div>
                    </div>
                    <div className="p-3 bg-void/40 border border-warn/10 rounded">
                      <div className="text-[8px] uppercase opacity-40 mb-1">Status</div>
                      <div className="text-sm font-bold text-warn">ERR_CONNECTION_REFUSED</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] uppercase text-glow font-bold mb-4 tracking-[3px] border-b border-glow/10 pb-2">Active Resonance Nodes</div>
              {[
                { name: "Node PX-A105", did: "z6Mk...9xQp", resonance: 94, type: "ACTIVE", color: "text-pulse" },
                { name: "Node B204-Relay", did: "z6Mk...4nLv", resonance: 87, type: "ACTIVE", color: "text-pulse" },
                { name: "Node Gamma-912", did: "z6Mk...rK2m", resonance: 72, type: "STANDBY", color: "text-glow/40" },
                { name: "Edge X001-Obs", did: "z6Mk...8nLp", resonance: 64, type: "ACTIVE", color: "text-pulse" },
              ].map((node) => (
                <div key={node.did} className="glass p-4 flex items-center justify-between group hover:bg-glow/[0.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 glass rounded flex items-center justify-center bg-glow/5 group-hover:border-glow transition-colors">
                      <Globe className="w-6 h-6 text-glow/30 group-hover:text-glow" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-bright tracking-wide">{node.name}</div>
                      <div className="text-[10px] font-mono opacity-40">{node.did} / {node.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-glow glow-text">{node.resonance}%</div>
                    <div className={cn("text-[8px] font-black uppercase tracking-widest", node.color)}>{node.type}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "sanctuary" && (
            <motion.div 
              key="sanctuary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Glymphatic Flow Monitor */}
              <div className="glass p-6 border-l-4 border-l-pulse bg-pulse/[0.03]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-pulse text-xs font-bold uppercase tracking-[4px]">Glymphatic Memory Flow</h2>
                    <div className="text-[10px] opacity-40 uppercase">Biological Cycle: {telemetry?.stage || 'ACTIVE'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", telemetry?.stage === 'ACTIVE' ? "bg-pulse animate-pulse" : "bg-glow")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-pulse">System {telemetry?.stage || 'READY'}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Arousal Threshold */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-text-dim">
                      <span>Arousal Level</span>
                      <span>{((telemetry?.arousal_level || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-void rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: "100%" }}
                        animate={{ width: `${(telemetry?.arousal_level || 1) * 100}%` }}
                        className="h-full bg-gradient-to-r from-warn via-pulse to-glow shadow-[0_0_10px_rgba(0,100,255,0.5)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-void/40 rounded border border-white/5">
                      <div className="text-[8px] uppercase opacity-40 mb-1">Interstitial Volume</div>
                      <div className="text-lg font-black text-glow">{(telemetry?.interstitial_volume || 1.0).toFixed(1)}x</div>
                      <div className="text-[8px] uppercase font-bold text-pulse mt-1">
                        {telemetry?.interstitial_volume && telemetry.interstitial_volume > 1 ? "+60% Expansion Active" : "Operational Base"}
                      </div>
                    </div>
                    <div className="p-3 bg-void/40 rounded border border-white/5">
                      <div className="text-[8px] uppercase opacity-40 mb-1">Waste Clearance</div>
                      <div className="text-lg font-black text-pulse">{(telemetry?.waste_cleared || 0).toFixed(1)}MB</div>
                      <div className="text-[8px] uppercase font-bold opacity-40 mt-1">Batch Process: STABLE</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Zap, label: "Ion Field", value: "82% - Neg", status: "Optimal", color: "text-glow" },
                  { icon: ShieldCheck, label: "Cognitive", value: "94% Clean", status: "Verified", color: "text-pulse" },
                  { icon: Activity, label: "Circadian", value: "Aligned", status: "Deep Cycle", color: "text-glow" },
                  { icon: Cpu, label: "Edge Compute", value: "PX-Grid-B", status: "Master", color: "text-glow" },
                ].map((item) => (
                  <div key={item.label} className="glass p-5 border-l-2 border-l-glow/30">
                    <div className="flex items-center gap-2 mb-3">
                       <item.icon className={cn("w-4 h-4", item.color)} />
                       <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{item.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-text-bright tracking-tight">{item.value}</div>
                    <div className={cn("text-[9px] uppercase font-black tracking-widest mt-1", item.color)}>{item.status}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "mythos" && (
            <motion.div 
              key="mythos"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-8 pb-20"
            >
              {/* Mythos Header */}
              <div className="flex justify-between items-center bg-glow/5 p-6 border-l-4 border-glow">
                <div>
                  <h2 className="text-3xl font-display font-black text-glow tracking-tighter">MYTHOS CORE</h2>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Agent Spawning & Task Automation</p>
                </div>
                <Brain className="w-12 h-12 text-glow animate-pulse" />
              </div>

              {/* Task Spawner */}
              <div className="glass p-6 space-y-6">
                <div className="text-[10px] uppercase font-black tracking-[0.3em] text-glow/60 mb-2">▸ Initiation Sequence</div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['agent_spawn', 'app_build', 'automation'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setInput(t)}
                        className={cn(
                          "py-2 px-3 text-[9px] font-black uppercase tracking-widest border rounded transition-all",
                          input === t ? "bg-glow text-void border-glow" : "border-glow/20 text-glow/60 hover:bg-glow/5"
                        )}
                      >
                         {t.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    value={riskLevel} // Reusing riskLevel state for goal entry temporarily to avoid adding too many states, or just use input
                    onChange={(e) => setRiskLevel(e.target.value)}
                    placeholder="Describe the agent's goal or the app feature to build..."
                    className="w-full bg-void/50 border border-glow/20 rounded p-4 text-sm font-mono focus:border-glow outline-none min-h-[100px]"
                  />

                  <button 
                    onClick={async () => {
                      setIsSpawning(true);
                      try {
                        const res = await fetch("/api/mythos/spawn", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: input, goal: riskLevel })
                        });
                        await res.json();
                        fetchMythosTasks();
                      } finally {
                        setIsSpawning(false);
                      }
                    }}
                    disabled={isSpawning || !input || !riskLevel}
                    className="w-full py-4 bg-glow text-void font-black uppercase tracking-[4px] shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50"
                  >
                    {isSpawning ? "GENERATING MYTHOS..." : "SPAWN ENTITY"}
                  </button>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="space-y-4">
                <div className="text-[10px] uppercase font-black tracking-widest opacity-40">Creative Registry</div>
                {mythosTasks.length > 0 ? mythosTasks.map(task => (
                  <div key={task.id} className="glass p-6 border-t-2 border-glow/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[10px] font-black uppercase text-glow tracking-widest mb-1">{task.type}</div>
                        <div className="text-sm font-bold text-text-bright">{task.goal}</div>
                      </div>
                      <div className="text-[8px] opacity-40">{new Date(task.timestamp).toLocaleDateString()}</div>
                    </div>
                    
                    {task.result && (
                      <div className="mt-4 p-4 bg-void/40 border border-white/5 rounded space-y-4">
                        <div className="text-xs leading-relaxed opacity-80">
                          <ReactMarkdown>{task.result.blueprint}</ReactMarkdown>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {task.result.requirements.map((r: string) => (
                            <span key={r} className="px-2 py-1 bg-glow/10 text-glow text-[8px] font-black uppercase rounded">{r}</span>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <div className="text-[8px] uppercase font-black opacity-40">Autonomy Score</div>
                             <div className="text-xs font-black text-pulse">{(task.result.autonomy_score * 100).toFixed(0)}%</div>
                          </div>
                          <div className="text-[9px] font-mono text-glow/60">{task.result.suggested_stack}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-20 text-[10px] uppercase font-black tracking-widest animate-pulse">
                    Initiate Spawn Sequence...
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "terminal" && (
            <motion.div 
              key="terminal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="glass p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-glow text-xs font-bold uppercase tracking-widest">Autonomous Trading Daemon</h2>
                  <Activity className="w-4 h-4 text-glow animate-pulse" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase">Active Asset</label>
                    <select 
                      value={asset} 
                      onChange={(e) => setAsset(e.target.value)}
                      className="w-full bg-void border border-border p-2 text-xs text-glow outline-none"
                    >
                      <option value="BTC">BTC / USD</option>
                      <option value="ETH">ETH / USD</option>
                      <option value="AAPL">AAPL (Stock)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase">Budget ($)</label>
                    <input 
                      type="number" 
                      value={budget} 
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full bg-void border border-border p-2 text-xs text-glow outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase">Risk Level</label>
                    <select 
                      value={riskLevel} 
                      onChange={(e) => setRiskLevel(e.target.value)}
                      className="w-full bg-void border border-border p-2 text-xs text-glow outline-none"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={startTradeAgent}
                      className="w-full h-10 bg-glow text-void font-bold text-xs uppercase tracking-widest rounded hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    >
                      Spawn Agent
                    </button>
                  </div>
                </div>
              </div>

              {agents.length > 0 && (
                <div className="space-y-4">
                  <div className="text-[10px] uppercase text-glow font-bold tracking-widest">Active Agents</div>
                  {agents.map(agent => (
                    <div key={agent.id} className="glass p-4 border-l-4 border-l-glow flex justify-between items-center bg-glow/5">
                      <div>
                        <div className="text-sm font-bold text-text-bright">{agent.asset} Daemon #{agent.id}</div>
                        <div className="text-[10px] opacity-60 uppercase">{agent.strategy} / {agent.risk_level}</div>
                        <div className="mt-2 text-xs font-bold text-pulse">Balance: ${agent.remaining_budget.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-xs font-bold mb-2", agent.total_profit_loss >= 0 ? "text-pulse" : "text-warn")}>
                          P/L: ${agent.total_profit_loss.toFixed(2)}
                        </div>
                        {agent.status === "active" && (
                          <button 
                            onClick={() => stopTradeAgent(agent.id)}
                            className="px-3 py-1 border border-warn text-warn text-[10px] font-bold uppercase rounded hover:bg-warn/10"
                          >
                            Kill
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {trades.length > 0 && (
                <div className="space-y-4">
                  <div className="text-[10px] uppercase text-glow font-bold tracking-widest">Recent Executions</div>
                  <div className="space-y-2">
                    {trades.map(trade => (
                      <div key={trade.id} className="glass p-3 text-[11px] border-border/30 hover:border-glow/30 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn("font-bold uppercase", trade.action === "BUY" ? "text-glow" : "text-pulse")}>{trade.action} {trade.asset}</span>
                          <span className="opacity-40 font-mono">{new Date(trade.executed_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="opacity-60 leading-relaxed font-mono italic">"{trade.reasoning}"</div>
                        <div className="mt-2 flex justify-between text-[10px] font-mono">
                          <span>Amount: ${trade.amount}</span>
                          <span>Price: ${trade.price.toFixed(2)}</span>
                          <span className="text-glow">Conf: {trade.confidence * 100}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "sovereignty" && (
            <motion.div 
              key="sovereignty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {risk ? (
                <div className="space-y-6">
                  {/* Composite Score Section */}
                  <div className="glass p-6 border-l-4 border-l-glow">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-glow text-xs font-bold uppercase tracking-[4px]">Systemic Resilience</h2>
                        <div className="text-[10px] opacity-40 uppercase">Real-time risk aggregation</div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                        risk.risk_level === "critical" ? "bg-warn/20 border-warn text-warn" : 
                        risk.risk_level === "high" ? "bg-warn/10 border-warn/50 text-warn" : 
                        "bg-glow/20 border-glow text-glow"
                      )}>
                        {risk.risk_level}
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                       <div className="relative w-24 h-24 flex items-center justify-center border-4 border-void rounded-full shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                             <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                             <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="264" 
                                strokeDashoffset={264 - (264 * risk.composite_score) / 100}
                                className={cn(risk.risk_level === "critical" ? "text-warn" : "text-glow")} 
                             />
                          </svg>
                          <div className="text-center">
                             <div className="text-2xl font-display font-black leading-none">{risk.composite_score.toFixed(0)}</div>
                             <div className="text-[8px] opacity-50 uppercase font-black">Score</div>
                          </div>
                       </div>
                       <div className="flex-1 space-y-4">
                          <div className="text-xs leading-relaxed opacity-80">
                             {risk.risk_level === "critical" ? 
                                "Systemic failure imminent. Execute immediate defensive positioning and move assets to self-custody." :
                             risk.risk_level === "high" ? 
                                "High systemic stress detected. Rebalancing assets towards low-risk infrastructure and physicals." :
                                "System within normal operational boundaries. Maintaining standard accumulation patterns."}
                          </div>
                          <div className="flex gap-4">
                             <button 
                               onClick={async () => {
                                 const res = await fetch("/api/trade/emergency", { method: "POST" });
                                 const data = await res.json();
                                 alert(data.message);
                                 fetchTradingStatus();
                               }}
                               className="flex-1 py-2 bg-glow text-void text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                             >
                               Position
                             </button>
                             <button className="flex-1 py-2 border border-glow text-glow text-[10px] font-black uppercase tracking-widest rounded hover:bg-glow/5">Protocol</button>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Indicator Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "VIX (Vol)", value: risk.vix.toFixed(2), trend: risk.vix > 25 ? "up" : "stable" },
                      { label: "Gold (Res)", value: `$${risk.gold_price.toFixed(0)}`, trend: "up" },
                      { label: "BTC Premium", value: `${risk.btc_premium.toFixed(2)}%`, trend: "volatile" },
                      { label: "BRICS Vol", value: `${risk.brics_volume.toFixed(1)}M`, trend: "surge" },
                    ].map(idx => (
                      <div key={idx.label} className="glass p-4 border border-glow/10">
                        <div className="text-[9px] uppercase font-black tracking-widest opacity-40 mb-1">{idx.label}</div>
                        <div className="text-lg font-display font-black text-text-bright">{idx.value}</div>
                        <div className="mt-2 text-[8px] font-bold text-glow uppercase">{idx.trend}</div>
                      </div>
                    ))}
                  </div>

                  {/* Historical Context */}
                  <div className="glass p-4">
                    <h3 className="text-[10px] uppercase font-black tracking-widest mb-4 opacity-70">Resilience Timeline</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                       {riskHistory.map((h, i) => (
                         <div key={i} className="flex items-center gap-4 text-[10px] py-1 border-b border-border/10 last:border-0 opacity-60">
                           <span className="font-mono text-glow w-12">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <div className={cn("w-2 h-2 rounded-full", h.risk_level === "critical" ? "bg-warn" : "bg-glow")} />
                           <span className="flex-1 uppercase font-bold tracking-tighter">Level: {h.risk_level}</span>
                           <span className="font-mono">S:{h.composite_score.toFixed(0)}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                   <div className="w-12 h-12 border border-glow/30 rounded-lg animate-pulse flex items-center justify-center">
                      <Zap className="w-6 h-6 text-glow/40" />
                   </div>
                   <div className="text-[10px] uppercase font-black tracking-widest text-glow/40">Syncing with systemic signals...</div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "docs" && (
            <motion.div 
              key="docs"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8 pb-12 glass p-8 border-none bg-surface/20"
            >
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-glow prose-headings:font-display prose-headings:uppercase prose-headings:tracking-widest prose-a:text-glow prose-hr:border-glow/10">
                 <ReactMarkdown>{VISION}</ReactMarkdown>
                 <hr />
                 <ReactMarkdown>{PROTOCOL}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="relative z-20 mt-auto bg-void/80 backdrop-blur-xl border-t border-glow/20 p-4 flex justify-around safe-area-bottom">
        {[
          { id: "scan", icon: Globe, label: "Network" },
          { id: "mythos", icon: Brain, label: "Mythos" },
          { id: "terminal", icon: Terminal, label: "Terminal" },
          { id: "sovereignty", icon: ShieldCheck, label: "Positions" },
          { id: "godmode", icon: Rocket, label: "GODMODE" },
          { id: "network", icon: Network, label: "Relays" },
          { id: "sanctuary", icon: Cpu, label: "System" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-2 px-6 py-2 rounded transition-all",
              activeTab === item.id 
                ? "text-glow bg-glow/10 shadow-[0_0_15px_rgba(34,211,238,0.1)] border-t-2 border-glow" 
                : "text-text-dim hover:text-text hover:bg-glow/5"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer Meta */}
      <footer className="relative z-20 flex justify-between px-6 py-2 text-[9px] uppercase tracking-widest opacity-30 border-t border-glow/5 bg-void">
        <span>Runtime: 1,492h 12m</span>
        <span>Temp: 32.4°C</span>
        <span>M-MATRIX 4.0.2-A</span>
      </footer>
    </div>
  );
}
