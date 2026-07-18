const $ = s => document.querySelector(s),
    $$ = s => document.querySelectorAll(s);
const STORAGE_KEY = 'managerFC:data:v2';
const LEGACY_STORAGE_KEYS = ['dadosApp', 'elencoFC26_v13'];
const cloneData = value => JSON.parse(JSON.stringify(value));
let activeStorageKey = STORAGE_KEY;
let currentUserId = null;
let storageErrorShown = false;
let abaAtiva = 'mercado',
    modoEdicao = !1,
    selCards = [],
    filtros = {
        pos: [],
        sit: [],
        status: [],
        fx: {
            idade: [0, 60],
            ovr: [0, 99],
            pot: [0, 99],
            valor: [0, 200000000]
        }
    },
    sortDir = 'asc',
    modoTabela = !1,
    sortTaticasField = 'pos',
    sortTaticasDir = 'desc',
    filtroRenovacaoAtivo = !1,
    snapshotVisualizando = null,
    snapshotAbaSelecionada = 'jogadores',
    mesAtualCal = 5,
    anoAtualCal = 2025,
    calModoLista = !1,
    imgUploadIdx = -1;
let compsSelecionadas = [],
    sortStatsField = 'jogos',
    sortStatsDir = 'desc',
    editComp = '',
    subAbaMercado = 'alvos';
window.selCap = false;


const cSit = {
    'Elenco': '#15803d',
    'Emprest. - IN': '#1d4ed8',
    'Emprest. - OUT': '#b91c1c',
    'Base': '#cbd5e1',
    'Observação': '#d97706',
    'Empréstimo': '#2563eb',
    'Transferência': '#15803d'
};

function getCompC() {
    const s = getSeason();
    if (!s) return {
        "Ligue 1": "#3b82f6",
        "Coupe de France": "#ef4444",
        "UEFA Champions League": "#10b981",
        "UEFA Europa League": "#f59e0b",
        "UEFA Conference League": "#8b5cf6",
        "Pré-Temporada": "#6b7280"
    };
    if (!s.competicoes) {
        s.competicoes = {
            "Ligue 1": "#3b82f6",
            "Coupe de France": "#ef4444",
            "UEFA Champions League": "#10b981",
            "UEFA Europa League": "#f59e0b",
            "UEFA Conference League": "#8b5cf6",
            "Pré-Temporada": "#6b7280"
        };
    }
    return s.competicoes;
}

function salvarCompeticao(nome, cor) {
    const s = getSeason();
    if (!s.competicoes) getCompC();
    s.competicoes[nome] = cor;
    salvarDados();
    renderizar();
    if (document.querySelector('#modal-competicoes-list')) renderizarCompeticoesList();
}

function excluirCompeticao(nome) {
    const s = getSeason();
    if (s.competicoes && s.competicoes[nome]) {
        delete s.competicoes[nome];
        salvarDados();
        renderizar();
        if (document.querySelector('#modal-competicoes-list')) renderizarCompeticoesList();
    }
}

function renderizarCompeticoesList() {
    const c = getCompC();
    let html = Object.keys(c).map(k => `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px;background:#0f172a;margin-bottom:5px;border-radius:4px;"><span style="color:${c[k]};font-weight:bold;">${k}</span> <button onclick="excluirCompeticao('${k}')" style="background:transparent;border:none;color:#ef4444;cursor:pointer;">🗑️</button></div>`).join('');
    document.querySelector('#modal-competicoes-list').innerHTML = html;
}

function abrirModalCompeticoes() {
    renderizarCompeticoesList();
    document.querySelector('#modal-competicoes').style.display = 'flex';
}

