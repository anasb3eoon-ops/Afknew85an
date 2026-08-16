require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;
const CONTROL_CHANNEL_ID = "1538406310327091260"; // آيدي جروب التحكم الخاص بك

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// متغيرات حالة التحكم
let isChatActive = true;
let isVoiceActive = true;
let isBotRunning = true;

// دالة لتوليد وقت عشوائي لمنع الشك (تجنب الحظر)
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
        await wait(2000); // الفاصل العام للأوامر الأخرى
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
    for (let i = 0; i < 10; i++) {
        if (!isBotRunning || !isChatActive) break;
        try {
            const channel = await client.channels.fetch("1507460885583626351");
            if (channel && channel.isText()) {
                await channel.send("!ذكريات");
                console.log(`📨 تم إرسال (!ذكريات) - رسالة رقم ${i + 1}`);
            }
        } catch (error) {
            console.error("❌ خطأ في إرسال ذكريات:", error);
        }
        if (i < 9) {
            await wait(4000);
        }
    }
};

const runTask2 = () => {
    if (!isBotRunning || !isChatActive) return;
    queueMessage("1497214787493433545", "بخشيش");
};

const runTask3 = () => {
    if (!isBotRunning || !isChatActive) return;
    queueMessage("1505231947574546472", "!عمل");
    queueMessage("1505231947574546472", "!جريمة");
    queueMessage("1505231947574546472", "!رصيد");
};

const runTask4 = () => {
    if (!isBotRunning || !isChatActive) return;
    queueMessage("1505231949629882508", "!هجوم <@998040612047691827>");
};

const connectToVoice = () => {
    if (!isBotRunning || !isVoiceActive) return;
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;
    try {
        joinVoiceChannel({
            channelId: AFK_CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
    } catch (e) { console.error(e); }
};

// جداول مرنة للتكرار العشوائي
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

    // تنفيذ فوري عند التشغيل
    runTask1();
    runTask2();
    runTask3();
    runTask4();

    // جدولة تكرار عشوائي لكل مهمة (لتجنب الشك)
    scheduleNextTask(runTask1, 26, 34); // حول النصف ساعة (26 إلى 34 دقيقة)
    scheduleNextTask(runTask2, 26, 34); // حول النصف ساعة
    scheduleNextTask(runTask3, 44, 56); // حول الـ 50 دقيقة (44 إلى 56 دقيقة)
    scheduleNextTask(runTask4, 26, 34); // حول النصف ساعة
});

// --- نظام التحكم الآمن عبر الجروب الخاص فقط ---
client.on('messageCreate', async (message) => {
    // التأكد من أن الرسالة صادرة منك أنت، وفي جروب التحكم المخصص فقط
    if (message.author.id !== client.user.id || message.channel.id !== CONTROL_CHANNEL_ID) return;

    const content = message.content.trim();

    if (content === '!أوامر') {
        await message.reply(`🤖 **لوحة تحكم البوت:**\n\n` +
            `🔹 \`!ايقاف\` - إيقاف البوت بالكامل\n` +
            `🔹 \`!تشغيل\` - تشغيل البوت بالكامل\n` +
            `🔹 \`!إيقاف_الكتابة\` - إيقاف الأوامر والرسائل فقط وإبقاء الصوت\n` +
            `🔹 \`!إيقاف_الصوت\` - إيقاف الاتصال الصوتي وإبقاء الكتابة\n` +
            `🔹 \`!حالة\` - معرفة حالة البوت الحالية`);
    } 
    else if (content === '!ايقاف') {
        isBotRunning = false;
        await message.reply("🔴 تم إيقاف البوت بالكامل.");
    } 
    else if (content === '!تشغيل') {
        isBotRunning = true;
        isChatActive = true;
        isVoiceActive = true;
        connectToVoice();
        await message.reply("🟢 تم تشغيل البوت واستعادة كافة الوظائف.");
    } 
    else if (content === '!إيقاف_الكتابة') {
        isChatActive = false;
        await message.reply("⚠️ تم إيقاف الكتابة التلقائية والأوامر، والصوت مستمر.");
    } 
    else if (content === '!إيقاف_الصوت') {
        isVoiceActive = false;
        await message.reply("⚠️ تم إيقاف البقاء بالروم الصوتي، والكتابة التلقائية مستمرة.");
    } 
    else if (content === '!حالة') {
        await message.reply(`📊 **حالة البوت الحالية:**\n` +
            `- الحالة العامة: ${isBotRunning ? '🟢 يعمل' : '🔴 متوقف'}\n` +
            `- الكتابة التلقائية: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}\n` +
            `- الروم الصوتي (AFK): ${isVoiceActive ? '🟢 متصل' : '🔴 مفصول'}`);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    if (isBotRunning && isVoiceActive && newState.channelId !== AFK_CHANNEL_ID) {
        setTimeout(connectToVoice, 3000);
    }
});

client.login(process.env.token);
