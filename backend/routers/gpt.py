from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from models.gpt_log import GPTLog
from schemas.gpt_log import GPTLogCreate, GPTLogOut
from database import SessionLocal
import os
import shutil
from google import genai
# from openai import OpenAI # Uncomment and configure for real OpenAI integration

router = APIRouter(prefix="/agri-gpt", tags=["agri-gpt"])
client = genai.Client("AIzaSyBT8DBKf63KRJRm_7h8Zye7S2LdqHH45oY")

UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/ask", response_model=GPTLogOut)
def ask_gpt(log: GPTLogCreate, db: Session = Depends(get_db)):
    # --- Replace this with real OpenAI GPT integration ---
    # response = openai.ChatCompletion.create(...)
    # answer = response['choices'][0]['message']['content']
    response = client.models.generate_content(model="gemini-2.5-flash", contents= f"You are a helpful assistant specialized in agriculture, answer concisely to this prompt {log.query}")
    answer = response.text
    # answer = f"[AgriGPT] This is a mock answer to: {log.query}"
    db_log = GPTLog(**log.dict())
    db_log.response = answer
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/detect-disease", response_model=GPTLogOut)
def detect_disease(
    user_id: int = Form(...),
    query: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save uploaded image
    file_ext = os.path.splitext(file.filename)[-1]
    save_path = os.path.join(UPLOAD_DIR, f"user{user_id}_disease_{file.filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    image_url = save_path

    # --- Replace this with real AI inference ---
    # result = run_disease_model(save_path)
    # For now, mock result:
    mock_results = [
        ("Late Blight", 89, "Apply copper-based fungicide immediately. Remove affected leaves."),
        ("Early Blight", 76, "Apply organic fungicide, prune affected areas."),
        ("Healthy Plant", 95, "No treatment needed. Continue current care routine.")
    ]
    disease, confidence, treatment = mock_results[user_id % 3]
    response = f"Disease: {disease}\nConfidence: {confidence}%\nTreatment: {treatment}"

    db_log = GPTLog(user_id=user_id, query=query, image_url=image_url, response=response)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[GPTLogOut])
def list_gpt_logs(db: Session = Depends(get_db)):
    return db.query(GPTLog).all() 
