import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Credentials are read ONLY from environment variables (No localStorage persistence for security)
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const url = ((import.meta.env.VITE_SUPABASE_URL as string) || '').trim();
  const anonKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').trim();
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('https://') && url.includes('.supabase.co'));
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
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.error('Gagal menginisialisasi Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { url, anonKey } = getSupabaseCredentials();
    if (!url || !anonKey) {
      return {
        success: false,
        message: 'Variabel lingkungan VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diisi.',
      };
    }
    if (!url.startsWith('https://')) {
      return { success: false, message: 'URL Supabase harus diawali dengan https://' };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Inisialisasi Supabase client gagal.' };
    }

    // Ping public table or auth
    const { error } = await client.from('app_settings').select('id').limit(1);

    if (error && error.code !== 'PGRST116' && !error.message.includes('relation') && error.message.includes('FetchError')) {
      return { success: false, message: `Gagal terhubung ke Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: 'Berhasil terhubung ke endpoint project Supabase dengan kredensial env!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Koneksi gagal: ${errorMsg}` };
  }
}
