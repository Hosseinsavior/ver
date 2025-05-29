// api/index.js
const { Telegraf } = require('telegraf');
const { supabase, initializeSettings, getSetting, saveSetting } = require('../lib/database');

// متغیرهای محیطی
const botToken = process.env.TELEGRAM_BOT_TOKEN || '5448614937:AAEBpW9HXTD5j6QEJcxdxtFwrdwnAWjTf20';
const adminId = process.env.ADMIN_ID || '5059280908';

// ایجاد ربات
const bot = new Telegraf(botToken);

// مقداردهی اولیه تنظیمات
initializeSettings();

// دکمه‌ها
const buttonOfficial = {
  reply_markup: {
    keyboard: [
      [{ text: '🔯غیر فعال کردن حالت ادمین' }],
      [{ text: '⤴️پیام همگانی' }, { text: '🔧تنظیمات' }],
      [{ text: 'آمار' }, { text: '📬پروفایل' }],
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

const buttonManage = {
  reply_markup: {
    keyboard: [[{ text: '✴️بخش مدیریت' }]],
    resize_keyboard: true,
  },
};

// تابع برای بررسی بلاک بودن کاربر
async function isUserBlocked(userId) {
  const { data } = await supabase
    .from('users')
    .select('is_blocked')
    .eq('user_id', userId)
    .single();
  return data?.is_blocked || false;
}

// دستور /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id.toString();
  const firstName = ctx.from.first_name || 'کاربر';
  const username = ctx.from.username ? `@${ctx.from.username}` : 'بدون یوزرنیم';

  // بررسی بلاک بودن کاربر
  if (await isUserBlocked(fromId)) {
    await ctx.reply('🚫 شما از ربات بلاک شده‌اید.', { parse_mode: 'HTML' });
    return;
  }

  // افزودن کاربر جدید
  const { data: user } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', fromId)
    .single();
  if (!user) {
    await supabase.from('users').insert({
      user_id: fromId,
      username,
      is_blocked: false,
    });
  }

  const startText = await getSetting('start_text', 'Hi!✋ <code>Welcome To My Bot:)</code>');
  const msg = fromId === adminId
    ? 'به ربات خودتون خوش اومدین'
    : startText.replace('FIRSTNAME', firstName).replace('USERNAME', username);

  await ctx.reply(msg, {
    parse_mode: 'HTML',
    ...(fromId === adminId ? buttonOfficial : buttonDokmeHa),
  });
});

// دستور بخش مدیریت
bot.hears('✴️بخش مدیریت', async (ctx) => {
  const fromId = ctx.from.id.toString();
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
  const fromId = ctx.from.id.toString();
  const text = ctx.message.text;
  const firstName = ctx.from.first_name || 'کاربر';

  if (ctx.chat.type === 'private' && fromId !== adminId) {
    const pmResani = await getSetting('pm_resani', '✅');
    const sendText = await getSetting('send_text', '<b>Sent To My Admin!</b>');

    if (await isUserBlocked(fromId)) {
      await ctx.reply('🚫 شما از ربات بلاک شده‌اید.', { parse_mode: 'HTML' });
      return;
    }

    if (pmResani === '✅') {
      await ctx.telegram.sendMessage(adminId, `پیام از [${firstName}](tg://user?id=${fromId}):\n${text}`, {
        parse_mode: 'Markdown',
      });
      await ctx.reply(sendText, { parse_mode: 'HTML' });
    }
  }
});

// مدیریت پروفایل
bot.hears('📬پروفایل', async (ctx) => {
  if (ctx.chat.type !== 'private') return;

  const fromId = ctx.from.id.toString();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', fromId)
    .single();

  let protxt = profile?.name || '📬 پروفایل خالی است...';
  if (profile?.age) protxt += `\n${profile.age} ساله`;
  if (profile?.location) protxt += `\nاز ${profile.location}`;
  if (profile?.tah) protxt += `\n${profile.tah}`;
  if (profile?.stats) protxt += `\nوضعیت: ${profile.stats}`;

  await ctx.reply(protxt, {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        [{ text: '↩️منوی اصلی' }, { text: '👁‍🗨مشاهده مشخصات' }],
        [{ text: '🅾نام' }, { text: '🅾سن' }],
        [{ text: '🅾محل سکونت' }, { text: '🅾وضعیت' }],
      ],
      resize_keyboard: true,
    },
  });
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
