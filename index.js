const keepAlive = require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const EventEmitter = require('events');

global.botEmitter = new EventEmitter();

const client = new Client();
const CONFIG_FILE = './bot_config.json';

const accountColors = ['#a89f9e', '#7a9b5a', '#8c7a68', '#5d7087', '#8d6d5f', '#7d5f95', '#77856d'];

const createDefaultAccount = (index = 1, preset = {}) => ({
    id: `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: preset.name || `الحساب ${index}`,
    token: preset.token || process.env.token || "",
    color: preset.color || accountColors[(index - 1) % accountColors.length],
    isPrimary: index === 1,
    guildId: preset.guildId || process.env.GUILD_ID || "",
    afkChannelId: preset.afkChannelId || process.env.AFK_CHANNEL_ID || "1496645738086531194",
    targetGuildId: preset.targetGuildId || process.env.TARGET_GUILD_ID || "1264561928034975775",

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

    customRooms: [],

    customTaskEnabled: false,
    customTaskChannels: ["1503150255594799205"],
    customTaskChannel: "1503150255594799205",
    customTaskMsg: "مرحبا شباب",
    customTaskIntervalMs: 6000
});

let config = {
    primaryAccountId: "",
    activeAccountId: "",
    accounts: []
};

const getActiveAccount = () => {
    if (!Array.isArray(config.accounts) || config.accounts.length === 0) {
        config.accounts = [createDefaultAccount(1)];
    }

    if (!config.primaryAccountId && config.accounts[0]) {
        config.primaryAccountId = config.accounts[0].id;
        config.accounts[0].isPrimary = true;
    }

    const selected = config.accounts.find(account => account.id === config.activeAccountId);
    if (selected) return selected;

    const primary = config.accounts.find(account => account.id === config.primaryAccountId) || config.accounts[0];
    config.activeAccountId = primary.id;
    return primary;
};

const syncActiveConfig = () => {
    const active = getActiveAccount();
    config.primaryAccountId = config.accounts[0]?.id || config.primaryAccountId || active.id;
    config.accounts = config.accounts.map((account, index) => {
        const normalized = { ...account };
        normalized.isPrimary = account.id === config.primaryAccountId || index === 0;
        normalized.color = normalized.color || accountColors[index % accountColors.length];
        if (normalized.isPrimary) config.primaryAccountId = normalized.id;
        return normalized;
    });
    Object.keys(active).forEach(key => {
        if (key !== 'id' && key !== 'name') config[key] = active[key];
    });
    config.activeAccountId = active.id;
};

if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        config = {
            ...config,
            ...savedData,
            accounts: Array.isArray(savedData.accounts) && savedData.accounts.length > 0 ? savedData.accounts : [createDefaultAccount(1)]
        };
    } catch (e) {
        console.error("❌ خطأ قراءة الملف:", e);
    }
}

if (!Array.isArray(config.accounts) || config.accounts.length === 0) {
    config.accounts = [createDefaultAccount(1)];
}
if (!config.primaryAccountId) {
    config.primaryAccountId = config.accounts[0].id;
    config.accounts[0].isPrimary = true;
}
if (!config.activeAccountId || !config.accounts.some(account => account.id === config.activeAccountId)) {
    config.activeAccountId = config.primaryAccountId || config.accounts[0].id;
}
syncActiveConfig();

const saveConfig = () => {
    try {
        const payload = {
            primaryAccountId: config.primaryAccountId,
            activeAccountId: config.activeAccountId,
            accounts: config.accounts.map(account => ({ ...account }))
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf8');
        syncActiveConfig();
    } catch (e) {
        console.error("❌ خطأ حفظ الملف:", e);
    }
};

let isChatActive = true;
let isVoiceActive = true;
let isBotRunning = true;
let isTaskRunning = true;
let planBInterval = null;
let isPlanBRunning = false;
let mainTaskLoop = null;
let task3Index = 0;

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
    const active = getActiveAccount();
    const profileView = { ...config, ...active, activeAccountId: config.activeAccountId, accounts: config.accounts };
    keepAlive.updateBotState({
        isRunning: isBotRunning,
        isChatActive,
        isVoiceActive,
        isPlanBRunning,
        isTaskRunning,
        stats,
        config: profileView
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
    } else if (action === 'chat') {
        isChatActive = !isChatActive;
    } else if (action === 'tasks') {
        isTaskRunning = !isTaskRunning;
        if (isTaskRunning) {
            startTaskLoops();
        }
    } else if (action === 'planb') {
        isPlanBRunning = !isPlanBRunning;
        if (isPlanBRunning) {
            startPlanBLoop();
        }
    }
    syncState();
});

global.botEmitter.on('updateConfig', (newCfg) => {
    if (newCfg.afkChannelId) config.afkChannelId = newCfg.afkChannelId;
    if (newCfg.targetGuildId) config.targetGuildId = newCfg.targetGuildId;
    saveConfig();
    syncState();
});

global.botEmitter.on('updateTasksConfig', (newCfg) => {
    const active = getActiveAccount();
    if (newCfg.token) active.token = newCfg.token;
    if (newCfg.guildId) active.guildId = newCfg.guildId;
    if (newCfg.afkChannelId) active.afkChannelId = newCfg.afkChannelId;
    if (newCfg.targetGuildId) active.targetGuildId = newCfg.targetGuildId;
    if (newCfg.task1Channel) active.task1Channel = newCfg.task1Channel;
    if (newCfg.task1Msg) active.task1Msg = newCfg.task1Msg;
    if (newCfg.task1Count) active.task1Count = parseInt(newCfg.task1Count) || 10;
    if (newCfg.task2Channel) active.task2Channel = newCfg.task2Channel;
    if (newCfg.task2Msg) active.task2Msg = newCfg.task2Msg;
    if (newCfg.task3Channel) active.task3Channel = newCfg.task3Channel;
    if (newCfg.task3Msgs) active.task3Msgs = Array.isArray(newCfg.task3Msgs) ? newCfg.task3Msgs : String(newCfg.task3Msgs).split(',').map(item => item.trim());
    if (newCfg.task4Channel) active.task4Channel = newCfg.task4Channel;
    if (newCfg.task4Msg) active.task4Msg = newCfg.task4Msg;
    if (newCfg.planBChannel) active.planBChannel = newCfg.planBChannel;
    if (newCfg.planBMsg) active.planBMsg = newCfg.planBMsg;
    if (newCfg.name) active.name = newCfg.name;
    Object.assign(config, active);
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

global.botEmitter.on('addCustomRoom', (roomData) => {
    const active = getActiveAccount();
    const newRoom = {
        channelId: roomData.channelId,
        message: roomData.message,
        interval: roomData.interval,
        active: true
    };
    active.customRooms.push(newRoom);
    Object.assign(config, active);
    saveConfig();
    syncState();
    console.log(`✅ تمت إضافة روم مخصص جديد في القناة: ${roomData.channelId}`);
});

global.botEmitter.on('deleteCustomRoom', (roomIdx) => {
    const active = getActiveAccount();
    if (active.customRooms[roomIdx]) {
        active.customRooms.splice(roomIdx, 1);
        delete customRoomIntervals[roomIdx];
        Object.assign(config, active);
        saveConfig();
        syncState();
        console.log(`✅ تم حذف الروم المخصص #${roomIdx + 1}`);
    }
});

