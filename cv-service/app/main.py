import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .auth import require_auth
from .config import get_settings
from .embedding import get_registry
from .errors import CvError, error_response
from .schemas import CompareRequest, CompareResponse, EmbedRequest, EmbedResponse
from .service import run_compare, run_embed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cv")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    logger.info(
        "cv service starting environment=%s mongo_database=%s references_collection=%s model=%s",
        settings.environment,
        settings.mongodb_db,
        settings.mongodb_references_collection,
        settings.cv_service_model,
    )
    get_registry().preload()  # raises -> process refuses to start with a broken model
    logger.info("cv service ready")
    yield


_s = get_settings()
app = FastAPI(
    title="Sanskriti Snap CV Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if _s.cv_enable_docs else None,
    redoc_url=None,
    openapi_url="/openapi.json" if _s.cv_enable_docs else None,
)
# No CORS middleware on purpose: this service is server-to-server only.

# Router-level auth runs before body validation, so unauthenticated callers always get 401.
router = APIRouter(dependencies=[Depends(require_auth)])


# Plain `def` handlers: FastAPI runs them in a threadpool, so CPU/GPU inference
# does not block the event loop.
@router.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    return run_embed(req)


@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    logger.info(
        "compare request artifact=%s inline_references=%d top_k=%d image_present=%s model=%s",
        req.artifactId or "<inline>",
        len(req.references or []),
        req.topK,
        bool(req.image),
        req.model or "default",
    )
    return run_compare(req)


app.include_router(router)


@app.get("/health")
def health():
    if get_registry().ready:
        return {"status": "ok"}
    return JSONResponse(status_code=503, content={"status": "unavailable"})


@app.exception_handler(CvError)
async def _cv_error(request: Request, exc: CvError):
    logger.warning(
        "request failed method=%s path=%s status=%d code=%s message=%s",
        request.method,
        request.url.path,
        exc.status,
        exc.code,
        exc.message,
    )
    return error_response(exc.code, exc.status, exc.message)


@app.exception_handler(RequestValidationError)
async def _validation_error(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    loc = ".".join(str(p) for p in first.get("loc", ()) if p != "body")
    msg = first.get("msg", "invalid request")
    logger.warning(
        "request validation failed method=%s path=%s location=%s message=%s",
        request.method,
        request.url.path,
        loc or "body",
        msg,
    )
    return error_response("INVALID_REQUEST", 400, f"{loc}: {msg}" if loc else msg)


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    logger.exception("unhandled error method=%s path=%s", request.method, request.url.path)
    return error_response("INTERNAL_ERROR", 500, "Internal error")  # no internals leaked