const getCBg = c => getCompC()[c] || '#475569';
const gBd = c => `<span class="badge-comp" style="background:${getCBg(c)}">${c}</span>`;
const rSt = v => `<div style="display:flex;gap:2px;justify-content:center">${[...Array(5)].map((_,i)=>`<svg viewBox="0 0 24 24" width="12" height="12" fill="${i<v?'#fbbf24':'none'}" stroke="${i<v?'#fbbf24':'#475569'}" stroke-width="2"><path d="M12 .5l3.6 7.5 8.3 1.2-6 5.8 1.4 8.3-7.4-4-7.4 4 1.4-8.3-6-5.8 8.3-1.2z"/></svg>`).join('')}</div>`;
const fZ = v => v == 0 ? `<span style="color:#475569">0</span>` : v;
const getAdp = (p, s) => {
    let x = s.replace(/\d/g, '');
    if (p === x) return '#10b981';
    const g = [
        ['ZAG', 'LE', 'LD', 'ADD', 'ADE'],
        ['VOL', 'MC', 'MEI', 'ME', 'MD', 'PE', 'PD'],
        ['ATA', 'PE', 'PD', 'SA']
    ];
    for (let a of g)
        if (a.includes(p) && a.includes(x)) return '#f59e0b';
    return '#ef4444';
};
const lblSit = s => ({
    'Observação': 'OBS',
    'Empréstimo': 'EMP',
    'Transferência': 'TRANSF'
})[s] || s;
const lblSt = s => ({
    'Titular': 'TIT',
    'Reserva': 'RES',
    'Não Relacionado': 'N/R'
})[s] || s;
const cN = m => m <= 5.9 ? '#ef4444' : m < 7 ? '#eab308' : '#10b981';

const defaultCalendarioLigue1 = [{
    id: 1,
    data: '2025-08-16',
    adversario: 'Metz (F)',
    rodada: '1',
    campeonato: 'Ligue 1'
}, {
    id: 2,
    data: '2025-08-23',
    adversario: 'Nantes (C)',
    rodada: '2',
    campeonato: 'Ligue 1'
}, {
    id: 3,
    data: '2025-08-30',
    adversario: 'Monaco (F)',
    rodada: '3',
    campeonato: 'Ligue 1'
}, {
    id: 4,
    data: '2025-09-13',
    adversario: 'Le Havre (C)',
    rodada: '4',
    campeonato: 'Ligue 1'
}, {
    id: 5,
    data: '2025-09-20',
    adversario: 'Paris FC (F)',
    rodada: '5',
    campeonato: 'Ligue 1'
}, {
    id: 6,
    data: '2025-09-27',
    adversario: 'Marseille (C)',
    rodada: '6',
    campeonato: 'Ligue 1'
}];
const defaultMercadoPlayer = {
    primeiroNome: "João",
    sobrenome: "Promessa",
    num: "-",
    pos: "ATA",
    status: "Prioridade",
    situacao: "Observação",
    idade: 21,
    alt: 185,
    pe: "Dir.",
    contAnos: 0,
    contMeses: 0,
    multa: 15e6,
    valor: 1e7,
    salario: 25000,
    ovr: 75,
    pot: 88,
    dr: 3,
    pr: 4,
    s: [85, 78, 65, 75, 30, 70],
    est: {}
};

function readStoredJSON(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.warn(`Não foi possível ler ${key}.`, error);
        return null;
    }
}

function criarCarreiraInicial() {
    const seed = window.MANAGER_FC_SEED || {};
    const jogadores = [...(seed.elenco || []), ...(seed.base || [])];
    const mercado = seed.mercado?.length ? seed.mercado : [defaultMercadoPlayer];
    return {
        schemaVersion: 2,
        indiceAtivo: 0,
        elencos: [{
            nome: 'RD Strasbourg',
            temporadaAtiva: 0,
            historico: [],
            temporadas: [{
                nome: 'Temporada 1',
                jogadores: cloneData(jogadores),
                mercado: cloneData(mercado),
                lineup: {},
                calendario: cloneData(defaultCalendarioLigue1),
                verba: 100000000,
                salario: 500000
            }]
        }]
    };
}

