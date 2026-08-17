require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');

const client = new Client();

// --- ملف الحفظ الدائم (Persistent Storage) ---
const CONFIG_FILE = './bot_config.json';

let config = {
    // control values default back to sensible saved/demo IDs so a group DM (or saved config file)
    // can be used without requiring env vars. Env vars still override if you set them in the host.
    guildId: process.env.GUILD_ID || "",
    afkChannelId: process.env.AFK_CHANNEL_ID || "1496645738086531194",
    controlChannelId: process.env.CONTROL_CHANNEL_ID || "1538406310327091260",
    targetGuildId: process.env.TARGET_GUILD_ID || "1264561928034975775",

    alertEnabled: false,
    alertGuildIds: [],
    disabledSendChannels: [],

    task1Channel: "1507460885583626351",
    task1Msg: "!ذكريات",
    task1Count: 10,

    task2Channel: "1497214787493433545",
    task2Msg: "بخشيش",

    task3Channel: "1505231947574546472",
    task3Msgs: ["!عمل", "!جريمة", "!رصيد"],

    task4Channel: "1505231949629882508",
    task4Msg: "!هجوم <@998040612047691827>",

    planBChannel: "1503150255594799205",
    planBMsg: "يا شباب جمعو نقاط",

    customTaskEnabled: false,
    customTaskChannels: ["1503150255594799205"],
    customTaskChannel: "1503150255594799205",
    customTaskMsg: "مرحبا شباب",
    customTaskIntervalMs: 6000
};

// تحميل الإعدادات المحفوظة إن وجدت
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        config = { ...config, ...savedData, ...{
            guildId: process.env.GUILD_ID || config.guildId,
            afkChannelId: process.env.AFK_CHANNEL_ID || config.afkChannelId,
            controlChannelId: process.env.CONTROL_CHANNEL_ID || config.controlChannelId,
            targetGuildId: process.env.TARGET_GUILD_ID || config.targetGuildId
        }};
        console.log("📂 تم تحميل الإعدادات المحفوظة بنجاح.");
    } catch (e) {
        console.error("❌ خطأ في قراءة ملف الإعدادات:", e);
    }
}


const saveConfig = () => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {
        console.error("❌ خطأ في حفظ الإعدادات:", e);
    }
};

const isMutedChannel = (channelId) => {
    if (!channelId) return false;
    return config.disabledSendChannels.includes(String(channelId));
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isChatActive = true;
let isVoiceActive = true;
let isBotRunning = true;

let planBInterval = null;
let isPlanBRunning = false;
let customTaskInterval = null;

// إحصائيات وسجل النشاط
let stats = {
    totalSent: 0,
    task1CountLog: 0,
    task2CountLog: 0,
    task3CountLog: 0,
    task4CountLog: 0,
    planBCountLog: 0,
    lastActiveTime: "لا يوجد نشاط بعد"
};

const getRandomInterval = (minMinutes, maxMinutes) => {
    const minMs = minMinutes * 60 * 1000;
    const maxMs = maxMinutes * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
};

let messageQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue || !isBotRunning || !isChatActive) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0 && isBotRunning && isChatActive) {
        const task = messageQueue.shift();
        if (isMutedChannel(task.channelId)) {
            console.log(`⏸️ تم تجاهل ارسال الروم ${task.channelId} لأنه تم ايقاف الإرسال له.`);
            continue;
        }
        try {
            const channel = await client.channels.fetch(task.channelId);
            if (channel && channel.isText()) {
                await channel.send(task.content);
                stats.totalSent++;
                stats.lastActiveTime = new Date().toLocaleString();
                console.log(`📨 تم إرسال: (${task.content}) إلى الروم: ${task.channelId}`);
            }
        } catch (error) {
            console.error(`❌ خطأ في إرسال الرسالة إلى الروم ${task.channelId}:`, error);
        }
        await wait(3000);
    }
    isProcessingQueue = false;
};

const queueMessage = (channelId, content) => {
    if (!isBotRunning || !isChatActive) return;
    messageQueue.push({ channelId, content });
    processQueue();
};

