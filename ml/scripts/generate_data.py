import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_telemetry_data(num_samples=10000):
    np.random.seed(42)
    
    # Base timestamp
    start_time = datetime(2026, 1, 1)
    
    data = []
    
    for i in range(num_samples):
        timestamp = start_time + timedelta(hours=i)
        asset_id = "DG-001"
        
        # Decide the state
        rand_state = np.random.rand()
        
        if rand_state < 0.75:
            # NORMAL (75%)
            state = "NORMAL"
            failure_horizon = 0
            
            load = np.random.uniform(50, 85)
            temp = 75 + load * 0.1 + np.random.normal(0, 1.5)
            vibration = 0.1 + load * 0.002 + np.random.normal(0, 0.05)
            power = load * 5 + np.random.normal(0, 5)
            coolant = 70 + load * 0.08 + np.random.normal(0, 1)
            battery = np.random.uniform(25, 28)
            fuel = np.random.uniform(20, 100)
            
        elif rand_state < 0.90:
            # WARNING (15%)
            state = "WARNING"
            failure_horizon = 0
            
            load = np.random.uniform(75, 95)
            temp = 85 + load * 0.15 + np.random.normal(0, 2)
            vibration = 0.4 + np.random.uniform(0, 0.3)
            power = load * 4.8 + np.random.normal(0, 15)
            coolant = 80 + load * 0.1 + np.random.normal(0, 1.5)
            battery = np.random.uniform(23, 26)
            fuel = np.random.uniform(15, 90)
            
        else:
            # ANOMALY / FAILURE PRECURSOR (10%)
            state = "FAILURE_PRECURSOR"
            failure_horizon = 1
            
            load = np.random.uniform(85, 110)
            temp = 95 + load * 0.15 + np.random.normal(0, 3)
            vibration = 0.8 + np.random.uniform(0, 0.8)
            power = load * 4.5 + np.random.normal(0, 30) # High fluctuation
            coolant = 95 + load * 0.1 + np.random.normal(0, 2)
            battery = np.random.uniform(20, 24)
            fuel = np.random.uniform(5, 50)
            
        # Ensure non-negative bounds
        vibration = max(0.01, vibration)
        power = max(0, power)
            
        data.append({
            "timestamp": timestamp.isoformat(),
            "assetId": asset_id,
            "temperature": round(temp, 2),
            "vibration": round(vibration, 3),
            "powerOutput": round(power, 1),
            "generatorLoad": round(load, 1),
            "fuelLevel": round(fuel, 1),
            "coolantTemperature": round(coolant, 2),
            "batteryVoltage": round(battery, 2),
            "state_label": state,
            "failure_within_horizon": failure_horizon
        })
        
    df = pd.DataFrame(data)
    
    os.makedirs("data/raw", exist_ok=True)
    file_path = "data/raw/synthetic_telemetry.csv"
    df.to_csv(file_path, index=False)
    print(f"Generated {num_samples} samples and saved to {file_path}")

if __name__ == "__main__":
    generate_telemetry_data(10000)
