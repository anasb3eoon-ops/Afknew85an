const keepAlive = require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const EventEmitter = require('events');

global.botEmitter = new EventEmitter();

const client = new Client();
const CONFIG_FILE = './bot_config.json';

let config = {
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

if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        config = { ...config, ...savedData };
    } catch (e) {
        console.error("❌ خطأ قراءة الملف:", e);
    }
}

const saveConfig = () => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {
        console.error("❌ خطأ حفظ الملف:", e);
    }
};

let isChatActive = true;
let isVoiceActive = true;
let isBotRunning = true;
let planBInterval = null;
let isPlanBRunning = false;

let stats = {
    totalSent: 0,
    task1CountLog: 0,
    task2CountLog: 0,
    task3CountLog: 0,
    task4CountLog: 0,
    planBCountLog: 0,
    lastActiveTime: "لا يوجد نشاط"
};

const syncState = () => {
    keepAlive.updateBotState({
        isRunning: isBotRunning,
        isChatActive,
        isVoiceActive,
        isPlanBRunning,
        stats,
        config
    });
};

const connectToVoice = (targetChannelId = null) => {
    if (!isBotRunning || !isVoiceActive || !config.guildId) return;
    const channelToJoin = targetChannelId || config.afkChannelId;
    if (!channelToJoin) return;

    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return;

    try {
        const existingConnection = getVoiceConnection(guild.id);
        if (existingConnection) existingConnection.destroy();

        joinVoiceChannel({
            channelId: channelToJoin,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
        console.log(`🔊 تم الاتصال بالروم: ${channelToJoin}`);
    } catch (e) { console.error("❌ خطأ اتصال صوتي:", e); }
};

// الاستماع لأوامر لوحة التحكم Web Dashboard
global.botEmitter.on('control', (action) => {
    if (action === 'bot') {
        isBotRunning = !isBotRunning;
        if (!isBotRunning) {
            const conn = getVoiceConnection(config.guildId);
            if (conn) conn.destroy();
        } else {
            connectToVoice();
        }
    } else if (action === 'voice') {
        isVoiceActive = !isVoiceActive;
        if (isVoiceActive) connectToVoice();
        else {
            const conn = getVoiceConnection(config.guildId);
            if (conn) conn.destroy();
        }
    } else if (action === 'planb') {
        isPlanBRunning = !isPlanBRunning;
    }
    syncState();
});

global.botEmitter.on('updateConfig', (newCfg) => {
    if (newCfg.afkChannelId) config.afkChannelId = newCfg.afkChannelId;
    if (newCfg.controlChannelId) config.controlChannelId = newCfg.controlChannelId;
    saveConfig();
    syncState();
});

global.botEmitter.on('updatePresence', (gameName) => {
    if (gameName && client.user) {
        client.user.setPresence({
            activities: [{ name: gameName, type: 'PLAYING' }],
            status: 'online'
        });
    }
});

client.on('ready', () => {
    console.log(`✅ تم تسجيل الدخول: ${client.user.tag}`);
    connectToVoice();
    syncState();
    setInterval(syncState, 5000);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    if (isBotRunning && isVoiceActive && newState.channelId !== config.afkChannelId) {
        setTimeout(connectToVoice, 3000);
    }
});

if (process.env.token) {
    client.login(process.env.token);
} else {
    console.log('⚠️ أضف متغير token لتشغيل البوت.');
}