function carregarDados() {
    let d = null;
    try {
        if (window.__INITIAL_APP_DATA__) {
            d = typeof structuredClone === 'function'
                ? structuredClone(window.__INITIAL_APP_DATA__)
                : JSON.parse(JSON.stringify(window.__INITIAL_APP_DATA__));
        }
    } catch (e) {
        console.error('Falha ao copiar save inicial:', e);
        d = null;
    }

    if (!d) {
        d = {
            elencos: [{
                nome: "Elenco Principal",
                jogadores: [],
                mercado: [defaultMercadoPlayer],
                verba: 1e8,
                salario: 5e5
            }],
            indiceAtivo: 0
        };
    }

    d.elencos = Array.isArray(d.elencos) ? d.elencos : [];
    if (!d.elencos.length) {
        d.elencos.push({
            nome: "Elenco Principal",
            jogadores: [],
            mercado: [defaultMercadoPlayer],
            verba: 1e8,
            salario: 5e5
        });
    }
    d.indiceAtivo = Math.min(Math.max(Number(d.indiceAtivo) || 0, 0), d.elencos.length - 1);

    d.elencos.forEach(e => {
        e.mercado = e.mercado || [defaultMercadoPlayer];
        e.lineup = e.lineup || {};
        if (!e.temporadas) {
            e.temporadas = [{
                nome: "Temporada 1",
                jogadores: e.jogadores || [],
                mercado: e.mercado,
                lineup: e.lineup,
                calendario: JSON.parse(JSON.stringify(defaultCalendarioLigue1)),
                verba: e.verba ?? 1e8,
                salario: e.salario ?? 5e5
            }];
            e.temporadaAtiva = 0;
            e.historico = [];
            ['jogadores', 'mercado', 'lineup', 'verba', 'salario'].forEach(k => delete e[k]);
        } else {
            e.temporadas.forEach(t => t.calendario = t.calendario || JSON.parse(JSON.stringify(defaultCalendarioLigue1)));
        }
        e.temporadaAtiva = Math.min(Math.max(Number(e.temporadaAtiva) || 0, 0), e.temporadas.length - 1);
        e.historico = e.historico || [];
        e.temporadas.forEach(t => {
            t.jogadores = t.jogadores || [];
            t.mercado = t.mercado || [];
            t.lineup = t.lineup || {};
            t.dataAtual = t.dataAtual || (t.calendario[0] ? t.calendario[0].data : `${new Date().getFullYear()}-08-01`);
            t.inbox = t.inbox || [];
            t.livroCaixa = t.livroCaixa || [];
        });
    });
    return d;
}
let initialState = readStoredJSON(STORAGE_KEY) || readStoredJSON('dadosApp');
if (!initialState) {
    const legacyRoster = readStoredJSON('elencoFC26_v13');
    if (Array.isArray(legacyRoster)) {
        initialState = {
            indiceAtivo: 0,
            elencos: [{
                nome: 'Elenco Principal',
                jogadores: legacyRoster,
                mercado: [defaultMercadoPlayer],
                verba: 100000000,
                salario: 500000
            }]
        };
    }
}
window.__INITIAL_APP_DATA__ = initialState || criarCarreiraInicial();
let appData = carregarDados();
delete window.__INITIAL_APP_DATA__;

