function registrarLivroCaixa(tp, n, c, v) {
    const s = getSeason();
    s.livroCaixa = s.livroCaixa || [];
    s.livroCaixa.push({
        tipo: tp,
        nome: n,
        clube: c || 'Desconhecido',
        valor: v,
        data: s.dataAtual
    });
}

function abrirLivroCaixa() {
    const s = getSeason();
    if (s.livroCaixa) {
        let map = new Map();
        s.livroCaixa.forEach(t => {
            let key = `${t.tipo}-${t.nome}`;
            map.set(key, t);
        });
        let uniq = Array.from(map.values());
        if (uniq.length !== s.livroCaixa.length) {
            s.livroCaixa = uniq;
            salvarDados();
        }
    }
    const lc = s.livroCaixa || [];
    let g = 0,
        r = 0;
    lc.forEach(t => {
        if (t.tipo.includes('Compra')) g += t.valor;
        if (t.tipo.includes('Venda')) r += t.valor;
    });
    let lu = r - g;
    $('#livro-caixa-dash').innerHTML = `<div class="metric-card" style="flex:1;background:#1e293b"><span class="metric-label">Gasto Total</span><span class="metric-val" style="color:#ef4444">${formatMoney(g)}</span></div><div class="metric-card" style="flex:1;background:#1e293b"><span class="metric-label">Receita Total</span><span class="metric-val" style="color:#10b981">${formatMoney(r)}</span></div><div class="metric-card" style="flex:1;background:#1e293b"><span class="metric-label">Lucro/Prejuízo</span><span class="metric-val" style="color:${lu>=0?'#10b981':'#ef4444'}">${formatMoney(lu)}</span></div>`;
    $('#livro-caixa-list').innerHTML = lc.length === 0 ? '<div style="text-align:center;padding:20px;color:#94a3b8">Nenhuma movimentação registrada.</div>' : lc.slice().reverse().map(t => {
        const isE = t.tipo.includes('Compra') || t.tipo.includes('IN');
        return `<div style="display:flex;align-items:center;padding:10px;border-bottom:1px solid #1e293b;gap:10px"><div style="font-size:1.5em">${isE?'🔻':'⬆️'}</div><div style="flex:1"><div style="font-weight:700">${t.nome}</div><div style="font-size:0.8em;color:#94a3b8">${t.tipo} • ${t.clube}</div></div><div style="text-align:right"><div style="font-weight:700;color:${isE?'#ef4444':'#10b981'}">${isE?'-':'+'}${formatMoney(t.valor)}</div><div style="font-size:0.75em;color:#cbd5e1">${t.data.split('-').reverse().join('/')}</div></div></div>`;
    }).join('');
    $('#modal-livro-caixa').style.display = 'flex';
}

function mudarTipoNegocio(t) {
    $('#modal-negociar-tipo').value = t;
    $('#btn-tipo-venda').classList.toggle('ativo', t === 'venda');
    $('#btn-tipo-emprestimo').classList.toggle('ativo', t === 'emprestimo');
    $('#form-venda').style.display = t === 'venda' ? 'flex' : 'none';
    $('#form-emprestimo').style.display = t === 'emprestimo' ? 'flex' : 'none';
}

function abrirModalNegociar(i) {
    consolidarEdicoes();
    const j = getSeason().jogadores[i];
    $('#modal-negociar-idx').value = i;
    $('#modal-negociar-nome').innerHTML = `${j.primeiroNome} <span style="color:#fbbf24;">${j.sobrenome}</span>`;
    $('#modal-negociar-valor-venda').value = j.valor || 0;
    $('#modal-negociar-clube-venda').value = '';
    $('#modal-negociar-clube-emp').value = '';
    $('#modal-negociar-emp-anos').value = 1;
    $('#modal-negociar-emp-meses').value = 0;
    $('#modal-negociar-tem-opcao').checked = !1;
    $('#div-opcao-valor').style.display = 'none';
    $('#modal-negociar-opcao-valor').value = j.valor || 0;
    mudarTipoNegocio('venda');
    $('#modal-negociar').style.display = 'flex';
}

function fecharModalNegociar() {
    $('#modal-negociar').style.display = 'none';
}

