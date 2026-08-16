require('./keep_alive.js');
const { Client, MessageActionRow, MessageButton } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات والذاكرة الحية (تستطيع تعديلها بالكامل من الأوامر أدناه) ---
let config = {
    guildId: process.env.GUILD_ID,
    afkChannelId: process.env.AFK_CHANNEL_ID,
    controlChannelId: "1538406310327091260",
    
    // المهام والرسائل والرومات الخاصة بها
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

const connectToVoice = () => {
    if (!isBotRunning || !isVoiceActive || !config.guildId || !config.afkChannelId) return;
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return;
    try {
        joinVoiceChannel({
            channelId: config.afkChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
    } catch (e) { console.error(e); }
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

// --- واجهة الأزرار التفاعلية ---
client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id || message.channel.id !== config.controlChannelId) return;

    const content = message.content.trim().toLowerCase();

    if (content === 'اوامر' || content === 'لوحة') {
        const row1 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('btn_start').setLabel('تشغيل البوت').setStyle('SUCCESS'),
                new MessageButton().setCustomId('btn_stop').setLabel('ايقاف البوت').setStyle('DANGER'),
                new MessageButton().setCustomId('btn_status').setLabel('حالة البوت').setStyle('SECONDARY')
            );

        const row2 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('btn_toggle_chat').setLabel('ايقاف الكتابة التلقائية').setStyle('PRIMARY'),
                new MessageButton().setCustomId('btn_toggle_voice').setLabel('ايقاف الصوت').setStyle('PRIMARY'),
                new MessageButton().setCustomId('btn_settings').setLabel('عرض الإعدادات').setStyle('SECONDARY')
            );

        await message.reply({
            content: `🎛️ **لوحة التحكم الرئيسية**\nاختر أحد الخيارات أدناه أو اكتب \`تعليمات\` لمعرفة طريقة تعديل الرومات والرسائل:`,
            components: [row1, row2]
        });
    }
    else if (content === 'تعليمات') {
        await message.reply(`📜 **طريقة تعديل الرومات والرسائل طيران (بدون كود):**\n\n` +
            `🔹 **لتعديل روم الصوت:** \`تعديل صوت [الايدي]\`\n` +
            `🔹 **لتعديل روم الذكريات:** \`تعديل روم ذكريات [الايدي]\`\n` +
            `🔹 **لتعديل نص الذكريات:** \`تعديل ذكريات [النص]\`\n` +
            `🔹 **لتعديل روم البخشيش:** \`تعديل روم بخشيش [الايدي]\`\n` +
            `🔹 **لتعديل نص البخشيش:** \`تعديل بخشيش [النص]\`\n` +
            `🔹 **لتعديل روم العمل والجريمة:** \`تعديل روم عمل [الايدي]\`\n` +
            `🔹 **لتعديل روم الهجوم:** \`تعديل روم هجوم [الايدي]\`\n` +
            `🔹 **لتعديل نص الهجوم:** \`تعديل هجوم [النص الجديد]\``);
    }
});