function normalizarDados(value) {
    const hadInitialData = Object.prototype.hasOwnProperty.call(window, '__INITIAL_APP_DATA__');
    const previousInitialData = window.__INITIAL_APP_DATA__;
    window.__INITIAL_APP_DATA__ = cloneData(value || criarCarreiraInicial());
    const normalized = carregarDados();
    if (hadInitialData) window.__INITIAL_APP_DATA__ = previousInitialData;
    else delete window.__INITIAL_APP_DATA__;
    return normalized;
}
setTimeout(() => atualizarStorageInfo(JSON.stringify(appData)), 500);
const getSeason = () => appData.elencos[appData.indiceAtivo].temporadas[appData.elencos[appData.indiceAtivo].temporadaAtiva];
const syncCal = () => {
    const s = getSeason();
    if (s && s.dataAtual) {
        let [y, m] = s.dataAtual.split('-');
        anoAtualCal = +y;
        mesAtualCal = +m - 1;
    }
};
const atualizarStorageInfo = (str) => {
    if (!$('#storage-info')) return;
    const bytes = new Blob([str]).size;
    const kb = (bytes / 1024).toFixed(1);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    $('#storage-info').innerText = mb > 1 ? `${mb} MB / 10 MB` : `${kb} KB`;
    $('#storage-info').style.color = bytes > 9 * 1024 * 1024 ? '#ef4444' : (bytes > 7.5 * 1024 * 1024 ? '#fbbf24' : '#94a3b8');
};

const salvarDados = (sync = true) => {
    let str;
    try {
        // Limpa notificações antigas antes de enviar o save completo ao banco.
        if (appData.logNotificacoes) {
            const limite = Date.now() - 60 * 24 * 60 * 60 * 1000;
            Object.keys(appData.logNotificacoes).forEach(k => {
                if (appData.logNotificacoes[k] < limite) delete appData.logNotificacoes[k];
            });
        }
        appData.schemaVersion = 2;
        str = JSON.stringify(appData);
        atualizarStorageInfo(str);
        if (sync && currentUserId) window.ManagerAuth?.queueSave(appData);
    } catch (e) {
        console.error(e);
        window.mostrarToast?.('Não foi possível preparar o save.', true);
        return;
    }

    try {
        localStorage.setItem(activeStorageKey, str);
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('O cache local da carreira não pôde ser atualizado.', e);
        if (!storageErrorShown) {
            storageErrorShown = true;
            window.mostrarToast?.('A sincronização continuará pela nuvem, mas o cache local está sem espaço.', true);
        }
    }
};

const addDays = (d, n) => {
    let x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString().split('T')[0];
};

function renderTimeline() {
    const s = getSeason();
    if (!s.dataAtual) s.dataAtual = `${anoAtualCal}-08-01`;
    let h = '';
    for (let i = -1; i <= 5; i++) {
        let d = addDays(s.dataAtual, i),
            p = d.split('-'),
            isH = i === 0,
            isJ = ['01', '07', '08'].includes(p[1]),
            isD = (p[1] === '08' && p[2] === '31') || (p[1] === '01' && p[2] === '31');
        let ev = s.calendario.filter(e => e.data === d),
            evH = ev.map(e => e.relatorio ? `<div class="tl-event" onclick="event.stopPropagation(); abrirViewRelatorio(${e.id})" style="background:#10b981;color:#fff;border-color:#047857;" title="Ver Relatório">${e.campeonato.split(' ').map(w=>w[0]).join('')} ${e.adversario.split(' ')[0]} (${e.gp}x${e.gc})</div>` : `<div class="tl-event" onclick="abrirModalEvento('${d}',${e.id})">${e.campeonato.split(' ').map(w=>w[0]).join('')} ${e.adversario.split(' ')[0]}</div>`).join('');
        h += `<div class="tl-day ${isH?'hoje':''} ${isJ?'janela':''} ${isD?'deadline':''}" ${ev.length?'':`onclick="abrirModalEvento('${d}',null)"`}><div class="tl-date">${p[2]}/${p[1]} ${isD?'(FIM)':''}</div>${evH}</div>`;
    }
    $('#timeline-bar').innerHTML = `<button class="tl-btn" onclick="mudarDataManager(-1)">⬅️</button><div class="tl-days">${h}</div><button class="tl-btn" onclick="mudarDataManager(1)">➡️</button>`;
    atualizarInboxVisual();
}