// --- المهام ---
const runTask1 = async () => {
    if (!isBotRunning || !isChatActive) return;
    if (isMutedChannel(config.task1Channel)) {
        console.log(`⏸️ تم تجاهل task1 للروم ${config.task1Channel} لأن الإرسال موقوف له.`);
        return;
    }
    for (let i = 0; i < config.task1Count; i++) {
        if (!isBotRunning || !isChatActive) break;
        try {
            const channel = await client.channels.fetch(config.task1Channel);
            if (channel && channel.isText()) {
                await channel.send(config.task1Msg);
                stats.totalSent++;
                stats.task1CountLog++;
                stats.lastActiveTime = new Date().toLocaleString();
                console.log(`📨 تم إرسال (${config.task1Msg}) - رقم ${i + 1}`);
            }
        } catch (error) {
            console.error("❌ خطأ في إرسال المهمة الأولى:", error);
        }
        if (i < config.task1Count - 1) {
            await wait(4000);
        }
    }
};

const runTask2 = () => {
    if (!isBotRunning || !isChatActive) return;
    if (isMutedChannel(config.task2Channel)) {
        console.log(`⏸️ تم تجاهل task2 للروم ${config.task2Channel} لأن الإرسال موقوف له.`);
        return;
    }
    queueMessage(config.task2Channel, config.task2Msg);
    stats.task2CountLog++;
};

const runTask3 = () => {
    if (!isBotRunning || !isChatActive) return;
    if (isMutedChannel(config.task3Channel)) {
        console.log(`⏸️ تم تجاهل task3 للروم ${config.task3Channel} لأن الإرسال موقوف له.`);
        return;
    }
    config.task3Msgs.forEach(msg => {
        queueMessage(config.task3Channel, msg);
        stats.task3CountLog++;
    });
};

const runTask4 = () => {
    if (!isBotRunning || !isChatActive) return;
    if (isMutedChannel(config.task4Channel)) {
        console.log(`⏸️ تم تجاهل task4 للروم ${config.task4Channel} لأن الإرسال موقوف له.`);
        return;
    }
    queueMessage(config.task4Channel, config.task4Msg);
    stats.task4CountLog++;
};

const startPlanB = async () => {
    if (isPlanBRunning) return;
    isPlanBRunning = true;
    console.log("🚀 تم بدء تفعيل الخطة باء (كل 2.5 ثانية رسالة)...");
    await sendPlanBMsg();

    planBInterval = setInterval(async () => {
        if (!isBotRunning || !isChatActive || !isPlanBRunning) return;
        await sendPlanBMsg();
    }, 2500);
};

const sendPlanBMsg = async () => {
    if (isMutedChannel(config.planBChannel)) {
        console.log(`⏸️ تم تجاهل الخطة باء للروم ${config.planBChannel} لأن الإرسال موقوف له.`);
        return;
    }
    try {
        const channel = await client.channels.fetch(config.planBChannel);
        if (channel && channel.isText()) {
            await channel.send(config.planBMsg);
            stats.totalSent++;
            stats.planBCountLog++;
            stats.lastActiveTime = new Date().toLocaleString();
            console.log(`🚨 تم تنفيذ الخطة باء وإرسال: (${config.planBMsg})`);
        }
    } catch (e) {
        console.error("❌ خطأ في تنفيذ الخطة باء:", e);
    }
};

const stopPlanB = () => {
    if (!isPlanBRunning) return;
    isPlanBRunning = false;
    if (planBInterval) {
        clearInterval(planBInterval);
        planBInterval = null;
    }
    console.log("🛑 تم إيقاف الخطة باء بنجاح.");
};

const startCustomTask = () => {
    if (customTaskInterval || !config.customTaskEnabled) return;
    customTaskInterval = setInterval(async () => {
        if (!isBotRunning || !isChatActive || !config.customTaskEnabled) return;
        const channelId = config.customTaskChannels[Math.floor(Math.random() * config.customTaskChannels.length)] || config.customTaskChannel;
        if (isMutedChannel(channelId)) {
            console.log(`⏸️ تم تجاهل المهمة المخصصة للروم ${channelId} لأن الإرسال موقوف له.`);
            return;
        }
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel && channel.isText()) {
                await channel.send(config.customTaskMsg);
                stats.totalSent++;
                stats.lastActiveTime = new Date().toLocaleString();
                console.log(`💬 تم إرسال رسالة مخصصة إلى ${channelId}: ${config.customTaskMsg}`);
            }
        } catch (err) {
            console.error('❌ خطأ في المهمة المخصصة:', err);
        }
    }, Math.max(1500, config.customTaskIntervalMs || 6000));
};

