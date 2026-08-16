require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');

const client = new Client();

// --- ملف الحفظ الدائم (Persistent Storage) ---
const CONFIG_FILE = './bot_config.json';

let config = {
    guildId: process.env.GUILD_ID,
    afkChannelId: process.env.AFK_CHANNEL_ID || "1496645738086531194",
    controlChannelId: "1538406310327091260",
    
    task1Channel: "1507460885583626351",
    task1Msg: "!ذكريات",
    task1Count: 10,

    task2Channel: "1497214787493433545",
    task2Msg: "بخشيش",

    task3Channel: "1505231947574546472",
    task3Msgs: ["!عمل", "!جريمة", "!رصيد"],

    task4Channel: "1505231949629882508",
    task4Msg: "!هجوم <@998040612047691827>",

    // الخطة باء
    planBChannel: "1503150255594799205",
    planBMsg: "يا شباب جمعو نقاط"
};

// تحميل الإعدادات المحفوظة إن وجدت
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        config = { ...config, ...savedData };
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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isChatActive = true;
let isVoiceActive = true;
let isBotRunning = true;

// مؤقت ومتحكم الخطة باء
let planBInterval = null;
let isPlanBRunning = false;

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
    queueMessage(config.task2Channel, config.task2Msg);
    stats.task2CountLog++;
};

const runTask3 = () => {
    if (!isBotRunning || !isChatActive) return;
    config.task3Msgs.forEach(msg => {
        queueMessage(config.task3Channel, msg);
        stats.task3CountLog++;
    });
};

