"use strict";
const { Bot, webhookCallback } = require("grammy");
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(botToken);
bot.command('start', async (ctx) => {
  await ctx.reply('✅ webhook handler alive');
});
module.exports = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_SECRET_TOKEN,
});
