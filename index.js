require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- التأكد من قراءة المتغيرات وتسجيل أي نقص في الـ Logs ---
const token = process.env.token || process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;
const MEMORIES_CHANNEL_ID = process.env.MEMORIES_CHANNEL_ID;
const ECONOMY_CHANNEL_ID = process.env.ECONOMY_CHANNEL_ID;
const TASBEEH_CHANNEL_ID = process.env.TASBEEH_CHANNEL_ID;
const TASBEEH_RANDOM_CHANNEL_ID = process.env.TASBEEH_RANDOM_CHANNEL_ID;

if (!token) {
    console.error("❌ [CRITICAL ERROR]: متغير الـ token غير موجود في ريلواي!");
}
if (!GUILD_ID || !AFK_CHANNEL_ID) {
    console.error("❌ [ERROR]: يرجى التأكد من إضافة GUILD_ID و AFK_CHANNEL_ID.");
}

// دالة للانضمام إلى الروم الصوتي مع تسجيل الأخطاء
const connectToVoice = () => {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.log(`⚠️ [VOICE]: لم يتم العثور على السيرفر برقم ID: ${GUILD_ID} حتى الآن، جاري إعادة المحاولة...`);
            return;
        }
        joinVoiceChannel({
            channelId: AFK_CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
        console.log(`🔊 [VOICE SUCCESS]: تم الدخول إلى روم الـ AFK بنجاح.`);
    } catch (error) {
        console.error("❌ [VOICE ERROR]: حدث خطأ أثناء محاولة الدخول للروم الصوتي:", error);
    }
};

client.on('ready', async () => {
    console.log(`✅ [LOGIN SUCCESS]: تم تسجيل الدخول بنجاح كـ: ${client.user.tag}`);
    
    // تأخير بسيط لضمان تحميل الكاش للسيرفرات
    setTimeout(() => {
        connectToVoice();
        startSmartRotation();
    }, 5000);
});

// نظام التناوب الذكي مع طباعة الأخطاء في الـ Logs بدقة
const startSmartRotation = async () => {
    let economyTimer = 0;
    let tasbeehTimer = 0;
    let randomTasbeehTimer = 0;

    console.log("⚙️ [SYSTEM]: تم تفعيل نظام التناوب الذكي للرسائل بنجاح.");

    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(GUILD_ID);
            if (!guild) return;

            // 1. روم التسبيح الرئيسي (كل 62 ثانية)
            if (Date.now() - tasbeehTimer > 62000) {
                if (TASBEEH_CHANNEL_ID) {
                    const channel = guild.channels.cache.get(TASBEEH_CHANNEL_ID);
                    if (channel) {
                        const msgs = await channel.messages.fetch({ limit: 5 });
                        let lastNum = 0;
                        msgs.forEach(m => {
                            const match = m.content.match(/\d+/);
                            if (match) lastNum = Math.max(lastNum, parseInt(match[0]));
                        });
                        await channel.send(`استغفر الله ${lastNum + 1}`);
                        console.log(`📿 [TASBEEH]: تم إرسال التسبيح برقم ${lastNum + 1}`);
                    } else {
                        console.log("⚠️ [WARNING]: روم التسبيح الرئيسي (TASBEEH_CHANNEL_ID) غير موجود أو غير مقروء.");
                    }
                }
                tasbeehTimer = Date.now();
                return;
            }

            // 2. روم التسبيح العشوائي (كل 5 ثواني)
            if (Date.now() - randomTasbeehTimer > 5000) {
                if (TASBEEH_RANDOM_CHANNEL_ID) {
                    const channel = guild.channels.cache.get(TASBEEH_RANDOM_CHANNEL_ID);
                    if (channel) {
                        const azkar = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله'];
                        const randomZikr = azkar[Math.floor(Math.random() * azkar.length)];
                        await channel.send(randomZikr);
                        console.log(`✨ [RANDOM TASBEEH]: تم إرسال (${randomZikr})`);
                    } else {
                        console.log("⚠️ [WARNING]: الروم العشوائي للتسبيح غير موجود.");
                    }
                }
                randomTasbeehTimer = Date.now();
                return;
            }

            // 3. روم الاقتصاد (!رصيد كل دقيقتين)
            if (Date.now() - economyTimer > 120000) {
                if (ECONOMY_CHANNEL_ID) {
                    const channel = guild.channels.cache.get(ECONOMY_CHANNEL_ID);
                    if (channel) {
                        await channel.send('!رصيد');
                        console.log("💰 [ECONOMY]: تم إرسال أمر !رصيد بنجاح.");
                    }
                }
                economyTimer = Date.now();
                return;
            }

            // 4. روم الذكريات (باقي الوقت)
            if (MEMORIES_CHANNEL_ID) {
                const memChannel = guild.channels.cache.get(MEMORIES_CHANNEL_ID);
                if (memChannel) {
                    await memChannel.send('!ذكريات');
                    console.log("📜 [MEMORIES]: تم إرسال أمر !ذكريات بنجاح.");
                }
            }

        } catch (error) {
            console.error("❌ [ROTATION ERROR]: حدث خطأ داخل حلقة الإرسال والتناوب:", error);
        }
    }, 3000); // كل 3 ثواني
};

// رصد الأخطاء العامة لكي لا ينطفئ البوت صامتاً
process.on('unhandledRejection', error => {
    console.error('❌ [UNHANDLED REJECTION]: خطأ غير معالج:', error);
});

client.login(token);
