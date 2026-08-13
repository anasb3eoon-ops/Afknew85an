require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');

const client = new Client();

// --- المتغيرات ---
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

// --- دالة التأفيك والدخول الصوتي الذكي ---
const connectToVoiceChannel = async () => {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) return;
        
        const channel = guild.channels.cache.get(AFK_CHANNEL_ID);
        if (channel && channel.type === 'GUILD_STAGE_VOICE' || channel.type === 'GUILD_VOICE') {
            // استخدام الاتصال الداخلي المباشر للبسلف بوت لتجنب أخطاء حزم النظام
            await client.ws.send({
                op: 4,
                d: {
                    guild_id: GUILD_ID,
                    channel_id: AFK_CHANNEL_ID,
                    self_mute: true,
                    self_deaf: false
                }
            });
            console.log("🔊 [AFK SUCCESS]: تم التأفيك والدخول إلى الروم الصوتي بنجاح.");
        }
    } catch (error) {
        console.error("❌ [AFK ERROR]: حدث خطأ أثناء محاولة التأفيك الصوتي:", error);
    }
};

client.on('ready', async () => {
    console.log(`✅ [LOGIN SUCCESS]: تم تسجيل الدخول بنجاح كـ: ${client.user.tag}`);
    
    setTimeout(() => {
        connectToVoiceChannel();
        startSmartRotation();
    }, 5000);
});

// --- نظام التناوب الذكي (كل 3 ثواني رسالة) ---
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
    }, 3000); // القاعدة الأساسية: حركة كل 3 ثواني
};

process.on('unhandledRejection', error => {
    console.error('❌ [UNHANDLED REJECTION]: خطأ غير معالج:', error);
});

client.login(token);