global.botEmitter.on('toggleCustomRoom', (roomIdx) => {
    const active = getActiveAccount();
    if (active.customRooms[roomIdx]) {
        active.customRooms[roomIdx].active = !active.customRooms[roomIdx].active;
        Object.assign(config, active);
        saveConfig();
        syncState();
        console.log(`✅ تم ${active.customRooms[roomIdx].active ? 'تشغيل' : 'إيقاف'} الروم المخصص #${roomIdx + 1}`);
    }
});

const replyChatStatus = () => {
    return [
        `🔹 البوت: ${isBotRunning ? 'مفعّل' : 'موقف'}`,
        `🔹 الصوت: ${isVoiceActive ? 'مفعّل' : 'موقف'}`,
        `🔹 الكتابة: ${isChatActive ? 'مفعّلة' : 'موقفة'}`,
        `🔹 المهام: ${isTaskRunning ? 'مفعّلة' : 'موقفة'}`,
        `🔹 الخطة ب: ${isPlanBRunning ? 'مفعّلة' : 'موقفة'}`
    ].join('\n');
};

const sendChannelMessage = async (channelId, messageText, label) => {
    if (!channelId || !messageText) return false;
    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) return false;
        await channel.send(messageText);
        stats.totalSent += 1;
        stats.lastActiveTime = new Date().toLocaleString('ar-SA');
        console.log(`✅ ${label}: ${channelId}`);
        return true;
    } catch (e) {
        console.error(`❌ ${label}: ${channelId} - ${e.message}`);
        return false;
    }
};

