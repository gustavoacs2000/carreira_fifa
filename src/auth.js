(() => {
const { createClient } = window.supabase;

const SUPABASE_URL = __SUPABASE_URL__;
const SUPABASE_PUBLISHABLE_KEY = __SUPABASE_PUBLISHABLE_KEY__;
const AUTH_STORAGE_KEY = 'managerFC:auth:v1';
const configured = /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL) && SUPABASE_PUBLISHABLE_KEY.length > 20;

const supabaseClient = configured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY
      }
    })
  : null;

let app = null;
let currentUser = null;
let pendingState = null;
let saveTimer = null;
let saveInFlight = null;
let accountOperation = false;
let loadingUserId = null;

const byId = id => document.getElementById(id);

function setAuthStatus(message = '') {
  const status = byId('auth-status');
  if (status) status.textContent = message;
}

function setSyncStatus(message, state = 'idle') {
  const status = byId('sync-status');
  if (!status) return;
  const dot = document.createElement('span');
  dot.className = 'storage-dot';
  status.replaceChildren(dot, document.createTextNode(` ${message}`));
  status.dataset.state = state;
}

function cleanOAuthParams() {
  const url = new URL(window.location.href);
  const oauthParams = ['code', 'error', 'error_code', 'error_description'];
  if (!oauthParams.some(param => url.searchParams.has(param))) return;
  oauthParams.forEach(param => url.searchParams.delete(param));
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function showGate(message = '') {
  currentUser = null;
  document.body.classList.add('auth-pending');
  document.body.classList.remove('auth-ready', 'account-open');
  const gate = byId('auth-gate');
  if (gate) gate.hidden = false;
  const button = byId('google-login');
  if (button) button.disabled = !configured || !byId('age-confirm')?.checked;
  setAuthStatus(message);
}

function showApp(user) {
  currentUser = user;
  document.body.classList.remove('auth-pending');
  document.body.classList.add('auth-ready');
  const gate = byId('auth-gate');
  if (gate) gate.hidden = true;
  const accountEmail = byId('account-email');
  if (accountEmail) accountEmail.textContent = user.email || 'Conta Google';
  cleanOAuthParams();
}

async function loadCareer(user) {
  if (loadingUserId === user.id) return;
  loadingUserId = user.id;
  setAuthStatus('Carregando sua carreira…');
  setSyncStatus('Carregando da nuvem', 'saving');

  const { data, error } = await supabaseClient
    .from('career_states')
    .select('state, version')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Falha ao carregar a carreira.', error);
    const localState = app.attachUser(user.id, null);
    showApp(user);
    setSyncStatus('Somente neste dispositivo', 'error');
    setAuthStatus('');
    pendingState = localState;
    loadingUserId = null;
    return;
  }

  const selectedState = app.attachUser(user.id, data?.state || null);
  showApp(user);
  setAuthStatus('');

  if (!data) {
    pendingState = selectedState;
    await flushSave();
  } else {
    setSyncStatus('Sincronizado', 'synced');
  }
  loadingUserId = null;
}

async function applySession(session) {
  if (!session?.user) {
    if (currentUser && !accountOperation) app?.detachUser({ clearCache: true });
    app?.clearSignedOutCaches();
    showGate();
    return;
  }

  if (currentUser?.id === session.user.id) return;
  await loadCareer(session.user);
}

async function signIn() {
  if (!configured || !supabaseClient) {
    setAuthStatus('O acesso Google ainda precisa ser configurado pelo administrador.');
    return;
  }
  if (!byId('age-confirm')?.checked) {
    setAuthStatus('Confirme a idade mínima para continuar.');
    return;
  }

  const button = byId('google-login');
  if (button) button.disabled = true;
  setAuthStatus('Abrindo o acesso seguro do Google…');

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'online',
        prompt: 'select_account'
      }
    }
  });

  if (error) {
    console.error(error);
    setAuthStatus('Não foi possível iniciar o login. Tente novamente.');
    if (button) button.disabled = false;
  }
}

function queueSave(state) {
  if (!currentUser || !configured) return;
  pendingState = JSON.parse(JSON.stringify(state));
  setSyncStatus('Salvando alterações', 'saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flushSave(), 900);
}

async function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (saveInFlight) await saveInFlight;
  if (!pendingState || !currentUser || !supabaseClient) return;

  const state = pendingState;
  pendingState = null;
  saveInFlight = supabaseClient.rpc('save_my_career', { p_state: state });
  const { error } = await saveInFlight;
  saveInFlight = null;

  if (error) {
    console.error('Falha ao sincronizar a carreira.', error);
    pendingState = state;
    setSyncStatus('Falha na sincronização', 'error');
    return;
  }

  setSyncStatus('Sincronizado', 'synced');
  if (pendingState) void flushSave();
}

async function signOut() {
  if (!supabaseClient || accountOperation) return;
  accountOperation = true;
  setSyncStatus('Finalizando sessão', 'saving');
  await flushSave();
  app?.detachUser({ clearCache: true });
  const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
  accountOperation = false;
  currentUser = null;
  if (error) console.error(error);
  showGate(error ? 'A sessão local foi limpa, mas ocorreu uma falha ao avisar o servidor.' : 'Você saiu com segurança.');
}

async function deleteAccount() {
  if (!supabaseClient || !currentUser || accountOperation) return;
  if (!confirm('Esta ação excluirá sua conta, carreiras e históricos da base ativa. Deseja continuar?')) return;
  const confirmation = prompt('Para confirmar, digite EXCLUIR:');
  if (confirmation !== 'EXCLUIR') return;

  accountOperation = true;
  setSyncStatus('Excluindo conta e dados', 'saving');
  const { error } = await supabaseClient.functions.invoke('delete-account', { body: { confirmation } });

  if (error) {
    accountOperation = false;
    console.error(error);
    setSyncStatus('Não foi possível excluir', 'error');
    alert('A exclusão não foi concluída. Tente novamente ou use o contato informado no Aviso de Privacidade.');
    return;
  }

  app?.detachUser({ clearCache: true });
  localStorage.removeItem(AUTH_STORAGE_KEY);
  currentUser = null;
  accountOperation = false;
  showGate('Sua conta e os dados da aplicação foram excluídos.');
}

function toggleAccount() {
  document.body.classList.toggle('account-open');
}

async function initialize(appApi) {
  app = appApi;
  byId('google-login')?.addEventListener('click', signIn);
  byId('age-confirm')?.addEventListener('change', event => {
    const button = byId('google-login');
    if (button) button.disabled = !configured || !event.target.checked;
    if (event.target.checked) setAuthStatus('');
  });

  if (!configured || !supabaseClient) {
    showGate('Integração não configurada. Consulte CONFIGURACAO-SUPABASE.md.');
    return;
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (event === 'SIGNED_OUT') void applySession(null);
      else if (session) void applySession(session);
    }, 0);
  });

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error(error);
    showGate('Não foi possível verificar sua sessão. Tente entrar novamente.');
    return;
  }
  await applySession(data.session);
}

window.ManagerAuth = {
  initialize,
  signIn,
  signOut,
  deleteAccount,
  toggleAccount,
  queueSave,
  flushSave
};
})();
