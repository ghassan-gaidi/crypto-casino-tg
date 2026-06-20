const { Bot, webhookCallback } = require('grammy');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN required');

const bot = new Bot(botToken);

bot.command('start', async (ctx) => {
  await ctx.reply('Bot is alive! 🎉');
});

// Export for Vercel
module.exports = process.env.VERCEL_ENV
  ? webhookCallback(bot, 'std/http', {
      secretToken: process.env.TELEGRAM_SECRET_TOKEN,
    })
  : undefined;
