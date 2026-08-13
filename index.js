require('./keep_alive.js');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client();

// متغيرات البيئة من Railway
const GUILD_ID = process.env.GUILD_ID;
const AFK_CHANNEL_ID = process.env.AFK_CHANNEL_ID;
const MEMORIES_CHANNEL_ID = process.env.MEMORIES_CHANNEL_ID;
const ECONOMY_CHANNEL_ID = process.env.ECONOMY_CHANNEL_ID;
const TASBEEH_CHANNEL_ID = process.env.TASBEEH_CHANNEL_ID;
const TASBEEH_RANDOM_CHANNEL_ID = process.env.TASBEEH_RANDOM_CHANNEL_ID;

let lastActionTime = Date.now();

// وظيفة الدخول للصوتي
const connectToVoice = () => {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;
    joinVoiceChannel({
        channelId: AFK_CHANNEL_ID,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: true,
        selfDeaf: false
    });
};

client.on('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    connectToVoice();
    startSmartRotation();
});

// نظام التناوب الذكي (رسالة كل 3 ثواني كحد أقصى)
const startSmartRotation = async () => {
    let economyTimer = 0;
    let tasbeehTimer = 0;
    let randomTasbeehTimer = 0;

    setInterval(async () => {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) return;

        // 1. روم التسبيح (كل 62 ثانية)
        if (Date.now() - tasbeehTimer > 62000) {
            const channel = guild.channels.cache.get(TASBEEH_CHANNEL_ID);
            const msgs = await channel.messages.fetch({ limit: 5 });
            let lastNum = 0;
            msgs.forEach(m => {
                const match = m.content.match(/\d+/);
                if (match) lastNum = Math.max(lastNum, parseInt(match[0]));
            });
            await channel.send(`استغفر الله ${lastNum + 1}`);
            tasbeehTimer = Date.now();
            return; // انتهاء الدور
        }

        // 2. روم التسبيح الإضافي (كل 5 ثواني)
        if (Date.now() - randomTasbeehTimer > 5000) {
            const channel = guild.channels.cache.get(TASBEEH_RANDOM_CHANNEL_ID);
            const azkar = ['سبحان الله', 'الحمد لله', 'الله أكبر'];
            await channel.send(azkar[Math.floor(Math.random() * azkar.length)]);
            randomTasbeehTimer = Date.now();
            return;
        }

        // 3. روم الاقتصاد (!رصيد كل دقيقتين، !عمل و !جريمة كل ساعة)
        if (Date.now() - economyTimer > 120000) {
            const channel = guild.channels.cache.get(ECONOMY_CHANNEL_ID);
            await channel.send('!رصيد');
            economyTimer = Date.now();
            return;
        }

        // 4. روم الذكريات (باقي الوقت)
        const memChannel = guild.channels.cache.get(MEMORIES_CHANNEL_ID);
        await memChannel.send('!ذكريات');

    }, 3000); // القاعدة الذهبية: رسالة كل 3 ثواني
};

client.login(process.env.token);
