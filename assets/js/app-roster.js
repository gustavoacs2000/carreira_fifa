function processarImg(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const cvs = document.createElement('canvas'),
                ctx = cvs.getContext('2d');
            let w = img.width,
                h = img.height,
                max = 64;
            if (w > h) {
                if (w > max) { h *= max / w; w = max; }
            } else {
                if (h > max) { w *= max / h; h = max; }
            }
            cvs.width = w; cvs.height = h;
            ctx.fillStyle = "#1e293b"; ctx.fillRect(0, 0, w, h); // fallback background for transparent pngs
            ctx.drawImage(img, 0, 0, w, h);
            const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
            const j = src[imgUploadIdx];
            if (j) j.img = cvs.toDataURL('image/jpeg', 0.6);
            salvarDados();
            renderizar();
        };
        img.src = ev.target.result;
    };
    r.readAsDataURL(f);
    e.target.value = '';
}

const toggleAcc = b => {
    const c = b.nextElementSibling;
    c.classList.toggle('open');
    b.innerHTML = c.classList.contains('open') ? '▲ Ocultar' : '▼ Finanças e Contrato';
};

function toggleEdit() {
    if (modoEdicao) consolidarEdicoes();
    modoEdicao = !modoEdicao;
    selCards = [];
    $('#btn-editar').innerHTML = modoEdicao ? "💾" : "✏️";
    renderizar();
}

function mudarAba(a) {
    if (modoEdicao) toggleEdit();
    abaAtiva = a;
    selCards = [];
    $$('.sidebar-menu a').forEach(el => el.classList.remove('ativo'));
    $('#link-' + a).classList.add('ativo');
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
    };
    filtroRenovacaoAtivo = !1;
    snapshotVisualizando = null;
    subAbaMercado = 'alvos';
    renderizar();
}
const trocarElenco = () => {
    if (modoEdicao) toggleEdit();
    appData.indiceAtivo = $('#squad-select').selectedIndex;
    selCards = [];
    snapshotVisualizando = null;
    compsSelecionadas = [];
    editComp = '';
    syncCal();
    salvarDados();
    renderizar();
};
const trocarTemporada = () => {
    if (modoEdicao) toggleEdit();
    appData.elencos[appData.indiceAtivo].temporadaAtiva = $('#season-select').selectedIndex;
    selCards = [];
    snapshotVisualizando = null;
    compsSelecionadas = [];
    editComp = '';
    syncCal();
    salvarDados();
    renderizar();
};
const adicionarElenco = () => {
    const n = prompt("Nome do novo elenco:");
    if (n) {
        appData.elencos.push({
            nome: n,
            temporadas: [{
                nome: "Temporada 1",
                jogadores: [],
                mercado: [],
                lineup: {},
                calendario: [],
                dataAtual: "2025-07-01",
                inbox: [],
                livroCaixa: [],
                verba: 1e8,
                salario: 5e5
            }],
            temporadaAtiva: 0,
            historico: []
        });
        appData.indiceAtivo = appData.elencos.length - 1;
        selCards = [];
        snapshotVisualizando = null;
        compsSelecionadas = [];
        editComp = '';
        syncCal();
        salvarDados();
        renderizar();
    }
};
const excluirElencoAtual = () => {
    if (appData.elencos.length <= 1) return alert("Não pode excluir o último elenco!");
    if (confirm("Deseja excluir este elenco?")) {
        appData.elencos.splice(appData.indiceAtivo, 1);
        appData.indiceAtivo = Math.max(0, appData.indiceAtivo - 1);
        salvarDados();
        renderizar();
    }
};
const excluirTemporadaAtual = () => {
    const e = appData.elencos[appData.indiceAtivo];
    if (e.temporadas.length <= 1) return alert("Não é possível excluir a única temporada!");
    if (confirm("Excluir temporada?")) {
        e.temporadas.splice(e.temporadaAtiva, 1);
        e.temporadaAtiva = Math.max(0, Math.min(e.temporadaAtiva, e.temporadas.length - 1));
        salvarDados();
        renderizar();
    }
};

