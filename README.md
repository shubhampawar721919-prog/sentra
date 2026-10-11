# SENTRA — AI-Based Sensor Trust, Drift & False-Alarm Detection Platform

> **Tagline:** Trust the Signal. Detect the Fault.  
> **Competition:** Code Apex — Track 4: Technology for Social Cause  
> **Selected Problem Statement:** AI-Based Sensor Trust, Drift and False-Alarm Detection

---

## 1. Executive Summary

**SENTRA** is an industrial-grade sensor intelligence and autonomous digital-twin platform developed to solve critical sensor degradation in harsh remote infrastructure. In extreme remote environments (such as Indian Antarctic Research Stations *Bharati* and *Maitri* operated by NCPOR/MoES), harsh blizzards, thermal cycling, and electrical interference cause sensor drift, transient spikes, stuck readings, and intermittent dropouts.

Traditional monitoring systems rely on static threshold alerts that trigger frequent false alarms during genuine environmental events (such as sudden polar blizzards dropping temperature across an entire meteorological mast) while failing to detect gradual transducer drift or frozen stuck-at values that remain within static bounds.

**SENTRA solves this by:**
1. **Continuous Signal Verification & Anomaly Scoring:** Unsupervised isolation forest and rolling statistical moments evaluate signal jitter and temporal rate of change.
2. **Spatial Peer Consensus & Disambiguation:** Compares candidate readings against physically correlated spatial peers. When all peers shift in physical concordance, SENTRA confirms a **Genuine Environmental Event** (0 false alarms). When only a single sensor diverges, SENTRA flags a **Hardware Sensor Fault** (Gradual Drift or Stuck-At).
3. **Calibrated 0–100 Sensor Trust Metric:** Dynamically estimates continuous trust based on peer concordance, temporal persistence, missing-data rates, and transducer noise.
4. **Impacted Asset Digital Twin & Cascading Risk:** Connects verified sensor health to operational assets (Generators, HVAC Air Handlers, Cooling Pumps, Battery BESS) to simulate downstream risk without propagating low-trust readings into false shutdowns.
5. **Model Evaluation Workspace:** Backed by held-out test trajectories, reporting real confusion matrices, class-by-class metrics, and proving a **90% false-alarm reduction** versus naive threshold baselines.

---

## 2. Supported Sensor Fault Scenarios

SENTRA detects, classifies, and explains 8 canonical operating regimes:

| Regime Class | Description | Detection Mechanism |
|---|---|---|
| `NORMAL` | Standard operational variance within baseline bounds | Rolling mean ($\mu$) & standard deviation ($\sigma$) within nominal limits |
| `GRADUAL_DRIFT` | Progressive thermocouple/transducer calibration divergence | Moving linear slope & spatial peer residual divergence ($> 5.0\sigma$) |
| `SUDDEN_SPIKE` | Transient impulse electrical spike or ADC bit error | Step impulse derivative ($\Delta > 12.0$) unconfirmed by peer channels |
| `FROZEN_STUCK` | Transducer lockup returning identical static readings | Zero dynamic variance detector ($N \ge 8$ identical consecutive cycles) |
| `EXCESSIVE_NOISE` | High-frequency circuit noise or loose shielding jitter | Moving window standard deviation breach ($\sigma > 3.0\times$ baseline) |
| `MISSING_DROPOUT` | Intermittent packet loss or complete telemetry dropout | Telemetry frame gap detector ($null$ / $NaN$ / packet timeout) |
| `RATE_OF_CHANGE_ANOMALY` | Physically impossible step rate of change | First-order difference exceeding physical thermodynamics limits |
| `GENUINE_ENVIRONMENTAL_EVENT` | True ambient weather shock (e.g. polar blizzard) | Cross-sensor spatial concordance ($\ge 60\%$) with peer residual $< 2.5\sigma$ |

---

## 3. Mathematical & ML Architecture

### A. Contextual Sensor Intelligence Ensemble
* **Unsupervised Anomaly Detector:** `IsolationForest` (60 estimators, contamination=0.04) trained on nominal steady-state trajectories to capture multi-dimensional baseline manifolds.
* **Supervised Fault Classifier:** Balanced `RandomForestClassifier` (70 estimators, max_depth=8) trained on multi-sensor feature matrices including:
  * Rolling mean, rolling variance, and moving slope over a sliding window ($W=8$).
  * Peer median, peer residual $|\text{reading} - \text{median}(\text{peers})|$, and spatial concordance ratio.
  * Consecutive stuck-at streak counter and missing measurement rates.

### B. Calibrated Sensor Trust Formulation ($0 - 100$)
Trust $T(t)$ is computed deterministically:
$$T(t) = \text{clamp}\left(100 - \sum \delta_{\text{evidence}}, 0, 100\right)$$
* For **Genuine Environmental Events**: Peer concordance guarantees sensor health is preserved:
  $$T_{\text{genuine}} = \max\left(90.0, 100.0 - 1.5 \cdot \text{residual}_{\text{peer}}\right)$$
* For **Hardware Faults**: Penalties are applied based on anomaly persistence, calibration divergence, and signal loss ($\delta_{\text{drift}} = -30$, $\delta_{\text{stuck}} = -45$, $\delta_{\text{dropout}} = -55$).
* Status thresholds:
  * $T \ge 85$: `HEALTHY`
  * $60 \le T < 85$: `SUSPECTED_FAULT`
  * $T < 60$: `CONFIRMED_FAULT`
  * Data dropout: `STALE_MISSING`

---

## 4. Full-Stack System Architecture

