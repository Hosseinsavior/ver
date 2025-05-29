// api/index.js
const { Telegraf } = require('telegraf');
const { supabase, initializeSettings, getSetting, saveSetting, addUser, isUserBlocked, blockUser, unblockUser } = require('../lib/database');

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
      [{ text: 'آمار' }, { text: '🈂فوروارد همگانی' }],
    ],
    resize_keyboard: true,
  },
};

const buttonDokmeHa = {
  reply_markup: {
    keyboard: [],
    resize_keyboard: true,
  },
};

const buttonManage = {
  reply_markup: {
    keyboard: [[{ text: '✴️بخش مدیریت' }]],
    resize_keyboard: true,
  },
};

const buttonBack = {
  reply_markup: {
    keyboard: [[{ text: '↩️بازگشت' }]],
    resize_keyboard: true,
  },
};

const buttonS2A = {
  reply_markup: {
    keyboard: [[{ text: '✅بله' }, { text: '↩️بازگشت' }]],
    resize_keyboard: true,
  },
};

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

  // بررسی قفل کانال
  const channelLock = await getSetting('channel_lock', '');
  if (channelLock && fromId !== adminId) {
    try {
      const member = await ctx.telegram.getChatMember(channelLock, fromId);
      if (!['member', 'creator', 'administrator'].includes(member.status)) {
        await ctx.reply(`برای استفاده از ربات، در کانال ${channelLock} عضو شوید و سپس /start کنید.`, {
          parse_mode: 'HTML',
        });
        return;
      }
    } catch (error) {
      console.error('Error checking channel membership:', error);
    }
  }

  // افزودن کاربر جدید
  await addUser(fromId, username);

  const startText = await getSetting('start_text', 'Hi!✋ <code>Welcome To My Bot:)</code>');
  const msg = fromId === adminId ? 'به ربات خودتون خوش اومدین' : startText.replace('FIRSTNAME', firstName).replace('USERNAME', username);

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

// غیرفعال کردن حالت ادمین
bot.hears('🔯غیر فعال کردن حالت ادمین', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId) {
    await saveSetting('command', 'none');
    await ctx.reply('🔯 حالت ادمین غیرفعال شد.', {
      parse_mode: 'HTML',
      ...buttonManage,
    });
  }
});

// پیام همگانی ساده
bot.hears('⤴️پیام همگانی', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId) {
    await saveSetting('command', 's2a');
    await ctx.reply('⤴️ پیام را وارد کنید:', {
      parse_mode: 'HTML',
      ...buttonBack,
    });
  }
});

bot.hears('↩️بازگشت', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId) {
    await saveSetting('command', 'none');
    await ctx.reply('✴️ به بخش مدیریت بازگشتید.', {
      parse_mode: 'HTML',
      ...buttonOfficial,
    });
  }
});

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id.toString();
  const text = ctx.message.text;
  const firstName = ctx.from.first_name || 'کاربر';
  const command = await getSetting('command', 'none');

  // مدیریت پیام همگانی ساده
  if (command === 's2a' && fromId === adminId) {
    await saveSetting('command', 'none');
    await ctx.reply('⤴️ پیام در صف ارسال قرار گرفت.', {
      parse_mode: 'HTML',
      ...buttonOfficial,
    });
    const { data: users } = await supabase.from('users').select('user_id');
    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.user_id, text, { parse_mode: 'HTML' });
      } catch (error) {
        console.error(`Error sending message to ${user.user_id}:`, error);
      }
    }
    return;
  }

  // مدیریت پیام‌های کاربران
  if (ctx.chat.type === 'private' && fromId !== adminId) {
    if (await isUserBlocked(fromId)) {
      await ctx.reply('🚫 شما از ربات بلاک شده‌اید.', { parse_mode: 'HTML' });
      return;
    }

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

// فوروارد همگانی
bot.hears('🈂فوروارد همگانی', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId) {
    await saveSetting('command', 's2a fwd');
    await ctx.reply('🈂 پیام را فوروارد کنید:', {
      parse_mode: 'HTML',
      ...buttonBack,
    });
  }
});

bot.on('message', async (ctx) => {
  const fromId = ctx.from.id.toString();
  const messageId = ctx.message.message_id;
  const command = await getSetting('command', 'none');

  if (command === 's2a fwd' && fromId === adminId && ctx.message.forward_from) {
    await saveSetting('command', 'none');
    await ctx.reply('🈂 پیام در صف ارسال قرار گرفت.', {
      parse_mode: 'HTML',
      ...buttonOfficial,
    });
    const { data: users } = await supabase.from('users').select('user_id');
    for (const user of users) {
      try {
        await ctx.telegram.forwardMessage(user.user_id, ctx.chat.id, messageId);
      } catch (error) {
        console.error(`Error forwarding to ${user.user_id}:`, error);
      }
    }
  }
});

