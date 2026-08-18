const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// المرجع الداخلي للإعدادات والحالة
let botState = {
    isRunning: true,
    isChatActive: true,
    isVoiceActive: true,
    isPlanBRunning: false,
    stats: {},
    config: {}
};

// دالة لتلقي البيانات وتحديثها من index.js
const updateBotState = (data) => {
    botState = { ...botState, ...data };
};

app.get('/', (req, res) => {
    const c = botState.config || {};
    const s = botState.stats || {};

    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>لوحة التحكم الفخمة | Discord Selfbot</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg-gradient: linear-gradient(135deg, #0f0c20 0%, #15102a 50%, #060814 100%);
                    --glass-bg: rgba(255, 255, 255, 0.04);
                    --glass-border: rgba(255, 255, 255, 0.08);
                    --accent-primary: #7269ef;
                    --accent-success: #10b981;
                    --accent-danger: #ef4444;
                    --accent-warning: #f59e0b;
                    --text-main: #f3f4f6;
                    --text-sub: #9ca3af;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
                body { background: var(--bg-gradient); color: var(--text-main); min-height: 100vh; padding: 25px 15px; }
                .container { max-width: 1000px; margin: 0 auto; }
                
                header { text-align: center; margin-bottom: 30px; }
                header h1 { font-size: 2.2rem; font-weight: 800; background: linear-gradient(90deg, #a78bfa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                header p { color: var(--text-sub); font-size: 0.95rem; }

                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 25px; }
                
                .card { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.37); }
                .card h3 { font-size: 1.2rem; margin-bottom: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px; color: #c084fc; display: flex; align-items: center; gap: 8px; }

                .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }
                .status-on { background: rgba(16, 185, 129, 0.2); color: var(--accent-success); border: 1px solid var(--accent-success); }
                .status-off { background: rgba(239, 68, 68, 0.2); color: var(--accent-danger); border: 1px solid var(--accent-danger); }

                .btn-group { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
                .btn { flex: 1; min-width: 120px; padding: 10px 15px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; text-decoration: none; text-align: center; color: white; display: inline-block; font-size: 0.9rem; }
                .btn:hover { transform: translateY(-2px); opacity: 0.9; }
                .btn-primary { background: #6366f1; }
                .btn-success { background: #10b981; }
                .btn-danger { background: #ef4444; }
                .btn-warning { background: #f59e0b; }

                form { display: flex; flex-direction: column; gap: 12px; }
                label { font-size: 0.85rem; color: var(--text-sub); }
                input[type="text"], input[type="number"] { width: 100%; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--glass-border); padding: 10px; border-radius: 8px; color: white; outline: none; }
                input:focus { border-color: var(--accent-primary); }

                .stat-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.9rem; }
                .stat-item span:last-child { font-weight: 700; color: #38bdf8; }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>👑 لوحة التحكم الشاملة</h1>
                    <p>إدارة السيلف بوت والمهام الصوتية والنصية بأعلى كفاءة</p>
                </header>

                <div class="grid">
                    <!-- حالة النظام -->
                    <div class="card">
                        <h3>⚡ حالة النظام</h3>
                        <div class="stat-item">
                            <span>البوت العام:</span>
                            <span class="status-badge ${botState.isRunning ? 'status-on' : 'status-off'}">${botState.isRunning ? 'نشط' : 'متوقف'}</span>
                        </div>
                        <div class="stat-item">
                            <span>الاتصال الصوتي:</span>
                            <span class="status-badge ${botState.isVoiceActive ? 'status-on' : 'status-off'}">${botState.isVoiceActive ? 'متصل' : 'مفصول'}</span>
                        </div>
                        <div class="stat-item">
                            <span>إرسال الشات:</span>
                            <span class="status-badge ${botState.isChatActive ? 'status-on' : 'status-off'}">${botState.isChatActive ? 'مفعل' : 'معطل'}</span>
                        </div>
                        <div class="stat-item">
                            <span>الخطة باء (Spam):</span>
                            <span class="status-badge ${botState.isPlanBRunning ? 'status-on' : 'status-off'}">${botState.isPlanBRunning ? 'شغالة' : 'متوقفة'}</span>
                        </div>
                        <div class="btn-group">
                            <a href="/api/toggle/bot" class="btn ${botState.isRunning ? 'btn-danger' : 'btn-success'}">${botState.isRunning ? 'إيقاف البوت' : 'تشغيل البوت'}</a>
                            <a href="/api/toggle/voice" class="btn btn-primary">${botState.isVoiceActive ? 'فصل الصوت' : 'توصيل الصوت'}</a>
                            <a href="/api/toggle/planb" class="btn btn-warning">${botState.isPlanBRunning ? 'إيقاف خطة B' : 'تشغيل خطة B'}</a>
                        </div>
                    </div>

                    <!-- إحصائيات النشاط -->
                    <div class="card">
                        <h3>📊 إحصائيات النشاط</h3>
                        <div class="stat-item"><span>إجمالي المرسل:</span> <span>${s.totalSent || 0}</span></div>
                        <div class="stat-item"><span>ذكريات (Task 1):</span> <span>${s.task1CountLog || 0}</span></div>
                        <div class="stat-item"><span>بخشيش (Task 2):</span> <span>${s.task2CountLog || 0}</span></div>
                        <div class="stat-item"><span>عمل/جريمة (Task 3):</span> <span>${s.task3CountLog || 0}</span></div>
                        <div class="stat-item"><span>هجوم (Task 4):</span> <span>${s.task4CountLog || 0}</span></div>
                        <div class="stat-item"><span>آخر نشاط:</span> <span style="font-size:0.75rem">${s.lastActiveTime || 'لا يوجد'}</span></div>
                    </div>
                </div>

                <div class="grid">
                    <!-- التحكم بالرومات والتافيك -->
                    <div class="card">
                        <h3>🎙️ إدارة الرومات الصوتية والتحكم</h3>
                        <form action="/api/update-config" method="POST">
                            <div>
                                <label>روم الـ AFK الصوتي:</label>
                                <input type="text" name="afkChannelId" value="${c.afkChannelId || ''}">
                            </div>
                            <div>
                                <label>روم الأوامر (Control Channel):</label>
                                <input type="text" name="controlChannelId" value="${c.controlChannelId || ''}">
                            </div>
                            <button type="submit" class="btn btn-primary" style="margin-top:10px">حفظ التغييرات</button>
                        </form>
                    </div>

                    <!-- تخصيص النشاط والحالة -->
                    <div class="card">
                        <h3>🎮 تغيير النشاط (Presence)</h3>
                        <form action="/api/update-presence" method="POST">
                            <div>
                                <label>نوع النشاط:</label>
                                <input type="text" name="gameName" placeholder="مثال: Valorant أو Fortnite">
                            </div>
                            <button type="submit" class="btn btn-success" style="margin-top:10px">تحديث النشاط</button>
                        </form>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// APIs التحكم
app.get('/api/toggle/:action', (req, res) => {
    const action = req.params.action;
    const event = require('events');
    if (global.botEmitter) {
        global.botEmitter.emit('control', action);
    }
    res.redirect('/');
});

app.post('/api/update-config', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('updateConfig', req.body);
    }
    res.redirect('/');
});

app.post('/api/update-presence', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('updatePresence', req.body.gameName);
    }
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`🌐 لوحة التحكم الفخمة تعمل على المنفذ: ${port}`);
});

module.exports = { updateBotState };
