import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'ponpes_supabase_url';
const STORAGE_KEY_KEY = 'ponpes_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;

  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('https://')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Gagal menginisialisasi Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL Supabase dan Anon Key wajib diisi.' };
    }
    if (!url.startsWith('https://')) {
      return { success: false, message: 'URL Supabase harus diawali dengan https://' };
    }

    const client = createClient(url, anonKey);
    // Ping public table or auth
    const { error } = await client.from('app_settings').select('id').limit(1);

    if (error && error.code !== 'PGRST116' && !error.message.includes('relation') && error.message.includes('FetchError')) {
      return { success: false, message: `Gagal terhubung ke Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: 'Berhasil terhubung ke endpoint project Supabase! Pastikan tabel database telah di-deploy menggunakan script migration SQL.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Koneksi gagal: ${errorMsg}` };
  }
}