function confirmarNegocio() {
    const idx = $('#modal-negociar-idx').value;
    if (idx === "") return;
    const s = getSeason(),
        j = s.jogadores[+idx],
        tp = $('#modal-negociar-tipo').value;
    if (tp === 'venda') {
        const val = +$('#modal-negociar-valor-venda').value || 0,
            clu = $('#modal-negociar-clube-venda').value;
        s.verba += val;
        s.salario += +j.salario || 0;
        registrarLivroCaixa('Venda', `${j.primeiroNome} ${j.sobrenome}`, clu, val);
        s.jogadores.splice(+idx, 1);
        if (s.lineup)
            for (let k in s.lineup)
                if (s.lineup[k] === j) delete s.lineup[k];
    } else {
        const clu = $('#modal-negociar-clube-emp').value;
        j.situacao = 'Emprest. - OUT';
        j.empClube = clu;
        j.empAnos = +$('#modal-negociar-emp-anos').value || 0;
        j.empMeses = +$('#modal-negociar-emp-meses').value || 0;
        j.empOpcaoCompra = $('#modal-negociar-tem-opcao').checked;
        j.empValorCompra = j.empOpcaoCompra ? (+$('#modal-negociar-opcao-valor').value || 0) : 0;
        j.status = 'Não Relacionado';
        registrarLivroCaixa('Empréstimo (OUT)', `${j.primeiroNome} ${j.sobrenome}`, clu, 0);
        if (s.lineup)
            for (let k in s.lineup)
                if (s.lineup[k] === j) delete s.lineup[k];
    }
    salvarDados();
    fecharModalNegociar();
    renderizar();
}

function mudarTipoContrato(t) {
    $('#modal-contratar-tipo').value = t;
    $('#btn-tipo-compra').classList.toggle('ativo', t === 'compra');
    $('#btn-tipo-emp-in').classList.toggle('ativo', t === 'emprestimo');
    $('#form-compra').style.display = t === 'compra' ? 'flex' : 'none';
    $('#form-emp-in').style.display = t === 'emprestimo' ? 'flex' : 'none';
}

function abrirModalContratar(i) {
    consolidarEdicoes();
    const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
    const j = src[i];
    $('#modal-contratar-idx').value = i;
    $('#modal-contratar-nome').innerHTML = `${j.primeiroNome} <span style="color:#fbbf24;">${j.sobrenome}</span>`;
    $('#modal-contratar-valor-compra').value = j.valor || 0;
    $('#modal-contratar-salario-compra').value = j.salario || 0;
    $('#modal-contratar-clube-compra').value = '';
    $('#modal-contratar-anos').value = 3;
    $('#modal-contratar-meses').value = 0;
    $('#modal-contratar-clube-origem').value = '';
    $('#modal-contratar-emp-in-anos').value = 1;
    $('#modal-contratar-emp-in-meses').value = 0;
    $('#modal-contratar-salario-emp-in').value = j.salario || 0;
    $('#modal-contratar-tem-opcao').checked = !1;
    $('#div-opcao-in-valor').style.display = 'none';
    $('#modal-contratar-opcao-in-valor').value = j.valor || 0;
    mudarTipoContrato('compra');
    $('#modal-contratar').style.display = 'flex';
}

function fecharModalContratar() {
    $('#modal-contratar').style.display = 'none';
}

function confirmarContrato() {
    const idx = $('#modal-contratar-idx').value;
    if (idx === "") return;
    const s = getSeason(),
        src = subAbaMercado === 'alvos' ? s.mercado : s.jogadores,
        j = src[+idx],
        tp = $('#modal-contratar-tipo').value;
    if (tp === 'compra') {
        const val = +$('#modal-contratar-valor-compra').value || 0,
            clu = $('#modal-contratar-clube-compra').value,
            sal = +$('#modal-contratar-salario-compra').value || 0;
        s.verba -= val;
        s.salario -= sal;
        j.salario = sal;
        j.contAnos = +$('#modal-contratar-anos').value || 0;
        j.contMeses = +$('#modal-contratar-meses').value || 0;
        j.status = "Reserva";
        j.num = "-";
        j.situacao = "Elenco";
        registrarLivroCaixa('Compra', `${j.primeiroNome} ${j.sobrenome}`, clu, val);
        s.jogadores.push(j);
        src.splice(+idx, 1);
    } else {
        const clu = $('#modal-contratar-clube-origem').value,
            sal = +$('#modal-contratar-salario-emp-in').value || 0;
        s.salario -= sal;
        j.salario = sal;
        j.contAnos = +$('#modal-contratar-emp-in-anos').value || 0;
        j.contMeses = +$('#modal-contratar-emp-in-meses').value || 0;
        j.empClube = clu;
        j.empOpcaoCompra = $('#modal-contratar-tem-opcao').checked;
        j.empValorCompra = j.empOpcaoCompra ? (+$('#modal-contratar-opcao-in-valor').value || 0) : 0;
        j.status = "Reserva";
        j.num = "-";
        j.situacao = "Emprest. - IN";
        registrarLivroCaixa('Empréstimo (IN)', `${j.primeiroNome} ${j.sobrenome}`, clu, 0);
        s.jogadores.push(j);
        src.splice(+idx, 1);
    }
    salvarDados();
    fecharModalContratar();
    renderizar();
}

