import json
with open("package.json", "r") as f:
    pkg = json.load(f)

pkg["scripts"]["dev:ml"] = "cd ml && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"

with open("package.json", "w") as f:
    json.dump(pkg, f, indent=2)

