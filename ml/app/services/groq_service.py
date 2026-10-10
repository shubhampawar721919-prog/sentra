import os
from dotenv import load_dotenv
from groq import Groq
import json

load_dotenv()

def generate_ai_analysis(data: dict) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
    
    if not api_key:
        return {
            "analysis": "GROQ_API_KEY not configured. Mock analysis: The asset appears to be functioning normally.",
            "possibleCauses": ["Mock cause 1", "Mock cause 2"],
            "recommendation": "Mock recommendation: Monitor system."
        }
    
    client = Groq(api_key=api_key)
    
    prompt = f"""
You are an expert AI diagnostician for the POLARIS Antarctic research station.
Analyze the following machine learning results and telemetry for asset {data.get('assetId')}.

Telemetry: {json.dumps(data.get('telemetry', {}))}
Anomaly Detection: {json.dumps(data.get('anomaly', {}))}
Failure Prediction: {json.dumps(data.get('failurePrediction', {}))}
Overall Risk: {json.dumps(data.get('risk', {}))}
Cascade Impact: {json.dumps(data.get('cascade', {}))}
Deterministic Decision: {json.dumps(data.get('decision', {}))}

Provide a brief, professional explanation of these results. 
Do NOT invent new numerical scores, probabilities, or risk levels; use only what is provided in the inputs. 
Explain WHY the deterministic decision was made (e.g., if Priority is URGENT, explain the telemetry/risk factors leading to it). Include cascading impacts on downstream systems if applicable.

Structure your response as valid JSON with the following keys:
- "analysis": A string providing a 2-3 sentence explanation of the situation, including cascading impact.
- "possibleCauses": A list of strings (1-3 items) suggesting what might be causing any issues (or ["None"] if normal).
- "recommendation": A string providing a clear operator recommendation matching the given deterministic decision action.
"""
    
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a JSON-only API. Only output valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result_str = completion.choices[0].message.content
        result_json = json.loads(result_str)
        return {
            "analysis": result_json.get("analysis", "Analysis unavailable."),
            "possibleCauses": result_json.get("possibleCauses", []),
            "recommendation": result_json.get("recommendation", "Monitor system.")
        }
    except Exception as e:
        return {
            "analysis": f"AI analysis failed: {str(e)}",
            "possibleCauses": [],
            "recommendation": "Review manual diagnostics."
        }