const abrirModalPromover = i => {
    consolidarEdicoes();
    const j = getSeason().jogadores[i];
    $('#modal-promover-idx').value = i;
    $('#modal-promover-nome').innerHTML = `${j.primeiroNome} <span style="color:#fbbf24;">${j.sobrenome}</span>`;
    $('#modal-promover-valor').value = j.valor || 0;
    $('#modal-promover-salario').value = j.salario || 0;
    $('#modal-promover-multa').value = j.multa || 0;
    $('#modal-promover').style.display = 'flex';
};
const fecharModalPromover = () => $('#modal-promover').style.display = 'none';

function confirmarPromocao() {
    const idx = $('#modal-promover-idx').value;
    if (idx === "") return;
    const j = getSeason().jogadores[+idx];
    j.salario = +$('#modal-promover-salario').value || 0;
    j.valor = +$('#modal-promover-valor').value || 0;
    j.multa = +$('#modal-promover-multa').value || 0;
    j.contAnos = +$('#modal-promover-anos').value || 3;
    j.contMeses = +$('#modal-promover-meses').value || 0;
    j.status = $('#modal-promover-status').value;
    j.situacao = "Elenco";
    salvarDados();
    fecharModalPromover();
    renderizar();
}

function renderizarAbaHistorico() {
    const e = appData.elencos[appData.indiceAtivo];
    let topHtml = `<div style="max-width:800px;margin:0 auto;padding:20px;"><h2 style="color:#fbbf24;text-align:center;border-bottom:2px solid #2d3748;padding-bottom:10px;margin-bottom:20px;">Histórico <button onclick="abrirLivroCaixa()" style="float:right;background:#10b981;color:#fff;border:none;padding:5px 10px;border-radius:5px;font-size:0.6em;cursor:pointer;margin-top:5px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 2px 4px rgba(0,0,0,.5)">📓 Livro-Caixa</button></h2>`;
    if (!e.historico?.length) return topHtml + `<div style="text-align:center;padding:40px;color:#94a3b8;font-size:1.2em;">Nenhum histórico disponível ainda.</div></div>`;
    if (snapshotVisualizando !== null) return renderizarSnapshotVisualizacao(snapshotVisualizando);
    return topHtml + `<div style="display:flex;flex-direction:column;gap:15px;">` + [...e.historico].reverse().map((s, r) => {
        const i = e.historico.length - 1 - r;
        return `<div class="historico-card"><div><div class="historico-title">${s.nome}</div><div class="historico-subtitle">Salvo em: ${s.data||'N/D'} | Jogadores: ${s.jogadores.length}</div></div><div style="display:flex;gap:8px;"><button class="btn-view-snap" onclick="visualizarSnapshot(${i})">👁️ Consultar</button><button class="btn-del-snap" onclick="excluirSnapshot(${i})">🗑️ Excluir</button></div></div>`
    }).join('') + `</div></div>`;
}