const getBg = v => v < 60 ? 'bg-baixo' : v < 70 ? 'bg-medio' : v < 86 ? 'bg-bom' : 'bg-otimo';
const formatMoney = v => v >= 1e6 ? '€' + (v / 1e6).toFixed(1).replace('.0', '') + 'M' : '€' + (v / 1e3).toFixed(1).replace('.0', '') + 'K';
const getStatusEmoji = s => ({
    'Titular': '⚽',
    'Reserva': '🪑',
    'Não Relacionado': '🚫',
    'Prioridade': '🟢',
    'Alternativa': '🟡',
    'Fim de Contrato': '🔴'
})[s] || '⚽';
const getSituacaoClass = s => ({
    'Elenco': 's-elenco',
    'Emprest. - IN': 's-in',
    'Emprest. - OUT': 's-out',
    'Base': 's-base',
    'Observação': 's-obs',
    'Empréstimo': 's-emp',
    'Transferência': 's-transf'
})[s] || 's-base';
const toggleSortDirection = () => {
    consolidarEdicoes();
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    renderizar(true);
};
const toggleFiltro = (t, v) => {
    consolidarEdicoes();
    filtros[t] = filtros[t].includes(v) ? filtros[t].filter(i => i !== v) : [...filtros[t], v];
    renderizar();
};
window.toggleSel = i => {
    consolidarEdicoes();
    if (selCards.includes(i)) selCards = selCards.filter(x => x !== i);
    else selCards.push(i);
    renderizar(true);
};

const renderizarDashboard = (f) => {
    const s = getSeason(),
        sum = k => f.reduce((a, j) => a + (parseInt(j[k]) || 0), 0);
    $('#dashboard').innerHTML = `<div class="metric-card"><span class="metric-label">Total</span><span class="metric-val">${f.length}</span></div><div class="metric-card"><span class="metric-label">Média OVR</span><span class="metric-val">${f.length?(sum('ovr')/f.length).toFixed(1):0}</span></div><div class="metric-card"><span class="metric-label">Verba Disp.</span><span class="metric-val">${modoEdicao?`<input type="number" id="edit-verba" value="${s.verba}">`:formatMoney(s.verba)}</span></div><div class="metric-card"><span class="metric-label">Salário Disp.</span><span class="metric-val">${modoEdicao?`<input type="number" id="edit-salario" value="${s.salario}">`:formatMoney(s.salario)}</span></div><div class="metric-card"><span class="metric-label">${abaAtiva==='mercado'?'Valor Alvos':'Valor Total'}</span><span class="metric-val">${formatMoney(sum('valor'))}</span></div><div class="metric-card"><span class="metric-label">${abaAtiva==='mercado'?'Salário Alvos':'Salário Total'}</span><span class="metric-val">${formatMoney(sum('salario'))}</span></div>`;
};

const excluirAbaTodo = () => {
    let t = abaAtiva === 'jogadores' ? 'o ELENCO' : abaAtiva === 'base' ? 'a BASE' : 'o MERCADO';
    if (confirm(`Excluir todos os listados n${t}?`)) {
        if (abaAtiva === 'mercado') getSeason().mercado = [];
        else if (abaAtiva === 'base') getSeason().jogadores = getSeason().jogadores.filter(j => j.situacao !== 'Base');
        else {
            getSeason().jogadores = getSeason().jogadores.filter(j => j.situacao === 'Base');
            getSeason().lineup = {};
        }
        salvarDados();
        renderizar();
    }
};
window.excluirSel = () => {
    if (!selCards.length || !confirm(`Excluir ${selCards.length} jogador(es)?`)) return;
    consolidarEdicoes();
    const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
    selCards.sort((a, b) => b - a).forEach(i => {
        const r = src.splice(i, 1)[0];
        if (src === getSeason().jogadores) {
            const l = getSeason().lineup;
            for (let k in l)
                if (l[k] === r) delete l[k];
        }
    });
    selCards = [];
    salvarDados();
    renderizar();
};


function importarCSV(e) {
    consolidarEdicoes();
    if (!e.target.files[0]) return;
    const r = new FileReader();
    r.onload = ev => {
        ev.target.result.split('\n').slice(1).forEach(row => {
            const c = row.trim().split(',');
            if (c.length >= 24) getSeason()[abaAtiva === 'mercado' ? 'mercado' : 'jogadores'].push({
                primeiroNome: c[0],
                sobrenome: c[1],
                num: c[2],
                pos: c[3],
                status: c[4],
                situacao: c[5],
                idade: +c[6],
                alt: +c[7],
                pe: c[8],
                contAnos: +c[9],
                contMeses: +c[10],
                multa: +c[11],
                valor: +c[12],
                salario: +c[13],
                ovr: +c[14],
                pot: +c[15],
                dr: +c[16],
                pr: +c[17],
                s: [+c[18], +c[19], +c[20], +c[21], +c[22], +c[23]],
                est: {}
            });
        });
        salvarDados();
        renderizar();
        alert("Importação concluída para a aba " + (abaAtiva === 'mercado' ? 'Mercado' : abaAtiva === 'base' ? 'Base' : 'Elenco') + "!");
    };
    r.readAsText(e.target.files[0]);
    e.target.value = "";
}

