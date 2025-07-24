
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import torch
import uvicorn

app = FastAPI()

# Load YOLOv5 model (default: yolov5s, can be replaced with a plant model)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

@app.post('/predict')
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    results = model(img)
    pred = results.pandas().xyxy[0].to_dict(orient='records')
    return JSONResponse(content={"predictions": pred})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 