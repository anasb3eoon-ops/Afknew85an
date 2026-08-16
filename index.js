require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات من متغيرات البيئة (Railway) ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;

// دالة مساعدة لعمل تأخير (Delay)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- نظام طابور الرسائل (Queue) لمنع أي تعارض أو سبام ---
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
        // فاصل آمني ثابث بين أي رسالة وأخرى في البوت بالكامل
        await wait(2000); 
    }

    isProcessingQueue = false;
};

// دالة لإضافة رسالة إلى الطابور
const queueMessage = (channelId, content) => {
    messageQueue.push({ channelId, content });
    processQueue();
};

// دالة للانضمام إلى الروم الصوتي
const connectToVoice = () => {
    if (!GUILD_ID || !AFK_CHANNEL_ID) {
        console.error("❌ خطأ: يرجى التأكد من إضافة GUILD_ID و AFK_CHANNEL_ID في متغيرات ريلاي (Railway Variables).");
        return;
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error("❌ لم يتم العثور على السيرفر، يرجى التأكد من صحة GUILD_ID");
        return;
    }

    try {
        joinVoiceChannel({
            channelId: AFK_CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
        console.log(`🎙️ تم الدخول إلى روم الـ AFK بنجاح.`);
    } catch (error) {
        console.error("❌ حدث خطا أثناء الدخول للروم الصوتي:", error);
    }
};

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول بنجاح كـ : ${client.user.tag}`);

    // الدخول للروم الصوتي عند التشغيل
    connectToVoice();

    // ----------------------------------------------------
    // 1. الروم الأول: 1507460885583626351 (كل نصف ساعة - 10 رسائل)
    // ----------------------------------------------------
    setInterval(() => {
        for (let i = 0; i < 10; i++) {
            queueMessage("1507460885583626351", "!ذكريات");
        }
        console.log("⏰ جدول الروم الأول: تمت إضافة 10 رسائل !ذكريات إلى الطابور.");
    }, 30 * 60 * 1000);

    // ----------------------------------------------------
    // 2. الروم الثاني: 1497214787493433545 (كل نصف ساعة - بخشيش)
    // ----------------------------------------------------
    setInterval(() => {
        queueMessage("1497214787493433545", "بخشيش");
        console.log("⏰ جدول الروم الثاني: تمت إضافة رسالة بخشيش إلى الطابور.");
    }, 30 * 60 * 1000);

    // ----------------------------------------------------
    // 3. الروم الثالث: 1505231947574546472 (كل 50 دقيقة - عمل، جريمة، رصيد)
    // ----------------------------------------------------
    setInterval(() => {
        queueMessage("1505231947574546472", "!عمل");
        queueMessage("1505231947574546472", "!جريمة");
        queueMessage("1505231947574546472", "!رصيد");
        console.log("⏰ جدول الروم الثالث: تمت إضافة الأوامر الثلاثة إلى الطابور.");
    }, 50 * 60 * 1000);

    // ----------------------------------------------------
    // 4. الروم الرابع: 1505231949629882508 (كل نصف ساعة - هجوم)
    // ----------------------------------------------------
    setInterval(() => {
        queueMessage("1505231949629882508", "!هجوم <@998040612047691827>");
        console.log("⏰ جدول الروم الرابع: تمت إضافة أمر الهجوم إلى الطابور.");
    }, 30 * 60 * 1000);
});

// ميزة الإعادة التلقائية عند الخروج أو التجميع/السحب من الروم الصوتي
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id)
    return;

    if (newState.channelId !== AFK_CHANNEL_ID) {
        console.log("⚠️ تم رصد تغيير في الروم الصوتي (خروج أو نقل). إرجاع الحساب بعد 3 ثوانٍ...");

        setTimeout(() => {
            connectToVoice();
        }, 3000);
    }
});

client.login(process.env.token);