function mudarDataManager(d) {
    const s = getSeason();
    if (d > 0) {
        let pendentes = (s.calendario || []).filter(e => e.data <= s.dataAtual && !e.relatorio);
        if (pendentes.length > 0) {
            if (!confirm(`Atenção: Você possui ${pendentes.length} partida(s) não registrada(s) até a data atual.\n\nAvançar sem registrá-las fará com que as estatísticas fiquem defasadas.\nDeseja ignorar o aviso e avançar a data mesmo assim?`)) return;
        }
    }
    let oldMA = s.dataAtual.substring(0, 7);
    s.dataAtual = addDays(s.dataAtual, d);
    let newMA = s.dataAtual.substring(0, 7);
    if (d > 0 && oldMA !== newMA) {
        s.mesesDescontados = s.mesesDescontados || [];
        if (!s.mesesDescontados.includes(newMA)) {
            s.mesesDescontados.push(newMA);
            atualizarContratosMes();
        }
    }
    verificarNotificacoes();
    salvarDados();
    renderTimeline();
}

function atualizarContratosMes() {
    const s = getSeason();
    [s.jogadores, s.mercado].forEach(a => {
        if (a) a.forEach((j, idx) => {
            if (['Elenco', 'Base', 'Emprest. - OUT'].includes(j.situacao)) {
                let m = (parseInt(j.contAnos) || 0) * 12 + (parseInt(j.contMeses) || 0) - 1;
                if (m < 0) {
                    m = 0;
                    j.status = "Fim de Contrato";
                }
                j.contAnos = Math.floor(m / 12);
                j.contMeses = m % 12;
            }
            if (j.situacao === 'Emprest. - IN') {
                let m = (parseInt(j.contAnos) || 0) * 12 + (parseInt(j.contMeses) || 0) - 1;
                if (m < 0) m = 0;
                j.contAnos = Math.floor(m / 12);
                j.contMeses = m % 12;
                if (m === 0) {
                    addNotif('fi_' + idx + '_' + s.dataAtual, `Devolução: Empréstimo de ${j.primeiroNome} ${j.sobrenome} encerrou.`);
                    setTimeout(() => {
                        let i = s.jogadores.indexOf(j);
                        if (i > -1) {
                            s.jogadores.splice(i, 1);
                            for (let k in s.lineup)
                                if (s.lineup[k] === j) delete s.lineup[k];
                            salvarDados();
                            renderizar();
                        }
                    }, 100);
                }
            }
            if (j.situacao === 'Emprest. - OUT') {
                let m = (parseInt(j.empAnos) || 0) * 12 + (parseInt(j.empMeses) || 0) - 1;
                if (m <= 0) {
                    m = 0;
                    j.situacao = 'Elenco';
                    j.status = 'Reserva';
                    delete j.empAnos;
                    delete j.empMeses;
                    addNotif('fo_' + idx + '_' + s.dataAtual, `Retorno: ${j.primeiroNome} ${j.sobrenome} retornou do empréstimo.`);
                } else {
                    j.empAnos = Math.floor(m / 12);
                    j.empMeses = m % 12;
                }
            }
        });
    });
    addNotif('vm_' + s.dataAtual, 'Atenção: Um mês se passou e os contratos foram deduzidos.');
    renderizar();
}

function addNotif(id, t) {
    const s = getSeason();
    if (!appData.logNotificacoes) appData.logNotificacoes = {};
    let baseId = id;
    if (id.length >= 10 && id.substring(id.length - 10).match(/^\d{4}-\d{2}-\d{2}$/)) {
        baseId = id.substring(0, id.length - 11);
    }
    const agora = Date.now();
    const l = appData.logNotificacoes[baseId];
    if (l && (agora - l) < 3 * 24 * 60 * 60 * 1000) return;

    if (!s.inbox.find(n => n.id === id)) {
        appData.logNotificacoes[baseId] = agora;
        s.inbox.push({
            id: id,
            txt: t,
            read: !1,
            data: s.dataAtual
        });
    }
}

