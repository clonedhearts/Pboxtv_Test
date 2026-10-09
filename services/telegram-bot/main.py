import sys
import os

# Ensure services/telegram-bot root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from Backend.fastapi.sidecar import sidecar as app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
