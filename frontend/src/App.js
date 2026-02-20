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
  const [activeModal, setActiveModal] = useState(null); // 新增：控制哪個視窗開啟 (char, bg, sound)
  const [canMove, setCanMove] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false); 

  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const redTimerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/config`).then(res => res.json()).then(data => {
      setConfig(data);
      if (data.characters.length > 0) {
        setState(s => ({ 
            ...s, 
            char: data.characters[0], 
            bg: data.backgrounds[0] || "", 
            selectedSounds: data.sounds 
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (config.characters.length > 0) {
      config.characters.forEach(char => {
        ['1.png', '2.png'].forEach(f => { const img = new Image(); img.src = `/assets/${char}/${f}`; });
      });
      config.backgrounds.forEach(bg => { const img = new Image(); img.src = `/assets/background/${bg}`; });
      config.sounds.forEach(s => { const a = new Audio(`/assets/sounds/${s}`); a.preload = "auto"; });
    }
  }, [config]);

  const handleAction = (e) => {
    if (canMove || isProcessing) return; 
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    setIsProcessing(true);
    const rainbowTrigger = Math.random() < 0.01;
    setStatus(prev => ({ ...prev, isPressed: true, isRed: false, isRainbow: rainbowTrigger ? true : prev.isRainbow }));

    if (state.selectedSounds.length > 0) {
      const sound = state.selectedSounds[Math.floor(Math.random() * state.selectedSounds.length)];
      new Audio(`${API_BASE}/assets/sounds/${sound}`).play();
    }

    const newCount = state.count + 1;
    setState(s => ({ ...s, count: newCount }));
    localStorage.setItem("clickCount", newCount);

    redTimerRef.current = setTimeout(() => setStatus(prev => ({ ...prev, isRed: true })), 2500);
    setTimeout(() => setIsProcessing(false), 200); 
  };

  const handleRelease = () => {
    clearTimeout(redTimerRef.current);
    setStatus(prev => ({ ...prev, isPressed: false, isRed: false }));
  };

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

  return (
    <div className="App" 
         style={{ backgroundImage: state.bg ? `url(${API_BASE}/assets/background/${state.bg})` : 'none' }}
         onPointerMove={handleDragging} onPointerUp={handleDragEnd}>
      
      <div className="top-ui-container">
        <div className="score-area">
            <span className="char-name">{state.char.toUpperCase()}</span> 
            一共叫了 <span className="score-num">{state.count}</span> 次
        </div>
        <div className={`move-toggle-box ${canMove ? 'active' : ''}`} onClick={() => setCanMove(!canMove)}>
            <img src={`${API_BASE}/assets/botton/move-btn.png`} alt="move" />
        </div>
      </div>

      <button className="toggle-panel-btn" onClick={() => setShowPanel(!showPanel)}> 
        {showPanel ? "CLOSE" : "MENU"} 
      </button>

          {/* 修改後的渲染結構 */}
    <div className="main-display">
      {state.char && (
        <div
          className="char-position-wrapper"
          onPointerDown={(e) => { handleDragStart(e); handleAction(e); }}
          onPointerUp={handleRelease}
          onPointerLeave={handleRelease}
          style={{
            /* 1. 這個外層 div 負責位移，不會被 CSS 動畫覆蓋 */
            transform: `translate(${position.x}px, ${position.y}px)`,
            position: 'relative',
            zIndex: 10,
            touchAction: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <img
            src={`${API_BASE}/assets/${state.char}/${status.isPressed ? '2.png' : '1.png'}`}
            className={`pop-img ${status.isRed ? 'effect-red' : ''} ${status.isRainbow ? 'effect-rainbow' : ''} ${canMove ? 'draggable' : ''}`}
            alt="char"
            draggable="false"
            style={{
              /* 2. 這個內層 img 負責縮放與 CSS 特效 */
              transform: status.isPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.1s' 
            }}
          />
        </div>
      )}
    </div>

      {/* 彈出選擇小視窗 (Modal) */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{activeModal === 'char' ? '選擇角色' : activeModal === 'bg' ? '選擇背景' : '音訊過濾'}</h3>
            <div className="modal-scroll-area">
              {activeModal === 'char' && config.characters.map(c => (
                <button key={c} className={state.char === c ? 'active' : ''} onClick={() => { setState({...state, char: c}); setActiveModal(null); }}>{c}</button>
              ))}
              {activeModal === 'bg' && config.backgrounds.map(b => (
                <button key={b} className={state.bg === b ? 'active' : ''} onClick={() => { setState({...state, bg: b}); setActiveModal(null); }}>{b.split('.')[0]}</button>
              ))}
              {activeModal === 'sound' && config.sounds.map(s => (
                <button key={s} className={state.selectedSounds.includes(s) ? 'active' : ''} 
                  onClick={() => {
                    const next = state.selectedSounds.includes(s) ? state.selectedSounds.filter(i => i !== s) : [...state.selectedSounds, s];
                    setState({...state, selectedSounds: next});
                  }}>{s.replace(/\.[^/.]+$/, "")}</button>
              ))}
            </div>
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>關閉</button>
          </div>
        </div>
      )}

      {/* 底部按鈕面板 */}
      <footer className={`control-panel ${showPanel ? 'show' : 'hide'}`}>
        <div className="bottom-btn-row">
          <button onClick={() => setActiveModal('char')}>角色切換</button>
          <button onClick={() => setActiveModal('bg')}>背景選擇</button>
          <button onClick={() => setActiveModal('sound')}>音訊過濾</button>
        </div>
      </footer>
    </div>
  );
}

export default App;