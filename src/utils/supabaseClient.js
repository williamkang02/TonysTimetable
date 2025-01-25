import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if running in a test environment
const isTest = process.env.NODE_ENV === 'test';

export const supabase = isTest 
  ? { // Mocked Supabase client for testing
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
      auth: {
        signIn: jest.fn().mockResolvedValue({
          user: { email: 'test2@gmail.com' },
          session: { access_token: 'mockAccessToken' },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    }
  : createClient(supabaseUrl, supabaseAnonKey); // Real Supabase client for production