function verificarProfundidadeElenco(s) {
    const e = s.jogadores.filter(j => j.situacao === 'Elenco' || j.situacao === 'Emprest. - IN');
    const tE = e.length; 
    const gol = e.filter(j => j.pos === 'GOL');
    if (gol.length < 2) addNotif(`dp_gol_${tE}`, `Assistente Técnico: Temos apenas ${gol.length} Goleiro(s). Contrate para ter no mínimo 2!`);
    else if (gol.length > 3) addNotif(`dp_gol_${tE}`, `Assistente Técnico: Excesso de Goleiros (${gol.length}). O ideal é manter 3.`);
    const lats = e.filter(j => j.pos === 'LE' || j.pos === 'LD');
    if (lats.length < 4) addNotif(`dp_lat_${tE}`, `Assistente Técnico: Faltam laterais. Temos apenas ${lats.length}, o ideal são 4 (2 para cada lado).`);
    else if (lats.length > 5) addNotif(`dp_lat_${tE}`, `Assistente Técnico: Excesso de Laterais (${lats.length}). Tente vender para manter no máximo 4 ou 5.`);
    const zag = e.filter(j => j.pos === 'ZAG');
    if (zag.length < 4) addNotif(`dp_zag_${tE}`, `Assistente Técnico: Defesa vulnerável! Temos apenas ${zag.length} zagueiro(s), contrate para ter pelo menos 4.`);
    else if (zag.length > 5) addNotif(`dp_zag_${tE}`, `Assistente Técnico: Excesso de Zagueiros (${zag.length}). Recomendado manter 4 ou 5.`);
    const mc = e.filter(j => j.pos === 'VOL' || j.pos === 'MC');
    if (mc.length < 4) addNotif(`dp_mc_${tE}`, `Assistente Técnico: Meio-campo despovoado. Temos apenas ${mc.length} jogadores centrais (VOL/MC). Contrate para ter no mínimo 4.`);
    const mei = e.filter(j => j.pos === 'MEI');
    const meiBase = mei.filter(j => j.situacao === 'Base').length;
    if (mei.length < 2) addNotif(`dp_mei_${tE}`, `Assistente Técnico: Faltam meias armadores (MEI). Temos apenas ${mei.length}, o ideal são 2.`);
    else if (mei.length > 3 || (mei.length === 3 && meiBase === 0)) addNotif(`dp_mei_${tE}`, `Assistente Técnico: Muitos armadores (MEI). Temos ${mei.length}, o ideal são 2 (ou 3 com uma promessa).`);
    const pnt = e.filter(j => ['ME', 'MD', 'PE', 'PD'].includes(j.pos));
    const pntBase = pnt.filter(j => j.situacao === 'Base').length;
    if (pnt.length < 4) addNotif(`dp_pnt_${tE}`, `Assistente Técnico: Faltam jogadores de beirada (ME/MD/PE/PD). Temos ${pnt.length}, o mínimo recomendado são 4.`);
    else if (pnt.length > 5 || (pnt.length === 5 && pntBase === 0)) addNotif(`dp_pnt_${tE}`, `Assistente Técnico: Excesso de pontas/alas (${pnt.length}). Tente manter 4, ou 5 se tiver jovens da base.`);
}