const startPlanBLoop = () => {
    if (planBInterval) clearInterval(planBInterval);
    if (!isPlanBRunning) return;

    planBInterval = setInterval(async () => {
        if (!isBotRunning || !isChatActive || !isPlanBRunning) return;
        await sendChannelMessage(config.planBChannel, config.planBMsg, 'خطة ب');
        stats.planBCountLog += 1;
    }, 15000);
};

const startTaskLoops = () => {
    if (mainTaskLoop) clearInterval(mainTaskLoop);

    mainTaskLoop = setInterval(async () => {
        if (!isBotRunning || !isChatActive || !isTaskRunning) return;

        if (config.task1Channel && config.task1Msg) {
            await sendChannelMessage(config.task1Channel, config.task1Msg, 'مهمة 1');
            stats.task1CountLog += 1;
        }

        if (config.task2Channel && config.task2Msg) {
            await sendChannelMessage(config.task2Channel, config.task2Msg, 'مهمة 2');
            stats.task2CountLog += 1;
        }

        if (config.task3Channel && Array.isArray(config.task3Msgs) && config.task3Msgs.length > 0) {
            const msg = config.task3Msgs[task3Index % config.task3Msgs.length];
            await sendChannelMessage(config.task3Channel, msg, 'مهمة 3');
            stats.task3CountLog += 1;
            task3Index += 1;
        }

        if (config.task4Channel && config.task4Msg) {
            await sendChannelMessage(config.task4Channel, config.task4Msg, 'مهمة 4');
            stats.task4CountLog += 1;
        }
    }, 8000);
};

global.botEmitter.on('addAccount', (accountData) => {
    const newAccount = createDefaultAccount(config.accounts.length + 1, {
        name: accountData?.name || `الحساب ${config.accounts.length + 1}`,
        token: accountData?.token || '',
        guildId: accountData?.guildId || '',
        afkChannelId: accountData?.afkChannelId || '',
        targetGuildId: accountData?.targetGuildId || '',
        color: accountData?.color || accountColors[config.accounts.length % accountColors.length]
    });
    newAccount.isPrimary = false;
    config.accounts.push(newAccount);
    config.activeAccountId = newAccount.id;
    if (!config.primaryAccountId) config.primaryAccountId = config.accounts[0].id;
    syncActiveConfig();
    saveConfig();
    syncState();
    console.log(`✅ تم إضافة حساب جديد: ${newAccount.name}`);
});

global.botEmitter.on('selectAccount', (accountId) => {
    if (!config.accounts.some(account => account.id === accountId)) return;
    config.activeAccountId = accountId;
    syncActiveConfig();
    saveConfig();
    syncState();
    console.log(`✅ تم اختيار الحساب: ${getActiveAccount().name}`);
});

global.botEmitter.on('deleteAccount', (accountId) => {
    if (config.accounts.length <= 1) {
        console.log('⚠️ لا يمكن حذف الحساب الأخير');
        return;
    }
    const deletedPrimary = config.accounts.find(account => account.id === accountId && account.isPrimary);
    config.accounts = config.accounts.filter(account => account.id !== accountId);
    if (deletedPrimary) {
        config.primaryAccountId = config.accounts[0].id;
    }
    config.activeAccountId = config.primaryAccountId || config.accounts[0].id;
    syncActiveConfig();
    saveConfig();
    syncState();
    console.log('✅ تم حذف الحساب');
});

client.on('ready', () => {
    console.log(`✅ تم تسجيل الدخول: ${client.user.tag}`);
    connectToVoice();
    startTaskLoops();
    startPlanBLoop();
    syncState();
    setInterval(syncState, 5000);
    
    // بدء تشغيل الـ Custom Rooms
    startCustomRooms();
});

