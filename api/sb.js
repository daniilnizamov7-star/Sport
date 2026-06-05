export const config = { runtime: 'edge' };

const SB_URL = 'https://yiqipulgofoschkccaxr.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWlwdWxnb2Zvc2Noa2NjYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjExMjksImV4cCI6MjA4OTg5NzEyOX0.Op4iBjGSOBcKb4pkVSd75_l8Fle3Cz15nBh9KF21YhI';

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '';
  const target = `${SB_URL}/rest/v1/${path}`;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Prefer': req.headers.get('Prefer') || '',
  };

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== 'GET' ? await req.text() : undefined,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