function renderizarSnapshotVisualizacao(idx) {
    const sn = appData.elencos[appData.indiceAtivo].historico[idx],
        l = sn[snapshotAbaSelecionada] || [];
    let btn = a => `<button style="padding:6px 12px;border-radius:6px;border:1px solid #fbbf24;cursor:pointer;font-weight:700;background:${snapshotAbaSelecionada===a?'#fbbf24':'transparent'};color:${snapshotAbaSelecionada===a?'#000':'#fbbf24'};" onclick="mudarAbaSnapshot('${a}')">${a.charAt(0).toUpperCase()+a.slice(1)}</button>`;
    let prmH = '';
    if (sn.premios) {
        const p = sn.premios;
        prmH = `<div style="display:flex;gap:10px;margin-bottom:20px;justify-content:center;flex-wrap:wrap;">${p.artilheiro?`<div style="background:#1e293b;padding:10px;border-radius:8px;text-align:center;border-top:3px solid #fbbf24;flex:1;min-width:140px"><h3 style="margin:0 0 5px 0;font-size:.9em;color:#cbd5e1">⚽ Artilheiro</h3><div style="font-weight:900;color:#fff;font-size:1.1em">${p.artilheiro.n}</div><div style="color:#fbbf24;font-size:.85em;font-weight:700">${p.artilheiro.v}</div></div>`:''}${p.garcom?`<div style="background:#1e293b;padding:10px;border-radius:8px;text-align:center;border-top:3px solid #3b82f6;flex:1;min-width:140px"><h3 style="margin:0 0 5px 0;font-size:.9em;color:#cbd5e1">👟 Garçom</h3><div style="font-weight:900;color:#fff;font-size:1.1em">${p.garcom.n}</div><div style="color:#3b82f6;font-size:.85em;font-weight:700">${p.garcom.v}</div></div>`:''}${p.revelacao?`<div style="background:#1e293b;padding:10px;border-radius:8px;text-align:center;border-top:3px solid #10b981;flex:1;min-width:140px"><h3 style="margin:0 0 5px 0;font-size:.9em;color:#cbd5e1">🌟 Revelação</h3><div style="font-weight:900;color:#fff;font-size:1.1em">${p.revelacao.n}</div><div style="color:#10b981;font-size:.85em;font-weight:700">${p.revelacao.v}</div></div>`:''}${p.contratacao?`<div style="background:#1e293b;padding:10px;border-radius:8px;text-align:center;border-top:3px solid #a855f7;flex:1;min-width:140px"><h3 style="margin:0 0 5px 0;font-size:.9em;color:#cbd5e1">💼 Contratação</h3><div style="font-weight:900;color:#fff;font-size:1.1em">${p.contratacao.n}</div><div style="color:#a855f7;font-size:.85em;font-weight:700">${p.contratacao.v}</div></div>`:''}${p.decepcao?`<div style="background:#1e293b;padding:10px;border-radius:8px;text-align:center;border-top:3px solid #ef4444;flex:1;min-width:140px"><h3 style="margin:0 0 5px 0;font-size:.9em;color:#cbd5e1">📉 Decepção</h3><div style="font-weight:900;color:#fff;font-size:1.1em">${p.decepcao.n}</div><div style="color:#ef4444;font-size:.85em;font-weight:700">${p.decepcao.v}</div></div>`:''}</div>`;
    }
    let hTop = `<div style="max-width:1200px;margin:0 auto;padding:10px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><button style="background:#4b5563;color:#fff;border:none;padding:8px 15px;border-radius:6px;cursor:pointer;font-weight:700;" onclick="fecharSnapshot()">⬅️ Voltar</button><h2 style="color:#fbbf24;margin:0;">Consulta: ${sn.nome}</h2><div style="display:flex;gap:10px;">${btn('jogadores')}${btn('mercado')}${btn('estatisticas')}</div></div>${prmH}`;
    if (snapshotAbaSelecionada === 'estatisticas') return hTop + renderizarEstatisticas(sn) + `</div>`;
    let cgSnap = `<colgroup><col width="60"><col width="auto"><col width="40"><col width="50"><col width="50"><col width="80"><col width="80"><col width="80"><col width="110"><col width="60"></colgroup>`;
    let h = `${hTop}<div class="table-container"><table class="table-view" style="table-layout:fixed;width:100%;">${cgSnap}<thead><tr><th>Posição</th><th>Jogador</th><th>Id</th><th>OVR</th><th>POT</th><th>Multa</th><th>Valor</th><th>Salário</th><th>Situação</th><th>Status</th></tr></thead><tbody>`;
    return h + (!l.length ? `<tr><td colspan="10" style="text-align:center;padding:20px;color:#94a3b8;">Nenhum dado salvo.</td></tr>` : l.map(j => {
        const stH = snapshotAbaSelecionada === 'jogadores' ? `<span style="font-weight:700;font-size:0.9em">${{'Titular':'TIT','Reserva':'RES','Não Relacionado':'N/R'}[j.status]||'N/R'}</span>` : `<span title="${j.status}" style="font-size:1.2em;">${getStatusEmoji(j.status)}</span>`;
        return `<tr><td><div class="pos-stat-box" style="font-size:.9em;padding:2px 4px;">${j.pos}</div></td><td class="nome-col">${j.primeiroNome} <span>${j.sobrenome}</span></td><td>${j.idade}</td><td><div class="stat-box ${getBg(j.ovr)}" style="display:inline-block;min-width:25px;padding:2px;">${j.ovr}</div></td><td><div class="stat-box ${getBg(j.pot)}" style="display:inline-block;min-width:25px;padding:2px;">${j.pot}</div></td><td>${formatMoney(j.multa)}</td><td>${formatMoney(j.valor)}</td><td>${formatMoney(j.salario)}</td><td><div class="status-faixa ${getSituacaoClass(j.situacao)}" style="margin:0;padding:2px 4px;font-size:.75em;background:${cSit[j.situacao]||'#15803d'}">${j.situacao}</div></td><td>${stH}</td></tr>`
    }).join('')) + `</tbody></table></div></div>`;
}

