require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const ytdl = require('ytdl-core');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') console.log('Ziyumi Beatz Bot is Online!');
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // Menu
        if (text === '.menu') {
            await sock.sendMessage(from, { text: "*Ziyumi Beatz Bot*\n\n1. .aiimg [desc] - Generate Image\n2. .yt [url] - Download Music\n3. .price - Price List" });
        }

        // AI Image
        if (text.startsWith('.aiimg ')) {
            const prompt = text.replace('.aiimg ', '');
            try {
                const response = await axios.post('https://api.openai.com/v1/images/generations', 
                    { prompt, n: 1, size: "1024x1024" },
                    { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } }
                );
                await sock.sendMessage(from, { image: { url: response.data.data[0].url } });
            } catch (e) { await sock.sendMessage(from, { text: "Error generating image." }); }
        }

        // YT Downloader
        if (text.startsWith('.yt ')) {
            const url = text.replace('.yt ', '');
            try {
                const stream = ytdl(url, { quality: 'highestaudio' });
                await sock.sendMessage(from, { audio: { stream: stream }, mimetype: 'audio/mpeg' });
            } catch (e) { await sock.sendMessage(from, { text: "Invalid link!" }); }
        }

        // Price List
        if (text === '.price') {
            await sock.sendMessage(from, { text: "Drill Beat: 2000 LKR\nTrap Beat: 1500 LKR\nFull Track: 5000 LKR" });
        }
    });
}

startBot();
