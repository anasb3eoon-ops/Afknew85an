require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// --- الإعدادات من متغيرات البيئة ورايلواي ---
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;
const BANK_BOT_ID = '1497214787493433545'; // آيدي بوت البنك المركزي
const BANK_CHANNEL_ID = '1497214787493433545'; // آيدي قناة البنك المحددة

// دالة للانضمام إلى الروم الصوتي
const connectToVoice = () => {
    if (!GUILD_ID || !AFK_CHANNEL_ID) return;
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    try {
        joinVoiceChannel({
            channelId: AFK_CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });
    } catch (error) {}
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// المحرك الذكي المطور (ينتظر ولا ينتقل لشيء حتى ينتهي الراتب إن وجد)
let isSolvingSalary = false;

const startSmartFarm = async (channel) => {
    console.log(`🧠 [المحرك الذكي]: بدأ العمل في قناة البنك...`);
    await channel.send('رصيد');
    await sleep(3000);

    while (true) {
        try {
            // إذا كان البوت يحل لغز الراتب حالياً، ننتظر لكي لا يخربه
            if (isSolvingSalary) {
                await sleep(5000);
                continue;
            }

            console.log("💸 طلب البخشيش...");
            await channel.send('بخشيش');
            await sleep(4000);

            if (isSolvingSalary) continue;

            console.log("💰 طلب الراتب...");
            await channel.send('الراتب');
            await sleep(5000); // إعطاء فرصة لظهور الأزرار

            if (isSolvingSalary) continue;

            const randomGames = ['كراش', 'نرد', 'مخاطرة', 'ألوان', 'خمن'];
            const chosenGame = randomGames[Math.floor(Math.random() * randomGames.length)];
            
            console.log(`🎮 تجربة لعبة سريعة: ${chosenGame}`);
            await channel.send(chosenGame);
            await sleep(5000);

            console.log("⏳ [استراحة ذكية]: انتظار قليل لتجنب الحظر...");
            await sleep(90000); // استراحة دقيقة ونصف بين الدورات

        } catch (err) {
            await sleep(5000);
        }
    }
};

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول بنجاح كـ : ${client.user.tag}`);
    connectToVoice();

    const bankChannel = client.channels.cache.get(BANK_CHANNEL_ID);
    if (bankChannel) {
        setTimeout(() => startSmartFarm(bankChannel), 5000);
    }
});

// نظام التفاعل الذكي وفرز أزرار الأرقام للراتب
client.on('messageCreate', async (message) => {
    if (message.author.id !== BANK_BOT_ID || message.channel.id !== BANK_CHANNEL_ID) return;

    // فحص إذا كانت الرسالة تخص ترتيب الأرقام (الراتب)
    const content = message.content + ' ' + (message.embeds[0]?.description || '');
    if (content.includes('ترتيب الاعداد تصاعديا') || content.includes('الراتب')) {
        if (message.components && message.components.length > 0) {
            isSolvingSalary = true; // قفل المحرك لحين الانتهاء من حل أزرار الراتب
            console.log("🔢 [لغز الراتب]: تم رصد الأزرار، جاري الفرز التصاعدي والنقر...");

            try {
                // تجميع كل الأزرار الموجودة في كل الصفوف
                let allButtons = [];
                for (const row of message.components) {
                    for (const btn of row.components) {
                        if (btn && btn.label && !isNaN(btn.label)) {
                            allButtons.push({
                                customId: btn.customId,
                                value: parseInt(btn.label)
                            });
                        }
                    }
                }

                // فرز الأزرار تصاعدياً (من الأصغر إلى الأكبر)
                allButtons.sort((a, b) => a.value - b.value);

                console.log(`📊 الأرقام المرتبة: ${allButtons.map(b => b.value).join(', ')}`);

                // النقر على الأزرار بالترتيب الصحيح مع فاصل زمني بسيط وآمن
                for (const button of allButtons) {
                    await sleep(1200); // سرعة آمنة ودقيقة للنقر
                    await message.clickButton(button.customId).catch(() => {});
                    console.log(`✅ تم النقر على الرقم: ${button.value}`);
                }

                console.log("🎉 تم الانتهاء من ترتيب أزرار الراتب بنجاح!");
            } catch (e) {
                console.log("⚠️ حدث خطأ أثناء حل أزرار الراتب:", e);
            }

            isSolvingSalary = false; // فتح قفل المحرك ليعود لعمله العادي
            return;
        }
    }

    // تفاعل عام مع باقي الألعاب العادية
    if (message.components && message.components.length > 0 && !isSolvingSalary) {
        await sleep(1500);
        for (const row of message.components) {
            if (row.components && row.components.length > 0) {
                const targetButton = row.components[0];
                if (targetButton && targetButton.customId) {
                    try {
                        await message.clickButton(targetButton.customId);
                    } catch (e) {}
                }
            }
        }
    }
});

// ميزة الإعادة التلقائية للروم الصوتي
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;

    if (newState.channelId !== AFK_CHANNEL_ID) {
        setTimeout(() => {
            connectToVoice();
        }, 3000);
    }
});

client.login(process.env.token);