const toggleCompFilter = c => {
    if (compsSelecionadas.includes(c)) compsSelecionadas = compsSelecionadas.filter(x => x !== c);
    else compsSelecionadas.push(c);
    renderizar();
};
const salvarStat = (i, c, f, v) => {
    const j = getSeason().jogadores[i];
    j.est = j.est || {};
    j.est[c] = j.est[c] || {
        jogos: 0,
        gols: 0,
        ast: 0,
        sg: 0,
        ca: 0,
        cv: 0,
        media: 0
    };
    j.est[c][f] = parseFloat(v) || 0;
    salvarDados();
};
const sortStats = f => {
    sortStatsDir = sortStatsField === f ? (sortStatsDir === 'desc' ? 'asc' : 'desc') : 'desc';
    sortStatsField = f;
    renderizar();
};
const adicionarCompExtra = () => {
    const n = prompt("Nome da nova competição:");
    if (n) {
        const s = getSeason();
        s.compsExtras = s.compsExtras || [];
        if (!s.compsExtras.includes(n)) s.compsExtras.push(n);
        salvarDados();
        renderizar();
    }
};
const renomearCompExtra = () => {
    const n = $('#rename-comp-input').value.trim();
    if (!n || n === editComp) return;
    const s = getSeason();
    if (s.compsExtras) s.compsExtras = s.compsExtras.map(c => c === editComp ? n : c);
    if (s.calendario) s.calendario.forEach(c => {
        if (c.campeonato === editComp) c.campeonato = n;
    });
    s.jogadores.forEach(j => {
        if (j.est && j.est[editComp]) {
            j.est[n] = j.est[editComp];
            delete j.est[editComp];
        }
    });
    if (compsSelecionadas.includes(editComp)) compsSelecionadas = compsSelecionadas.map(c => c === editComp ? n : c);
    editComp = n;
    salvarDados();
    renderizar();
};
const excluirCompExtra = () => {
    if (!confirm(`Excluir a competição "${editComp}" e suas estatísticas?`)) return;
    const s = getSeason();
    if (s.compsExtras) s.compsExtras = s.compsExtras.filter(c => c !== editComp);
    if (s.calendario) s.calendario.forEach(c => {
        if (c.campeonato === editComp) c.campeonato = "Sem Competição";
    });
    s.jogadores.forEach(j => {
        if (j.est && j.est[editComp]) delete j.est[editComp];
    });
    compsSelecionadas = compsSelecionadas.filter(c => c !== editComp);
    editComp = '';
    salvarDados();
    renderizar();
};

