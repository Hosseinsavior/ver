const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://oxhehidouvrrrvsebwwc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeSettings() {
  try {
    const { data } = await supabase.from('settings').select('key');
    if (!data || data.length === 0) {
      await supabase.from('settings').insert([
        { key: 'start_text', value: 'Hi!✋ <code>Welcome To My Bot:)</code>' },
        { key: 'send_text', value: '<b>Sent To My Admin!</b>' },
        { key: 'pm_resani', value: '✅' },
        { key: 'sticker', value: '✅' },
        { key: 'file', value: '✅' },
        { key: 'aks', value: '✅' },
        { key: 'music', value: '✅' },
        { key: 'film', value: '✅' },
        { key: 'voice', value: '✅' },
        { key: 'link', value: '✅' },
        { key: 'forward', value: '✅' },
        { key: 'join', value: '✅' },
        { key: 'pm_forward', value: '⛔️' },
      ]);
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

async function getSetting(key, defaultValue) {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', key).single();
    return data?.value || defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

async function saveSetting(key, value) {
  try {
    const { error } = await supabase.from('settings').upsert({ key, value });
    if (error) throw error;
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
}

async function addUser(userId, username) {
  try {
    const { error } = await supabase.from('users').upsert({ user_id: userId, username });
    if (error) throw error;
  } catch (error) {
    console.error('Error adding user:', error);
  }
}

async function isUserBlocked(userId) {
  try {
    const { data } = await supabase.from('users').select('is_blocked').eq('user_id', userId).single();
    return data?.is_blocked || false;
  } catch (error) {
    console.error('Error checking user block status:', error);
    return false;
  }
}

async function blockUser(userId) {
  try {
    const { error } = await supabase.from('users').update({ is_blocked: true }).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error blocking user:', error);
  }
}

async function unblockUser(userId) {
  try {
    const { error } = await supabase.from('users').update({ is_blocked: false }).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
}

async function getButtons() {
  try {
    const { data } = await supabase.from('buttons').select('*');
    return data || [];
  } catch (error) {
    console.error('Error getting buttons:', error);
    return [];
  }
}

async function addButton(text, type, content, caption, position) {
  try {
    const { error } = await supabase.from('buttons').insert({ text, type, content, caption, position });
    if (error) throw error;
  } catch (error) {
    console.error('Error adding button:', error);
  }
}

async function removeButton(text) {
  try {
    const { error } = await supabase.from('buttons').delete().eq('text', text);
    if (error) throw error;
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
