import contextlib

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

MTG_API_BASE = "http://api:8000"


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=MTG_API_BASE, timeout=30.0) as client:
        app.state.client = client
        yield


app = FastAPI(lifespan=lifespan)


@app.api_route("/api/{path:path}", methods=["GET"])
async def proxy(path: str, request: Request):
    client: httpx.AsyncClient = request.app.state.client
    url = httpx.URL(path=f"/{path}", query=request.url.query.encode())
    resp = await client.get(url)
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type", "application/json"),
    )


app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    return FileResponse("static/index.html")
