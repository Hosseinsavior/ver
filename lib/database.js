// lib/database.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultSettings = {
  on_off: 'true',
  sticker: '✅',
  file: '✅',
  aks: '✅',
  music: '✅',
  film: '✅',
  voice: '✅',
  link: '✅',
  forward: '✅',
  join: '✅',
  pm_forward: '⛔️',
  pm_resani: '✅',
  channelFWD: '',
  channel_lock: '',
  start_text: 'Hi!✋ <code>Welcome To My Bot:)</code>',
  send_text: '<b>Sent To My Admin!</b>',
  command: 'none',
};

async function initializeSettings() {
  try {
    for (const [key, value] of Object.entries(defaultSettings)) {
      const { data } = await supabase
        .from('settings')
        .select('key')
        .eq('key', key)
        .single();
      if (!data) {
        await supabase.from('settings').insert({ key, value });
      }
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
    throw error;
  }
}

async function getSetting(key, defaultValue) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.value || defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

async function saveSetting(key, value) {
  try {
    await supabase
      .from('settings')
      .upsert({ key, value });
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    throw error;
  }
}

async function addUser(userId, username) {
  try {
    const { data } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    if (!data) {
      await supabase.from('users').insert({
        user_id: userId,
        username,
        is_blocked: false,
      });
    }
  } catch (error) {
    console.error('Error adding user:', error);
  }
}

async function isUserBlocked(userId) {
  try {
    const { data } = await supabase
      .from('users')
      .select('is_blocked')
      .eq('user_id', userId)
      .single();
    return data?.is_blocked || false;
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

async function blockUser(userId) {
  try {
    await supabase
      .from('users')
      .update({ is_blocked: true })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error blocking user:', error);
  }
}

async function unblockUser(userId) {
  try {
    await supabase
      .from('users')
      .update({ is_blocked: false })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
}

async function getButtons() {
  try {
    const { data } = await supabase
      .from('buttons')
      .select('*')
      .order('position', { ascending: true });
    return data || [];
  } catch (error) {
    console.error('Error getting buttons:', error);
    return [];
  }
}

async function addButton(text, type, content, caption = '', position = 'bottom') {
  try {
    await supabase
      .from('buttons')
      .insert({ text, type, content, caption, position });
  } catch (error) {
    console.error('Error adding button:', error);
  }
}

async function removeButton(text) {
  try {
    await supabase
      .from('buttons')
      .delete()
      .eq('text', text);
  } catch (error) {
    console.error('Error removing button:', error);
  }
}

module.exports = {
  supabase,
  initializeSettings,
  getSetting,
  saveSetting,
  addUser,
  isUserBlocked,
  blockUser,
  unblockUser,
  getButtons,
  addButton,
  removeButton,
};
