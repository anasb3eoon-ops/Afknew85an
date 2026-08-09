require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات من متغيرات البيئة (Railway) ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;

// دالة للانضمام إلى الروم الصوتي
const connectToVoice = () => {
    if (!GUILD_ID || !AFK_CHANNEL_ID) {
        console.error("❌ خطأ: يرجى التأكد من إضافة GUILD_ID و AFK_CHANNEL_ID في متغيرات ريلواي (Railway Variables).");
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
        console.log(`🔊 تم الدخول إلى روم الـ AFK بنجاح.`);
    } catch (error) {
        console.error("❌ حدث خطأ أثناء الدخول للروم الصوتي:", error);
    }
};

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول بنجاح كـ: ${client.user.tag}`);
    
    // الدخول للروم الصوتي عند التشغيل
    connectToVoice();
});

// ميزة الإعادة التلقائية عند الخروج أو التجميع/السحب
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;

    if (newState.channelId !== AFK_CHANNEL_ID) {
        console.log("⚠️ تم رصد تغيير في الروم الصوتي (خروج أو نقل). إرجاع الحساب بعد 3 ثوانٍ...");
        
        setTimeout(() => {
            connectToVoice();
        }, 3000);
    }
});

client.login(process.env.token);
