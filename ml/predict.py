"""
PanchayatMausam - Model Inference & Evaluation CLI
Loads trained downscaler model weights and outputs calibrated micro-climate forecast.
"""

import os
import sys
import json
import joblib
import pandas as pd

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), 'artifacts', 'downscaler_gbdt_v1.joblib')

def predict_panchayat_weather(block_temp, block_rain, block_humidity, block_wind, 
                              delta_elev, panch_elev, slope_deg, aspect_deg, dist_water_km,
                              month=9, hour=12):
    if not os.path.exists(ARTIFACT_PATH):
        print(f"Error: Model artifact not found at {ARTIFACT_PATH}")
        sys.exit(1)

    bundle = joblib.load(ARTIFACT_PATH)
    model = bundle['model']
    feature_cols = bundle['feature_cols']
    q95_uncertainty = bundle['q95_uncertainty']

    row = {
        'block_temp': [block_temp],
        'block_rain': [block_rain],
        'block_humidity': [block_humidity],
        'block_wind': [block_wind],
        'delta_elevation': [delta_elev],
        'panch_elev': [panch_elev],
        'slope_deg': [slope_deg],
        'aspect_deg': [aspect_deg],
        'distance_to_water_km': [dist_water_km],
        'month': [month],
        'hour': [hour]
    }
    df = pd.DataFrame(row)[feature_cols]
    pred_temp = float(model.predict(df)[0])

    result = {
        "baseline_block_temp_degC": round(block_temp, 2),
        "predicted_panchayat_temp_degC": round(pred_temp, 2),
        "temperature_delta_degC": round(pred_temp - block_temp, 2),
        "conformal_95_ci_lower_degC": round(pred_temp - q95_uncertainty, 2),
        "conformal_95_ci_upper_degC": round(pred_temp + q95_uncertainty, 2),
        "uncertainty_margin_degC": round(q95_uncertainty, 2)
    }
    return result

if __name__ == '__main__':
    # Test sample: High altitude Himalayan village
    out = predict_panchayat_weather(
        block_temp=26.5,
        block_rain=2.0,
        block_humidity=65.0,
        block_wind=12.0,
        delta_elev=1970.0, # 1970m higher than block centroid!
        panch_elev=2730.0,
        slope_deg=28.0,
        aspect_deg=200.0,
        dist_water_km=0.2,
        month=9,
        hour=14
    )
    print(json.dumps(out, indent=2))