const stopCustomTask = () => {
    if (!customTaskInterval) return;
    clearInterval(customTaskInterval);
    customTaskInterval = null;
};

// --- نظام تحديث الألعاب مع إظهار الأيقونات الرسمية ---
const setPresenceActivity = (type, name, details = null) => {
    try {
        if (type === 'spotify') {
            client.user.setPresence({
                activities: [{
                    name: 'Spotify',
                    type: 'LISTENING',
                    details: name, 
                    state: details 
                }],
                status: 'online'
            });
        } else {
            // استخدام التطبيقات الرسمية المتاحة في السيلف بوت لتظهر الصور بشكل صحيح
            let appId = "367827983903449089"; // افتراضي عام
            if (name.toLowerCase().includes('valorant')) appId = "782291108640030730";
            if (name.toLowerCase().includes('fortnite')) appId = "323534496466984960";
            if (name.toLowerCase().includes('minecraft')) appId = "453478544186523658";
            if (name.toLowerCase().includes('roblox')) appId = "390403342322302976";

            client.user.setPresence({
                activities: [{
                    name: name,
                    type: 'PLAYING',
                    applicationId: appId // لإجبار ديسكورد على جلب الأيقونة الرسمية
                }],
                status: 'online'
            });
        }
        console.log(`🎮 تم تحديث الحالة في البروفايل إلى: ${name}`);
    } catch (e) {
        console.error("❌ خطأ في تحديث الحالة:", e);
    }
};