// التعامل مع الأزرار
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.channelId !== config.controlChannelId) return;

    if (interaction.customId === 'btn_stop') {
        isBotRunning = false;
        await interaction.reply({ content: "🔴 تم ايقاف البوت بالكامل.", ephemeral: false });
    } 
    else if (interaction.customId === 'btn_start') {
        isBotRunning = true;
        isChatActive = true;
        isVoiceActive = true;
        connectToVoice();
        await interaction.reply({ content: "🟢 تم تشغيل البوت واستعادة كافة الوظائف.", ephemeral: false });
    } 
    else if (interaction.customId === 'btn_toggle_chat') {
        isChatActive = !isChatActive;
        await interaction.reply({ content: `⚠️ حالة الكتابة أصبحت: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}`, ephemeral: false });
    } 
    else if (interaction.customId === 'btn_toggle_voice') {
        isVoiceActive = !isVoiceActive;
        if(isVoiceActive) connectToVoice();
        await interaction.reply({ content: `⚠️ حالة الصوت أصبحت: ${isVoiceActive ? '🟢 متصل' : '🔴 مفصول'}`, ephemeral: false });
    } 
    else if (interaction.customId === 'btn_status') {
        await interaction.reply({
            content: `📊 **حالة البوت الحالية:**\n` +
                `- الحالة العامة: ${isBotRunning ? '🟢 يعمل' : '🔴 متوقف'}\n` +
                `- الكتابة التلقائية: ${isChatActive ? '🟢 مفعلة' : '🔴 متوقفة'}\n` +
                `- الصوت: ${isVoiceActive ? '🟢 متصل' : '🔴 مفصول'}`,
            ephemeral: false
        });
    }
    else if (interaction.customId === 'btn_settings') {
        await interaction.reply({
            content: `⚙️ **الإعدادات الحالية:**\n` +
                `- روم الصوت: \`${config.afkChannelId}\`\n` +
                `- روم الذكريات: \`${config.task1Channel}\` (الرسالة: ${config.task1Msg})\n` +
                `- روم البخشيش: \`${config.task2Channel}\` (الرسالة: ${config.task2Msg})\n` +
                `- روم العمل: \`${config.task3Channel}\`\n` +
                `- روم الهجوم: \`${config.task4Channel}\` (الرسالة: ${config.task4Msg})\n` +
                `*(اكتب \`تعليمات\` لمعرفة كيفية التعديل)*`,
            ephemeral: false
        });
    }
});

// --- نظام الأوامر النصية لتعديل جميع الرومات والرسائل طيران بدون همزات أو شرطات ---
client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id || message.channel.id !== config.controlChannelId) return;
    
    const text = message.content.trim();
    const parts = text.split(" ");
    const cmd = parts[0] + " " + (parts[1] || ""); // دمج أول كلمتين للتحقق من الأمر

    // 1. تعديل روم الصوت
    if (text.startsWith("تعديل صوت") && parts[2]) {
        config.afkChannelId = parts[2];
        connectToVoice();
        await message.reply(`✅ تم تحديث روم الصوت إلى: \`${parts[2]}\``);
    }
    // 2. تعديل روم الذكريات
    else if (text.startsWith("تعديل روم ذكريات") && parts[3]) {
        config.task1Channel = parts[3];
        await message.reply(`✅ تم تحديث روم الذكريات إلى: \`${parts[3]}\``);
    }
    // 3. تعديل نص الذكريات
    else if (text.startsWith("تعديل ذكريات")) {
        const newVal = text.replace("تعديل ذكريات", "").trim();
        if (newVal) {
            config.task1Msg = newVal;
            await message.reply(`✅ تم تحديث نص الذكريات إلى: \`${newVal}\``);
        }
    }
    // 4. تعديل روم البخشيش
    else if (text.startsWith("تعديل روم بخشيش") && parts[3]) {
        config.task2Channel = parts[3];
        await message.reply(`✅ تم تحديث روم البخشيش إلى: \`${parts[3]}\``);
    }
    // 5. تعديل نص البخشيش
    else if (text.startsWith("تعديل بخشيش")) {
        const newVal = text.replace("تعديل بخشيش", "").trim();
        if (newVal) {
            config.task2Msg = newVal;
            await message.reply(`✅ تم تحديث نص البخشيش إلى: \`${newVal}\``);
        }
    }
    // 6. تعديل روم العمل والجريمة
    else if (text.startsWith("تعديل روم عمل") && parts[3]) {
        config.task3Channel = parts[3];
        await message.reply(`✅ تم تحديث روم العمل إلى: \`${parts[3]}\``);
    }
    // 7. تعديل روم الهجوم
    else if (text.startsWith("تعديل روم هجوم") && parts[3]) {
        config.task4Channel = parts[3];
        await message.reply(`✅ تم تحديث روم الهجوم إلى: \`${parts[3]}\``);
    }
    // 8. تعديل نص الهجوم
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
