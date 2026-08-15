require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات من متغيرات البيئة ورايلواي ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;
const BANK_BOT_ID = '1497214787493433545'; // آيدي بوت البنك المركزي
const BANK_CHANNEL_ID = '1497214787493433545'; // آيدي قناة البنك المحددة التي سيتم العمل فيها حصراً

// دالة للانضمام إلى الروم الصوتي والحفاظ على التواجد
const connectToVoice = () => {
    if (!GUILD_ID || !AFK_CHANNEL_ID) {
        console.error("❌ خطأ: يرجى التأكد من إضافة GUILD_ID و AFK_CHANNEL_ID في متغيرات ريلاي.");
        return;
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error("❌ لم يتم العثور على السيرفر.");
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
        console.error("❌ حدث خطأ أثناء الدخول للروم الصوتي:", error);
    }
};

// دالة تأخير آمنة
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// المحرك الذكي للعمل حصراً داخل قناة البنك المحددة
const startSmartFarm = async (channel) => {
    console.log(`🧠 [المحرك الذكي]: بدأ العمل حصراً في قناة البنك المحددة...`);
    
    // أول خطوة: فحص الرصيد ووقت الألعاب في غرفة البنك فقط
    await channel.send('رصيد');
    await sleep(3000);
    await channel.send('وقت');
    await sleep(4000);

    while (true) {
        try {
            console.log("💸 محاولة جمع البخشيش...");
            await channel.send('بخشيش');
            await sleep(4000);

            console.log("💰 محاولة طلب الراتب...");
            await channel.send('الراتب');
            await sleep(4000);

            const randomGames = ['كراش', 'نرد', 'مخاطرة', 'ألوان', 'خمن'];
            const chosenGame = randomGames[Math.floor(Math.random() * randomGames.length)];
            
            console.log(`🎮 تجربة لعبة سريعة: ${chosenGame}`);
            await channel.send(chosenGame);
            await sleep(5000);

            console.log("⏳ [استراحة ذكية]: انتظار قليل لتجنب الحظر، ثم إعادة المحاولة...");
            await sleep(120000); // استراحة دقيقتين لتجنب السبام
            
            await channel.send('وقت');
            await sleep(4000);

        } catch (err) {
            console.error("⚠️ خطأ بسيط في حلقة العمل، إعادة المحاولة...", err);
            await sleep(10000);
        }
    }
};

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول بنجاح كـ : ${client.user.tag}`);
    connectToVoice();

    // العثور على قناة البنك المحددة بدقة عبر الآيدي الذي أرسلته
    const bankChannel = client.channels.cache.get(BANK_CHANNEL_ID);
    if (bankChannel) {
        console.log(`🎯 تم العثور على قناة البنك بنجاح: ${bankChannel.name}`);
        setTimeout(() => startSmartFarm(bankChannel), 5000);
    } else {
        console.error("❌ لم يتم العثور على قناة البنك! تأكد أن الحساب موجود في السيرفر ولديه صلاحية رؤية هذه القناة.");
    }
});

// نظام التفاعل السريع مع الألعاب والرواتب في غرفة البنك حصراً
client.on('messageCreate', async (message) => {
    // التأكد أن الرسالة قادمة من بوت البنك وفي القناة المخصصة فقط
    if (message.author.id !== BANK_BOT_ID || message.channel.id !== BANK_CHANNEL_ID) return;

    if (message.components && message.components.length > 0) {
        await sleep(1500);

        for (const row of message.components) {
            if (row.components && row.components.length > 0) {
                const targetButton = row.components[0];
                
                if (targetButton && targetButton.customId) {
                    try {
                        await message.clickButton(targetButton.customId);
                        console.log(`⚡ [تفاعل فوري]: تم الضغط على زر اللعبة/الراتب بنجاح.`);
                    } catch (e) {
                        // تجاهل الخطأ إذا انتهى وقت الزر
                    }
                }
            }
        }
    }
});

// ميزة الإعادة التلقائية للروم الصوتي
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;

    if (newState.channelId !== AFK_CHANNEL_ID) {
        console.log("⚠️ تم رصد خروج من روم الـ AFK. إعادة الاتصال خلال 3 ثوانٍ...");
        setTimeout(() => {
            connectToVoice();
        }, 3000);
    }
});

client.login(process.env.token);
