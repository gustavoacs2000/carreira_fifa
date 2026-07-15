import { createClient } from 'npm:@supabase/supabase-js@2';

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

Deno.serve(async request => {
  const cors = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: cors });

  const requestOrigin = request.headers.get('origin') || '';
  if (!cors['Access-Control-Allow-Origin'] || cors['Access-Control-Allow-Origin'] !== requestOrigin) {
    return Response.json({ error: 'origin_not_allowed' }, { status: 403, headers: cors });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return Response.json({ error: 'authentication_required' }, { status: 401, headers: cors });

  let body: { confirmation?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400, headers: cors });
  }
  if (body.confirmation !== 'EXCLUIR') {
    return Response.json({ error: 'confirmation_required' }, { status: 400, headers: cors });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceRoleKey) {
    return Response.json({ error: 'server_not_configured' }, { status: 500, headers: cors });
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error: userError } = await userClient.auth.getUser();
  if (userError || !data.user) {
    return Response.json({ error: 'invalid_session' }, { status: 401, headers: cors });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id, false);
  if (deleteError) {
    console.error('delete-account failed', deleteError.message);
    return Response.json({ error: 'delete_failed' }, { status: 500, headers: cors });
  }

  return Response.json({ deleted: true }, { headers: { ...cors, 'Cache-Control': 'no-store' } });
});
