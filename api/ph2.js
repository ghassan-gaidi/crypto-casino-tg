"use strict";
const { Bot, webhookCallback } = require("grammy");
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
bot.command('start', async (ctx) => {
  await ctx.reply('✅ webhook alive');
});
const handler = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_SECRET_TOKEN,
});
// Wrap it in a plain async function so Vercel sees a clean handler
module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