function verificarNotificacoes() {
    const s = getSeason();
    if (!s.inbox) s.inbox = [];
    const dA = s.dataAtual.split('-');
    const isM = ['01', '07', '08'].includes(dA[1]);
    s.jogadores.forEach((j, i) => {
        let n = `${j.primeiroNome} ${j.sobrenome}`;
        if (j.contAnos === 0 && j.contMeses === 6) addNotif(`c6_${i}_${s.dataAtual}`, `Pré-Contrato: ${n} entra nos últimos 6 meses.`);
        if (j.contAnos === 0 && j.contMeses === 1) addNotif(`c1_${i}_${s.dataAtual}`, `URGENTE: Contrato de ${n} expira neste mês!`);
        if (j.contAnos === 0 && j.contMeses === 0 && ['Elenco', 'Vender', 'Emprestar'].includes(j.situacao)) addNotif(`c0_${i}_${s.dataAtual}`, `CONTRATO EXPIRADO: O vínculo oficial de ${n} chegou ao fim. Renove imediatamente ou ele poderá assinar com outra equipe de graça.`);
        if (j.situacao === 'Emprest. - IN' && j.contAnos === 0 && j.contMeses === 1) addNotif(`ei_${i}_${s.dataAtual}`, `Fim de Empréstimo: ${n} (IN) se encerra ao final do mês.`);
        if (j.situacao === 'Emprest. - OUT' && j.contAnos === 0 && j.contMeses === 0) addNotif(`eo_${i}_${s.dataAtual}`, `Retorno: ${n} (OUT) está voltando de empréstimo.`);
    });
    let dm = `${dA[1]}-${dA[2]}`;
    if (['01-01', '07-01'].includes(dm)) addNotif(`jA_${dA[1]}_${dA[0]}`, `A Janela de Transferências abriu hoje!`);
    if (['01-29', '08-29'].includes(dm)) addNotif(`jF_${dA[1]}_${dA[0]}`, `Atenção: Faltam apenas 2 dias para a janela de transferências fechar!`);
    verificarProfundidadeElenco(s);
    let j8 = 0;
    for (let i = 0; i < 8; i++)
        if (s.calendario.some(e => e.data === addDays(s.dataAtual, i))) j8++;
    if (j8 > 3) addNotif(`fd_${s.dataAtual}`, `Aviso do DM: Temos ${j8} jogos nos próximos 8 dias. Lembre-se de rodar o elenco para evitar fadiga extrema!`);
    if (!s.capitao) addNotif(`cp_${s.dataAtual}`, `Lembrete tático: Você não selecionou nenhum Capitão (C) na aba Táticas.`);
    if (s.verba && s.salario && s.salario > s.verba * 0.9) addNotif(`vb_${s.dataAtual}`, `Aviso Financeiro: A folha salarial está quase esgotando nossa verba total.`);
    if (dA[2] === '01') addNotif(`bs_${dA[1]}_${dA[0]}`, `Relatório Mensal da Base: Acesse o EA FC e registre as promessas recém chegadas.`);
    if (dA[2] === '15') addNotif(`pl_${dA[1]}_${dA[0]}`, `Lembrete Mensal: Verifique se algum jovem da base evoluiu o OVR no Plano de Desenvolvimento.`);
    s.jogadores.filter(j => j.situacao === 'Base' && j.idade >= 18 && j.ovr < 65).forEach((j, i) => addNotif(`es_${i}_${s.dataAtual}`, `Olheiro avisa: ${j.primeiroNome} atingiu 18 anos mas continua com OVR muito baixo. Avalie o futuro do garoto.`));
    if (s.calendario.some(e => e.data === s.dataAtual)) addNotif(`jg_${s.dataAtual}`, `Hoje é dia de jogo! Revise as Táticas e prepare-se.`);
    let tmrw = addDays(s.dataAtual, 1);
    if (s.calendario.some(e => e.data === tmrw)) addNotif(`jg_tmrw_${s.dataAtual}`, `Lembrete de Véspera: Temos um compromisso agendado para amanhã. Ajuste o time e descanse os titulares se necessário.`);
    if (dA[1] === '06' && !s.calendario.some(e => e.data > s.dataAtual)) addNotif(`ft_${s.dataAtual}`, `Fim da Temporada: Acesse as opções e clique em Avançar Temporada antes de rodar o calendário do EA FC!`);
    verificarEventosNarrativos(s);
    atualizarInboxVisual();
}

function toggleInbox() {
    const p = $('#inbox-panel');
    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
}

