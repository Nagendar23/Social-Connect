const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const res = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (res.error) {
    console.log('Login failed', res.error.message);
    return;
  }
  
  const token = res.data.session.access_token;
  const refresh = res.data.session.refresh_token;
  
  const cookie = `sb-mxfrpwftuhwmbnsgemjt-auth-token=${encodeURIComponent(JSON.stringify([{access_token: token, refresh_token: refresh}]))}`;
  
  try {
    const f = await fetch(`${API_BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({ content: 'Test post from script' })
    });
    const text = await f.text();
    console.log('Response:', f.status, text);
  } catch(e) {
    console.error('Fetch error:', e);
  }
}
test();
