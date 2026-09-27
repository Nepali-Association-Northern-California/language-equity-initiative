/*
 * Deployment settings. Leave both values empty to run in test mode:
 * responses are then saved only in this browser and can be downloaded from the start page.
 * To collect real data, create the Supabase project described in ../db/schema.sql
 * and paste its Project URL and anon (public) key here. The anon key is safe to publish
 * because the database only lets it INSERT, never read.
 */
window.APP_CONFIG = {
  supabaseUrl: 'https://khhzmbuqbyvkvxjxwclz.supabase.co',
  supabaseAnonKey: 'sb_publishable_wokTMZ7qibPn_Fky2Ep00w_tg_gfFEk'
};