function renderizarEstatisticas(sourceSeason = null) {
    const s = sourceSeason || getSeason(),
        isRead = !!sourceSeason || !modoEdicao;
    const comps = [...new Set([...Object.keys(getCompC()), ...(s.calendario || []).map(c => c.campeonato)])];
    if (!compsSelecionadas.length && comps.length) compsSelecionadas = [...comps];

    let jg = 0,
        v = 0,
        e = 0,
        d = 0,
        gp = 0,
        gc = 0;
    (s.calendario || []).forEach(c => {
        if (compsSelecionadas.includes(c.campeonato) && c.gp !== "" && c.gc !== "" && c.gp != null && c.gc != null) {
            jg++;
            gp += +c.gp;
            gc += +c.gc;
            if (+c.gp > +c.gc) v++;
            else if (+c.gp == +c.gc) e++;
            else d++;
        }
    });
    let sg = gp - gc;
    const tm = ($('#search-input') ? $('#search-input').value : '').toLowerCase();
    let uniqueSet = new Set();
    let uniqueJogadores = (s.jogadores || []).filter(j => {
        let key = `${j.primeiroNome}${j.sobrenome}`.toLowerCase().replace(/\s/g, '');
        if (uniqueSet.has(key)) return false;
        uniqueSet.add(key);
        return true;
    });
    let flt = uniqueJogadores.filter(j => (`${j.primeiroNome} ${j.sobrenome}`.toLowerCase().includes(tm)));

    let pStats = flt.map(j => {
        let st = {
            j: j,
            jogos: 0,
            gols: 0,
            ast: 0,
            sg: 0,
            ca: 0,
            cv: 0
        };
        let totJ = 0,
            sumMed = 0;
        compsSelecionadas.forEach(c => {
            if (j.est && j.est[c]) {
                st.jogos += j.est[c].jogos || 0;
                st.gols += j.est[c].gols || 0;
                st.ast += j.est[c].ast || 0;
                st.sg += j.est[c].sg || 0;
                st.ca += j.est[c].ca || 0;
                st.cv += j.est[c].cv || 0;
                let m = j.est[c].media !== undefined ? parseFloat(j.est[c].media) : (j.est[c].jogos ? (j.est[c].somaNotas || 0) / j.est[c].jogos : 0);
                sumMed += m * (j.est[c].jogos || 1);
                totJ += (j.est[c].jogos || 1);
            }
        });
        st.media = totJ ? (sumMed / totJ).toFixed(1) : '0.0';
        st.impacto = st.jogos ? ((st.gols + st.ast) / st.jogos).toFixed(2) : '0.00';
        return st;
    });
    pStats.sort((a, b) => {
        let vA, vB;
        if (['pos', 'sobrenome', 'ovr', 'valor', 'salario', 'evolucao', 'idade'].includes(sortStatsField)) {
            vA = a.j[sortStatsField];
            vB = b.j[sortStatsField];
            if (sortStatsField === 'sobrenome') {
                vA = vA.toLowerCase();
                vB = vB.toLowerCase();
            } else if (sortStatsField === 'ovr' || sortStatsField === 'valor' || sortStatsField === 'salario' || sortStatsField === 'idade') {
                vA = +vA;
                vB = +vB;
            } else if (sortStatsField === 'evolucao') {
                inicializarBases(a.j);
                inicializarBases(b.j);
                vA = a.j.ovr - a.j.baseOvr;
                vB = b.j.ovr - b.j.baseOvr;
            } else {
                const o = ["GOL", "LE", "ZAG", "LD", "VOL", "ME", "MC", "MEI", "MD", "PE", "ATA", "PD"];
                vA = o.indexOf(vA);
                vB = o.indexOf(vB);
            }
        } else {
            vA = sortStatsField === 'media' ? +a.media : sortStatsField === 'impacto' ? +a.impacto : a[sortStatsField];
            vB = sortStatsField === 'media' ? +b.media : sortStatsField === 'impacto' ? +b.impacto : b[sortStatsField];
        }
        return vA < vB ? (sortStatsDir === 'asc' ? -1 : 1) : vA > vB ? (sortStatsDir === 'asc' ? 1 : -1) : 0;
    });
    if (!editComp && comps.length) editComp = comps[0];

    let html = `<div style="max-width:1200px;margin:0 auto;"><div class="filtros-container" style="text-align:center;margin-bottom:15px;display:block;padding:12px;"><div style="color:#fbbf24;font-weight:700;margin-bottom:10px;text-transform:uppercase;font-size:0.85em;">Filtros de Competição</div><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">${comps.map(c => `<button class="filtro-btn ${compsSelecionadas.includes(c)?'ativo':''}" onclick="toggleCompFilter('${c}')">${c}</button>`).join('')}</div></div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:20px;"><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Jogos</span><span class="metric-val" style="color:#fff">${jg}</span></div><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Vitórias</span><span class="metric-val" style="color:#10b981">${v}</span></div><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Empates</span><span class="metric-val" style="color:#94a3b8">${e}</span></div><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Derrotas</span><span class="metric-val" style="color:#ef4444">${d}</span></div><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Gols Pró</span><span class="metric-val" style="color:#3b82f6">${gp}</span></div><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Gols Contra</span><span class="metric-val" style="color:#f59e0b">${gc}</span></div><div class="metric-card" style="flex:1;min-width:100px;"><span class="metric-label">Saldo</span><span class="metric-val" style="color:#fff">${sg}</span></div></div>`;

    if (!isRead) html += `<div style="text-align:center;margin-bottom:15px;display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;"><label style="color:#fbbf24;font-weight:700;">Editando Competição:</label><select id="stat-edit-comp" onchange="editComp=this.value; renderizar()" style="padding:6px;border-radius:6px;background:#0f172a;color:#fff;border:1px solid #fbbf24;">${comps.map(c=>`<option value="${c}" ${c===editComp?'selected':''}>${c}</option>`).join('')}</select><button onclick="abrirModalCompeticoes()" style="background:#15803d;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:700;margin-left:10px;">Gerenciar Competições</button></div>`;

    const th = (f, l) => `<th onclick="sortStats('${f}')" style="cursor:pointer;white-space:nowrap;${f==='sobrenome'?'text-align:left':''}">${l} ${sortStatsField===f?(sortStatsDir==='desc'?'⬇️':'⬆️'):''}</th>`;
    let cgEst = `<colgroup><col width="45"><col width="auto"><col width="65"><col width="65"><col width="40"><col width="45"><col width="50"><col width="40"><col width="40"><col width="40"><col width="45"><col width="35"><col width="35"><col width="50"><col width="55"></colgroup>`;

    html += `<style>.table-est th, .table-est td { padding: 10px 4px !important; font-size: 0.85em; }</style>`;
    html += `<div class="table-container" style="max-width:980px;margin:0 auto;"><table class="table-view table-est" style="table-layout:fixed;width:100%;">${cgEst}<thead><tr>${th('pos','POS')}${th('sobrenome','JOGADOR')}${th('valor','VALOR')}${th('salario','SALÁRIO')}${th('idade','ID.')}${th('ovr','OVR')}${th('evolucao','EVOL.')}${th('jogos','J')}${th('gols','G')}${th('ast','A')}${th('sg','SSG')}${th('ca','🟨')}${th('cv','🟥')}${th('media','MÉDIA')}${th('impacto','IMP.')}</tr></thead><tbody>`;

    html += pStats.map(st => {
        let j = st.j,
            i = s.jogadores.indexOf(j);
        inicializarBases(j);
        let dO = j.ovr - j.baseOvr;
        let dH = dO > 0 ? `<span style="color:#10b981;font-weight:900;">+${dO}</span>` : dO < 0 ? `<span style="color:#ef4444;font-weight:900;">${dO}</span>` : `<span style="color:#475569">-</span>`;
        if (!isRead) {
            let jEst = (j.est && j.est[editComp]) ? j.est[editComp] : {
                jogos: 0,
                gols: 0,
                ast: 0,
                sg: 0,
                ca: 0,
                cv: 0,
                media: 0
            };
            let med = jEst.media !== undefined ? parseFloat(jEst.media).toFixed(1) : (jEst.jogos ? (jEst.somaNotas / jEst.jogos).toFixed(1) : '0.0');
            const inp = f => `<input type="number" value="${jEst[f]||0}" style="width:35px;text-align:center;background:#0f172a;color:#fbbf24;border:1px solid #334155;border-radius:4px;padding:2px;" onblur="salvarStat(${i},'${editComp}','${f}',this.value)">`;
            const inpMed = `<input type="number" step="0.1" min="5.0" max="10.0" value="${med}" style="width:45px;text-align:center;background:#0f172a;color:#fbbf24;border:1px solid #334155;border-radius:4px;padding:2px;" onblur="salvarStat(${i},'${editComp}','media',this.value)">`;
            return `<tr><td><div class="pos-stat-box" style="font-size:.8em;padding:2px 4px;">${j.pos}</div></td><td class="nome-col">${j.primeiroNome} <span>${j.sobrenome}</span></td><td style="color:#cbd5e1">${formatMoney(j.valor)}</td><td style="color:#cbd5e1">${formatMoney(j.salario)}</td><td>${j.idade}</td><td><div class="stat-box ${getBg(j.ovr)}" style="display:inline-block;padding:2px 4px;">${j.ovr}</div></td><td>${dH}</td><td>${inp('jogos')}</td><td>${inp('gols')}</td><td>${inp('ast')}</td><td>${inp('sg')}</td><td>${inp('ca')}</td><td>${inp('cv')}</td><td>${inpMed}</td><td style="font-weight:700;color:#fbbf24">${st.impacto}</td></tr>`;
        } else {
            return `<tr><td><div class="pos-stat-box" style="font-size:.8em;padding:2px 4px;">${j.pos}</div></td><td class="nome-col">${j.primeiroNome} <span>${j.sobrenome}</span></td><td style="color:#cbd5e1">${formatMoney(j.valor)}</td><td style="color:#cbd5e1">${formatMoney(j.salario)}</td><td>${j.idade}</td><td><div class="stat-box ${getBg(j.ovr)}" style="display:inline-block;padding:2px 4px;">${j.ovr}</div></td><td>${dH}</td><td style="color:${st.jogos==0?'#475569':''}">${st.jogos}</td><td style="color:${st.gols==0?'#475569':''}">${st.gols}</td><td style="color:${st.ast==0?'#475569':''}">${st.ast}</td><td style="color:${st.sg==0?'#475569':''}">${st.sg}</td><td style="color:${st.ca==0?'#475569':''}">${st.ca}</td><td style="color:${st.cv==0?'#475569':''}">${st.cv}</td><td style="font-weight:700;color:${cN(+st.media)};">${st.media}</td><td style="font-weight:700;color:#fbbf24">${st.impacto}</td></tr>`;
        }
    }).join('');
    return html + `</tbody></table></div></div>`;
}

