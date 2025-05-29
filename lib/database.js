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
  pm_resani: '✅',
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
    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
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

module.exports = { supabase, initializeSettings, getSetting, saveSetting };
