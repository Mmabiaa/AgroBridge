from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, products, orders, sensors, forums, comments, events, gpt, plans, reminders, blockchain
import models.user
import models.product
import models.order
import models.sensor_data
import models.forum
import models.comment
import models.event
import models.gpt_log
import models.plan
import models.reminder
import models.blockchain_certificate
# New models
import models.farm
import models.market_price
import models.audit_log
from routers import rbac
from routers import voice

app = FastAPI()

# Allow all origins for development; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(engine)  # type: ignore[attr-defined]

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(sensors.router)
app.include_router(forums.router)
app.include_router(comments.router)
app.include_router(events.router)
app.include_router(gpt.router)
app.include_router(plans.router)
app.include_router(reminders.router)
app.include_router(blockchain.router)
app.include_router(rbac.router)
app.include_router(voice.router)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"} 