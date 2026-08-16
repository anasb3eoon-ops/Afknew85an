require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let messageQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
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
        await wait(2000); // الفاصل العام بين أي رسالة وأخرى في البوت
    }
    isProcessingQueue = false;
};

const queueMessage = (channelId, content) => {
    messageQueue.push({ channelId, content });
    processQueue();
};

// --- المهام ---
const runTask1 = async () => {
    for (let i = 0; i < 10; i++) {
        queueMessage("1507460885583626351", "!ذكريات");
        await wait(4000); // 4 ثوانٍ لكل رسالة ذكريات
    }
};

const runTask2 = () => {
    queueMessage("1497214787493433545", "بخشيش");
};

const runTask3 = () => {
    queueMessage("1505231947574546472", "!عمل");
    queueMessage("1505231947574546472", "!جريمة");
    queueMessage("1505231947574546472", "!رصيد");
};

const runTask4 = () => {
    queueMessage("1505231949629882508", "!هجوم <@998040612047691827>");
};

const connectToVoice = () => {
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

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول كـ : ${client.user.tag}`);
    connectToVoice();

    // تنفيذ فوري
    runTask1();
    runTask2();
    runTask3();
    runTask4();

    // تكرار المهام
    setInterval(runTask1, 30 * 60 * 1000);
    setInterval(runTask2, 30 * 60 * 1000);
    setInterval(runTask3, 50 * 60 * 1000);
    setInterval(runTask4, 30 * 60 * 1000);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    if (newState.channelId !== AFK_CHANNEL_ID) {
        setTimeout(connectToVoice, 3000);
    }
});

client.login(process.env.token);
