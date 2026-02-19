import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 設定保持不變
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 關鍵：在 Vercel 環境中，'api' 資料夾會被當作 Function 執行
# 我們確保路徑是從根目錄開始算
ROOT_DIR = os.getcwd()
ASSETS_DIR = os.path.join(ROOT_DIR, "assets")

@app.get("/api/config")
def get_config():
    # 增加防呆：如果資料夾不存在，回傳空清單而不是報錯
    if not os.path.exists(ASSETS_DIR):
        return {"characters": [], "sounds": [], "backgrounds": [], "error": "Assets folder not found"}

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

@app.get("/api/debug")
def debug_path():
    return {
        "cwd": os.getcwd(),
        "ls_root": os.listdir("."),
        "assets_exists": os.path.exists("assets")
    }

app.mount("/assets", StaticFiles(directory=ASSETS_PATH), name="assets")