function acionarImportarCSV() {
    if (abaAtiva === 'calendario') {
        $('#csvCalendarFileInput').click();
    } else {
        $('#csvFileInput').click();
    }
}

function importarCalendarioCSV(e) {
    consolidarEdicoes();
    if (!e.target.files[0]) return;
    const r = new FileReader();
    r.onload = ev => {
        let cal = getSeason().calendario || [];
        ev.target.result.split('\n').slice(1).forEach(row => {
            const c = row.trim().split(',');
            if (c.length >= 5 && c[0] && c[1]) {
                cal.push({
                    id: cal.length ? Math.max(...cal.map(x => x.id)) + 1 : 1,
                    data: c[0],
                    adversario: c[1],
                    mando: c[2] || 'C',
                    rodada: c[3] || '',
                    campeonato: c[4] || '',
                    gp: c[5] || '',
                    gc: c[6] || ''
                });
            }
        });
        getSeason().calendario = cal;
        salvarDados();
        renderizar();
        alert("Importação de calendário concluída!");
    };
    r.readAsText(e.target.files[0]);
    e.target.value = "";
}

window.adicionarJogador = function() {
    try {
        const isM = abaAtiva === 'mercado',
            isB = abaAtiva === 'base';
        let pos = filtros.pos[0] || "ATA",
            sit = filtros.sit[0] || (isM ? "Observação" : isB ? "Base" : "Elenco"),
            st = filtros.status[0] || (isM ? "Alternativa" : isB ? "Não Relacionado" : "Titular");
        let id = 20, alt = 180, pe = "Dir.", dr = 3, pr = 3, cA = 0, cM = 0, sal = 10000, val = 10000000, mul = 0, ovr = 65, pot = 85;
        if (isB || sit === "Base") {
            id = 15; alt = 175; dr = 2; pr = 2; cA = 3; sal = 1500; val = 1000000; ovr = 60; pot = 90;
        }
        getSeason()[isM ? 'mercado' : 'jogadores'].push({
            primeiroNome: "Novo", sobrenome: isM ? "Alvo" : "Jogador", num: "-", pos: pos, status: st, situacao: sit,
            idade: id, alt: alt, pe: pe, contAnos: cA, contMeses: cM, multa: mul, valor: val, salario: sal,
            ovr: ovr, pot: pot, dr: dr, pr: pr, s: [60, 60, 60, 60, 60, 60], est: {}
        });
        salvarDados();
        renderizar();
        mostrarToast("Novo jogador adicionado!");
    } catch(e) { console.error(e); mostrarToast("Erro ao adicionar jogador", true); }
}

window.excluirJogador = function(i) {
    if (confirm("Deseja mesmo excluir este card?")) {
        try {
            consolidarEdicoes();
            const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
            const r = src.splice(i, 1)[0];
            if (src === getSeason().jogadores) {
                const l = getSeason().lineup;
                for (let k in l) if (l[k] === r) delete l[k];
            }
            salvarDados();
            renderizar();
            mostrarToast("Jogador excluído com sucesso.");
        } catch(e) { console.error(e); mostrarToast("Erro ao excluir", true); }
    }
}

function alterarValor(i, c, d, s = null, mn = 1, mx = 99) {
    consolidarEdicoes();
    const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
    const j = src[i];
    if (s !== null) j.s[s] = Math.min(mx, Math.max(mn, j.s[s] + d));
    else if (['multa', 'valor', 'salario'].includes(c)) j[c] = Math.max(0, parseInt(j[c] || 0) + d * 1e5);
    else j[c] = Math.min(mx, Math.max(mn, parseInt(j[c] || 0) + d));
    salvarDados();
    renderizar();
}

const mudarMesCal = d => {
    mesAtualCal += d;
    if (mesAtualCal > 11) {
        mesAtualCal = 0;
        anoAtualCal++;
    } else if (mesAtualCal < 0) {
        mesAtualCal = 11;
        anoAtualCal--;
    }
    renderizar();
};