function atualizarInboxVisual() {
    const s = getSeason();
    if (!s.inbox) return;
    const ur = s.inbox.filter(m => !m.read).length;
    $('#inbox-badge').innerText = ur;
    $('#inbox-badge').style.display = ur > 0 ? 'block' : 'none';
    $('#inbox-list').innerHTML = [...s.inbox].reverse().map((m, i) => `<div class="inbox-msg ${m.read?'':'unread'}" onclick="marcarLida(${s.inbox.length-1-i})" style="position:relative;padding-right:25px;"><div style="font-size:0.7em;color:#94a3b8">${m.data.split('-').reverse().join('/')}</div>${m.txt}<button onclick="excluirNotificacao(event, ${s.inbox.length-1-i})" style="position:absolute;top:5px;right:5px;background:transparent;border:none;color:#ef4444;cursor:pointer;font-weight:bold;font-size:1.1em;" title="Excluir notificação">✖</button></div>`).join('');
}

function excluirNotificacao(event, i) {
    event.stopPropagation();
    getSeason().inbox.splice(i, 1);
    salvarDados();
    atualizarInboxVisual();
}

function marcarLida(i) {
    getSeason().inbox[i].read = !0;
    salvarDados();
    atualizarInboxVisual();
}

function marcarTodasLidas() {
    getSeason().inbox.forEach(m => m.read = !0);
    salvarDados();
    atualizarInboxVisual();
}

function limparNotificacoes() {
    getSeason().inbox = [];
    salvarDados();
    atualizarInboxVisual();
}

function consolidarEdicoes() {
    if (!modoEdicao) return;
    if ($('#edit-verba')) getSeason().verba = parseInt($('#edit-verba').value) || 0;
    if ($('#edit-salario')) getSeason().salario = parseInt($('#edit-salario').value) || 0;
    if ($('#edit-squad-name')) appData.elencos[appData.indiceAtivo].nome = $('#edit-squad-name').value;
    $$('.card').forEach(c => {
        const i = c.getAttribute('data-index');
        if (i === null) return;
        const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
        const j = src[+i];
        if (!j) return;
        const sv = s => c.querySelector(s)?.value ?? null;
        let v;
        ['situacao', 'status', 'primeiroNome', 'sobrenome', 'num', 'pos', 'pe'].forEach(f => {
            if ((v = sv(`[data-field="${f}"]`)) !== null) j[f] = v;
        });
        if (j.situacao === 'Emprest. - OUT') {
            j.status = 'Não Relacionado';
        }
        ['contAnos', 'contMeses', 'multa', 'valor', 'salario'].forEach(f => {
            if ((v = sv(`[data-field="${f}"]`)) !== null) j[f] = parseInt(v) || 0;
        });
        ['dr', 'pr'].forEach(f => {
            if ((v = sv(`[data-field="${f}"]`)) !== null) j[f] = parseInt(v) || 1;
        });
    });
    let sn = getSeason();
    if (sn && sn.jogadores) {
        let toMove = sn.jogadores.filter(j => j.situacao === 'Emprest. - IN' && +j.contAnos === 0 && +j.contMeses === 0);
        if (toMove.length > 0) {
            toMove.forEach(j => {
                j.situacao = 'Empréstimo';
                j.status = 'Prioridade';
                sn.mercado = sn.mercado || [];
                sn.mercado.unshift(j);
                let idx = sn.jogadores.indexOf(j);
                if (idx > -1) sn.jogadores.splice(idx, 1);
                if (sn.lineup) {
                    for (let k in sn.lineup) {
                        if (sn.lineup[k] === j) delete sn.lineup[k];
                    }
                }
            });
            toMove.forEach((j, idx) => {
                addNotif(`retorno_in_${j.primeiroNome}_${sn.dataAtual}_${idx}`, `Fim de Empréstimo: O contrato de ${j.primeiroNome} ${j.sobrenome} acabou e ele retornou ao clube de origem (Movido para Alvos).`);
            });
        }
    }
    salvarDados();
}

const abrirUpload = i => {
    consolidarEdicoes();
    imgUploadIdx = i;
    $('#img-upload').click();
};
