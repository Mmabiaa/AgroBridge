import requests

API_URL = 'http://localhost:8001/predict'
IMAGE_PATH = 'sample.jpg'  # Place a sample image in this directory

with open(IMAGE_PATH, 'rb') as f:
    files = {'file': f}
    response = requests.post(API_URL, files=files)
    print('Status:', response.status_code)
    print('Response:', response.json()) 