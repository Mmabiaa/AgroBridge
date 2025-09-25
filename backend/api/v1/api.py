from fastapi import APIRouter

from .endpoints import (
    auth,
    users,
    products,
    orders,
    ai_assistant,
    farms,
    market_prices,
    forums,
    notifications
)

api_router = APIRouter()

# Include all API endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(ai_assistant.router, prefix="/ai", tags=["AI Assistant"])
api_router.include_router(farms.router, prefix="/farms", tags=["Farms"])
api_router.include_router(market_prices.router, prefix="/market-prices", tags=["Market Prices"])
api_router.include_router(forums.router, prefix="/forums", tags=["Forums"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
