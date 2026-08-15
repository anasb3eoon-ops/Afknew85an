require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات من متغيرات البيئة (Railway) ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;
const BANK_BOT_ID = '1497214787493433545'; // آيدي بوت البنك المركزي

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

// المحرك الذكي الحقيقي (يتأقلم مع أوقات الانتظار ولا يرسل رسائل عبثية)
const startSmartFarm = async (channel) => {
    console.log("🧠 [المحرك الذكي]: بدأ العمل، جاري فحص الرصيد والأوقات...");
    
    // أول خطوة: فحص الرصيد ووقت الألعاب
    await channel.send('رصيد');
    await sleep(3000);
    await channel.send('وقت');
    await sleep(4000);

    while (true) {
        try {
            // نبدأ بالأوامر الأساسية لجمع الكاش من الصفر (بخشيش + راتب)
            console.log("💸 محاولة جمع البخشيش...");
            await channel.send('بخشيش');
            await sleep(4000);

            console.log("💰 محاولة طلب الراتب...");
            await channel.send('الراتب');
            await sleep(4000);

            // تجربة الألعاب السريعة لرفع الرصيد
            const randomGames = ['كراش', 'نرد', 'مخاطرة', 'ألوان', 'خمن'];
            const chosenGame = randomGames[Math.floor(Math.random() * randomGames.length)];
            
            console.log(`🎮 تجربة لعبة سريعة لجمع الفلوس: ${chosenGame}`);
            await channel.send(chosenGame);
            await sleep(5000);

            // في حال كانت كل الأوامر بكولداون، البوت يأخذ استراحة ذكية (مثلاً دقيقتين) 
            // لكي لا يزعج الشات أو يتعرض للحظر، ثم يعيد فحص الوقت تلقائياً.
            console.log("⏳ [استراحة ذكية]: انتظار قليل لتجنب الكولداون والحظر، ثم إعادة المحاولة...");
            await sleep(120000); // استراحة دقيقتين قبل الدورة القادمة
            
            // إعادة فحص الوقت لتحديث الذاكرة
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

    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        const textChannel = guild.channels.cache.find(c => c.type === 'GUILD_TEXT' && c.permissionsFor(client.user).has('SEND_MESSAGES'));
        if (textChannel) {
            console.log(`🎯 تم تحديد قناة العمل التلقائي: ${textChannel.name}`);
            setTimeout(() => startSmartFarm(textChannel), 5000);
        }
    }
});

// نظام التفاعل السريع مع الألعاب والرواتب (الضغط على الأزرار فور ظهورها)
client.on('messageCreate', async (message) => {
    if (message.author.id !== BANK_BOT_ID) return;

    // إذا ظهرت أزرار (مثل أزرار الراتب المرتبة، ألعاب الألوان، أو خيارات اللعبة)
    if (message.components && message.components.length > 0) {
        await sleep(1500); // انتظار بسيط لضمان ظهور الزر بشكل كامل

        for (const row of message.components) {
            if (row.components && row.components.length > 0) {
                // اختيار أول زر أو زر عشوائي حسب طبيعة اللعبة للضغط عليه بسرعة
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
