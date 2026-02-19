import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 直接讀取根目錄的 assets (Vercel 運行環境中 assets 與 api 資料夾同級)
ROOT_DIR = os.getcwd()
ASSETS_DIR = os.path.join(ROOT_DIR, "assets")

@app.get("/api/config")
def get_config():
    if not os.path.exists(ASSETS_DIR):
        return {
            "characters": [], 
            "sounds": [], 
            "backgrounds": [], 
            "error": "Assets folder not found",
            "debug_info": {"cwd": ROOT_DIR, "ls": os.listdir(ROOT_DIR)}
        }

    exclude_folders = ["sounds", "background", "botton"]
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

# 移除 app.mount("/assets", ...)，交給 Vercel rewrites 處理