import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
const API_BASE = "";
  
  const [config, setConfig] = useState({ characters: [], sounds: [], backgrounds: [] });
  const [state, setState] = useState({
    char: "", bg: "", selectedSounds: [],
    count: parseInt(localStorage.getItem("clickCount") || "0")
  });
  
  const [status, setStatus] = useState({ isPressed: false, isRed: false, isRainbow: false });
  const [showPanel, setShowPanel] = useState(true);
  const [canMove, setCanMove] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const redTimerRef = useRef(null);
  const rainbowTimerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/config`).then(res => res.json()).then(data => {
      setConfig(data);
      if (data.characters.length > 0) {
        setState(s => ({ ...s, char: data.characters[0], bg: data.backgrounds[0] || "", selectedSounds: data.sounds }));
      }
    });
  }, []);

  // 在你的 App 元件內部加入這個 useEffect
  useEffect(() => {
    const preloadAssets = () => {
      // 1. 取得所有角色圖片
      // 假設你已經從 /api/config 拿到 characters 清單
      config.characters.forEach((char) => {
        ['1.png', '2.png'].forEach((file) => {
          const img = new Image();
          img.src = `/assets/${char}/${file}`;
        });
      });

      // 2. 預載背景圖片
      config.backgrounds.forEach((bg) => {
        const img = new Image();
        img.src = `/assets/background/${bg}`;
      });
    };

    if (config.characters.length > 0) {
      preloadAssets();
    }
  }, [config]); // 當 config 更新（API 回傳）時執行

  const handleDragStart = (e) => {
    if (!canMove) return;
    isDragging.current = true;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    offset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleDragging = (e) => {
    if (!isDragging.current || !canMove) return;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    setPosition({ x: clientX - offset.current.x, y: clientY - offset.current.y });
  };

  const handleDragEnd = () => { isDragging.current = false; };

  const handleAction = (e) => {
    if (canMove) return; 
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    const rainbowTrigger = Math.random() < 0.1;
    setStatus(prev => ({ ...prev, isPressed: true, isRed: false, isRainbow: rainbowTrigger ? true : prev.isRainbow }));

    if (state.selectedSounds.length > 0) {
      const sound = state.selectedSounds[Math.floor(Math.random() * state.selectedSounds.length)];
      new Audio(`${API_BASE}/assets/sounds/${sound}`).play();
    }

    const newCount = state.count + 1;
    setState(s => ({ ...s, count: newCount }));
    localStorage.setItem("clickCount", newCount);

    if (rainbowTrigger) {
      if (rainbowTimerRef.current) clearTimeout(rainbowTimerRef.current);
      rainbowTimerRef.current = setTimeout(() => setStatus(prev => ({ ...prev, isRainbow: false })), 5000);
    }

    redTimerRef.current = setTimeout(() => setStatus(prev => ({ ...prev, isRed: true })), 2500);
  };

  const handleRelease = () => {
    clearTimeout(redTimerRef.current);
    setStatus(prev => ({ ...prev, isPressed: false, isRed: false }));
  };

  return (
    <div className="App" 
         style={{ backgroundImage: state.bg ? `url(${API_BASE}/assets/background/${state.bg})` : 'none' }}
         onMouseMove={handleDragging} onMouseUp={handleDragEnd} onTouchMove={handleDragging} onTouchEnd={handleDragEnd}>
      
      <div className="top-ui-container">
        <div className="score-area">
            <span className="char-name">{state.char.toUpperCase()}</span> 
            一共叫了 <span className="score-num">{state.count}</span> 次
        </div>
        <div className={`move-toggle-box ${canMove ? 'active' : ''}`} onClick={() => setCanMove(!canMove)}>
            <img src={`${API_BASE}/assets/botton/move-btn.png`} alt="move" />
        </div>
      </div>

      <button className="toggle-panel-btn" onClick={() => setShowPanel(!showPanel)}> {showPanel ? "CLOSE" : "MENU"} </button>

      <div className="main-display" onMouseDown={handleAction} onMouseUp={handleRelease} onTouchStart={handleAction} onTouchEnd={handleRelease}>
        {state.char && (
          <img 
            src={`${API_BASE}/assets/${state.char}/${status.isPressed ? '2.png' : '1.png'}`} 
            className={`pop-img ${status.isRed ? 'effect-red' : ''} ${status.isRainbow ? 'effect-rainbow' : ''} ${canMove ? 'draggable' : ''}`}
            alt="char" 
            draggable="false"
            onMouseDown={handleDragStart} onTouchStart={handleDragStart}
            /* 修正 2: 這裡的 transform 寫法確保縮放與位移共存，不會互相覆蓋 */
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                position: 'relative',
                transform: status.isPressed ? 'scale(0.95)' : 'scale(1)'
            }}
          />
        )}
      </div>

      <footer className={`control-panel ${showPanel ? 'show' : 'hide'}`}>
        <div className="dropdown-container">
          <div className="select-group">
            <label>角色切換</label>
            <select value={state.char} onChange={(e) => setState({...state, char: e.target.value})}>
              {config.characters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="select-group">
            <label>背景選擇</label>
            <select value={state.bg} onChange={(e) => setState({...state, bg: e.target.value})}>
              {config.backgrounds.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="sound-multi-select">
            <label>聲音清單</label>
            <div className="checkbox-grid">
              {config.sounds.map(s => (
                <label key={s} className="checkbox-item">
                  <input type="checkbox" checked={state.selectedSounds.includes(s)} 
                         onChange={() => {
                           const next = state.selectedSounds.includes(s) ? state.selectedSounds.filter(i => i !== s) : [...state.selectedSounds, s];
                           setState({...state, selectedSounds: next});
                         }} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;