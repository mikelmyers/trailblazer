"""Entry point: python -m primordia.external_api.terra"""

import os

import uvicorn

from .app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("TERRA_API_PORT", "8100"))
    uvicorn.run(
        "primordia.external_api.terra.__main__:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("TERRA_API_RELOAD", "").lower() in ("true", "1"),
    )