```
[ Synthetic / Real Telemetry Generator / SCADA Gateway ]
                         │
                         ▼
             [ Node.js Express Backend ] (:5001)
     ┌───────────────────┴───────────────────┐
     ▼                                       ▼
[ MongoDB / In-Memory ]             [ Python ML FastAPI Service ] (:8000)
- Station & Asset Twins             - Isolation Forest Anomaly Detector
- Monitored Sensor Channels         - Random Forest Fault Classifier
- Explainable Alerts & Audits       - Held-out Benchmark Evaluator
- Evaluation Benchmark Results      - Peer Spatial Concordance Logic
     │                                       │
     └───────────────────┬───────────────────┘
                         ▼
             [ React 19 + Vite Frontend ] (:5173)
             - Sensor Intelligence Overview Dashboard
             - Sensor Explorer & Historical Timeseries
             - Model Evaluation Workspace & Confusion Matrix
             - Connected Digital Twin & Dependency Graph
             - Explainable Decision Support & Alert Drawer
```

---

## 5. Quickstart & Local Reproduction

### Prerequisites
* **Node.js** v18+ (tested on v20 and v22)
* **Python** 3.10+ (tested on Python 3.12 / 3.14)
* **npm** v9+

### Option A: 1-Command Startup (Recommended)
```bash
# Clone repository
git clone https://github.com/Atharva7153/Polaris.git
cd Polaris

# Run automated setup script (installs npm dependencies and Python venv)
chmod +x setup.sh start.sh
./setup.sh

# Start all three services concurrently (Frontend, Backend, ML)
npm run dev
```

### Option B: Manual Service Startup
1. **Start Python ML Service (Port 8000):**
   ```bash
   cd ml
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Backend API & Database (Port 5001):**
   ```bash
   cd backend
   npm install
   # Automatic in-memory MongoDB fallback activates if local mongod is not present!
   npm run dev
   ```

3. **Start Frontend Console (Port 5173):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 6. Judge & Demo Credentials

Click the **"1-Click Judge Login"** button on the login screen, or authenticate using:

| Field | Value |
|---|---|
| **Demo Email** | `admin@sentra.ai` *(or `admin@polaris.gov`)* |
| **Password** | `password123` |
| **Role** | System Administrator / Mission Operations Specialist |

---

## 7. Interactive Judge Demonstration Guide

Follow this 5-step walkthrough to verify all Track 4 requirements:

1. **Sensor Intelligence Overview (`/dashboard`):**
   * Inspect the live fleet metrics: Monitored Sensors (24+ channels), Healthy Channels, Suspected Faults, Fleet Trust Score ($96/100$), and False-Alarm Reduction ($-90\%$).
   * Use the **Live Demo Scenario Injector** strip at the top to inject scenarios with 1 click.

2. **Demonstrate Sensor Fault vs. Genuine Event Disambiguation:**
   * Click **"Simulate Sensor Drift (Fault)"**: Injects $+8.5^\circ\text{C}$ drift into `SEN-TEMP-ENV-01` while peer sensors stay nominal. Notice `SEN-TEMP-ENV-01` is flagged as `SUSPECTED_FAULT` (Trust drops to $65\%$) with explainable evidence attributing the divergence to a single transducer failure. Downstream HVAC systems are **protected** from false alarms.
   * Click **"Trigger Cold Front (Genuine Event)"**: Simulates a sudden $-14^\circ\text{C}$ polar blizzard dropping all 3 weather mast sensors simultaneously in consensus. Notice the system identifies `GENUINE_ENVIRONMENTAL_EVENT`, maintaining $95\%+$ sensor trust and producing **ZERO false hardware alarms**.
   * Click **"Reset Nominal"** to restore nominal baseline.

3. **Inspect Timeseries in Sensor Explorer (`/telemetry`):**
   * Select `SEN-TEMP-ENV-01`.
   * View the real-time Recharts timeseries chart displaying raw readings, detected anomalies, peer consensus bands, and historical trust trajectories.
   * Review the explainable evidence factors, nominal operating envelopes, and downstream asset dependencies.

4. **Model Evaluation Workspace (`/analytics`):**
   * Inspect the real benchmark metrics computed on held-out test trajectories (Macro F1: $58\%$, Genuine Event Recall: $95\%$, False Alarm Rate: $0.0\%$, Detection Delay: $1.2$ cycles, Inference Latency: $8.7\text{ ms}$).
   * Review the **Head-to-Head Comparison Table** proving $-90\%$ false alarms compared to static thresholds.
   * Explore the interactive **8x8 Confusion Matrix Heatmap** (hover over any cell to see ground truth vs predicted distributions).
   * Click **"Run Live Benchmark Test"** to trigger a live evaluation run across 1,200 synthetic held-out samples.

5. **Operational Digital Twin & Explainable Alerts (`/digital-twin` & `/alerts`):**
   * In Digital Twin, observe the **SENSOR TRUST** metric badge alongside station resilience and energy margins.
   * In Alerts, click any active alert to open the **Explainable Decision Support Drawer** showing root-cause diagnosis, cross-referenced peer sensors, cascade consequences, and recommended operator maintenance actions.

---

## 8. Technology Stack Summary

* **Frontend:** React 19, Vite 8, Tailwind CSS, Recharts 3, Framer Motion, Lucide Icons, Socket.IO Client.
* **Backend:** Node.js, Express, Socket.IO, Mongoose, In-Memory MongoDB Server (zero setup friction), Axios.
* **Machine Learning:** Python 3.12+, FastAPI, Scikit-Learn (Isolation Forest & Random Forest), XGBoost, Pandas, NumPy, Joblib.

---

*SENTRA · Trust the Signal. Detect the Fault. · Developed for Code Apex — Track 4: Technology for Social Cause.*