client.on('messageCreate', async (message) => {
    if (!message || !message.content || message.author.id !== client.user.id) return;

    const text = message.content.trim();
    const command = text.toLowerCase();

    if (command === '!status' || command === 'حالة' || command === 'status') {
        await message.reply(replyChatStatus());
        return;
    }

    if (command === '!stop' || command === '!off' || command === 'ايقاف' || command === 'ايقاف تشغيل' || command === 'stop' || command === 'off') {
        isBotRunning = false;
        isTaskRunning = false;
        isVoiceActive = false;
        const conn = getVoiceConnection(config.guildId);
        if (conn) conn.destroy();
        syncState();
        await message.reply('⏹️ تم إيقاف البوت بالكامل');
        return;
    }

    if (command === '!start' || command === '!on' || command === 'تشغيل' || command === 'start' || command === 'on') {
        isBotRunning = true;
        isTaskRunning = true;
        isVoiceActive = true;
        connectToVoice();
        startTaskLoops();
        syncState();
        await message.reply('▶️ تم تشغيل البوت');
        return;
    }

    if (command === '!voice off' || command === '!ايقاف صوت' || command === 'ايقاف صوت' || command === 'voice off') {
        isVoiceActive = false;
        const conn = getVoiceConnection(config.guildId);
        if (conn) conn.destroy();
        syncState();
        await message.reply('🔇 تم إيقاف الصوت');
        return;
    }

    if (command === '!voice on' || command === '!تشغيل صوت' || command === 'تشغيل صوت' || command === 'voice on') {
        isVoiceActive = true;
        connectToVoice();
        syncState();
        await message.reply('🔊 تم تشغيل الصوت');
        return;
    }

    if (command === '!chat off' || command === '!ايقاف كتابة' || command === 'ايقاف كتابة' || command === 'chat off') {
        isChatActive = false;
        syncState();
        await message.reply('📝 تم إيقاف الكتابة');
        return;
    }

    if (command === '!chat on' || command === '!تشغيل كتابة' || command === 'تشغيل كتابة' || command === 'chat on') {
        isChatActive = true;
        syncState();
        await message.reply('📝 تم تشغيل الكتابة');
        return;
    }

    if (command === '!tasks off' || command === '!ايقاف مهام' || command === 'ايقاف مهام') {
        isTaskRunning = false;
        syncState();
        await message.reply('🛑 تم إيقاف المهام');
        return;
    }

    if (command === '!tasks on' || command === '!تشغيل مهام' || command === 'تشغيل مهام') {
        isTaskRunning = true;
        startTaskLoops();
        syncState();
        await message.reply('▶️ تم تشغيل المهام');
        return;
    }

    if (command === '!planb off' || command === '!ايقاف خطة ب' || command === 'ايقاف خطة ب') {
        isPlanBRunning = false;
        if (planBInterval) clearInterval(planBInterval);
        syncState();
        await message.reply('🛑 تم إيقاف خطة ب');
        return;
    }

    if (command === '!planb on' || command === '!تشغيل خطة ب' || command === 'تشغيل خطة ب') {
        isPlanBRunning = true;
        startPlanBLoop();
        syncState();
        await message.reply('▶️ تم تشغيل خطة ب');
        return;
    }

    if (command === '!help' || command === 'اوامر' || command === 'commands') {
        await message.reply('الأوامر المتاحة:\n!status\n!stop\n!start\n!voice off\n!voice on\n!chat off\n!chat on\n!tasks off\n!tasks on\n!planb off\n!planb on');
    }
});

const customRoomIntervals = {};

const startCustomRooms = () => {
    // إنشء interval لكل روم مخصص
    const checkCustomRooms = async () => {
        if (!isBotRunning || !isChatActive) return;
        
        for (let i = 0; i < config.customRooms.length; i++) {
            const room = config.customRooms[i];
            if (!room || !room.active) continue;
            
            if (!customRoomIntervals[i]) {
                customRoomIntervals[i] = 0;
            }
            
            customRoomIntervals[i]++;
            
            // إذا وصلنا للوقت المحدد، أرسل الرسالة
            if (customRoomIntervals[i] >= room.interval) {
                try {
                    const channel = client.channels.cache.get(room.channelId);
                    if (channel && channel.isTextBased()) {
                        await channel.send(room.message);
                        stats.totalSent++;
                        stats.lastActiveTime = new Date().toLocaleString('ar-SA');
                        console.log(`✅ تم إرسال رسالة من روم مخصص: ${room.channelId}`);
                    }
                } catch (e) {
                    console.error(`❌ خطأ إرسال رسالة في روم مخصص: ${room.channelId}`, e.message);
                }
                
                // إعادة تعيين العداد
                customRoomIntervals[i] = 0;
            }
        }
    };
    
    // تحقق كل ثانية
    setInterval(checkCustomRooms, 1000);
};

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
