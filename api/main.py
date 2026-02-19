import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

@app.get("/api/config")
def get_config():
    # 確保只抓取角色資料夾，排除掉 background 和 sounds
    exclude_folders = ["sounds", "background","botton"]
    characters = [
        d for d in os.listdir(ASSETS_DIR) 
        if os.path.isdir(os.path.join(ASSETS_DIR, d)) and d not in exclude_folders
    ]
    
    sound_path = os.path.join(ASSETS_DIR, "sounds")
    sounds = os.listdir(sound_path) if os.path.exists(sound_path) else []
    
    bg_path = os.path.join(ASSETS_DIR, "background")
    backgrounds = os.listdir(bg_path) if os.path.exists(bg_path) else []
    
    return {
        "characters": characters,
        "sounds": sounds,
        "backgrounds": backgrounds
    }

app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")