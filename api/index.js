// api/index.js
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// متغیرهای محیطی
const botToken = process.env.TELEGRAM_BOT_TOKEN || '6429865327:AAE-2pEt3tq24CLR7XxWMwXvlDpRxE59te8';
const adminId = process.env.ADMIN_ID || '5059280908';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// اتصال به Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// ایجاد ربات
const bot = new Telegraf(botToken);

// تابع برای ذخیره و بازیابی تنظیمات
async function getSetting(key, defaultValue) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || defaultValue;
}

async function saveSetting(key, value) {
  await supabase
    .from('settings')
    .upsert({ key, value });
}

// دکمه‌ها
const buttonOfficial = {
  reply_markup: {
    keyboard: [
      [{ text: '🔯غیر فعال کردن حالت ادمین' }],
      [{ text: '⤴️پیام همگانی' }, { text: '🔧تنظیمات' }],
      [{ text: 'آمار' }],
    ],
    resize_keyboard: true,
  },
};

const buttonDokmeHa = {
  reply_markup: {
    keyboard: [
      [{ text: '📬پروفایل' }],
      [{ text: '☎️ارسال شماره شما', request_contact: true }],
    ],
    resize_keyboard: true,
  },
};

// دستور /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;
  const firstName = ctx.from.first_name || 'کاربر';
  const username = ctx.from.username ? `@${ctx.from.username}` : 'بدون یوزرنیم';

  const startText = await getSetting('start_text', 'Hi!✋ <code>Welcome To My Bot:)</code>');
  const msg = fromId === adminId
    ? 'به ربات خودتون خوش اومدین'
    : startText.replace('FIRSTNAME', firstName).replace('USERNAME', username);

  await ctx.reply(msg, {
    parse_mode: 'HTML',
    ...fromId === adminId ? buttonOfficial : buttonDokmeHa,
  });
});

// دستور بخش مدیریت
bot.hears('✴️بخش مدیریت', async (ctx) => {
  const fromId = ctx.from.id;
  if (fromId === adminId) {
    await saveSetting('command', 'none');
    await ctx.reply('✴️ به بخش مدیریت خوش آمدید!', {
      parse_mode: 'HTML',
      ...buttonOfficial,
    });
  }
});

// پاسخ به پیام‌های کاربران
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;
  const text = ctx.message.text;
  const firstName = ctx.from.first_name || 'کاربر';

  if (ctx.chat.type === 'private' && fromId !== adminId) {
    const pmResani = await getSetting('pm_resani', '✅');
    const sendText = await getSetting('send_text', '<b>Sent To My Admin!</b>');

    if (pmResani === '✅') {
      await ctx.telegram.sendMessage(adminId, `پیام از [${firstName}](tg://user?id=${fromId}):\n${text}`, {
        parse_mode: 'Markdown',
      });
      await ctx.reply(sendText, { parse_mode: 'HTML' });
    }
  }
});

// مدیریت Webhook
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling update:', error);
    res.status(500).send('Error');
  }
};

// راه‌اندازی Webhook (فقط برای تست محلی)
if (process.env.NODE_ENV !== 'production') {
  bot.launch();
}