// تنظیمات
bot.hears('🔧تنظیمات', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId) {
    const settings = {
      sticker: await getSetting('sticker', '✅'),
      file: await getSetting('file', '✅'),
      aks: await getSetting('aks', '✅'),
      music: await getSetting('music', '✅'),
      film: await getSetting('film', '✅'),
      voice: await getSetting('voice', '✅'),
      link: await getSetting('link', '✅'),
      forward: await getSetting('forward', '✅'),
      join: await getSetting('join', '✅'),
      pm_forward: await getSetting('pm_forward', '⛔️'),
      pm_resani: await getSetting('pm_resani', '✅'),
    };
    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: `استیکر: ${settings.sticker}`, callback_data: 'sticker' }],
          [{ text: `فایل: ${settings.file}`, callback_data: 'file' }],
          [{ text: `عکس: ${settings.aks}`, callback_data: 'aks' }],
          [{ text: `موزیک: ${settings.music}`, callback_data: 'music' }],
          [{ text: `ویدیو: ${settings.film}`, callback_data: 'film' }],
          [{ text: `ویس: ${settings.voice}`, callback_data: 'voice' }],
          [{ text: `لینک: ${settings.link}`, callback_data: 'link' }],
          [{ text: `فوروارد: ${settings.forward}`, callback_data: 'forward' }],
          [{ text: `عضویت گروه: ${settings.join}`, callback_data: 'join' }],
          [{ text: `فوروارد پیام: ${settings.pm_forward}`, callback_data: 'pm_forward' }],
          [{ text: `پیام‌رسانی: ${settings.pm_resani}`, callback_data: 'pm_resani' }],
        ],
      },
    };
    await ctx.reply('🔧 تنظیمات ربات:', {
      parse_mode: 'HTML',
      ...buttons,
    });
  }
});

bot.on('callback_query', async (ctx) => {
  const fromId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data;
  const messageId = ctx.callbackQuery.message.message_id;
  const chatId = ctx.chat.id;

  if (fromId === adminId) {
    const settingKeys = ['sticker', 'file', 'aks', 'music', 'film', 'voice', 'link', 'forward', 'join', 'pm_forward', 'pm_resani'];
    if (settingKeys.includes(data)) {
      const currentStatus = await getSetting(data, '✅');
      const newStatus = currentStatus === '✅' ? '⛔️' : '✅';
      await saveSetting(data, newStatus);
      const settings = {
        sticker: await getSetting('sticker', '✅'),
        file: await getSetting('file', '✅'),
        aks: await getSetting('aks', '✅'),
        music: await getSetting('music', '✅'),
        film: await getSetting('film', '✅'),
        voice: await getSetting('voice', '✅'),
        link: await getSetting('link', '✅'),
        forward: await getSetting('forward', '✅'),
        join: await getSetting('join', '✅'),
        pm_forward: await getSetting('pm_forward', '⛔️'),
        pm_resani: await getSetting('pm_resani', '✅'),
      };
      const buttons = {
        reply_markup: {
          inline_keyboard: [
            [{ text: `استیکر: ${settings.sticker}`, callback_data: 'sticker' }],
            [{ text: `فایل: ${settings.file}`, callback_data: 'file' }],
            [{ text: `عکس: ${settings.aks}`, callback_data: 'aks' }],
            [{ text: `موزیک: ${settings.music}`, callback_data: 'music' }],
            [{ text: `ویدیو: ${settings.film}`, callback_data: 'film' }],
            [{ text: `ویس: ${settings.voice}`, callback_data: 'voice' }],
            [{ text: `لینک: ${settings.link}`, callback_data: 'link' }],
            [{ text: `فوروارد: ${settings.forward}`, callback_data: 'forward' }],
            [{ text: `عضویت گروه: ${settings.join}`, callback_data: 'join' }],
            [{ text: `فوروارد پیام: ${settings.pm_forward}`, callback_data: 'pm_forward' }],
            [{ text: `پیام‌رسانی: ${settings.pm_resani}`, callback_data: 'pm_resani' }],
          ],
        },
      };
      await ctx.reply('🔧 تنظیمات به‌روزرسانی شد:', {
        message_id: messageId,
        parse_mode: 'HTML',
        ...buttons,
      });
      await ctx.answerCbQuery(`وضعیت ${data} به ${newStatus} تغییر کرد.`);
    }
  }
});

// آمار
bot.hears('آمار', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId) {
    const { data: members } = await supabase.from('users').select('user_id');
    const { data: banned } = await supabase.from('users').select('user_id').eq('is_blocked', true);
    await ctx.reply(`📊 آمار ربات:\nکاربران: ${members.length}\nکاربران بلاک‌شده: ${banned.length}`, {
      parse_mode: 'HTML',
      ...buttonOfficial,
    });
  }
});

// بلاک و آنبلاک
bot.command('ban', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId && ctx.message.reply_to_message) {
    const targetId = ctx.message.reply_to_message.from.id.toString();
    if (targetId !== adminId) {
      await blockUser(targetId);
      await ctx.reply('🚫 کاربر بلاک شد.', { parse_mode: 'HTML' });
    } else {
      await ctx.reply('🚫 نمی‌توانید خودتان را بلاک کنید.', { parse_mode: 'HTML' });
    }
  }
});

bot.command('unban', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (fromId === adminId && ctx.message.reply_to_message) {
    const targetId = ctx.message.reply_to_message.from.id.toString();
    await unblockUser(targetId);
    await ctx.reply('✅ کاربر آنبلاک شد.', { parse_mode: 'HTML' });
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
