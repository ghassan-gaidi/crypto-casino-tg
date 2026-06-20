const { Bot, webhookCallback } = require('grammy');
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
bot.command('start', async (ctx) => { await ctx.reply('✅ bot alive'); });
module.exports = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_SECRET_TOKEN,
});