const removerDoCampo = k => {
    delete getSeason().lineup[k];
    salvarDados();
    renderizar();
};
const formacoesTaticas = {
    "4-3-3": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "MC1": "bottom:47%;left:30%", "MEI": "bottom:51%;left:50%", "MC2": "bottom:47%;left:70%", "PE": "bottom:72%;left:20%", "ATA": "bottom:77%;left:50%", "PD": "bottom:72%;left:80%" }
    },
    "4-4-2 Clássico": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "ME": "bottom:50%;left:15%", "MC1": "bottom:47%;left:38%", "MC2": "bottom:47%;left:62%", "MD": "bottom:50%;left:85%", "ATA1": "bottom:75%;left:38%", "ATA2": "bottom:75%;left:62%" }
    },
    "4-4-2 Losango": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "VOL": "bottom:38%;left:50%", "MC1": "bottom:47%;left:30%", "MC2": "bottom:47%;left:70%", "MEI": "bottom:55%;left:50%", "ATA1": "bottom:75%;left:38%", "ATA2": "bottom:75%;left:62%" }
    },
    "4-2-3-1": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "VOL1": "bottom:38%;left:38%", "VOL2": "bottom:38%;left:62%", "MEI": "bottom:55%;left:50%", "PE": "bottom:72%;left:25%", "PD": "bottom:72%;left:75%", "ATA": "bottom:77%;left:50%" }
    },
    "4-1-4-1": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "VOL": "bottom:38%;left:50%", "ME": "bottom:55%;left:15%", "MC1": "bottom:47%;left:35%", "MC2": "bottom:47%;left:65%", "MD": "bottom:55%;left:85%", "ATA": "bottom:75%;left:50%" }
    },
    "3-5-2": {
        slots: { "GOL": "bottom:2%;left:50%", "ZAG1": "bottom:22%;left:25%", "ZAG2": "bottom:20%;left:50%", "ZAG3": "bottom:22%;left:75%", "VOL1": "bottom:38%;left:35%", "VOL2": "bottom:38%;left:65%", "ME": "bottom:55%;left:15%", "MEI": "bottom:52%;left:50%", "MD": "bottom:55%;left:85%", "ATA1": "bottom:75%;left:38%", "ATA2": "bottom:75%;left:62%" }
    },
    "5-3-2": {
        slots: { "GOL": "bottom:2%;left:50%", "ADE": "bottom:25%;left:12%", "ZAG1": "bottom:20%;left:30%", "ZAG2": "bottom:18%;left:50%", "ZAG3": "bottom:20%;left:70%", "ADD": "bottom:25%;left:88%", "MC1": "bottom:47%;left:30%", "VOL": "bottom:42%;left:50%", "MC2": "bottom:47%;left:70%", "ATA1": "bottom:75%;left:38%", "ATA2": "bottom:75%;left:62%" }
    },
    "4-3-3 (Contenção)": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "VOL": "bottom:38%;left:50%", "MC1": "bottom:47%;left:30%", "MC2": "bottom:47%;left:70%", "PE": "bottom:72%;left:20%", "ATA": "bottom:77%;left:50%", "PD": "bottom:72%;left:80%" }
    },
    "4-3-3 (Ofensivo)": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "MC1": "bottom:44%;left:35%", "MC2": "bottom:44%;left:65%", "MEI": "bottom:56%;left:50%", "PE": "bottom:72%;left:20%", "ATA": "bottom:77%;left:50%", "PD": "bottom:72%;left:80%" }
    },
    "4-3-3 (Falso 9)": {
        slots: { "GOL": "bottom:2%;left:50%", "LE": "bottom:25%;left:15%", "ZAG1": "bottom:22%;left:38%", "ZAG2": "bottom:22%;left:62%", "LD": "bottom:25%;left:85%", "MC1": "bottom:42%;left:30%", "MC2": "bottom:42%;left:70%", "MEI": "bottom:54%;left:50%", "PE": "bottom:72%;left:20%", "SA": "bottom:68%;left:50%", "PD": "bottom:72%;left:80%" }
    }
};
const mudarFormacao = nf => {
    const s = getSeason();
    s.formacao = nf;
    const nl = {},
        c = formacoesTaticas[nf];
    for (let p in s.lineup)
        if (c.slots[p]) nl[p] = s.lineup[p];
    s.lineup = nl;
    salvarDados();
    renderizar();
};
const salvarLineup = n => {
    const s = getSeason();
    s.lineupsSalvos = s.lineupsSalvos || {};
    s.lineupsSalvos[n] = {
        formacao: s.formacao || '4-3-3',
        jogadores: JSON.parse(JSON.stringify(s.lineup || {}))
    };
    salvarDados();
    alert(`Escalação '${n}' salva!`);
    renderizar();
};
const carregarLineup = n => {
    if (n === 'atual') return;
    const s = getSeason(),
        l = s.lineupsSalvos?.[n];
    if (!l) {
        alert(`Nenhuma escalação '${n}'.`);
        $('#select-lineup').value = 'atual';
        return;
    }
    s.formacao = l.formacao;
    const nl = {};
    for (let p in l.jogadores) {
        let f = s.jogadores.find(j => j.primeiroNome === l.jogadores[p].primeiroNome && j.sobrenome === l.jogadores[p].sobrenome);
        if (f) nl[p] = f;
    }
    s.lineup = nl;
    salvarDados();
    renderizar();
    setTimeout(() => {
        if ($('#select-lineup')) $('#select-lineup').value = 'atual';
    }, 100);
};

