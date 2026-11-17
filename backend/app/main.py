from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.audit_logs import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.customers import router as customers_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.issues import router as issues_router
from app.api.v1.products import router as products_router
from app.api.v1.receipts import router as receipts_router
from app.api.v1.reports import router as reports_router
from app.api.v1.stock_counts import router as stock_counts_router
from app.api.v1.suppliers import router as suppliers_router
from app.api.v1.system_settings import router as settings_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.units import router as units_router
from app.api.v1.users import router as users_router
from app.api.v1.warehouses import router as warehouses_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.logging import logger, setup_logging
from app.utils.seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging
    setup_logging()
    logger.info("Initializing StockManager WMS backend...")

    # Seed initial data
    try:
        async with AsyncSessionLocal() as session:
            await seed_database(session)
    except Exception as e:
        logger.warning(f"Seed data note (database might be initializing or already seeded): {e}")

    yield

    logger.info("Shutting down StockManager WMS backend...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Hệ Thống Quản Lý Xuất Nhập Tồn Kho (Warehouse & Inventory Management System)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append(f"{field}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Dữ liệu gửi lên không hợp lệ", "errors": errors},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau."},
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
    }


# Include API v1 Routers
prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=prefix)
app.include_router(users_router, prefix=prefix)
app.include_router(categories_router, prefix=prefix)
app.include_router(units_router, prefix=prefix)
app.include_router(warehouses_router, prefix=prefix)
app.include_router(suppliers_router, prefix=prefix)
app.include_router(customers_router, prefix=prefix)
app.include_router(products_router, prefix=prefix)
app.include_router(inventory_router, prefix=prefix)
app.include_router(receipts_router, prefix=prefix)
app.include_router(issues_router, prefix=prefix)
app.include_router(transfers_router, prefix=prefix)
app.include_router(stock_counts_router, prefix=prefix)
app.include_router(reports_router, prefix=prefix)
app.include_router(audit_router, prefix=prefix)
app.include_router(settings_router, prefix=prefix)