const runTask4 = () => {
    if (!isBotRunning || !isChatActive) return;
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

// --- نظام تغيير الحالات والألعاب (Rich Presence) ---
const setPresenceActivity = (type, name, details = null) => {
    try {
        if (type === 'spotify') {
            // محاكاة سبوتيفاي بشكل احترافي
            client.user.setPresence({
                activities: [{
                    name: 'Spotify',
                    type: 'LISTENING',
                    details: name, // اسم الأغنية (مثلاً: أمل حياتي)
                    state: details // اسم الفنان (مثلاً: أم كلثوم)
                }],
                status: 'online'
            });
        } else {
            // العاب (مثل فالورانت، فورتنايت، إلخ)
            let activityType = 'PLAYING';
            if (type === 'streaming') activityType = 'STREAMING';
            if (type === 'watching') activityType = 'WATCHING';
            
            client.user.setPresence({
                activities: [{
                    name: name,
                    type: activityType
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

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول كـ : ${client.user.tag}`);
    connectToVoice();
    
    // الحالة الافتراضية عند التشغيل
    setPresenceActivity('game', 'Valorant');

    runTask1();
    runTask2();
    runTask3();
    runTask4();

    scheduleNextTask(runTask1, 26, 34);
    scheduleNextTask(runTask2, 26, 34);
    scheduleNextTask(runTask3, 44, 56);
    scheduleNextTask(runTask4, 26, 34);
});

// --- نظام التحكم والفلترة الذكية للمنشنات والردود ---
client.on('messageCreate', async (message) => {
    
    // 1. فلتر المنشنات والردود الذكي (للأشخاص فقط وبدون بوتات ولا @everyone)
    if (message.author.id !== client.user.id && !message.author.bot) {
        
        // التحقق من عدم وجود تاغ عام
        const hasEveryone = message.mentions.everyone;
        if (!hasEveryone) {
            const isMentioned = message.mentions.has(client.user);
            let isReplied = false;

            if (message.reference && message.reference.messageId) {
                try {
                    const repliedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
                    if (repliedMsg && repliedMsg.author && repliedMsg.author.id === client.user.id) {
                        isReplied = true;
                    }
                } catch (e) {}
            }

            // إذا كان منشن شخصي حقيقي أو رد مباشر على رسالتك
            if (isMentioned || isReplied) {
                try {
                    const controlChannel = await client.channels.fetch(config.controlChannelId);
                    if (controlChannel && controlChannel.isText()) {
                        const typeStr = isMentioned ? "🔔 **منشن شخصي جديد!**" : "💬 **رد جديد على رسالتك!**";
                        await controlChannel.send(
                            `${typeStr}\n` +
                            `- **اسم الشخص:** \`${message.author.tag}\` (آيدي: \`${message.author.id}\`)\n` +
                            `- **الروم:** <#${message.channel.id}>\n` +
                            `- **الرسالة:** \`${message.content}\``
                        );
                    }
                } catch (err) {
                    console.error("❌ خطأ في إرسال إشعار التاغات:", err);
                }
            }
        }
    }

    // 2. أوامر التحكم الخاصة بجروب التحكم فقط
    if (message.author.id !== client.user.id || message.channel.id !== config.controlChannelId) return;
    
    const text = message.content.trim();
    const parts = text.split(" ");
    const cmd = text.toLowerCase();

    if (cmd === 'اوامر' || cmd === 'لوحة') {
        await message.reply(`🎛️ **لوحة التحكم المتقدمة:**\n\n` +
            `🔹 \`تشغيل\` / \`ايقاف\`\n` +
            `🔹 \`ايقاف كتابة\` / \`ايقاف صوت\`\n` +
            `🔹 \`حالة\` - عرض الإحصائيات الكاملة وسجل العمليات\n` +
            `🔹 \`الخطة باء\` - تفعيل إرسال نقاط مكثف (كل 2.5 ثانية)\n` +
            `🔹 \`ايقاف الخطة باء\` - إيقاف الخطة باء فوراً\n` +
            `🔹 \`مسح [العدد] [الايدي]\` - مسح آخر رسائلك من روم معين\n` +
            `🔹 \`حالة الألعاب\` - لعرض قائمة الألعاب والحالات المتاحة للتفعيل 🎮`);
    }
    else if (cmd === 'حالة الألعاب' || cmd === 'ألعاب') {
        await message.reply(`🎮 **قائمة الألعاب والحالات الفخمة للبروفايل:**\n\n` +
            `استخدم الأوامر التالية لتغيير مظهرك فوراً:\n` +
            `🔹 \لعبة فالورانت\` -> \`لعبة Valorant\`\n` +
            `🔹 \`لعبة فورتنايت\` -> \`لعبة Fortnite\`\n` +
            `🔹 \`لعبة ماينكرافت\` -> \`لعبة Minecraft\`\n` +
            `🔹 \`لعبة روبلوكس\` -> \`لعبة Roblox\`\n` +
            `🔹 \`سبوتيفاي أم كلثوم\` -> \`تشغيل أغنية أم كلثوم (أمل حياتي)\`\n` +
            `🔹 \`سبوتيفاي [اسم الأغنية] - [اسم الفنان]\` -> مخصص بالكامل\n` +
            `*(مثال: \`سبوتيفاي يامسهرني - أم كلثوم\`)*`);
    }
    else if (cmd === 'لعبة فالورانت') {
        setPresenceActivity('game', 'Valorant');
        await message.reply("🎮 تم تغيير حالتك في البروفايل إلى: **Playing Valorant**");
    }
    else if (cmd === 'لعبة فورتنايت') {
        setPresenceActivity('game', 'Fortnite');
        await message.reply("🎮 تم تغيير حالتك في البروفايل إلى: **Playing Fortnite**");
    }
    else if (cmd === 'لعبة ماينكرافت') {
        setPresenceActivity('game', 'Minecraft');
        await message.reply("🎮 تم تغيير حالتك في البروفايل إلى: **Playing Minecraft**");
    }
    else if (cmd === 'لعبة روبلوكس') {
        setPresenceActivity('game', 'Roblox');
        await message.reply("🎮 تم تغيير حالتك في البروفايل إلى: **Playing Roblox**");
    }
    else if (cmd === 'سبوتيفاي أم كلثوم' || cmd === 'سبوتيفاي ام كلثوم') {
        setPresenceActivity('spotify', 'أمل حياتي', 'أم كلثوم');
        await message.reply("🎵 تم تشغيل سبوتيفاي في بروفايلك: **Listening to أم كلثوم - أمل حياتي**");
    }
    else if (text.startsWith("سبوتيفاي ")) {
        const spotifyArgs = text.replace("سبوتيفاي", "").trim();
        const splitSong = spotifyArgs.split("-");
        if (splitSong.length >= 2) {
            const songName = splitSong[0].trim();
            const artistName = splitSong[1].trim();
            setPresenceActivity('spotify', songName, artistName);
            await message.reply(`🎵 تم تحديث سبوتيفاي: **Listening to ${artistName} - ${songName}**`);
        } else {
            await message.reply("❌ الصيغة غير صحيحة. استخدم: `سبوتيفاي اسم الأغنية - اسم الفنان`");
        }
    }
    else if (cmd === 'تشغيل') {
        isBotRunning = true;
        isChatActive = true;
        isVoiceActive = true;
        connectToVoice();
        await message.reply("🟢 تم تشغيل البوت واستعادة كافة الوظائف.");
    }
    else if (cmd === 'ايقاف') {
        isBotRunning = false;
        stopPlanB();
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
    else if (cmd === 'الخطة باء') {
        if (isPlanBRunning) {
            await message.reply("⚠️ الخطة باء مفعلة مسبقاً!");
            return;
        }
        await message.reply(`🚀 جاري تفعيل **الخطة باء** (رسالة كل 2.5 ثانية) في روم النقاط (\`${config.planBChannel}\`)....`);
        startPlanB();
    }
    else if (cmd === 'ايقاف الخطة باء') {
        if (!isPlanBRunning) {
            await message.reply("⚠️ الخطة باء متوقفة أساساً!");
            return;
        }
        stopPlanB();
        await message.reply("🛑 تم إيقاف **الخطة باء** بنجاح.");
    }
    else if (text.startsWith("مسح")) {
        const count = parseInt(parts[1]);
        const targetChannelId = parts[2];

        if (!count || !targetChannelId) {
            await message.reply("❌ الصيغة غير صحيحة. استخدم: `مسح [العدد] [آيدي_الروم]`");
            return;
        }

        try {
            const channel = await client.channels.fetch(targetChannelId);
            if (!channel || !channel.isText()) {
                await message.reply("❌ الروم غير موجود أو ليس روم نصي!");
                return;
            }

            const fetchedMessages = await channel.messages.fetch({ limit: 100 });
            const myMessages = fetchedMessages.filter(m => m.author.id === client.user.id).first(count);

            if (myMessages.length === 0) {
                await message.reply("⚠️ لم أجد أي رسائل مرسولة لي في هذا الروم.");
                return;
            }

            let deletedCount = 0;
            for (const msg of myMessages) {
                await msg.delete().catch(() => {});
                deletedCount++;
                await wait(1500);
            }

            await message.reply(`✅ تم بنجاح حذف آخر (${deletedCount}) رسالة من الروم <#${targetChannelId}>.`);
        } catch (e) {
            console.error("❌ خطأ أثناء مسح الرسائل:", e);
            await message.reply("❌ حدث خطأ أثناء محاولة مسح الرسائل، تأكد من الصلاحيات.");
        }
    }
    else if (cmd === 'حالة') {
        await message.reply(`📊 **تقرير الحالة والإحصائيات الشامل:**\n` +
            `- الحالة العامة: ${isBotRunning ? '🟢 يعمل' : '🔴 متوقف'}\n` +
            `- الكتابة التلقائية: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}\n`+
            `- الصوت (التافيك): ${isVoiceActive ? '🟢 متصل' : '🔴 مفصول'}\n` +
            `- الخطة باء (كل 2.5 ث): ${isPlanBRunning ? '🟢 نشطة' : '🔴 متوقفة'}\n` +
            `- إجمالي الرسائل المرسلة: \`${stats.totalSent}\` رسالة\n` +
            `- نشاط الذكريات: \`${stats.task1CountLog}\` مرة\n` +
            `- نشاط البخشيش: \`${stats.task2CountLog}\` مرة\n` +
            `- نشاط العمل والجريمة: \`${stats.task3CountLog}\` مرة\n` +
            `- نشاط الخطة باء: \`${stats.planBCountLog}\` رسالة مرسلة\n` +
            `- آخر وقت نشاط: \`${stats.lastActiveTime}\``);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    if (isBotRunning && isVoiceActive && newState.channelId !== config.afkChannelId) {
        setTimeout(connectToVoice, 3000);
    }
});

client.login(process.env.token);
