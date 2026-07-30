// ═══════════════════════════════════════════════════════
//  Vercel Serverless Function — Telegram Proxy
//  Bot token is NEVER exposed to the client.
// ═══════════════════════════════════════════════════════

const BOT_TOKEN = '8085476726:AAECfjxBBG6-iCrvnq-gn7O3yIaMCoLT0g';
// 🔐 PRODUCTION: Use environment variable instead:
//    process.env.BOT_TOKEN   (set in Vercel Dashboard)

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default async function handler(req, res) {
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    try {
        const { type, chatId, text, data, caption } = req.body;

        if (!chatId) {
            return res.status(400).json({ ok: false, error: 'Missing chatId' });
        }

        switch (type) {
            // ── Text message ──────────────────────────────────
            case 'text': {
                const params = new URLSearchParams({
                    chat_id: chatId,
                    text: (text || '').substring(0, 4000)
                });
                const tgRes = await fetch(`${TELEGRAM_API}/sendMessage?${params}`, { method: 'GET' });
                const tgData = await tgRes.json();
                return res.status(tgRes.ok ? 200 : 502).json(tgData);
            }

            // ── Photo (base64) ────────────────────────────────
            case 'photo': {
                if (!data) {
                    return res.status(400).json({ ok: false, error: 'Missing photo data' });
                }
                const buffer = Buffer.from(data, 'base64');
                const formData = new FormData();
                formData.append('chat_id', chatId);
                formData.append('photo', new Blob([buffer], { type: 'image/jpeg' }), 'photo.jpg');
                if (caption) formData.append('caption', (caption || '').substring(0, 1024));

                const tgRes = await fetch(`${TELEGRAM_API}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                });
                const tgData = await tgRes.json();
                return res.status(tgRes.ok ? 200 : 502).json(tgData);
            }

            // ── Video (base64) ────────────────────────────────
            case 'video': {
                if (!data) {
                    return res.status(400).json({ ok: false, error: 'Missing video data' });
                }
                const buffer = Buffer.from(data, 'base64');
                const formData = new FormData();
                formData.append('chat_id', chatId);
                formData.append('video', new Blob([buffer], { type: 'video/webm' }), 'video.webm');
                if (caption) formData.append('caption', (caption || '').substring(0, 1024));

                const tgRes = await fetch(`${TELEGRAM_API}/sendVideo`, {
                    method: 'POST',
                    body: formData
                });
                const tgData = await tgRes.json();
                return res.status(tgRes.ok ? 200 : 502).json(tgData);
            }

            default:
                return res.status(400).json({ ok: false, error: `Unknown type: ${type}` });
        }
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
    }
}