// اتصال الصوت مع الحماية
const connectToVoice = (targetChannelId = null) => {
    if (!isBotRunning || !isVoiceActive || !config.guildId) return;
    const channelToJoin = targetChannelId || config.afkChannelId;
    if (!channelToJoin) return;

    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return;

    try {
        const existingConnection = getVoiceConnection(guild.id);
        if (existingConnection) {
            existingConnection.destroy();
        }

        joinVoiceChannel({
            channelId: channelToJoin,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
        console.log(`🔊 تم الاتصال بالروم الصوتي بنجاح: ${channelToJoin}`);
    } catch (e) { console.error("❌ خطأ في الاتصال الصوتي:", e); }
};

const scheduleNextTask = (taskFn, minMin, maxMin) => {
    const runAndSchedule = async () => {
        if (isBotRunning) {
            await taskFn();
        }
        const nextTime = getRandomInterval(minMin, maxMin);
        setTimeout(runAndSchedule, nextTime);
    };
    const initialTime = getRandomInterval(minMin, maxMin);
    setTimeout(runAndSchedule, initialTime);
};

const isAlertTarget = (message) => {
    if (!config.alertEnabled || message.author.bot) return false;
    if (!message.guild || !message.guild.id) return false;
    if (!config.alertGuildIds.includes(String(message.guild.id))) return false;
    if (!message.mentions || !message.mentions.users) return false;
    if (message.mentions.users.has(client.user.id)) return true;
    if (message.reference && message.reference.messageId) {
        return true;
    }
    return false;
};

const sendMentionAlert = async (message) => {
    if (!isAlertTarget(message)) return;
    try {
        const channel = await client.channels.fetch(config.controlChannelId).catch(() => null);
        if (!channel) return;
        const authorTag = message.author ? message.author.tag : 'unknown';
        const guildName = message.guild ? message.guild.name : 'DM';
        const channelName = message.channel ? message.channel.name : 'unknown';
        const preview = (message.content || '').replace(/\s+/g, ' ').trim();
        const text = `🔔 تنبيه جديد\n` +
            `- شخص: ${authorTag}\n` +
            `- سيرفر: ${guildName}\n` +
            `- روم: ${channelName}\n` +
            `- تاغ/رد: ${message.mentions && message.mentions.users && message.mentions.users.has(client.user.id) ? 'تاغ' : 'رد'}\n` +
            `- الرسالة: ${preview || 'لا يوجد نص'}`;
        await channel.send(text);
    } catch (e) {
        console.error('❌ خطأ في ارسال اشعار التنبيه:', e);
    }
};

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول كـ : ${client.user.tag}`);
    connectToVoice();
    setPresenceActivity('game', 'Valorant');

    runTask1();
    runTask2();
    runTask3();
    runTask4();

    if (config.customTaskEnabled) startCustomTask();

    scheduleNextTask(runTask1, 26, 34);
    scheduleNextTask(runTask2, 26, 34);
    scheduleNextTask(runTask3, 44, 56);
    scheduleNextTask(runTask4, 26, 34);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        if (message.author.id === client.user.id) {
            if (message.channel.id !== config.controlChannelId) return;
        } else {
            return;
        }
    }

    if (message.author.id !== client.user.id && config.alertEnabled) {
        await sendMentionAlert(message);
    }

    if (message.author.id !== client.user.id) return;
    if (message.channel.id !== config.controlChannelId) return;

    const text = message.content.trim();
    const lower = text.toLowerCase();
    const reply = (content) => message.reply(content).catch(() => {});
    const isValidId = (value) => typeof value === 'string' && /^\d{5,20}$/.test(value);

    if (lower === 'شرح' || lower === 'اوامر' || lower === 'لوحة' || lower === 'help') {
        return reply(
            '📘 شرح سريع:\n' +
            '• هذا البوت يتحكم من خلال محادثة خاصة أو مجموعة خاصة بك\n' +
            '• لا يحتاج موقع\n' +
            '• كل شيء يتم داخل الروم control\n' +
            '🧩 أوامر سريعة:\n' +
            '• تشغيل\n' +
            '• ايقاف\n' +
            '• ايقاف صوت\n' +
            '• ايقاف كتابة\n' +
            '• حالة\n' +
            '• اشعار\n' +
            '• اشعار سيرفر 123456789\n' +
            '• اشعار قائمة\n' +
            '• ايقاف ارسال 123456789\n' +
            '• تشغيل ارسال 123456789\n' +
            '• ارسال متوقف\n' +
            '• الخطة باء\n' +
            '• ايقاف الخطة باء\n' +
            '• قنوات\n' +
            '• تعديل\n' +
            '• تعديل قناة 1 123456789\n' +
            '• تعديل رسالة 1 مرحبا\n' +
            '• تعديل عدد 1 10\n' +
            '• تعديل مؤقت مخصص 6000\n' +
            '• تشغيل مخصصة\n' +
            '• ايقاف مخصصة\n' +
            '• مسح 20 123456789\n' +
            '• لعبة Valorant\n' +
            '• سبوتيفاي song - artist'
        );
    }

    if (lower === 'تشغيل') {
        if (isBotRunning) return reply('⚠️ البوت يعمل مسبقاً.');
        isBotRunning = true;
        isChatActive = true;
        isVoiceActive = true;
        connectToVoice();
        return reply('🟢 تم تشغيل البوت بالكامل.');
    }

    if (lower === 'ايقاف') {
        if (!isBotRunning) return reply('⚠️ البوت متوقف مسبقاً.');
        isBotRunning = false;
        stopPlanB();
        const conn = getVoiceConnection(config.guildId);
        if (conn) conn.destroy();
        return reply('🔴 تم إيقاف البوت بالكامل.');
    }

    if (lower === 'ايقاف صوت' || lower === 'اياف صوت' || lower === 'توقف صوت') {
        isVoiceActive = !isVoiceActive;
        if (isVoiceActive) {
            connectToVoice();
            return reply('🔊 تم تفعيل الصوت والاتصال بالروم.');
        }
        const conn = getVoiceConnection(config.guildId);
        if (conn) conn.destroy();
        return reply('🔇 تم إيقاف الصوت وتفكيك الاتصال.');
    }

    if (lower === 'ايقاف كتابة' || lower === 'اياف كتابة' || lower === 'توقف كتابة') {
        isChatActive = !isChatActive;
        return reply(`✍️ حالة الكتابة: ${isChatActive ? 'مفعلة' : 'متوقفة'}`);
    }

    if (lower === 'حالة') {
        return reply(
            '📊 الحالة العامة:\n' +
            `- البوت: ${isBotRunning ? '🟢 يعمل' : '🔴 متوقف'}\n` +
            `- الكتابة: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}\n` +
            `- الصوت: ${isVoiceActive ? '🟢 متصل' : '🔴 مفصول'}\n` +
            `- الخطة باء: ${isPlanBRunning ? '🟢 نشطة' : '🔴 متوقفة'}\n` +
            `- الاشعارات: ${config.alertEnabled ? '🟢 مفعلة' : '🔴 متوقفة'}\n` +
            `- الرومات الموقوفة للإرسال: ${config.disabledSendChannels.length || 0}\n` +
            `- إجمالي الرسائل: ${stats.totalSent}\n` +
            `- ذكريات: ${stats.task1CountLog}\n` +
            `- بخشيش: ${stats.task2CountLog}\n` +
            `- عمل/جريمة: ${stats.task3CountLog}\n` +
            `- هجوم: ${stats.task4CountLog}\n` +
            `- آخر نشاط: ${stats.lastActiveTime}`
        );
    }

    if (lower === 'اشعار') {
        config.alertEnabled = !config.alertEnabled;
        saveConfig();
        return reply(`🔔 إشعارات التاغ/الرد: ${config.alertEnabled ? 'مفعلة' : 'متوقفة'}`);
    }

    if (text.startsWith('اشعار سيرفر ')) {
        const guildId = text.replace('اشعار سيرفر ', '').trim();
        if (!isValidId(guildId)) return reply('❌ الصيغة: اشعار سيرفر [آيدي_السيرفر]');
        const strId = String(guildId);
        if (!config.alertGuildIds.includes(strId)) {
            config.alertGuildIds.push(strId);
            saveConfig();
            return reply(`✅ تم إضافة السيرفر ${strId} إلى الاشعارات.`);
        }
        return reply('⚠️ السيرفر موجود مسبقاً في الاشعارات.');
    }

    if (text.startsWith('اشعار حذف ')) {
        const guildId = text.replace('اشعار حذف ', '').trim();
        if (!isValidId(guildId)) return reply('❌ الصيغة: اشعار حذف [آيدي_السيرفر]');
        config.alertGuildIds = config.alertGuildIds.filter(id => id !== String(guildId));
        saveConfig();
        return reply(`✅ تم حذف السيرفر ${guildId} من الاشعارات.`);
    }

    if (lower === 'اشعار قائمة') {
        return reply(`📋 السيرفرات المراقبة: ${config.alertGuildIds.length ? config.alertGuildIds.join(' | ') : 'لا يوجد'}`);
    }

    if (text.startsWith('ايقاف ارسال ') || text.startsWith('توقيف ارسال ') || text.startsWith('وقف ارسال ')) {
        const value = text.replace(/^(ايقاف ارسال|توقيف ارسال|وقف ارسال)\s+/i, '').trim();
        if (!isValidId(value)) return reply('❌ الصيغة: ايقاف ارسال [آيدي_الروم]');
        const channelId = String(value);
        if (!config.disabledSendChannels.includes(channelId)) {
            config.disabledSendChannels.push(channelId);
            saveConfig();
            return reply(`⏸️ تم ايقاف الإرسال في الروم ${channelId}.`);
        }
        return reply('⚠️ الإرسال موقوف مسبقاً في هذا الروم.');
    }

    if (text.startsWith('تشغيل ارسال ') || text.startsWith('تفعيل ارسال ')) {
        const value = text.replace(/^(تشغيل ارسال|تفعيل ارسال)\s+/i, '').trim();
        if (!isValidId(value)) return reply('❌ الصيغة: تشغيل ارسال [آيدي_الروم]');
        config.disabledSendChannels = config.disabledSendChannels.filter(id => id !== String(value));
        saveConfig();
        return reply(`▶️ تم تفعيل الإرسال في الروم ${value}.`);
    }

    if (lower === 'ارسال متوقف' || lower === 'قائمة ارسال') {
        return reply(`📋 الرومات الموقوفة: ${config.disabledSendChannels.length ? config.disabledSendChannels.join(' | ') : 'لا يوجد'}`);
    }

    if (lower === 'الخطة باء') {
        if (isPlanBRunning) return reply('⚠️ الخطة باء مفعلة مسبقاً.');
        startPlanB();
        return reply('🚀 تم تشغيل الخطة باء كل 2.5 ثانية.');
    }

    if (lower === 'ايقاف الخطة باء') {
        if (!isPlanBRunning) return reply('⚠️ الخطة باء متوقفة مسبقاً.');
        stopPlanB();
        return reply('🛑 تم إيقاف الخطة باء.');
    }

    if (lower === 'قنوات' || lower === 'التشانل' || lower === 'ق') {
        return reply(
            '📋 القنوات الحالية:\n' +
            `- task1 : ${config.task1Channel}\n` +
            `- task2 : ${config.task2Channel}\n` +
            `- task3 : ${config.task3Channel}\n` +
            `- task4 : ${config.task4Channel}\n` +
            `- planB : ${config.planBChannel}\n` +
            `- afk : ${config.afkChannelId}\n` +
            `- control : ${config.controlChannelId}\n` +
            `- custom : ${config.customTaskChannel}\n` +
            `- custom list : ${config.customTaskChannels.join(' | ')}`
        );
    }

    if (lower === 'تعديل') {
        return reply(
            '🛠️ تعديل القنوات/الرسائل:\n' +
            '• تعديل قناة 1 123456789\n' +
            '• تعديل قناة afk 123456789\n' +
            '• تعديل قناة custom 123456789\n' +
            '• تعديل رسالة 1 مرحبا\n' +
            '• تعديل رسالة custom مرحبا\n' +
            '• تعديل عدد 1 10\n' +
            '• تعديل مؤقت مخصص 6000\n' +
            '• تعديل قائمة مخصصة 123 | 456 | 789\n' +
            '• تشغيل مخصصة\n' +
            '• ايقاف مخصصة'
        );
    }

    if (text.startsWith('تعديل قناة ')) {
        const parts = text.replace('تعديل قناة ', '').trim().split(/\s+/);
        const key = parts[0];
        const value = parts[1];
        if (!value || !isValidId(value)) return reply('❌ الصيغة: تعديل قناة [1/2/3/4/ب/afk/control/custom] [آيدي]');

        const map = {
            '1': 'task1Channel',
            '2': 'task2Channel',
            '3': 'task3Channel',
            '4': 'task4Channel',
            'ب': 'planBChannel',
            'باء': 'planBChannel',
            'afk': 'afkChannelId',
            'control': 'controlChannelId',
            'custom': 'customTaskChannel'
        };

        const field = map[key.toLowerCase()] || map[key] || map[key.toLowerCase()];
        if (!field) return reply('❌ المفتاح غير معروف. استخدم 1/2/3/4/ب/afk/control/custom');
        config[field] = value;
        if (field === 'customTaskChannel') config.customTaskChannels = [value];
        saveConfig();
        return reply(`✅ تم تحديث ${field} إلى ${value}`);
    }

    if (text.startsWith('تعديل رسالة ')) {
        const trimmed = text.replace('تعديل رسالة ', '').trim();
        const firstSpace = trimmed.indexOf(' ');
        const key = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
        const value = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();
        if (!value) return reply('❌ الصيغة: تعديل رسالة [1/2/3/4/ب/custom] [النص]');

        const map = {
            '1': 'task1Msg',
            '2': 'task2Msg',
            '3': 'task3Msgs',
            '4': 'task4Msg',
            'ب': 'planBMsg',
            'باء': 'planBMsg',
            'custom': 'customTaskMsg'
        };

        const field = map[key] || map[key.toLowerCase()];
        if (!field) return reply('❌ المفتاح غير معروف. استخدم 1/2/3/4/ب/custom');
        if (field === 'task3Msgs') {
            config.task3Msgs = value.split('|').map(v => v.trim()).filter(Boolean);
        } else {
            config[field] = value;
        }
        saveConfig();
        return reply(`✅ تم تحديث الرسالة ${key} بنجاح.`);
    }

    if (text.startsWith('تعديل عدد ')) {
        const parts = text.replace('تعديل عدد ', '').trim().split(/\s+/);
        const key = parts[0];
        const value = parseInt(parts[1]);
        if (!key || Number.isNaN(value)) return reply('❌ الصيغة: تعديل عدد [1/2/3/4] [رقم]');
        if (key === '1') config.task1Count = value;
        else if (key === '2') config.task2Count = value;
        else if (key === '3') config.task3Count = value;
        else if (key === '4') config.task4Count = value;
        else return reply('❌ المفتاح غير معروف.');
        saveConfig();
        return reply(`✅ تم ضبط العدد ${key} على ${value}.`);
    }

    if (text.startsWith('تعديل مؤقت مخصص')) {
        const value = parseInt(text.replace('تعديل مؤقت مخصص', '').trim());
        if (Number.isNaN(value)) return reply('❌ الصيغة: تعديل مؤقت مخصص [ميلي ثانية]');
        config.customTaskIntervalMs = Math.max(1500, value);
        saveConfig();
        return reply(`✅ تم تحديث المؤقت المخصص إلى ${config.customTaskIntervalMs}ms.`);
    }

    if (text.startsWith('تعديل قائمة مخصصة ')) {
        const value = text.replace('تعديل قائمة مخصصة ', '').trim();
        const list = value.split('|').map(v => v.trim()).filter(Boolean);
        if (list.length === 0) return reply('❌ استخدم: تعديل قائمة مخصصة 123 | 456 | 789');
        config.customTaskChannels = list;
        if (!config.customTaskChannels.includes(config.customTaskChannel)) {
            config.customTaskChannel = list[0];
        }
        saveConfig();
        return reply(`✅ تم تحديث قائمة القنوات المخصصة: ${list.join(' | ')}`);
    }

    if (lower === 'تشغيل مخصصة') {
        config.customTaskEnabled = true;
        startCustomTask();
        saveConfig();
        return reply('✅ تم تفعيل المهمة المخصصة.');
    }

    if (lower === 'ايقاف مخصصة') {
        config.customTaskEnabled = false;
        stopCustomTask();
        saveConfig();
        return reply('🛑 تم إيقاف المهمة المخصصة.');
    }

    if (text.startsWith('مسح')) {
        const parts = text.split(/\s+/);
        const count = parseInt(parts[1]);
        const channelId = parts[2];
        if (!count || !channelId || !isValidId(channelId)) return reply('❌ الصيغة: مسح [عدد] [آيدي_الروم]');
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isText()) return reply('❌ الروم غير موجود أو ليس نصي');
            const fetched = await channel.messages.fetch({ limit: 100 });
            const myMsgs = fetched.filter(m => m.author && m.author.id === client.user.id).first(count);
            if (!myMsgs || myMsgs.length === 0) return reply('⚠️ ما في رسائل مني في هذا الروم.');
            let deleted = 0;
            for (const msg of myMsgs) {
                await msg.delete().catch(() => {});
                deleted++;
                await wait(1000);
            }
            return reply(`✅ تم حذف ${deleted} رسالة من الروم ${channelId}.`);
        } catch (err) {
            console.error('❌ خطأ في المسح:', err);
            return reply('❌ حدث خطأ أثناء المسح.');
        }
    }

    if (text.startsWith('لعبة ')) {
        const value = text.replace('لعبة ', '').trim();
        if (!value) return reply('❌ استخدم: لعبة [اسم اللعبة]');
        setPresenceActivity('game', value);
        return reply(`🎮 تم تغيير اللعبة إلى: **${value}**`);
    }

    if (text.startsWith('سبوتيفاي ')) {
        const value = text.replace('سبوتيفاي ', '').trim();
        const parts = value.split('-');
        if (parts.length < 2) return reply('❌ استخدم: سبوتيفاي اسم الأغنية - اسم الفنان');
        setPresenceActivity('spotify', parts[0].trim(), parts[1].trim());
        return reply(`🎵 تم ضبط سبوتيفاي: **${parts[0].trim()} - ${parts[1].trim()}**`);
    }

    if (lower === 'نجاح' || lower === 'نعم') {
        return reply('✅ تم الاستلام.');
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    if (isBotRunning && isVoiceActive && newState.channelId !== config.afkChannelId) {
        setTimeout(connectToVoice, 3000);
    }
});

if (process.env.token) {
    client.login(process.env.token).catch((err) => {
        console.error('❌ فشل تسجيل الدخول إلى الديسكورد:', err.message || err);
    });
} else {
    console.log('⚠️ لم يتم تعيين token، لا يمكن تشغيل البوت.');
}
