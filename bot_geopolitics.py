import json
import os
from llama_cpp import Llama

def run_geopolitics_agent():
    print("🌐 Initiating Geopolitical Intelligence Agent (Hormuz/Regional Tracker)...")
    
    # 1. Read localized intelligence feed
    try:
        with open("intelligence_feed.json", "r") as f:
            feed = json.load(f)
    except FileNotFoundError:
        print("❌ Error: intelligence_feed.json not found. Run the aggregator first.")
        return

    events = feed.get("events", [])
    
    # 2. Isolate geopolitical/transit events (e.g., HORMUZNORMAL)
    geo_events = [e for e in events if any(kw in e.get("ticker", "").upper() for kw in ["HORMUZ", "GEOPOLITICS", "CONFLICT", "STRAIT"])]
    
    if not geo_events:
        # Fallback to general event streams if exact keyword isn't matched
        geo_events = [e for e in events if "FED" not in e.get("ticker", "").upper() and "BALLON" not in e.get("ticker", "").upper() and "GOLF" not in e.get("ticker", "").upper()]

    if not geo_events:
        print("⚠️ No geopolitical events found in current feed.")
        return

    # 3. Extract targets
    geo_target = geo_events[0]
    ticker = geo_target.get('ticker')
    contracts = [c.get('ticker') for c in geo_target.get('contracts', [])]
    
    print(f"\n🎯 Target Locked: {ticker}")
    print(f"Contract Outcomes: {contracts}")

    # 4. Locate Local GGUF Model across home/project directories
    model_path = ""
    search_dirs = [".", os.path.expanduser("~"), os.path.expanduser("~/metamatrix")]
    for directory in search_dirs:
        if os.path.exists(directory):
            for root, dirs, files in os.walk(directory):
                for file in files:
                    if file.endswith(".gguf"):
                        model_path = os.path.join(root, file)
                        break
                if model_path:
                    break
        if model_path:
            break

    if not model_path:
        print("\n⚠️ No .gguf model file detected in local paths.")
        return

    print(f"\n🧠 Loading local LLM engine: {model_path}...")
    llm = Llama(model_path=model_path, n_ctx=2048, verbose=False)

    # 5. Structured Prompting for Geopolitical Risk Analysis
    prompt = f"""<|im_start|>system
You are a strategic geopolitical intelligence and risk-assessment engine.
Analyze the event contract: {ticker}.
Outcomes: {', '.join(contracts)}.
Provide an estimated probability distribution across these outcomes based on regional security, transit stability, and naval logistics norms.
<|im_end|>
<|im_start|>user
Evaluate probability and risk factors for {ticker}.
<|im_end|>
<|im_start|>assistant
"""

    print("⚡ Synthesizing geopolitical risk assessment...")
    output = llm(prompt, max_tokens=200, stop=["<|im_end|>"], echo=False)
    verdict = output['choices'][0]['text'].strip()

    print("\n=== 🔮 LOCAL MODEL GEOPOLITICAL VERDICT ===")
    print(verdict)

if __name__ == "__main__":
    run_geopolitics_agent()
