require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات والذاكرة الحية ---
let config = {
    guildId: process.env.GUILD_ID,
    afkChannelId: process.env.AFK_CHANNEL_ID,
    controlChannelId: "1538406310327091260",
    
    task1Channel: "1507460885583626351",
    task1Msg: "!ذكريات",
    task1Count: 10,

    task2Channel: "1497214787493433545",
    task2Msg: "بخشيش",

    task3Channel: "1505231947574546472",
    task3Msgs: ["!عمل", "!جريمة", "!رصيد"],

    task4Channel: "1505231949629882508",
    task4Msg: "!هجوم <@998040612047691827>"
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isChatActive = true;
let isVoiceActive = true;
let isBotRunning = true;

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
        try {
            const channel = await client.channels.fetch(task.channelId);
            if (channel && channel.isText()) {
                await channel.send(task.content);
                console.log(`📨 تم إرسال: (${task.content}) إلى الروم: ${task.channelId}`);
            }
        } catch (error) {
            console.error(`❌ خطأ في إرسال الرسالة إلى الروم ${task.channelId}:`, error);
        }
        await wait(2000); 
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
    for (let i = 0; i < config.task1Count; i++) {
        if (!isBotRunning || !isChatActive) break;
        try {
            const channel = await client.channels.fetch(config.task1Channel);
            if (channel && channel.isText()) {
                await channel.send(config.task1Msg);
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
    queueMessage(config.task2Channel, config.task2Msg);
};

const runTask3 = () => {
    if (!isBotRunning || !isChatActive) return;
    config.task3Msgs.forEach(msg => {
        queueMessage(config.task3Channel, msg);
    });
};

const runTask4 = () => {
    if (!isBotRunning || !isChatActive) return;
    queueMessage(config.task4Channel, config.task4Msg);
};

// دالة الاتصال الصوتي مع قطع الاتصال القديم أولاً (إصلاح مشكلة التافيك)
const connectToVoice = () => {
    if (!isBotRunning || !isVoiceActive || !config.guildId || !config.afkChannelId) return;
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return;
    try {
        // قطع الاتصال القديم إن وجد لمنع التعليق
        const existingConnection = getVoiceConnection(guild.id);
        if (existingConnection) {
            existingConnection.destroy();
        }

        joinVoiceChannel({
            channelId: config.afkChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
        console.log(`🔊 تم الاتصال بالروم الصوتي بنجاح: ${config.afkChannelId}`);
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

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول كـ : ${client.user.tag}`);
    connectToVoice();

    runTask1();
    runTask2();
    runTask3();
    runTask4();

    scheduleNextTask(runTask1, 26, 34);
    scheduleNextTask(runTask2, 26, 34);
    scheduleNextTask(runTask3, 44, 56);
    scheduleNextTask(runTask4, 26, 34);
});

// --- نظام التحكم النصي المطور والسريع (بدون أزرار وبدون همزات) ---
client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id || message.channel.id !== config.controlChannelId) return;
    
    const text = message.content.trim();
    const parts = text.split(" ");
    const cmd = text.toLowerCase();

    // 1. القائمة الرئيسية والأوامر
    if (cmd === 'اوامر' || cmd === 'لوحة') {
        await message.reply(`🎛️ **لوحة التحكم السريعة:**\n\n` +
            `🔹 \`تشغيل\` - تشغيل البوت بالكامل\n` +
            `🔹 \`ايقاف\` - ايقاف البوت بالكامل\n` +
            `🔹 \`ايقاف كتابة\` - ايقاف الرسائل التلقائية\n` +
            `🔹 \`ايقاف صوت\` - ايقاف التافيك الصوتي\n` +
            `🔹 \`حالة\` - عرض الحالة الحالية والإعدادات\n` +
            `🔹 \`تعليمات\` - معرفة طريقة تعديل الرومات والرسائل طيران`);
    }
    else if (cmd === 'تعليمات') {
        await message.reply(`📜 **طريقة تعديل الرومات والرسائل فوراً طيران:**\n\n` +
            `🔹 \`تعديل صوت [الايدي]\`\n` +
            `🔹 \`تعديل روم ذكريات [الايدي]\`\n` +
            `🔹 \`تعديل ذكريات [النص الجديد]\`\n` +
            `🔹 \`تعديل روم بخشيش [الايدي]\`\n` +
            `🔹 \`تعديل بخشيش [النص الجديد]\`\n` +
            `🔹 \`تعديل روم عمل [الايدي]\`\n` +
            `🔹 \`تعديل روم هجوم [الايدي]\`\n` +
            `🔹 \`تعديل هجوم [النص الجديد]\``);
    }
    // 2. التحكم بالحالة
    else if (cmd === 'تشغيل') {
        isBotRunning = true;
        isChatActive = true;
        isVoiceActive = true;
        connectToVoice();
        await message.reply("🟢 تم تشغيل البوت واستعادة كافة الوظائف.");
    }
    else if (cmd === 'ايقاف') {
        isBotRunning = false;
        const conn = getVoiceConnection(config.guildId);
        if (conn) conn.destroy();
        await message.reply("🔴 تم ايقاف البوت بالكامل وفصل الصوت.");
    }
    else if (cmd === 'ايقاف كتابة') {
        isChatActive = !isChatActive;
        await message.reply(`⚠️ حالة الكتابة أصبحت: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}`);
    }
    else if (cmd === 'ايقاف صوت') {
        isVoiceActive = !isVoiceActive;
        if (isVoiceActive) {
            connectToVoice();
            await message.reply("🟢 تم تفعيل الصوت والاتصال بالروم.");
        } else {
            const conn = getVoiceConnection(config.guildId);
            if (conn) conn.destroy();
            await message.reply("🔴 تم فصل الصوت وإيقافه.");
        }
    }
    else if (cmd === 'حالة') {
        await message.reply(`📊 **حالة الإعدادات والرومات الحالية:**\n` +
            `- الحالة العامة: ${isBotRunning ? '🟢 يعمل' : '🔴 متوقف'}\n` +
            `- الكتابة التلقائية: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}\n` +
            `- الصوت (التافيك): ${isVoiceActive ? '🟢 متصل' : '🔴 مفصول'}\n` +
            `- روم الصوت الحالي: \`${config.afkChannelId}\`\n` +
            `- روم الذكريات: \`${config.task1Channel}\` (${config.task1Msg})\n` +
            `- روم البخشيش: \`${config.task2Channel}\` (${config.task2Msg})\n` +
            `- روم العمل: \`${config.task3Channel}\`\n` +
            `- روم الهجوم: \`${config.task4Channel}\` (${config.task4Msg})`);
    }
    // 3. التعديلات الفورية للرومات والرسائل طيران
    else if (text.startsWith("تعديل صوت") && parts[2]) {
        config.afkChannelId = parts[2];
        connectToVoice();
        await message.reply(`✅ تم تحديث ونقل روم الصوت (التافيك) بنجاح إلى: \`${parts[2]}\``);
    }
    else if (text.startsWith("تعديل روم ذكريات") && parts[3]) {
        config.task1Channel = parts[3];
        await message.reply(`✅ تم تحديث روم الذكريات إلى: \`${parts[3]}\``);
    }
    else if (text.startsWith("تعديل ذكريات")) {
        const newVal = text.replace("تعديل ذكريات", "").trim();
        if (newVal) {
            config.task1Msg = newVal;
            await message.reply(`✅ تم تحديث نص الذكريات إلى: \`${newVal}\``);
        }
    }
    else if (text.startsWith("تعديل روم بخشيش") && parts[3]) {
        config.task2Channel = parts[3];
        await message.reply(`✅ تم تحديث روم البخشيش إلى: \`${parts[3]}\``);
    }
    else if (text.startsWith("تعديل بخشيش")) {
        const newVal = text.replace("تعديل بخشيش", "").trim();
        if (newVal) {
            config.task2Msg = newVal;
            await message.reply(`✅ تم تحديث نص البخشيش إلى: \`${newVal}\``);
        }
    }
    else if (text.startsWith("تعديل روم عمل") && parts[3]) {
        config.task3Channel = parts[3];
        await message.reply(`✅ تم تحديث روم العمل إلى: \`${parts[3]}\``);
    }
    else if (text.startsWith("تعديل روم هجوم") && parts[3]) {
        config.task4Channel = parts[3];
        await message.reply(`✅ تم تحديث روم الهجوم إلى: \`${parts[3]}\``);
    }
    else if (text.startsWith("تعديل هجوم")) {
        const newVal = text.replace("تعديل هجوم", "").trim();
        if (newVal) {
            config.task4Msg = newVal;
            await message.reply(`✅ تم تحديث نص الهجوم إلى: \`${newVal}\``);
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    if (isBotRunning && isVoiceActive && newState.channelId !== config.afkChannelId) {
        setTimeout(connectToVoice, 3000);
    }
});

client.login(process.env.token);
