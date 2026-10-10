import json
import os
from dotenv import load_dotenv
from fastapi.testclient import TestClient

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import app

load_dotenv()

scenarios = {
    "Scenario 1 - Healthy Generator": {
        "assetId": "DG-001",
        "temperature": 80.0,
        "vibration": 0.15,
        "powerOutput": 400.0,
        "generatorLoad": 70.0,
        "fuelLevel": 85.0,
        "coolantTemperature": 75.0,
        "batteryVoltage": 26.5
    },
    "Scenario 2 - Degrading Generator": {
        "assetId": "DG-001",
        "temperature": 92.0,
        "vibration": 0.55,
        "powerOutput": 450.0,
        "generatorLoad": 90.0,
        "fuelLevel": 45.0,
        "coolantTemperature": 88.0,
        "batteryVoltage": 25.0
    },
    "Scenario 3 - Critical Generator": {
        "assetId": "DG-001",
        "temperature": 110.0,
        "vibration": 1.2,
        "powerOutput": 480.0,
        "generatorLoad": 105.0,
        "fuelLevel": 15.0,
        "coolantTemperature": 102.0,
        "batteryVoltage": 22.0
    }
}

def test_what_if_scenarios(client, baseline):
    print("\n" + "=" * 60)
    print("--- What-If Simulation Scenarios ---")
    
    simulations = [
        {
            "name": "Scenario 1: Generator vibration increases",
            "changes": {"vibration": baseline["vibration"] + 0.8}
        },
        {
            "name": "Scenario 2: Generator overheats",
            "changes": {
                "temperature": baseline["temperature"] + 25.0,
                "coolantTemperature": baseline["coolantTemperature"] + 20.0
            }
        },
        {
            "name": "Scenario 3: Generator approaches overload",
            "changes": {
                "generatorLoad": 102.0,
                "powerOutput": baseline["powerOutput"] + 50.0 # representing instability
            }
        },
        {
            "name": "Scenario 4: Primary generator failure",
            "changes": {
                "temperature": 120.0,
                "vibration": 1.5,
                "generatorLoad": 110.0,
                "fuelLevel": 5.0
            }
        }
    ]
    
    for sim in simulations:
        print(f"\n{sim['name']}")
        print("-" * 40)
        sim_req = {
            "assetId": "DG-001",
            "baseline": baseline,
            "changes": sim["changes"]
        }
        res = client.post("/simulation", json=sim_req)
        if res.status_code == 200:
            data = res.json()
            print(f"Baseline Risk: {data['baseline']['riskLevel']} (Score: {data['baseline']['anomalyScore']}/{data['baseline']['failureProbability']})")
            print(f"Simulated Risk: {data['simulation']['riskLevel']} (Score: {data['simulation']['anomalyScore']}/{data['simulation']['failureProbability']})")
            print(f"Risk Increase: {data['change']['riskIncrease']}")
            
            cascade = data['cascade']
            if cascade['affectedAssets']:
                print(f"Cascading Impacts:")
                for impact in cascade['cascadeRisks']:
                    print(f"-> {impact['assetId']}: {impact['level']} risk ({impact['reason']})")
            else:
                print(f"Cascading Impacts: None")
        else:
            print(f"Simulation Error: {res.text}")

def main():
    print("Testing ML layer Phase 5 (TestClient)")
    print("=" * 60)
    
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/health")
        if res.status_code == 200:
            health = res.json()
            print(f"Health Check: {json.dumps(health, indent=2)}")
        else:
            print("Health Check Failed")
            return
            
        print("=" * 60)
        
        for name, telemetry in scenarios.items():
            print(f"\n{name}")
            print("-" * 40)
            
            # Unified Intelligence (Phase 5 endpoint)
            res = client.post("/unified-intelligence", json=telemetry)
            if res.status_code == 200:
                result = res.json()
                print(f"Risk Result: {result['risk']['level']} (Score: {result['risk']['score']})")
                print(f"Anomaly Score: {result['anomaly']['score']}")
                print(f"Failure Probability: {result['failurePrediction']['probability']}")
                
                # Decision Engine
                decision = result['decision']
                print(f"\nDeterministic Decision Engine:")
                print(f"Priority: {decision['priority']}")
                print(f"Action: {decision['action']}")
                print(f"Reasons: {decision['reason']}")
                
                # Cascade Engine
                cascade = result['cascade']
                print(f"\nCascading Impacts:")
                if cascade['affectedAssets']:
                    for impact in cascade['cascadeRisks']:
                        print(f"-> {impact['assetId']}: {impact['level']} risk ({impact['reason']})")
                else:
                    print("-> None")
                
                # AI Explanation
                ai_req = {
                    "assetId": telemetry["assetId"],
                    "telemetry": telemetry,
                    "anomaly": result["anomaly"],
                    "failurePrediction": result["failurePrediction"],
                    "risk": result["risk"],
                    "cascade": cascade,
                    "decision": decision
                }
                
                try:
                    ai_res = client.post("/ai-analysis", json=ai_req)
                    if ai_res.status_code == 200:
                        print("\nAI Explanation:")
                        ai_data = ai_res.json()
                        print(f"- Analysis: {ai_data['analysis']}")
                        print(f"- Recommendation: {ai_data['recommendation']}")
                        print(f"- Possible Causes: {', '.join(ai_data['possibleCauses'])}")
                    else:
                        print(f"AI Analysis Error: {ai_res.text}")
                except Exception as e:
                    print(f"AI Analysis Request Failed: {e}")
                    
            else:
                print(f"Error: {res.text}")
            print("=" * 60)
            
        # Test Simulation Scenarios on Baseline Healthy Generator
        test_what_if_scenarios(client, scenarios["Scenario 1 - Healthy Generator"])

if __name__ == "__main__":
    main()
