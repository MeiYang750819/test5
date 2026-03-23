/* ================================================================
   【 ⚙️ GAME ENGINE - 靈魂回歸終極完美版 】
   ================================================================ */

// 1. 抓取網址參數 (uid 或 id) 與防失憶機制
const urlParams = new URLSearchParams(window.location.search);
let currentUser = urlParams.get('uid') || urlParams.get('id');

if (currentUser) {
    localStorage.setItem('hero_current_id', currentUser);
} else {
    currentUser = localStorage.getItem('hero_current_id') || "TEST_001";
}

const GameEngine = {
    // 🌟 API 連線設定
    config: {
        apiUrl: "https://script.google.com/macros/s/AKfycbzeRcm0HPrmkfPWhQ6whjDp11bMmYNcGTW5TJ3owRAoMad-9qCnClKsdcOIIt9iO4yy5Q/exec",
        uid: currentUser
    },

    // 🌟 系統狀態 (完美融合你的計分細項)
    state: {
        score: 0,
        backendRank: "",
        examStatus: "",
        items: ['👕 粗製布衣'],
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        checkboxes: {},
        weaponType: null,
        currentTrial: 0,
        examDate: null,      
        examDateLocked: false,
        resultDate: null,    
        resultDateLocked: false,
        changeDate: null,
        changeReason: null,
        changeDateLocked: false,
        bankDate: null,
        bankDateLocked: false,
        bankStatus: null, 
        
        appointmentTime: "等待公會發布...", 
        appointmentLocation: "等待公會發布...", 
        
        // 分數細項記錄 (供大結局結算與彈窗判定用)
        scoreDetails: {
            baseAndExplore: 0,
            penalty: 0,
            bonus: 0,
            hrEval: 0
        },
        hasSeenAlert: false, // 防止重新整理無限跳警告
        hasSeenDoomFlash: false
    },

    ranks: [
        { min: 101, title: "💎 SS級 神話級玩家" },
        { min: 96,  title: "🌟 S級 傳說級玩家" },
        { min: 80,  title: "🟢 A級 菁英玩家" },
        { min: 60,  title: "🥇 B級 穩健玩家" },
        { min: 40,  title: "🥈 C級 潛力玩家" },
        { min: 20,  title: "🥉 D級 基礎學徒" },
        { min: 10,  title: "🌱 實習小萌新" },
        { min: 0,   title: "🥚 報到新手村" }
    ],

    armorPath: ['👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲', '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'],
    
    weaponPaths: {
        '🗡️ 精鋼短劍': '⚔️ 騎士長劍', '⚔️ 騎士長劍': '⚔️ 破甲重劍', '⚔️ 破甲重劍': '🗡️ 聖光戰劍', '🗡️ 聖光戰劍': '👑 王者之聖劍',
        '🏹 獵人短弓': '🏹 精靈長弓', '🏹 精靈長弓': '🏹 迅雷連弓', '🏹 迅雷連弓': '🏹 追風神弓', '🏹 追風神弓': '☄️ 破曉流星弓',
        '🔱 鐵尖長槍': '🔱 鋼鐵戰矛', '🔱 鋼鐵戰矛': '🔱 破陣重矛', '🔱 破陣重矛': '🔱 龍膽銀槍', '🔱 龍膽銀槍': '🐉 滅世龍吟槍'
    },

    // 🌟 重新分配進度條：前五關共 71%，第六關 12%，總合 83%
    trialsData: {
        1: { progGain: 14, loc: '🏰 登錄公會', scoreGain: 16 },
        2: { progGain: 14, loc: '📁 裝備盤點', scoreGain: 16 },
        3: { progGain: 17, loc: '🛡️ 裝備鑑定所', scoreGain: 21 },
        4: { progGain: 13, loc: '🎒 出征準備營', scoreGain: 16 },
        5: { progGain: 13, loc: '💼 契約祭壇', scoreGain: 16 }, 
        6: { progGain: 12, loc: '👑 榮耀殿堂', scoreGain: 0 }
    },

    init() {
        document.querySelectorAll('details').forEach(el => el.removeAttribute('open'));

        // 為導覽列按鈕自動補上 ID，防止換頁失憶
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.href && !btn.href.includes('javascript')) {
                const url = new URL(btn.href, window.location.href);
                url.searchParams.set('id', currentUser);
                btn.href = url.toString();
            }
        });

        try {
            const saved = localStorage.getItem('hero_progress_' + this.config.uid);
            if (saved) { this.state = Object.assign({}, this.state, JSON.parse(saved)); }
        } catch (e) {}

        this.injectGlobalCSS();

        // 綁定 Checkbox 記憶
        setTimeout(() => {
            document.querySelectorAll('input[type="checkbox"]').forEach(chk => {
                if (this.state.checkboxes && this.state.checkboxes[chk.id]) chk.checked = true;
                chk.addEventListener('change', (e) => {
                    if (!this.state.checkboxes) this.state.checkboxes = {};
                    this.state.checkboxes[e.target.id] = e.target.checked;
                    this.save();
                });
            });
        }, 100);

        this.syncWithBackend();

        setTimeout(() => { this.updateUI(false); }, 50);

        // 🌟 隱藏彩蛋：加上 ?delay=1 網址參數，直接觸發奪命連環閃警告！
        if (window.location.search.includes('delay=1')) {
            setTimeout(() => this.showDelayWarning(), 500);
        }

        // 🌟 檢查是否需要跳出強提醒彈窗
        this.checkSystemAlerts();

        // 🌟 成就回顧機制：若已破關，重整網頁時直接顯示結算面板 (不放煙火)
        if (this.state.currentTrial >= 6) {
            setTimeout(() => {
                this.showFinalAchievement(false); 
            }, 800);
        }
    },

    injectGlobalCSS() {
        if (document.getElementById('game-fx-style')) return;
        const style = document.createElement('style');
        style.id = 'game-fx-style';
        style.innerHTML = `
            @keyframes shinyUpdate {
                0% { filter: brightness(1); transform: scale(1); color: inherit; }
                40% { filter: brightness(1.5); transform: scale(1.2); color: #ffffff; text-shadow: 0 0 8px #fbbf24, 0 0 16px #fbbf24; }
                60% { filter: brightness(1.5); transform: scale(1.2); color: #ffffff; text-shadow: 0 0 8px #fbbf24, 0 0 16px #fbbf24; }
                100% { filter: brightness(1); transform: scale(1); color: inherit; }
            }
            .shiny-effect { animation: shinyUpdate 1s ease-in-out; display: inline-block; }
            .game-toast {
                position: fixed; bottom: 20px; right: -300px;
                background: #1a1a1a; color: #efefef; border: 1px solid #fbbf24;
                padding: 12px 20px; border-radius: 8px; z-index: 9999;
                transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-weight: bold;
            }
            .game-toast.show { right: 20px; }
            
            /* 🌟 你的史詩級動畫 CSS 完整保留 */
            .floating-score, .floating-text { position: fixed; color: #4ade80; font-size: 24px; font-weight: bold; text-shadow: 0 0 8px rgba(0,0,0,0.8); pointer-events: none; z-index: 10000; animation: floatUp 1.5s ease-out forwards; }
            @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-50px); } }
            @keyframes fadeUpIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
            @keyframes stampIn { 0% { opacity: 0; transform: scale(3) rotate(-15deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }

            /* 警告彈窗樣式 */
            .sys-alert-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 10002; }
            .sys-alert-modal.active { display: flex; }
            .sys-alert-box { background: #1a1a1a; padding: 25px; border-radius: 8px; text-align: center; max-width: 80%; border: 2px solid; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
            .sys-alert-box.danger { border-color: #ef4444; }
            .sys-alert-box.reward { border-color: #4ade80; }
            .sys-alert-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .sys-alert-title.danger { color: #ef4444; }
            .sys-alert-title.reward { color: #4ade80; }
            .sys-alert-text { color: white; margin-bottom: 20px; line-height: 1.5; }
            .sys-alert-btn { padding: 8px 20px; background: #333; color: white; border: 1px solid #666; cursor: pointer; border-radius: 4px; font-weight: bold; }

            /* 煙火與打字機特效 */
            .css-firework { position: absolute; width: 5px; height: 5px; border-radius: 50%; box-shadow: 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff; animation: 1s bang ease-out infinite backwards, 1s gravity ease-in infinite backwards, 5s position linear infinite backwards; }
            #firework-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10005; display: none; }
            #firework-overlay.active { display: block; }
            .firework-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fbbf24; font-size: 24px; font-weight: bold; text-align: center; text-shadow: 0 0 10px #fbbf24; animation: fadeUpIn 1s forwards; }

            #delay-warning-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(239, 68, 68, 0.2); z-index: 10006; display: none; align-items: center; justify-content: center; flex-direction: column; cursor: pointer; }
            #delay-warning-overlay.active { display: flex; }
            .warning-icon { font-size: 40px; animation: shinyUpdate 0.5s infinite; color: #ef4444; }
            .warning-text { color: #ef4444; font-size: 18px; font-weight: bold; margin-top: 20px; opacity: 0; transition: opacity 0.5s; text-shadow: 0 0 10px #ef4444; }
            .warning-text.show { opacity: 1; }

            input[type="date"] { color-scheme: dark; color: white; }
            input.locked-input { -webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; opacity: 1 !important; background-color: rgba(255, 255, 255, 0.1) !important; border: 1px solid #555 !important; }
        `;
        document.head.appendChild(style);
    },

    // 🌟 與後台同步大腦 (結合了你的 scoreDetails 架構)
    async syncWithBackend() {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;

        try {
            const apiUrl = `${this.config.apiUrl}?action=loadData&uid=${encodeURIComponent(this.config.uid)}`;
            const response = await fetch(apiUrl);
            const res = await response.json();

            if (res.status === 'success' && res.data) {
                const d = res.data;
                const oldScore = this.state.score;

                this.state.appointmentTime = d.appointmentTime;
                this.state.appointmentLocation = d.appointmentLocation;
                this.state.score = d.currentScore;
                this.state.backendRank = d.currentRank;
                this.state.examStatus = d.examStatus;
                
                if (d.scoreDetails) {
                    this.state.scoreDetails.baseAndExplore = d.scoreDetails.base;
                    this.state.scoreDetails.penalty = -(d.scoreDetails.delayPenalty);
                    this.state.scoreDetails.hrEval = d.scoreDetails.hrEval;
                }

                if (d.examDate) { this.state.examDate = d.examDate; this.state.examDateLocked = true; }
                if (d.resultDate) { this.state.resultDate = d.resultDate; this.state.resultDateLocked = true; }
                if (d.bankDate) { this.state.bankDate = d.bankDate; this.state.bankDateLocked = true; }

                if (d.maxTrialCompleted && d.maxTrialCompleted > this.state.currentTrial) {
                    this.state.currentTrial = d.maxTrialCompleted;
                    this.state.location = this.trialsData[this.state.currentTrial]?.loc || '⛺ 新手村';
                    
                    this.state.items = ['👕 粗製布衣'];
                    for (let i = 0; i < d.maxTrialCompleted; i++) { this.upgradeArmor(); }
                    
                    if (d.maxTrialCompleted >= 1 && !this.state.weaponType) {
                        this.state.weaponType = '🗡️ 精鋼短劍';
                        this.state.items.push('🗡️ 精鋼短劍');
                        for (let i = 0; i < d.maxTrialCompleted; i++) { this.upgradeWeapon(); }
                    }
                }

                document.querySelectorAll('.dyn-company').forEach(el => el.innerText = d.companyName || "MYs studio");
                document.querySelectorAll('.dyn-team').forEach(el => el.innerText = d.team || "外場團隊");
                document.querySelectorAll('.dyn-type').forEach(el => el.innerText = d.type || "兼職");
                document.querySelectorAll('.dyn-name').forEach(el => el.innerText = d.userName || "測試員");

                const statusStr = String(this.state.examStatus).trim().toUpperCase();
                const isApproved = (statusStr === '通過' || statusStr === 'OK');
                const isRejected = (statusStr === '退件');

                if (this.state.currentTrial >= 6) {
                    this.state.status = '👑 聖殿加冕';
                } else if (isRejected) {
                    this.state.status = '❌ 強化失敗';
                } else if (isApproved) {
                    this.state.status = '👑 鑑定通過';
                } else if (this.state.currentTrial === 3) {
                    this.state.status = '⏳ 提交公會審查';
                } else {
                    this.state.status = '📦 檢整裝備中';
                }

                this.save();
                this.updateUI(this.state.score > oldScore);
            }
        } catch (err) { console.error("同步失敗:", err); }
    },

    // 🌟 針對單一特定元素進行閃爍特效
    flashElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('shiny-effect');
            void el.offsetWidth;
            el.classList.add('shiny-effect');
        }
    },

    // 🌟 主線防具與奇遇武器的專屬升級邏輯
    upgradeArmor() {
        let currentArmor = this.state.items.find(item => this.armorPath.includes(item));
        if (currentArmor) {
            let idx = this.armorPath.indexOf(currentArmor);
            if (idx < this.armorPath.length - 1) {
                let nextArmor = this.armorPath[idx + 1];
                this.state.items = this.state.items.map(item => item === currentArmor ? nextArmor : item);
                return true;
            }
        }
        return false;
    },

    upgradeWeapon() {
        let currentWeapon = this.state.items.find(item => Object.keys(this.weaponPaths).includes(item) || Object.values(this.weaponPaths).includes(item));
        if (currentWeapon && this.weaponPaths[currentWeapon]) {
            let nextWeapon = this.weaponPaths[currentWeapon];
            this.state.items = this.state.items.map(item => item === currentWeapon ? nextWeapon : item);
            return true;
        }
        return false;
    },

    // 🌟 延宕奪命連環閃警告動畫
    showDelayWarning() {
        if(document.getElementById('delay-warning-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'delay-warning-overlay';
        overlay.innerHTML = `<div class="warning-icon">⚠️ 警告</div><div class="warning-text">進度延宕，冒險積分持續流失中..</div>`;
        document.body.appendChild(overlay);
        
        void overlay.offsetWidth;
        overlay.classList.add('active');
        
        setTimeout(() => { overlay.querySelector('.warning-text').classList.add('show'); }, 1500); 
        
        let count = 0;
        const interval = setInterval(() => {
            document.body.style.backgroundColor = count % 2 === 0 ? '#4a0000' : '#121212';
            count++;
            if (count > 6) {
                clearInterval(interval);
                document.body.style.backgroundColor = '';
            }
        }, 150);

        overlay.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };
    },

    // 🌟 強提醒彈窗系統 (結合你的 UI 與後台判斷)
    checkSystemAlerts() {
        if (this.state.hasSeenAlert) return;

        const urlParams = new URLSearchParams(window.location.search);
        const alertType = urlParams.get('alert');

        if (alertType === 'penalty') {
            this.showSysAlert('danger', '⚠️ 系統通知', '任務遭遇挫折，積分有所減損！');
            this.state.hasSeenAlert = true;
            this.save();
        } else if (alertType === 'bonus') {
            this.showSysAlert('reward', '✨ 系統通知', '表現優異！系統已發放效率獎勵積分！');
            this.state.hasSeenAlert = true;
            this.save();
        }
    },

    showSysAlert(type, titleText, msgText) {
        const modalId = 'sys-alert-' + Date.now();
        const html = `
            <div class="sys-alert-modal active" id="${modalId}">
                <div class="sys-alert-box ${type}">
                    <div class="sys-alert-title ${type}">${titleText}</div>
                    <div class="sys-alert-text">${msgText}</div>
                    <button class="sys-alert-btn" onclick="document.getElementById('${modalId}').remove()">我知道了</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 🌟 你的心血：客製化解鎖機制與獨立動畫
    unlock(event, id, action) {
        // 如果是 checkbox 卻沒打勾，就擋掉
        if (event && event.target && event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
            if (!event.target.checked) return; 
        }

        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id); 
        this.save();

        let scoreGain = 0;
        let toastMsg = "";
        let alertMsg = "";
        let doFlashItem = false; 
        
        if (action === 'large_fold') {
            scoreGain = 2;
            alertMsg = `🔔 發現隱藏關卡，冒險積分 +${scoreGain}`;
        } else if (action === 'explore1') {
            scoreGain = 1;
            toastMsg = `✨ 深入探索，冒險積分+${scoreGain}`;
        } else if (action === 'explore2') {
            scoreGain = 1;
            toastMsg = `🧩 獲得情報，冒險積分 +${scoreGain}`;
        } else if (action === 'explore_armor') {
            scoreGain = 1;
            toastMsg = `✨ 防具升級，冒險積分+${scoreGain}`;
        } else if (action === 'random_weapon') {
            scoreGain = 1; 
            toastMsg = `⚔️ 獲得基礎武器，戰力大幅提升！`;
        } else {
            // 預防萬一的 fallback
            scoreGain = typeof action === 'number' ? action : 1;
            toastMsg = `✨ 發現隱藏彩蛋，冒險積分 +${scoreGain}`;
        }

        if (alertMsg) { alert(alertMsg); }

        this.createFloatingText(event, `+${scoreGain}`);
        if (toastMsg) this.showToast(toastMsg);
        
        // 將分數同步到後台
        fetch(`${this.config.apiUrl}?action=updateScore&uid=${encodeURIComponent(this.config.uid)}&field=${encodeURIComponent(id)}&score=${encodeURIComponent(scoreGain)}`);
        
        // 🌟 延遲優化：有通知等 3 秒，沒通知等 1 秒
        let delayTime = toastMsg ? 3000 : 1000;

        setTimeout(() => {
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain; 
            
            if (action === 'explore_armor') {
                if (this.upgradeArmor()) doFlashItem = true;
            } else if (action === 'random_weapon') {
                const weapons = ['🗡️ 精鋼短劍', '🏹 獵人短弓', '🔱 鐵尖長槍'];
                const w = weapons[Math.floor(Math.random() * weapons.length)];
                this.state.weaponType = w;
                this.state.items.push(w);
                doFlashItem = true;
            }
            this.save();
            this.updateUI();
            
            if (scoreGain > 0 && action !== 'random_weapon') {
                this.flashElement('score-text');
            }
            if (doFlashItem) {
                this.flashElement('item-text'); 
                this.flashElement('rank-name'); 
            }
        }, delayTime);
    },

    // 🌟 第五關可自由取消的獨立計分觸發器
    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        let scoreGain = 8;
        
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${scoreGain}`);
            this.state.achievements.push(id);
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain;
            this.save();
            
            fetch(`${this.config.apiUrl}?action=updateScore&uid=${encodeURIComponent(this.config.uid)}&field=${encodeURIComponent(id)}&score=${encodeURIComponent(scoreGain)}`);
            
            setTimeout(() => {
                this.updateUI();
                this.flashElement('score-text');
            }, 1000); 
        } else if (!isChecked && this.state.achievements.includes(id)) {
            this.state.achievements = this.state.achievements.filter(a => a !== id);
            this.state.score -= scoreGain;
            this.state.scoreDetails.baseAndExplore -= scoreGain;
            this.save();
            
            fetch(`${this.config.apiUrl}?action=updateScore&uid=${encodeURIComponent(this.config.uid)}&field=${encodeURIComponent(id)}&score=${encodeURIComponent(-scoreGain)}`);
            
            this.updateUI();
            this.flashElement('score-text');
        }
    },

    createFloatingText(e, text) {
        if (text === '+0' || !text || !e) return; 
        const x = e.clientX || (e.touches && e.touches[0].clientX) || e.pageX;
        const y = e.clientY || (e.touches && e.touches[0].clientY) || e.pageY;
        const el = document.createElement('div');
        el.className = 'floating-score';
        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000); 
    },

    save() { localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state)); },

    updateUI() {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rEl = document.getElementById('rank-text');
        const sEl = document.getElementById('status-tag');
        
        if (rEl) rEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="rank-name">${this.state.backendRank || rank.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="loc-text">${this.state.location}</span>`;
        if (sEl) sEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="item-text">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status">${this.state.status}</span>`;
        
        const scoreEl = document.getElementById('score-text');
        if (scoreEl) scoreEl.innerText = this.state.score + "分";
        const scoreFill = document.getElementById('score-fill');
        if (scoreFill) scoreFill.style.width = Math.min(this.state.score, 100) + "%";

        // 🌟 逼死強迫症：非整數進度條計算 (含第六關才會滿100%)
        let currentProg = 0;
        for(let i=1; i<=this.state.currentTrial; i++) {
            if(i <= 6) currentProg += this.trialsData[i].progGain;
        }
        if(this.state.achievements.includes('faq_main')) currentProg += 6;
        if(this.state.achievements.includes('onboard_main')) currentProg += 6;
        if(this.state.achievements.includes('pg2-m-1')) currentProg += 5;
        currentProg = Math.min(100, currentProg);

        const progVal = document.getElementById('prog-val');
        if (progVal) progVal.innerText = currentProg + "%";
        const progFill = document.getElementById('prog-fill');
        if (progFill) progFill.style.width = currentProg + "%";

        this.updateDateControls();
        const timeEl = document.getElementById('dyn-apt-time');
        if (timeEl) timeEl.innerText = this.state.appointmentTime;
        const locEl = document.getElementById('dyn-apt-loc');
        if (locEl) locEl.innerText = this.state.appointmentLocation;
        
        this.updateButtonStyles();
    },

    updateDateControls() {
        const dateFields = [
            { id: 'input-exam-date', btn: 'btn-lock-exam', val: this.state.examDate, locked: this.state.examDateLocked },
            { id: 'input-result-date', btn: 'btn-lock-result', val: this.state.resultDate, locked: this.state.resultDateLocked },
            { id: 'input-bank-date', btn: 'btn-lock-bank', val: this.state.bankDate, locked: this.state.bankDateLocked }
        ];

        dateFields.forEach(field => {
            const input = document.getElementById(field.id);
            const btn = document.getElementById(field.btn);
            if (input && btn) {
                input.value = field.val || "";
                if (field.locked) {
                    input.type = 'text'; 
                    input.disabled = true;
                    input.classList.add('locked-input');
                    btn.innerText = "已鎖定";
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                } else {
                    input.type = 'date';
                    input.classList.remove('locked-input');
                }
            }
        });

        const changeInput = document.getElementById('input-change-date');
        const changeReason = document.getElementById('input-change-reason');
        const changeBtn = document.getElementById('btn-lock-change');
        
        if (changeInput && changeBtn && this.state.changeDateLocked) {
            changeInput.type = 'text'; changeInput.value = this.state.changeDate || "";
            changeInput.disabled = true; changeInput.classList.add('locked-input');
            if (changeReason) { changeReason.value = this.state.changeReason || ""; changeReason.disabled = true; changeReason.classList.add('locked-input'); }
            changeBtn.innerText = "已送出"; changeBtn.disabled = true; changeBtn.style.opacity = "0.5";
        }
    },

    lockDate(type) {
        const id = type === 'exam' ? 'input-exam-date' : type === 'result' ? 'input-result-date' : 'input-bank-date';
        const val = document.getElementById(id).value;
        if (!val) { alert("請先選擇日期！"); return; }
        
        const confirmLock = confirm("鎖定後不可修改，確定要鎖定嗎？");
        if (!confirmLock) return;

        // 🌟 日期格式：你說維持 YYYY-MM-DD 沒關係，這邊就直接存入
        if (type === 'exam') { this.state.examDate = val; this.state.examDateLocked = true; }
        else if (type === 'result') { this.state.resultDate = val; this.state.resultDateLocked = true; }
        else if (type === 'bank') { this.state.bankDate = val; this.state.bankDateLocked = true; }
        
        this.save(); 
        this.updateUI();
        
        // 同步寫入後台
        fetch(`${this.config.apiUrl}?action=lockDate&uid=${encodeURIComponent(this.config.uid)}&dateType=${type}&dateValue=${encodeURIComponent(val)}`);
    },

    requestChange() {
        const val = document.getElementById('input-change-date').value;
        const reasonVal = document.getElementById('input-change-reason').value;
        if (!val || !reasonVal) { alert("⚠️ 勇者請注意\n預計日期與改期原因皆為必填項目！"); return; }
        
        const confirmLock = confirm("確定要送出改期申請嗎？系統將自動扣減積分！");
        if (!confirmLock) return;

        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖。");
        
        this.state.changeDateLocked = true;
        this.state.changeDate = val;
        this.state.changeReason = reasonVal;
        this.save();
        this.updateUI();
        
        fetch(`${this.config.apiUrl}?action=lockDate&uid=${encodeURIComponent(this.config.uid)}&dateType=change&dateValue=${encodeURIComponent(val)}&reason=${encodeURIComponent(reasonVal)}`);
    },

    // 🌟 真實檔案上傳機制 (取代你原本的 setTimeout 模擬)
    handleFileUpload(inputElement, chkId, fileType) {
        const file = inputElement.files[0];
        if (!file) return;

        const statusSpan = inputElement.parentElement.querySelector('.upload-status');
        const chkBox = document.getElementById(chkId);
        
        statusSpan.innerText = "⏳ 魔法封裝上傳中...";
        statusSpan.classList.remove('success');

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1];
            
            const payload = {
                action: 'uploadFile',
                uid: GameEngine.config.uid,
                fileName: file.name,
                mimeType: file.type,
                fileType: fileType, 
                fileData: base64Data
            };

            fetch(GameEngine.config.apiUrl, {
                method: 'POST', 
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(res => {
                if(res.status === 'success') {
                    statusSpan.innerText = "✅ 歸檔完成";
                    statusSpan.classList.add('success');
                    if(chkBox) {
                        chkBox.checked = true;
                        if (!this.state.checkboxes) this.state.checkboxes = {};
                        this.state.checkboxes[chkId] = true;
                        this.save();
                    }
                } else {
                    statusSpan.innerText = "❌ 傳輸失敗";
                    alert("⚠️ 上傳失敗：" + res.message);
                }
            })
            .catch(err => {
                statusSpan.innerText = "❌ 網路中斷";
            });
        };
        reader.readAsDataURL(file);
    },

    // 🌟 保留你設計的 3 秒延遲過關感
    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) return;
        
        // 第四關遲到無情扣分
        if (trialNum === 4) {
            const apt = this.state.appointmentTime;
            if (!apt || apt.includes("等待")) { alert("⚠️ 尚未發布報到時間！"); return; }
            
            const aptDateStr = apt.replace(/-/g, '/');
            const aptTime = new Date(aptDateStr);
            const now = new Date();
            
            if (now > aptTime) {
                alert(`🚨 警告：遲到報到！\n系統已自動扣除 2 分積極度積分！`);
                fetch(`${this.config.apiUrl}?action=latePenalty&uid=${encodeURIComponent(this.config.uid)}`);
                this.state.score -= 2; 
                this.state.scoreDetails.penalty -= 2;
            }
        }
        
        if (trialNum === 3) {
            if (!this.state.examDateLocked || !this.state.resultDateLocked) {
                alert("⚠️ 請先填寫並「鎖定」體檢相關日期（預計體檢日 ＆ 報告產出日），才能推進關卡！");
                return;
            }
        }
        
        const tData = this.trialsData[trialNum];
        
        // 🌟 立即更新按鈕狀態與本機資料，防連點
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.save(); 
        this.updateButtonStyles(); 

        const detailsBlock = document.getElementById(`detail-trial-${trialNum}`);
        if (detailsBlock) { detailsBlock.removeAttribute('open'); }

        // 同步寫入後台時間戳記
        fetch(`${this.config.apiUrl}?action=completeTrial&uid=${encodeURIComponent(this.config.uid)}&trialNum=${trialNum}`)
            .then(() => { this.syncWithBackend(); });

        if (trialNum === 6) {
            // 🌟 拔除 Toast，改為 1.5 秒後直接進入大結局 (煙火動畫)
            setTimeout(() => {
                this.showFinalAchievement(true); // 傳入 true 代表要放煙火
                if (this.upgradeArmor()) {}
                if (this.upgradeWeapon()) {}
                this.save(); 
                this.updateUI();
            }, 1500);
        } else {
            let msg = trialNum === 3 ? '📣 此階段任務已完成，請稍待鑑定！' : '📣 此階段任務已完成，請繼續前進！';
            this.showToast(msg);

            // 🌟 延遲 3 秒結算特效 (等待 Toast 消失)
            setTimeout(() => {
                if (trialNum !== 5) {
                    this.state.score += tData.scoreGain;
                    this.state.scoreDetails.baseAndExplore += tData.scoreGain;
                }
                
                let doFlashItem = false;
                if (this.upgradeArmor()) doFlashItem = true;
                if (this.upgradeWeapon()) doFlashItem = true;

                this.save(); 
                this.updateUI();

                if (doFlashItem) this.flashElement('item-text');
                this.flashElement('loc-text');
                this.flashElement('prog-val');
                if (trialNum !== 5) this.flashElement('score-text');
            }, 3000);
        }
    },

    // 🌟 史詩級大結局演出腳本 (100% 原汁原味保留)
    showFinalAchievement(withFirework = true) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        
        let displayRankTitle = this.state.backendRank || rank.title;
        
        // 抓取階級英文字母 (SS, S, A, B, C, D)
        let rankLetter = 'D';
        let fullRankTitle = displayRankTitle;
        try {
            rankLetter = displayRankTitle.match(/[A-ZS]+/)?.[0] || 'D';
            fullRankTitle = displayRankTitle.replace(/.*?([A-ZSS]+級.*)/, '$1');
        } catch(e) {}

        // 抓取完成度 %
        const currentProg = document.getElementById('prog-val').innerText;

        // 🌟 更新版評價文字庫
        let evalStr = "";
        if(this.state.score >= 96) evalStr = "無懈可擊的執行力！<br>積極度與效率令人驚豔，未來的表現值得期待！";
        else if(this.state.score >= 80) evalStr = "穩健可靠地完成了所有準備，<br>這是一個好的開始，繼續保持這份用心！";
        else if(this.state.score >= 41) evalStr = "雖然過程有些波折，但總算完成試煉，<br>未來的任務請務必更加留意細節與時效喔！";
        else evalStr = "試煉過程充滿驚險，職場如同戰場，<br>請重新調整狀態，拿出更好的表現！";

        // 裝備與嘲諷判定
        const weaponItem = this.state.items.find(i => Object.keys(this.weaponPaths).includes(i) || Object.values(this.weaponPaths).includes(i) || ['👑 王者之聖劍', '☄️ 破曉流星弓', '🐉 滅世龍吟槍'].includes(i)) || "";
        const armorItem = this.state.items.find(i => this.armorPath.includes(i)) || "";
        const finalEquip = [armorItem, weaponItem].filter(Boolean).join(' 、 '); 

        const hasWeapon = !!weaponItem;
        // 🌟 嘲諷顏色調淡 (#ff8a8a)
        let mockeryHTML = !hasWeapon ? `<div class="fade-in-row mockery-text" style="animation: fadeUpIn 0.8s forwards 3.3s; color:#ff8a8a; font-size:13px; border-top:1px dashed #555; padding-top:10px; margin-top:15px;">📝 系統額外判定：<br>勇者雖已通關，但未詳閱《鍛造秘笈》，<br>仍全程赤手空拳完成試煉...敬佩！敬佩！</div>` : "";

        // 渲染結算面板的 HTML 結構
        const renderModal = () => {
            if(document.getElementById('final-achievement-modal')) document.getElementById('final-achievement-modal').remove();
            
            const baseScore = this.state.scoreDetails.baseAndExplore;
            const penalty = this.state.scoreDetails.penalty;
            const hrEval = this.state.scoreDetails.hrEval;
            
            let detailHtml = `
                <div style="font-size: 13px; color: #888; margin-left: 10px; margin-top: 5px; line-height: 1.4; text-align: left;">
                    └ 基礎與探索得分：${baseScore} 分<br>
            `;
            if (penalty < 0) detailHtml += `└ 鑑定所或逾期扣分：<span style="color:#ff8a8a;">${penalty} 分</span><br>`;
            if (hrEval !== 0) detailHtml += `└ 人資綜合評估：<span style="${hrEval > 0 ? 'color:#4ade80;' : 'color:#ff8a8a;'}">${hrEval > 0 ? '+'+hrEval : hrEval} 分</span><br>`;
            detailHtml += `</div>`;

            const modal = document.createElement('div');
            modal.id = 'final-achievement-modal';
            modal.innerHTML = `
                <div class="achievement-box" onclick="event.stopPropagation()" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#1a1a1a; padding:30px; border:2px solid #fbbf24; z-index:10000; color:white; width:85%; max-width:400px; border-radius:12px; box-shadow: 0 0 30px rgba(251,191,36,0.3); text-align:center;">
                    <div class="close-modal-btn" onclick="document.getElementById('final-achievement-modal').remove()" style="position:absolute; right:15px; top:10px; font-size:20px; cursor:pointer; color:#888;">✕</div>
                    <div class="typing-container" style="font-size:32px; font-weight:bold; color:#fbbf24; margin-bottom:20px;">
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0s; display:inline-block;">評</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0.4s; display:inline-block;">定</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0.8s; display:inline-block;">${rankLetter}</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 1.2s; display:inline-block;">級</span>
                    </div>
                    <div style="margin-top: 20px;">
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 1.8s; opacity:0;"><strong>🏆 最終戰力評級：</strong>${fullRankTitle}</div>
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 2.1s; opacity:0; margin-top:10px;">
                            <strong>💯 冒險總積分：</strong>${this.state.score} 分
                            ${detailHtml}
                        </div>
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 2.4s; opacity:0; margin-top:10px;"><strong>✅ 試煉完成度：</strong>${currentProg}</div>
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 2.7s; opacity:0; margin-top:10px; color:#8ab4f8;"><strong>🛡️ 最終裝備：</strong><br>${finalEquip}</div>
                        
                        <div class="fade-in-row eval-text" style="animation: fadeUpIn 0.8s forwards 3.0s; opacity:0; margin-top:15px; padding:10px; background:rgba(255,255,255,0.05); border-radius:6px; line-height:1.5;">
                            <strong>📜 系統總評：</strong><br>${evalStr}
                        </div>
                        ${mockeryHTML}
                    </div>
                </div>
            `;
            
            // 點擊黑底也可關閉
            modal.onclick = () => {
                modal.remove();
            };
            
            document.body.appendChild(modal);
        };

        if (withFirework) {
            // 1. 放 CSS 粒子煙火 (停留 3 秒)
            const fw = document.createElement('div');
            fw.id = 'firework-overlay';
            fw.innerHTML = `
                <div class="css-firework fw-1"></div>
                <div class="css-firework fw-2"></div>
                <div class="css-firework fw-3"></div>
                <div class="firework-text">入職試煉圓滿達成<br>歡迎正式踏入我們的行列</div>
            `;
            document.body.appendChild(fw);
            void fw.offsetWidth;
            fw.classList.add('active');

            // 2. 煙火結束，浮現結算面板
            setTimeout(() => {
                fw.classList.remove('active');
                setTimeout(() => {
                    fw.remove();
                    renderModal();
                }, 500);
            }, 3000); 
        } else {
            // 無煙火模式 (重新登入時)，直接顯示面板
            renderModal();
        }
    },

    updateButtonStyles() {
        const lockedTexts = {
            1: "🔒 啟程點・已封印",
            2: "🔒 行囊區・已封印",
            3: "⏳ 鑑定所・審核中",
            4: "🔒 前線營・已就緒",
            5: "📜 誓約日・已締約",
            6: "👑 聖殿區・已加冕"
        };
        
        const trials = [1, 2, 3, 4, 5, 6];
        
        const statusStr = String(this.state.examStatus).trim().toUpperCase();
        const isApproved = (statusStr === '通過' || statusStr === 'OK');
        const isRejected = (statusStr === '退件');

        trials.forEach(n => {
            const btn = document.getElementById(`btn-trial-${n}`);
            const detailsBlock = document.getElementById(`detail-trial-${n}`);
            
            if (btn) {
                if (this.state.currentTrial >= n) {
                    btn.disabled = true;
                    btn.innerText = lockedTexts[n];
                    btn.style.backgroundColor = "";
                    btn.style.color = "";
                    
                    if (detailsBlock) {
                        const inputs = detailsBlock.querySelectorAll('input');
                        inputs.forEach(input => {
                            input.disabled = true;
                            if(input.type === 'checkbox' || input.type === 'radio' || input.type === 'file') {
                                input.style.opacity = "0.5";
                                input.style.cursor = "not-allowed";
                            }
                        });
                        // 鎖定上傳按鈕外觀
                        const uploadBtns = detailsBlock.querySelectorAll('.file-upload-btn');
                        uploadBtns.forEach(uBtn => {
                            uBtn.style.opacity = "0.5";
                            uBtn.style.cursor = "not-allowed";
                            uBtn.style.pointerEvents = "none";
                        });
                    }

                    // 🌟 若是第六關破關按鈕，賦予「點擊回顧成就」功能
                    if (n === 6) {
                        btn.disabled = false; 
                        btn.innerText = "🏆 成就回顧";
                        btn.style.backgroundColor = "#fbbf24";
                        btn.style.color = "#000";
                        btn.style.cursor = "pointer";
                        btn.onclick = () => { this.showFinalAchievement(false); };
                    }
                }
                
                // 第三關退件/通過邏輯
                if (n === 3) {
                    if (this.state.currentTrial >= 3 && isApproved) {
                        btn.innerText = "✅ 鑑定通過";
                        btn.style.backgroundColor = "#2a2a2a";
                        btn.style.color = "#4ade80";
                        btn.style.border = "1px solid #4ade80";
                    } else if (isRejected) {
                        btn.disabled = false;
                        btn.innerText = "❌ 退件重傳";
                        btn.style.backgroundColor = "#ef4444";
                        btn.style.color = "#ffffff";
                        
                        if (detailsBlock) {
                            detailsBlock.querySelectorAll('input').forEach(i => i.disabled = false);
                            detailsBlock.querySelectorAll('.file-upload-btn').forEach(b => {
                                b.style.opacity = "1";
                                b.style.cursor = "pointer";
                                b.style.pointerEvents = "auto";
                            });
                        }
                    }
                }
            }
            
            // 🌟 關卡順序防偷跑解鎖邏輯 
            if (detailsBlock) {
                if (n === 4 && !(this.state.currentTrial >= 3 && isApproved)) {
                    detailsBlock.classList.add('locked-details');
                    detailsBlock.removeAttribute('open');
                } else if (n > 1 && this.state.currentTrial < n - 1) {
                    detailsBlock.classList.add('locked-details');
                    detailsBlock.removeAttribute('open'); 
                } else {
                    detailsBlock.classList.remove('locked-details');
                }
            }
        });

        // 🌟 恢復第五關的勾選狀態 
        if(this.state.achievements.includes('t5_score_1')) {
            const chk = document.getElementById('chk-t5-1');
            if (chk && this.state.currentTrial < 5) chk.checked = true; 
        }
        if(this.state.achievements.includes('t5_score_2')) {
            const chk = document.getElementById('chk-t5-2');
            if (chk && this.state.currentTrial < 5) chk.checked = true;
        }

        // 🌟 第六關霸道單選深度鎖定邏輯
        const have = document.getElementById('chk-bank-have');
        const process = document.getElementById('chk-bank-process');
        const done = document.getElementById('chk-bank-done');
        const bDate = document.getElementById('input-bank-date');
        const bBtn = document.getElementById('btn-lock-bank');

        if (have && process && done && this.state.currentTrial < 6) {
            have.disabled = false; process.disabled = false; done.disabled = false;
            if(!this.state.bankDateLocked) { bDate.disabled = false; bBtn.disabled = false; }
            
            if (this.state.bankStatus === 'have') {
                have.checked = true;
                process.disabled = true; done.disabled = true;
                bDate.disabled = true; bBtn.disabled = true;
            } else if (this.state.bankStatus === 'process') {
                process.checked = true;
                have.disabled = true; done.disabled = true;
            } else if (this.state.bankStatus === 'done') {
                done.checked = true;
                have.disabled = true; process.disabled = true;
                bDate.disabled = true; bBtn.disabled = true;
            }
        }
    }
};

window.addEventListener('load', () => GameEngine.init());
