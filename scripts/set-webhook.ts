/**
 * Set the Telegram bot webhook URL.
 * Usage: TELEGRAM_BOT_TOKEN=xxx BOT_URL=https://your-domain.vercel.app/api/bot npx tsx scripts/set-webhook.ts
 */

const token = process.env.TELEGRAM_BOT_TOKEN
const url = process.env.BOT_URL

if (!token || !url) {
  console.error('Missing TELEGRAM_BOT_TOKEN or BOT_URL')
  process.exit(1)
}

async function main() {
  // Set webhook
  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret_token: process.env.TELEGRAM_SECRET_TOKEN,
        allowed_updates: ['message', 'callback_query'],
      }),
    },
  )
  const data = await res.json()
  console.log('setWebhook response:', JSON.stringify(data, null, 2))

  // Get webhook info
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  const infoData = await info.json()
  console.log('Webhook info:', JSON.stringify(infoData, null, 2))
}

main().catch(console.error)
