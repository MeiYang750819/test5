/* ================================================================
   【 ⚙️ GAME ENGINE - 真實雲端上傳與防失憶完美版 】
   ================================================================ */

const urlParams = new URLSearchParams(window.location.search);
let currentUser = urlParams.get('uid') || urlParams.get('id');

if (currentUser) {
    localStorage.setItem('hero_current_id', currentUser);
} else {
    currentUser = localStorage.getItem('hero_current_id') || "TEST_001";
}

const GameEngine = {
    config: {
        apiUrl: "https://script.google.com/macros/s/AKfycbz18MlQSnFETW9q80SWGixDg074px2_GxRbvS5RoFfrCiUsLO9T7j9aTEikeWV9z9Px7g/exec",
        uid: currentUser
    },

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
        scoreDetails: { base: 0, earlyBird: 0, delayPenalty: 0, hrEval: 0 },
        hasSeenDoomFlash: false
    },

    ranks: [
        { min: 101, title: "💎 SS級 神話級玩家" },
        { min: 96,  title: "🌟 S級 傳說級玩家" },
        { min: 80,  title: "🟢 A級 菁英玩家" },
        { min: 60,  title: "🥇 B級 穩健玩家" },
        { min: 41,  title: "🥈 C級 潛力玩家" },
        { min: 21,  title: "🥉 D級 基礎學徒" },
        { min: 11,  title: "🌱 實習小萌新" },
        { min: 0,   title: "🥚 報到新手村" }
    ],

    armorPath: [
        '👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲',
        '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'
    ],

    weaponPaths: {
        '🗡️ 精鋼短劍': '⚔️ 騎士長劍', '⚔️ 騎士長劍': '⚔️ 破甲重劍', '⚔️ 破甲重劍': '⚔️ 斬星巨劍', '⚔️ 斬星巨劍': '🗡️ 聖光戰劍', '🗡️ 聖光戰劍': '👑 王者之聖劍',
        '🏹 獵人短弓': '🏹 精靈長弓', '🏹 精靈長弓': '🏹 迅雷連弓', '🏹 迅雷連弓': '🏹 穿雲幻弓', '🏹 穿雲幻弓': '🏹 追風神弓', '🏹 追風神弓': '☄️ 破曉流星弓',
        '🔱 鐵尖長槍': '🔱 鋼鐵戰矛', '🔱 鋼鐵戰矛': '🔱 破陣重矛', '🔱 破陣重矛': '🔱 雷霆戰戟', '🔱 雷霆戰戟': '🔱 龍膽銀槍', '🔱 龍膽銀槍': '🐉 滅世龍吟槍'
    },

    trialsData: {
        1: { progGain: 14, loc: '🏰 登錄公會', scoreGain: 16 },
        2: { progGain: 14, loc: '📁 裝備盤點', scoreGain: 16 },
        3: { progGain: 17, loc: '🛡️ 裝備鑑定所', scoreGain: 21 },
        4: { progGain: 13, loc: '🎒 出征準備營', scoreGain: 16 },
        5: { progGain: 13, loc: '💼 契約祭壇', scoreGain: 16 },
        6: { progGain: 12, loc: '👑 榮耀殿堂', scoreGain: 0 }
    },

    getStorageKey() { return 'hero_progress_' + this.config.uid; },

    init() {
        document.querySelectorAll('details').forEach(el => el.removeAttribute('open'));

        // 防止跳頁失憶
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.href && !btn.href.includes('javascript')) {
                const url = new URL(btn.href, window.location.href);
                url.searchParams.set('id', currentUser);
                btn.href = url.toString();
            }
        });

        try {
            const saved = localStorage.getItem(this.getStorageKey());
            if (saved) this.state = Object.assign({}, this.state, JSON.parse(saved));
        } catch (e) {}

        this.injectGlobalCSS();

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

        if (this.state.currentTrial >= 6) {
            setTimeout(() => { this.showFinalAchievement(false); }, 800);
        }
    },

    injectGlobalCSS() {
        if (document.getElementById('game-fx-style')) return;
        const style = document.createElement('style');
        style.id = 'game-fx-style';
        style.innerHTML = `
            @keyframes shinyUpdate {
                0%, 100% { filter: brightness(1); transform: scale(1); }
                50% { filter: brightness(1.5); transform: scale(1.2); color: #ffffff; text-shadow: 0 0 15px #fbbf24; } /* 🌟 恢復超級閃亮 1.2倍 */
            }
            .shiny-effect { animation: shinyUpdate 1s ease-in-out; display: inline-block; }
            .game-toast {
                position: fixed; bottom: 20px; right: -300px;
                background: #1a1a1a; color: #efefef; border: 1px solid #fbbf24;
                padding: 12px 20px; border-radius: 8px; z-index: 9999;
                transition: 0.5s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-weight: bold;
            }
            .game-toast.show { right: 20px; }
            
            .floating-score {
                position: fixed; color: #4ade80; font-size: 24px; font-weight: bold;
                text-shadow: 0 0 8px rgba(0,0,0,0.8); pointer-events: none; z-index: 10000;
                animation: floatUp 1.5s ease-out forwards;
            }
            @keyframes floatUp {
                0% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-50px) scale(1.5); }
            }

            input[type="date"] { color-scheme: dark; color: white; } /* 🌟 日期強制白字 */
            input.locked-input {
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                appearance: none !important;
                color: #ffffff !important;
                -webkit-text-fill-color: #ffffff !important;
                opacity: 1 !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid #555 !important;
            }
        `;
        document.head.appendChild(style);
    },

    async syncWithBackend() {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;

        try {
            const apiUrl = `${this.config.apiUrl}?action=loadData&uid=${encodeURIComponent(this.config.uid)}`;
            const response = await fetch(apiUrl);
            const res = await response.json();

            if (res.status === 'success' && res.data) {
                const d = res.data;
                const oldScore = this.state.score; // 🌟 紀錄舊分數用來判斷要不要閃

                this.state.appointmentTime = d.appointmentTime;
                this.state.appointmentLocation = d.appointmentLocation;
                this.state.score = d.currentScore;
                this.state.backendRank = d.currentRank;
                this.state.examStatus = d.examStatus;
                this.state.scoreDetails = d.scoreDetails;

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
                // 🌟 嚴格判定：分數變高才會閃光！
                this.updateUI(this.state.score > oldScore);
            }
        } catch (err) { console.error("同步失敗:", err); }
    },

    flashElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('shiny-effect');
            void el.offsetWidth;
            el.classList.add('shiny-effect');
        }
    },

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

    // 🌟 彩蛋綁定在 Checkbox 打勾時飄分
    unlock(event, id, scoreGain) {
        const chk = event.target;
        if (!chk.checked) return; // 沒打勾不給分
        if (this.state.achievements.includes(id)) return;
        
        this.state.achievements.push(id);
        this.save();
        
        if (scoreGain > 0) {
            this.state.score += scoreGain;
            this.state.scoreDetails.base += scoreGain;
            this.createFloatingText(event, `+${scoreGain}`);
            
            fetch(`${this.config.apiUrl}?action=updateScore&uid=${encodeURIComponent(this.config.uid)}&field=${encodeURIComponent(id)}&score=${encodeURIComponent(scoreGain)}`);
            setTimeout(() => { this.updateUI(true); }, 1000);
        }
    },

    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        const gain = 8;
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${gain}`);
            this.state.achievements.push(id);
            this.state.score += gain;
            this.state.scoreDetails.base += gain;
        } else if (!isChecked && this.state.achievements.includes(id)) {
            this.state.achievements = this.state.achievements.filter(a => a !== id);
            this.state.score -= gain;
            this.state.scoreDetails.base -= gain;
        }
        this.save(); this.updateUI(true);
    },

    createFloatingText(e, text) {
        if (text === '+0' || !text) return; 
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        const el = document.createElement('div');
        el.className = 'floating-score'; el.innerText = text;
        el.style.left = `${x}px`; el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'game-toast'; toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
    },

    save() {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    },

    updateUI(doFlash = false) {
        let displayRankTitle = this.state.backendRank;
        if (!displayRankTitle) {
            const rankObj = this.ranks.find(r => this.state.score >= r.min) || this.ranks[7];
            displayRankTitle = rankObj.title;
        }

        const rEl = document.getElementById('rank-text');
        const sEl = document.getElementById('status-tag');
        if (rEl) rEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="rank-name">${displayRankTitle}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="loc-text">${this.state.location}</span>`;
        if (sEl) sEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="item-text">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status">${this.state.status}</span>`;
        
        const scoreEl = document.getElementById('score-text');
        const scoreFill = document.getElementById('score-fill');
        if (scoreEl) scoreEl.innerText = this.state.score + "分";
        if (scoreFill) scoreFill.style.width = Math.min(this.state.score, 100) + "%";

        let currentProg = 0;
        for(let i=1; i<=this.state.currentTrial; i++) { currentProg += this.trialsData[i].progGain; }
        const progVal = document.getElementById('prog-val');
        const progFill = document.getElementById('prog-fill');
        if (progVal) progVal.innerText = currentProg + "%";
        if (progFill) progFill.style.width = currentProg + "%";

        if (doFlash) {
            this.flashElement('score-text');
            this.flashElement('rank-name');
            this.flashElement('loc-text');
        }

        this.updateDateControls();
        this.updateButtonStyles();
        
        // 🌟 更新第四關的前線營開啟時間與報到時間
        const timeEl = document.getElementById('dyn-apt-time');
        const locEl = document.getElementById('dyn-apt-loc');
        const openEl = document.getElementById('dyn-open-time');
        
        if (timeEl) timeEl.innerText = this.state.appointmentTime;
        if (locEl) locEl.innerText = this.state.appointmentLocation;
        
        if (openEl && this.state.appointmentTime && !this.state.appointmentTime.includes("等待")) {
            const aptDateStr = this.state.appointmentTime.replace(/-/g, '/');
            const openTime = new Date(aptDateStr);
            openTime.setDate(openTime.getDate() - 1);
            openTime.setHours(17, 0, 0, 0); // 前一天下午 17:00
            openEl.innerText = openTime.getFullYear() + "-" + String(openTime.getMonth()+1).padStart(2,'0') + "-" + String(openTime.getDate()).padStart(2,'0') + " 17:00";
        }
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
                if (field.locked) {
                    input.type = 'text'; input.value = field.val || ""; input.disabled = true;
                    input.classList.add('locked-input'); btn.innerText = "已鎖定"; btn.disabled = true; btn.style.opacity = "0.5";
                } else {
                    input.type = 'date'; input.classList.remove('locked-input');
                }
            }
        });
    },

    lockDate(type) {
        const id = type === 'exam' ? 'input-exam-date' : type === 'result' ? 'input-result-date' : 'input-bank-date';
        const val = document.getElementById(id).value;
        if (!val) { alert("請先選擇日期！"); return; }
        
        const confirmLock = confirm("鎖定後不可修改，確定要鎖定嗎？");
        if (!confirmLock) return;

        // 🌟 統一儲存 YYYY-MM-DD 格式，不再自動轉換
        if (type === 'exam') { this.state.examDate = val; this.state.examDateLocked = true; }
        else if (type === 'result') { this.state.resultDate = val; this.state.resultDateLocked = true; }
        else if (type === 'bank') { this.state.bankDate = val; this.state.bankDateLocked = true; }
        
        this.save(); this.updateUI(false);
        fetch(`${this.config.apiUrl}?action=lockDate&uid=${encodeURIComponent(this.config.uid)}&dateType=${type}&dateValue=${encodeURIComponent(val)}`);
    },

    requestChange() {
        const dateVal = document.getElementById('input-change-date').value;
        const reasonVal = document.getElementById('input-change-reason').value;
        
        // 🌟 嚴格防呆：只按日期不填原因絕對不給過
        if (!dateVal || !reasonVal) { 
            alert("⚠️ 勇者請注意\n預計日期與改期原因皆為必填項目！"); 
            return; 
        }
        
        const confirmLock = confirm("確定要送出改期申請嗎？系統將自動扣減積分！");
        if (!confirmLock) return;

        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖。");
        
        const changeInput = document.getElementById('input-change-date');
        const reasonInput = document.getElementById('input-change-reason');
        const changeBtn = document.getElementById('btn-lock-change');
        
        changeInput.type = 'text'; changeInput.disabled = true; changeInput.classList.add('locked-input');
        reasonInput.disabled = true; reasonInput.classList.add('locked-input');
        changeBtn.innerText = "已送出"; changeBtn.disabled = true; changeBtn.style.opacity = "0.5";
        
        fetch(`${this.config.apiUrl}?action=lockDate&uid=${encodeURIComponent(this.config.uid)}&dateType=change&dateValue=${encodeURIComponent(dateVal)}&reason=${encodeURIComponent(reasonVal)}`);
    },

    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) return;
        
        // 🌟 第四關遲到無情扣分機制
        if (trialNum === 4) {
            const apt = this.state.appointmentTime;
            if (!apt || apt.includes("等待")) { alert("⚠️ 尚未發布報到時間！"); return; }
            
            const aptDateStr = apt.replace(/-/g, '/');
            const aptTime = new Date(aptDateStr);
            const now = new Date();
            
            if (now > aptTime) {
                alert(`🚨 警告：遲到報到！\n系統已自動扣除 2 分積極度積分！`);
                fetch(`${this.config.apiUrl}?action=latePenalty&uid=${encodeURIComponent(this.config.uid)}`);
                this.state.score -= 2; // 畫面先行扣分
                this.state.scoreDetails.delayPenalty += 2;
            }
        }
        
        if (trialNum === 3) {
            if (!this.state.examDateLocked || !this.state.resultDateLocked) {
                alert("⚠️ 請先填寫並「鎖定」體檢相關日期（預計體檢日 ＆ 報告產出日），才能推進關卡！");
                return;
            }
        }
        
        const tData = this.trialsData[trialNum];
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.save();
        
        const detailsBlock = document.getElementById(`detail-trial-${trialNum}`);
        if (detailsBlock) { detailsBlock.removeAttribute('open'); }
        
        this.updateButtonStyles();

        // 🌟 提交任務才會飄出底分！
        if (tData.scoreGain > 0 && event) {
            this.createFloatingText(event, `+${tData.scoreGain}`);
            this.state.score += tData.scoreGain;
            this.state.scoreDetails.base += tData.scoreGain;
            setTimeout(() => { this.updateUI(true); }, 1000); // 確保閃爍
        }

        fetch(`${this.config.apiUrl}?action=completeTrial&uid=${encodeURIComponent(this.config.uid)}&trialNum=${trialNum}`)
            .then(() => { this.syncWithBackend(); });
        
        if (trialNum === 6) {
            setTimeout(() => { this.showFinalAchievement(true); }, 1500);
        } else {
            let msg = trialNum === 3 ? '📣 此階段任務已完成，請稍待鑑定！' : '📣 此階段任務已完成，請繼續前進！';
            this.showToast(msg);
        }
    },

    // 🌟 終極引擎：真實讀取檔案並轉為 Base64 傳送至 Google Drive
    handleFileUpload(input, chkId, fileType) {
        const file = input.files[0];
        if (!file) return;

        const statusSpan = input.parentElement.querySelector('.upload-status');
        const chkBox = document.getElementById(chkId);
        
        statusSpan.innerText = "⏳ 魔法封裝上傳中...";
        statusSpan.classList.remove('success');

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1];
            
            const payload = {
                action: 'uploadFile',
                uid: GameEngine.config.uid,
                fileName: file.name,
                mimeType: file.type,
                fileType: fileType, // 告訴後台這是哪種檔案(bank, exam_normal...)
                fileData: base64Data
            };

            fetch(GameEngine.config.apiUrl, {
                method: 'POST', // 使用 POST 傳輸巨量檔案
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(res => {
                if(res.status === 'success') {
                    statusSpan.innerText = "✅ 歸檔完成";
                    statusSpan.classList.add('success');
                    if(chkBox) {
                        chkBox.checked = true;
                        if (!GameEngine.state.checkboxes) GameEngine.state.checkboxes = {};
                        GameEngine.state.checkboxes[chkId] = true;
                        GameEngine.save();
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

    showFinalAchievement(withFirework = true) {
        let displayRankTitle = this.state.backendRank;
        if (!displayRankTitle) {
            const rankObj = this.ranks.find(r => this.state.score >= r.min) || this.ranks[7];
            displayRankTitle = rankObj.title;
        }
        
        const fullRankTitle = displayRankTitle.replace(/.*?([A-ZSS]+級.*)/, '$1');
        const currentProg = document.getElementById('prog-val').innerText;

        const weaponItem = this.state.items.find(i => Object.keys(this.weaponPaths).includes(i) || Object.values(this.weaponPaths).includes(i) || ['👑 王者之聖劍', '☄️ 破曉流星弓', '🐉 滅世龍吟槍'].includes(i)) || "";
        const armorItem = this.state.items.find(i => this.armorPath.includes(i)) || "";
        const finalEquip = [armorItem, weaponItem].filter(Boolean).join(' 、 '); 
        const hasWeapon = !!weaponItem;

        const renderModal = () => {
            if (document.getElementById('final-achievement-modal')) {
                document.getElementById('final-achievement-modal').remove();
            }
            
            const d = this.state.scoreDetails;
            let earlyBirdStr = `+${d.earlyBird}`;
            let hrEvalStr = d.hrEval >= 0 ? `+${d.hrEval}` : d.hrEval;
            
            let detailHtml = `
                <div style="font-size: 13px; color: #888; margin-left: 10px; margin-top: 5px; line-height: 1.6;">
                    └ 🗺️ 基礎探索積分：${d.base} 分<br>
                    └ ⚡ 高效早鳥紅利：<span style="color:#4ade80;">${earlyBirdStr} 分</span><br>
                    └ ⏳ 任務延宕損耗：<span style="color:#ff8a8a;">${d.delayPenalty} 分</span><br>
                    └ 👁️ 公會長老評鑑：<span style="${d.hrEval >= 0 ? 'color:#4ade80;' : 'color:#ff8a8a;'}">${hrEvalStr} 分</span><br>
                </div>
            `;

            let mockeryHTML = !hasWeapon ? `<div style="margin-top:15px; color:#ff8a8a; font-size:13px; border-top:1px dashed #555; padding-top:10px;">📝 系統額外判定：<br>勇者雖已通關，但未詳閱《鍛造秘笈》，<br>仍全程赤手空拳完成試煉...敬佩！</div>` : "";

            const modal = document.createElement('div');
            modal.id = 'final-achievement-modal';
            modal.innerHTML = `
                <div class="achievement-box" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#1a1a1a; padding:30px; border:2px solid #fbbf24; z-index:10000; color:white; width:85%; max-width:400px; border-radius:12px; box-shadow: 0 0 30px rgba(251,191,36,0.3);">
                    <h2 style="color:#fbbf24; margin-top:0; text-align:center;">🏆 最終戰力結算</h2>
                    <div style="margin-top: 20px;">
                        <div style="font-size:15px; margin-bottom:8px;"><strong>🏆 最終戰力評級：</strong>${fullRankTitle}</div>
                        <div style="font-size:15px; margin-bottom:8px;">
                            <strong>💯 最終冒險積分：${this.state.score} 分</strong>
                            ${detailHtml}
                        </div>
                        <div style="font-size:15px; margin-bottom:8px;"><strong>✅ 試煉完成度：</strong>${currentProg}</div>
                        <div style="font-size:15px; margin-bottom:8px;"><strong>🛡️ 最終裝備：</strong>${finalEquip}</div>
                        ${mockeryHTML}
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 25px; width: 100%; padding: 12px; background: #fbbf24; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 16px;">確認收錄</button>
                </div>
            `;
            document.body.appendChild(modal);
        };

        if (withFirework) { setTimeout(render, 1500); } else { render(); }
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

        const statusStr = String(this.state.examStatus).trim().toUpperCase();
        const isApproved = (statusStr === '通過' || statusStr === 'OK');
        const isRejected = (statusStr === '退件');

        for (let n = 1; n <= 6; n++) {
            const btn = document.getElementById(`btn-trial-${n}`);
            const block = document.getElementById(`detail-trial-${n}`);
            if (!btn || !block) continue;

            if (this.state.currentTrial >= n) {
                btn.disabled = true;
                btn.innerText = lockedTexts[n];
                btn.style.backgroundColor = "";
                btn.style.color = "";
                
                block.querySelectorAll('input').forEach(i => {
                    if (i.type === 'checkbox') i.checked = true; // 強制滿勾
                    i.disabled = true;
                    if (i.type === 'checkbox' || i.type === 'radio' || i.type === 'file') {
                        i.style.opacity = "1";
                        i.style.cursor = "not-allowed";
                    }
                });

                block.querySelectorAll('.file-upload-btn').forEach(b => {
                    b.style.opacity = "0.5";
                    b.style.cursor = "not-allowed";
                    b.style.pointerEvents = "none";
                });

                if (n === 6) {
                    btn.disabled = false;
                    btn.innerText = "🏆 成就回顧";
                    btn.style.backgroundColor = "#fbbf24";
                    btn.style.color = "#000";
                    // 🌟 修正點擊沒反應：確保按鈕點擊彈出面板
                    btn.onclick = () => this.showFinalAchievement(false);
                }
            }

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
                    
                    block.querySelectorAll('input').forEach(i => i.disabled = false);
                    block.querySelectorAll('.file-upload-btn').forEach(b => {
                        b.style.opacity = "1";
                        b.style.cursor = "pointer";
                        b.style.pointerEvents = "auto";
                    });
                }
            }

            if (n === 4 && !(this.state.currentTrial >= 3 && isApproved)) {
                block.classList.add('locked-details');
                block.removeAttribute('open');
            } else if (n > 1 && this.state.currentTrial < n - 1) {
                block.classList.add('locked-details');
                block.removeAttribute('open');
            } else {
                block.classList.remove('locked-details');
            }
        }
    }
};

window.addEventListener('load', () => GameEngine.init());
