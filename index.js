require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');

const client = new Client();

// --- سحب التوكن وروم التأفيك من متغيرات ريلواي ---
const token = process.env.token || process.env.TOKEN;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;

if (!token) {
    console.error("❌ [CRITICAL ERROR]: متغير الـ token غير موجود في ريلواي!");
}
if (!AFK_CHANNEL_ID) {
    console.error("❌ [CRITICAL ERROR]: متغير AFK_CHANNEL_ID غير موجود في ريلواي!");
}

// دالة الدخول الصوتي مع ميوت
const joinAfkVoice = async () => {
    try {
        for (const [guildId, guild] of client.guilds.cache) {
            const channel = guild.channels.cache.get(AFK_CHANNEL_ID);
            if (channel) {
                await client.ws.send({
                    op: 4,
                    d: {
                        guild_id: guildId,
                        channel_id: AFK_CHANNEL_ID,
                        self_mute: true,  // تفعيل الميوت
                        self_deaf: false
                    }
                });
                console.log(`🔊 [AFK SUCCESS]: تم التأفيك بنجاح في الروم (${AFK_CHANNEL_ID}) مع ميوت.`);
                break;
            }
        }
    } catch (error) {
        console.error("❌ [AFK ERROR]: حدث خطأ أثناء محاولة التأفيك:", error);
    }
};

client.on('ready', async () => {
    console.log(`✅ [LOGIN SUCCESS]: تم تسجيل الدخول بنجاح كـ: ${client.user.tag}`);
    setTimeout(joinAfkVoice, 4000);
});

// --- ميزة إعادة الدخول خلال ثانيتين لو تم سحبك أو نقلك ---
client.on('voiceStateUpdate', (oldState, newState) => {
    // التأكد أن الحدث يخص حسابك الشخصي (البوت)
    if (oldState.id !== client.user.id) return;

    // إذا كان البوت كان في روم وتم نقله أو إخراجه منه
    if (oldState.channelId && !newState.channelId) {
        console.log("⚠️ [AFK NOTICE]: تم إخراجك أو سحبك من روم التأفيك! جاري العودة خلال ثانيتين...");
        setTimeout(() => {
            joinAfkVoice();
        }, 2000);
    }
});

process.on('unhandledRejection', error => {
    console.error('❌ [UNHANDLED REJECTION]: خطأ غير معالج:', error);
});

client.login(token);
