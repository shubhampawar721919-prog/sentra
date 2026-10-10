import pandas as pd

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies feature engineering consistently for training and inference.
    """
    df_engineered = df.copy()
    
    # Ratios and Interactions
    # temperature_vibration_ratio
    # Add a small epsilon to avoid division by zero
    df_engineered['temperature_vibration_ratio'] = df_engineered['temperature'] / (df_engineered['vibration'] + 1e-5)
    
    # load_temperature_interaction
    df_engineered['load_temperature_interaction'] = df_engineered['generatorLoad'] * df_engineered['temperature']
    
    # power_efficiency
    df_engineered['power_efficiency'] = df_engineered['powerOutput'] / (df_engineered['generatorLoad'] + 1e-5)
    
    # Select final features
    features = [
        'temperature',
        'vibration',
        'powerOutput',
        'generatorLoad',
        'fuelLevel',
        'coolantTemperature',
        'batteryVoltage',
        'temperature_vibration_ratio',
        'load_temperature_interaction',
        'power_efficiency'
    ]
    
    return df_engineered[features]
