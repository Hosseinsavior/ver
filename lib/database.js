// lib/database.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const defaultSettings = {
  on_off: 'true',
  sticker: '✅',
  file: '✅',
  pm_resani: '✅',
  start_text: 'Hi!✋ <code>Welcome To My Bot:)</code>',
  send_text: '<b>Sent To My Admin!</b>',
};

async function initializeSettings() {
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
}

module.exports = { supabase, initializeSettings };
