// Supabase.js – TNC Fast Food
// Correct credentials + safe for GitHub Pages

const SUPABASE_URL = 'https://tpzpcukpjsyozbngqyzb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1UVdKJ-GTEv99U40hr0vqg_lI-6p0N2';

// Create the client (the library is loaded from CDN before this file)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Make it available to the rest of the website
window.tncSupabase = supabaseClient;
