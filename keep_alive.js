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
    isTaskRunning: true,
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
            <title>🎮 لوحة التحكم النيون | Discord Selfbot</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes neonGlow {
                    0%, 100% { color: #a89f9e; }
                    50% { color: #c9bfbe; }
                }

                @keyframes slideInFade {
                    from { 
                        opacity: 0; 
                        transform: translateY(15px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0);
                    }
                }

                :root {
                    --dark-black: #0a0a0a;
                    --dark-brown: #1a1410;
                    --gray-dark: #2a2620;
                    --gray-neon: #787776;
                    --gray-light: #a89f9e;
                    --text-main: #e8e6e4;
                    --text-sub: #9a9390;
                }

                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box;
                    font-family: 'Cairo', sans-serif;
                }

                body {
                    --account-accent: ${c.color || '#a89f9e'};
                    --account-accent-soft: rgba(168, 159, 158, 0.18);
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1410 50%, #0d0a08 100%);
                    color: var(--text-main);
                    min-height: 100vh;
                    padding: 40px 15px;
                    overflow-x: hidden;
                    position: relative;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 2;
                }

                header {
                    text-align: center;
                    margin-bottom: 50px;
                }

                header h1 {
                    font-size: 3rem;
                    font-weight: 900;
                    font-family: 'Orbitron', monospace;
                    letter-spacing: 3px;
                    animation: neonGlow 4s ease-in-out infinite;
                    color: var(--account-accent);
                    margin-bottom: 15px;
                }

                header p {
                    color: #9a9390;
                    font-size: 0.95rem;
                    letter-spacing: 1px;
                }

                .status-line {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 25px;
                    flex-wrap: wrap;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border: 1.5px solid rgba(120, 119, 118, 0.4);
                    border-radius: 25px;
                    background: rgba(42, 38, 32, 0.6);
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.4s ease;
                }

                .status-indicator:hover {
                    border-color: rgba(120, 119, 118, 0.7);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .status-dot.active { background: #7a9b5a; }
                .status-dot.inactive { background: #8b5a5a; }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 25px;
                    margin-bottom: 30px;
                }

                .card {
                    background: linear-gradient(135deg, rgba(26, 20, 16, 0.95) 0%, rgba(32, 26, 20, 0.95) 100%);
                    border: 1.5px solid rgba(120, 119, 118, 0.3);
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                    animation: slideInFade 0.6s ease-out both;
                    position: relative;
                    transition: all 0.3s ease;
                    border-left: 4px solid var(--account-accent);
                }

                .card:nth-child(1) { animation-delay: 0.05s; }
                .card:nth-child(2) { animation-delay: 0.1s; }
                .card:nth-child(3) { animation-delay: 0.15s; }
                .card:nth-child(4) { animation-delay: 0.2s; }

                .card:hover {
                    border-color: rgba(120, 119, 118, 0.6);
                    box-shadow: 0 6px 25px rgba(120, 119, 118, 0.15);
                    transform: translateY(-2px);
                }

                .card h3 {
                    font-size: 1.3rem;
                    margin-bottom: 20px;
                    border-bottom: 1.5px solid rgba(120, 119, 118, 0.3);
                    padding-bottom: 12px;
                    color: #b8aeac;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                }

                .status-badge {
                    display: inline-block;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    border: 1px solid;
                    transition: all 0.2s ease;
                }

                .status-on {
                    background: rgba(122, 155, 90, 0.15);
                    color: #9fbf7f;
                    border-color: rgba(122, 155, 90, 0.4);
                }

                .status-off {
                    background: rgba(139, 90, 90, 0.15);
                    color: #c9a5a5;
                    border-color: rgba(139, 90, 90, 0.4);
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(120, 119, 118, 0.15);
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    color: #b8aeac;
                }

                .stat-item:hover {
                    background: rgba(120, 119, 118, 0.04);
                    padding-left: 5px;
                }

                .stat-item span:last-child {
                    font-weight: 700;
                    color: #9fbf7f;
                }

                .btn-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 20px;
                }

                .btn {
                    flex: 1;
                    min-width: 130px;
                    padding: 11px 18px;
                    border: 1.5px solid;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    text-decoration: none;
                    text-align: center;
                    color: #f5f3f1;
                    display: inline-block;
                    font-size: 0.85rem;
                    position: relative;
                    letter-spacing: 0.5px;
                }

                .btn:hover {
                    transform: translateY(-1px);
                }

                .btn-primary {
                    background: linear-gradient(135deg, var(--account-accent) 0%, #4a4a48 100%);
                    border-color: rgba(120, 119, 118, 0.5);
                }

                .btn-primary:hover {
                    box-shadow: 0 0 10px rgba(120, 119, 118, 0.2);
                    border-color: rgba(120, 119, 118, 0.7);
                }

                .btn-success {
                    background: linear-gradient(135deg, var(--account-accent) 0%, #5a7a48 100%);
                    border-color: rgba(122, 155, 90, 0.5);
                }

                .btn-success:hover {
                    box-shadow: 0 0 10px rgba(122, 155, 90, 0.2);
                    border-color: rgba(122, 155, 90, 0.7);
                }

                .btn-danger {
                    background: linear-gradient(135deg, #5a3a38 0%, #7a4a48 100%);
                    border-color: rgba(139, 90, 90, 0.5);
                }

                .btn-danger:hover {
                    box-shadow: 0 0 10px rgba(139, 90, 90, 0.2);
                    border-color: rgba(139, 90, 90, 0.7);
                }

                .btn-warning {
                    background: linear-gradient(135deg, var(--account-accent) 0%, #7a5a48 100%);
                    border-color: rgba(140, 100, 60, 0.5);
                }

                .btn-warning:hover {
                    box-shadow: 0 0 10px rgba(140, 100, 60, 0.2);
                    border-color: rgba(140, 100, 60, 0.7);
                }

                form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                label {
                    font-size: 0.85rem;
                    color: #a89f9e;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                input[type="text"],
                input[type="number"] {
                    width: 100%;
                    background: rgba(20, 16, 12, 0.8);
                    border: 1.5px solid rgba(120, 119, 118, 0.3);
                    padding: 11px 14px;
                    border-radius: 8px;
                    color: #e8e6e4;
                    outline: none;
                    font-size: 0.9rem;
                    transition: all 0.25s ease;
                }

                input:focus {
                    border-color: rgba(120, 119, 118, 0.6);
                    box-shadow: 0 0 8px rgba(120, 119, 118, 0.15);
                    background: rgba(20, 16, 12, 0.95);
                }

                input::placeholder {
                    color: #5a5350;
                }

                form button {
                    margin-top: 5px;
                }

                /* Accordion Styles */
                .accordion-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .accordion-item {
                    background: rgba(42, 38, 32, 0.5);
                    border: 1.5px solid rgba(120, 119, 118, 0.3);
                    border-radius: 8px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .accordion-item:hover {
                    border-color: rgba(120, 119, 118, 0.5);
                    background: rgba(42, 38, 32, 0.7);
                }

                .accordion-header {
                    padding: 12px 15px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    color: #b8aeac;
                    transition: all 0.25s ease;
                    user-select: none;
                }

                .accordion-header:hover {
                    color: #c9bfbe;
                }

                .accordion-icon {
                    font-size: 1.2rem;
                    transition: transform 0.3s ease;
                }

                .accordion-item.active .accordion-icon {
                    transform: rotate(180deg);
                }

                .accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    padding: 0 15px;
                }

                .accordion-item.active .accordion-content {
                    max-height: 500px;
                    padding: 15px;
                }

                .accordion-content-inner {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                @media (max-width: 768px) {
                    header h1 { font-size: 2rem; letter-spacing: 2px; }
                    .grid { grid-template-columns: 1fr; }
                    .btn-group { flex-direction: column; }
                    .btn { min-width: 100%; }
                    body { padding: 20px 10px; }
                }
            </style>
        </head>
        <body style="--account-accent: ${c.color || '#a89f9e'};">
            <div class="container">
                <header>
                    <h1>◆ لوحة التحكم ◆</h1>
                    <p>نظام إدارة ديسكورد سيلفبوت المتقدم</p>
                    <div class="status-line">
                        <div class="status-indicator">
                            <span class="status-dot ${botState.isRunning ? 'active' : 'inactive'}"></span>
                            <span>البوت: ${botState.isRunning ? 'نشط ✓' : 'متوقف ✗'}</span>
                        </div>
                        <div class="status-indicator">
                            <span class="status-dot ${botState.isVoiceActive ? 'active' : 'inactive'}"></span>
                            <span>الصوت: ${botState.isVoiceActive ? 'متصل ✓' : 'مفصول ✗'}</span>
                        </div>
                        <div class="status-indicator">
                            <span class="status-dot ${botState.isChatActive ? 'active' : 'inactive'}"></span>
                            <span>الكتابة: ${botState.isChatActive ? 'مفعلة ✓' : 'معطلة ✗'}</span>
                        </div>
                        <div class="status-indicator">
                            <span class="status-dot ${botState.isTaskRunning ? 'active' : 'inactive'}"></span>
                            <span>المهام: ${botState.isTaskRunning ? 'مفعلة ✓' : 'متوقفة ✗'}</span>
                        </div>
                        <div class="status-indicator">
                            <span class="status-dot ${botState.isPlanBRunning ? 'active' : 'inactive'}"></span>
                            <span>الخطة ب: ${botState.isPlanBRunning ? 'مشغلة ✓' : 'متوقفة ✗'}</span>
                        </div>
                    </div>
                </header>

                <div style="display:flex; flex-direction:column; gap:25px;">
                    <div class="grid">
                            <!-- حالة النظام -->
                    <div class="card">
                        <h3>⚙️ حالة النظام</h3>
                        <div class="stat-item">
                            <span>البوت الرئيسي</span>
                            <span class="status-badge ${botState.isRunning ? 'status-on' : 'status-off'}">${botState.isRunning ? 'نشط' : 'متوقف'}</span>
                        </div>
                        <div class="stat-item">
                            <span>قناة الصوت</span>
                            <span class="status-badge ${botState.isVoiceActive ? 'status-on' : 'status-off'}">${botState.isVoiceActive ? 'متصلة' : 'مفصولة'}</span>
                        </div>
                        <div class="stat-item">
                            <span>وحدة الكتابة</span>
                            <span class="status-badge ${botState.isChatActive ? 'status-on' : 'status-off'}">${botState.isChatActive ? 'مفعلة' : 'معطلة'}</span>
                        </div>
                        <div class="stat-item">
                            <span>المهام الأساسية</span>
                            <span class="status-badge ${botState.isTaskRunning ? 'status-on' : 'status-off'}">${botState.isTaskRunning ? 'مفعلة' : 'متوقفة'}</span>
                        </div>
                        <div class="stat-item">
                            <span>الخطة ب</span>
                            <span class="status-badge ${botState.isPlanBRunning ? 'status-on' : 'status-off'}">${botState.isPlanBRunning ? 'مشغلة' : 'متوقفة'}</span>
                        </div>
                        <div class="btn-group">
                            <a href="/api/toggle/bot" class="btn ${botState.isRunning ? 'btn-danger' : 'btn-success'}">${botState.isRunning ? '⏹ إيقاف كامل' : '▶ تشغيل كامل'}</a>
                            <a href="/api/toggle/voice" class="btn btn-primary">${botState.isVoiceActive ? '🔇 إيقاف صوت' : '🔊 تشغيل صوت'}</a>
                            <a href="/api/toggle/chat" class="btn btn-warning">${botState.isChatActive ? '🔇 إيقاف كتابة' : '📝 تشغيل كتابة'}</a>
                            <a href="/api/toggle/tasks" class="btn btn-success">${botState.isTaskRunning ? '⏹ إيقاف المهام' : '▶ تشغيل المهام'}</a>
                            <a href="/api/toggle/planb" class="btn btn-warning">${botState.isPlanBRunning ? '⏹ إيقاف خطة ب' : '▶ تشغيل خطة ب'}</a>
                        </div>
                    </div>

                    <!-- إحصائيات النشاط -->
                    <div class="card">
                        <h3>📊 إحصائيات النشاط</h3>
                        <div class="stat-item"><span>إجمالي المرسل</span> <span>${s.totalSent || 0}</span></div>
                        <div class="stat-item"><span>المهمة الأولى (ذكريات)</span> <span>${s.task1CountLog || 0}</span></div>
                        <div class="stat-item"><span>المهمة الثانية (بخشيش)</span> <span>${s.task2CountLog || 0}</span></div>
                        <div class="stat-item"><span>المهمة الثالثة (عمل/جريمة)</span> <span>${s.task3CountLog || 0}</span></div>
                        <div class="stat-item"><span>المهمة الرابعة (هجوم)</span> <span>${s.task4CountLog || 0}</span></div>
                        <div class="stat-item"><span>آخر نشاط</span> <span style="font-size:0.85rem">${s.lastActiveTime || 'لا يوجد'}</span></div>
                    </div>
                </div>

                <div class="grid">
                    <!-- إدارة القنوات الصوتية -->
                    <div class="card">
                        <h3>🎙️ إدارة القنوات الصوتية</h3>
                        <form action="/api/update-tasks-config" method="POST">
                            <div class="form-group">
                                <label>🔴 قناة ال AFK (الانتظار)</label>
                                <input type="text" name="afkChannelId" value="${c.afkChannelId || ''}" placeholder="أدخل رقم القناة">
                            </div>
                            <button type="submit" class="btn btn-primary" style="margin-top: 15px;">💾 حفظ</button>
                        </form>
                    </div>

                    <!-- المهام الثابتة المبرمجة -->
                    <div class="card">
                        <h3>⚡ المهام المبرمجة (ثابتة)</h3>
                        <div class="accordion-container">
                            <!-- المهمة 1 -->
                            <div class="accordion-item">
                                <div class="accordion-header">
                                    <span>📌 المهمة 1 - ذكريات</span>
                                    <span class="accordion-icon">▼</span>
                                </div>
                                <div class="accordion-content">
                                    <div class="accordion-content-inner">
                                        <div class="stat-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                            <strong style="color: #c9bfbe;">القناة:</strong>
                                            <span style="color: #9fbf7f;">${c.task1Channel}</span>
                                            <strong style="color: #c9bfbe; margin-top: 8px;">الرسالة:</strong>
                                            <span style="color: #9fbf7f;">${c.task1Msg}</span>
                                            <strong style="color: #c9bfbe; margin-top: 8px;">المرات:</strong>
                                            <span style="color: #9fbf7f;">${c.task1Count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- المهمة 2 -->
                            <div class="accordion-item">
                                <div class="accordion-header">
                                    <span>📌 المهمة 2 - بخشيش</span>
                                    <span class="accordion-icon">▼</span>
                                </div>
                                <div class="accordion-content">
                                    <div class="accordion-content-inner">
                                        <div class="stat-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                            <strong style="color: #c9bfbe;">القناة:</strong>
                                            <span style="color: #9fbf7f;">${c.task2Channel}</span>
                                            <strong style="color: #c9bfbe; margin-top: 8px;">الرسالة:</strong>
                                            <span style="color: #9fbf7f;">${c.task2Msg}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- المهمة 3 -->
                            <div class="accordion-item">
                                <div class="accordion-header">
                                    <span>📌 المهمة 3 - عمل/جريمة</span>
                                    <span class="accordion-icon">▼</span>
                                </div>
                                <div class="accordion-content">
                                    <div class="accordion-content-inner">
                                        <div class="stat-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                            <strong style="color: #c9bfbe;">القناة:</strong>
                                            <span style="color: #9fbf7f;">${c.task3Channel}</span>
                                            <strong style="color: #c9bfbe; margin-top: 8px;">الرسائل:</strong>
                                            <span style="color: #9fbf7f;">${Array.isArray(c.task3Msgs) ? c.task3Msgs.join(' | ') : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- المهمة 4 -->
                            <div class="accordion-item">
                                <div class="accordion-header">
                                    <span>📌 المهمة 4 - هجوم</span>
                                    <span class="accordion-icon">▼</span>
                                </div>
                                <div class="accordion-content">
                                    <div class="accordion-content-inner">
                                        <div class="stat-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                            <strong style="color: #c9bfbe;">القناة:</strong>
                                            <span style="color: #9fbf7f;">${c.task4Channel}</span>
                                            <strong style="color: #c9bfbe; margin-top: 8px;">الرسالة:</strong>
                                            <span style="color: #9fbf7f;">${c.task4Msg}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- خطة ب -->
                            <div class="accordion-item">
                                <div class="accordion-header">
                                    <span>📌 خطة ب - رسائل مبرمجة</span>
                                    <span class="accordion-icon">▼</span>
                                </div>
                                <div class="accordion-content">
                                    <div class="accordion-content-inner">
                                        <div class="stat-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                            <strong style="color: #c9bfbe;">القناة:</strong>
                                            <span style="color: #9fbf7f;">${c.planBChannel}</span>
                                            <strong style="color: #c9bfbe; margin-top: 8px;">الرسالة:</strong>
                                            <span style="color: #9fbf7f;">${c.planBMsg}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid">
                    <!-- حذف الرسائل -->
                    <div class="card">
                        <h3>🗑️ حذف الرسائل</h3>
                        <div class="form-group">
                            <label>🔧 ID الروم</label>
                            <input type="text" id="deleteChannelId" placeholder="أدخل ID الروم" required>
                        </div>
                        <div class="form-group">
                            <label>📨 عدد الرسائل</label>
                            <input type="number" id="deleteMessageCount" placeholder="مثال: 50" min="1" max="100" value="50">
                        </div>
                        <button type="button" class="btn btn-danger" onclick="deleteMessages()" style="width: 100%;">🗑️ حذف الرسائل</button>
                    </div>

                    <!-- الرومات المخصصة -->
                    <div class="card">
                        <h3>🎮 الرومات المخصصة (Custom Rooms)</h3>
                        <div class="accordion-container" id="customRoomsContainer">
                            ${Array.isArray(c.customRooms) && c.customRooms.length > 0 ? c.customRooms.map((room, idx) => `
                                <div class="accordion-item" data-room-id="${idx}">
                                    <div class="accordion-header">
                                        <span>🔧 روم مخصص #${idx + 1}</span>
                                        <span class="accordion-icon">▼</span>
                                    </div>
                                    <div class="accordion-content">
                                        <div class="accordion-content-inner">
                                            <div class="stat-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                                <strong style="color: #c9bfbe;">القناة:</strong>
                                                <span style="color: #9fbf7f;">${room.channelId}</span>
                                                <strong style="color: #c9bfbe; margin-top: 8px;">الرسالة:</strong>
                                                <span style="color: #9fbf7f;">${room.message}</span>
                                                <strong style="color: #c9bfbe; margin-top: 8px;">المؤقت:</strong>
                                                <span style="color: #9fbf7f;">${room.interval} ثانية</span>
                                                <strong style="color: #c9bfbe; margin-top: 8px;">الحالة:</strong>
                                                <span style="color: ${room.active ? '#9fbf7f' : '#c9a5a5'};">${room.active ? '✅ مشغل' : '❌ معطل'}</span>
                                            </div>
                                            <div style="display: flex; gap: 10px; margin-top: 12px;">
                                                <button type="button" class="btn btn-danger" onclick="deleteCustomRoom(${idx})" style="flex: 1; min-width: 100px;">🗑️ حذف</button>
                                                <a href="/api/toggle-custom-room/${idx}" class="btn btn-warning" style="flex: 1; min-width: 100px;">${room.active ? '⏸️ إيقاف' : '▶️ تشغيل'}</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p style="color: #9a9390; text-align: center; padding: 15px;">لا توجد رومات مخصصة</p>'}
                        </div>

                        <div style="margin-top: 20px; padding: 15px; background: rgba(42, 38, 32, 0.5); border-radius: 8px; border: 1.5px solid rgba(120, 119, 118, 0.3);">
                            <h4 style="color: #b8aeac; margin-bottom: 12px;">➕ إضافة روم مخصص جديد</h4>
                            <div class="form-group">
                                <label>🔧 رقم القناة</label>
                                <input type="text" id="newRoomChannel" placeholder="أدخل رقم القناة" required>
                            </div>
                            <div class="form-group">
                                <label>💬 الرسالة</label>
                                <input type="text" id="newRoomMessage" placeholder="الرسالة اللي تبي ترسلها" required>
                            </div>
                            <div class="form-group">
                                <label>⏱️ المؤقت (بالثواني)</label>
                                <input type="number" id="newRoomInterval" placeholder="مثال: 30" min="1" required>
                            </div>
                            <button type="button" class="btn btn-success" onclick="addCustomRoom()" style="width: 100%;">➕ إضافة الروم</button>
                        </div>
                    </div>

                    <!-- تغيير حالة النشاط -->
                    <div class="card">
                        <h3>🎮 حالة النشاط (Presence)</h3>
                        <form action="/api/update-presence" method="POST">
                            <div class="form-group">
                                <label>🎯 ما الذي تفعله؟</label>
                                <input type="text" name="gameName" placeholder="مثال: Valorant, Fortnite, البرمجة...">
                            </div>
                            <button type="submit" class="btn btn-warning">🚀 تحديث الحالة</button>
                        </form>
                    </div>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                document.querySelectorAll('.accordion-header').forEach(header => {
                    header.addEventListener('click', function() {
                        const item = this.parentElement;
                        item.classList.toggle('active');
                    });
                });

                function addCustomRoom() {
                    const channel = document.getElementById('newRoomChannel').value;
                    const message = document.getElementById('newRoomMessage').value;
                    const interval = document.getElementById('newRoomInterval').value;

                    if (!channel || !message || !interval) {
                        alert('❌ ملء جميع الحقول مطلوب!');
                        return;
                    }

                    fetch('/api/add-custom-room', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channelId: channel, message, interval: parseInt(interval) })
                    }).then(() => location.reload());
                }

                function deleteCustomRoom(idx) {
                    if (confirm('هل أنت متأكد من حذف هذا الروم؟')) {
                        fetch('/api/delete-custom-room/' + idx, { method: 'POST' })
                            .then(() => location.reload());
                    }
                }

                function deleteMessages() {
                    const channelId = document.getElementById('deleteChannelId').value.trim();
                    const count = document.getElementById('deleteMessageCount').value.trim();
                    if (!channelId) {
                        alert('❌ أدخل ID الروم أولاً');
                        return;
                    }
                    fetch('/api/delete-messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channelId, count: Number(count || 50) })
                    }).then(async (res) => {
                        const data = await res.json();
                        alert(data.message || '✅ تم الحذف');
                        if (data.success) location.reload();
                    });
                }
            </script>
        </html>
    `);
});

// APIs التحكم
app.get('/api/toggle/:action', (req, res) => {
    const action = req.params.action;
    if (global.botEmitter) {
        global.botEmitter.emit('control', action);
    }
    res.redirect('/');
});

app.post('/api/update-tasks-config', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('updateTasksConfig', req.body);
    }
    res.redirect('/');
});

app.post('/api/add-account', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('addAccount', req.body || {});
    }
    res.json({ success: true });
});

app.post('/api/delete-account/:id', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('deleteAccount', req.params.id);
    }
    res.json({ success: true });
});

app.get('/api/select-account/:id', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('selectAccount', req.params.id);
    }
    res.redirect('/');
});

app.post('/api/add-custom-room', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('addCustomRoom', req.body);
    }
    res.json({ success: true });
});

app.post('/api/delete-custom-room/:id', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('deleteCustomRoom', parseInt(req.params.id));
    }
    res.json({ success: true });
});

app.post('/api/delete-messages', async (req, res) => {
    if (!global.botEmitter) {
        return res.json({ success: false, message: '⚠️ البوت غير متاح' });
    }

    const payload = req.body || {};
    const result = await new Promise((resolve) => {
        const onDone = (data) => {
            global.botEmitter.removeListener('deleteMessagesResult', onDone);
            resolve(data);
        };
        global.botEmitter.on('deleteMessagesResult', onDone);
        global.botEmitter.emit('deleteMessages', payload);
    });

    res.json(result || { success: false, message: '⚠️ لم يتم حذف الرسائل' });
});

app.get('/api/toggle-custom-room/:id', (req, res) => {
    if (global.botEmitter) {
        global.botEmitter.emit('toggleCustomRoom', parseInt(req.params.id));
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
