function renderizar(skipF = false) {
    const c = $('#elenco-container'),
        s = getSeason(),
        elAtv = appData.elencos[appData.indiceAtivo];
    $('#squad-select').innerHTML = appData.elencos.map((e, i) => `<option value="${i}" ${i===appData.indiceAtivo?'selected':''}>${e.nome}</option>`).join('');
    if ($('#season-select')) $('#season-select').innerHTML = elAtv.temporadas.map((t, i) => `<option value="${i}" ${i===elAtv.temporadaAtiva?'selected':''}>${t.nome}</option>`).join('');
    $('#main-title').innerHTML = modoEdicao ? `<input type="text" id="edit-squad-name" value="${elAtv.nome}" style="text-align:center;background:transparent;color:#fbbf24;border:none;border-bottom:2px solid #fbbf24;font-size:1em;width:300px;">` : elAtv.nome;

    const isO = abaAtiva === 'calendario' || abaAtiva === 'historico' || abaAtiva === 'taticas' || abaAtiva === 'estatisticas';
    $$('.fixed-buttons, .fixed-buttons-bottom').forEach(e => e.style.display = (abaAtiva === 'historico') ? 'none' : 'flex');
    $('#filtros-container').style.display = isO ? 'none' : 'block';
    $('#dashboard').style.display = isO ? 'none' : 'grid';
    c.classList.remove('grid');
    if (!modoTabela && !isO && abaAtiva !== 'estatisticas') c.classList.add('grid');
    if ($('.sort-area')) $('.sort-area').style.display = abaAtiva === 'estatisticas' ? 'none' : 'flex';

    if ($('#btn-adicionar')) $('#btn-adicionar').style.display = (modoEdicao && (abaAtiva === 'jogadores' || abaAtiva === 'mercado' || abaAtiva === 'base')) ? 'flex' : 'none';
    if ($('#btn-excluir-tudo')) $('#btn-excluir-tudo').style.display = (modoEdicao && (abaAtiva === 'jogadores' || abaAtiva === 'mercado' || abaAtiva === 'base')) ? 'flex' : 'none';
    if ($('#btn-excluir-visiveis')) $('#btn-excluir-visiveis').style.display = (modoEdicao && (abaAtiva === 'jogadores' || abaAtiva === 'mercado' || abaAtiva === 'base')) ? 'flex' : 'none';
    if ($('#btn-excluir-selecionados')) { $('#btn-excluir-selecionados').style.display = (modoEdicao && (abaAtiva === 'jogadores' || abaAtiva === 'mercado' || abaAtiva === 'base') && selCards.length > 0) ? 'flex' : 'none'; if ($('#count-sel')) $('#count-sel').innerText = selCards.length; }
    if ($('#btn-avancar-temporada')) $('#btn-avancar-temporada').style.display = (modoEdicao && abaAtiva === 'jogadores') ? 'flex' : 'none';
    $$('.squad-selector .btn-add').forEach(b => b.style.display = modoEdicao ? 'inline-block' : 'none');
    $$('.squad-selector .btn-del').forEach(b => b.style.display = modoEdicao ? 'inline-block' : 'none');
    if ($('#btn-exportar-csv')) $('#btn-exportar-csv').style.display = (modoEdicao || abaAtiva === 'calendario') ? 'inline-block' : 'none';
    if ($('#btn-importar-csv')) $('#btn-importar-csv').style.display = (modoEdicao || abaAtiva === 'calendario') ? 'inline-block' : 'none';
    if ($('#btn-exportar-backup')) $('#btn-exportar-backup').style.display = modoEdicao ? 'inline-block' : 'none';
    if ($('#btn-importar-backup')) $('#btn-importar-backup').style.display = modoEdicao ? 'inline-block' : 'none';
    if ($('#storage-info')) $('#storage-info').style.display = modoEdicao ? 'inline-block' : 'none';

    if ($('#btn-excluir-sel')) {
        $('#btn-excluir-sel').style.display = (modoEdicao && selCards.length > 0) ? 'flex' : 'none';
        if (selCards.length > 0) $('#btn-excluir-sel').innerText = `🗑️ Sel. (${selCards.length})`;
    }

    verificarNotificacoes();
    renderTimeline();

    if (abaAtiva === 'calendario') { c.innerHTML = renderizarCalendario(); return; }
    if (abaAtiva === 'historico') { c.innerHTML = renderizarAbaHistorico(); return; }
    if (abaAtiva === 'taticas') { c.innerHTML = renderizarTaticas(); return; }
    if (abaAtiva === 'estatisticas') { c.innerHTML = renderizarEstatisticas(); return; }

    const tm = $('#search-input').value.toLowerCase(),
        srt = $('#sort-select').value;
    if ($('#btn-filtro-renovacao')) $('#btn-filtro-renovacao').classList.toggle('ativo', filtroRenovacaoAtivo);

    const pO = ["GOL", "LE", "ZAG", "LD", "VOL", "ME", "MC", "MEI", "MD", "PE", "ATA", "PD"];
    const sO = abaAtiva === 'estatisticas' ? ["Elenco", "Emprest. - IN"] : (abaAtiva === 'jogadores' ? ["Elenco", "Emprest. - IN", "Emprest. - OUT", "Vender", "Emprestar"] : (abaAtiva === 'base' ? ["Base"] : (subAbaMercado !== 'alvos' ? ["Elenco", "Emprest. - IN", "Emprest. - OUT", "Vender", "Emprestar"] : ["Observação", "Empréstimo", "Transferência"])));
    const stO = abaAtiva === 'mercado' ? ["Prioridade", "Alternativa", "Fim de Contrato"] : ["Titular", "Reserva", "Não Relacionado"];

    if (!skipF) {
        const btnL = t => `<button class="filtro-btn" style="border:none;background:transparent;padding:0 2px;font-size:.7em;margin-right:0;opacity:.6" onclick="filtros['${t}']=[];renderizar()" title="Limpar">✖️</button>`;
        $('#filtro-pos').innerHTML = `${btnL('pos')}<span class="filtro-titulo">Posição:</span>` + pO.map(o => `<button class="filtro-btn ${filtros.pos.includes(o)?'ativo':''}" onclick="toggleFiltro('pos','${o}')">${o}</button>`).join('');
        $('#filtro-sit').innerHTML = abaAtiva === 'base' ? '' : `${btnL('sit')}<span class="filtro-titulo">Situação:</span>` + sO.filter(o => !(abaAtiva === 'jogadores' && o === 'Emprest. - OUT')).map(o => `<button class="filtro-btn ${filtros.sit.includes(o)?'ativo':''}" onclick="toggleFiltro('sit','${o}')">${lblSit(o)}</button>`).join('');
        $('#filtro-status').innerHTML = `${btnL('status')}<span class="filtro-titulo">Status:</span>` + stO.map(o => `<button class="filtro-btn ${filtros.status.includes(o)?'ativo':''}" onclick="toggleFiltro('status','${o}')">${lblSt(o)}</button>`).join('');

        $('#filtro-pos').className = 'filtro-linha' + (filtros.pos.length ? ' ativo-linha' : '');
        $('#filtro-sit').className = 'filtro-linha' + (filtros.sit.length ? ' ativo-linha' : '');
        $('#filtro-sit').style.display = (abaAtiva === 'base' || (abaAtiva === 'mercado' && subAbaMercado === 'out')) ? 'none' : 'flex';
        $('#filtro-status').className = 'filtro-linha' + (filtros.status.length ? ' ativo-linha' : '');
        $('#filtro-status').style.display = (abaAtiva === 'mercado' && subAbaMercado === 'out') ? 'none' : 'flex';

        if ($('#filtro-faixas')) $('#filtro-faixas').innerHTML = buildFaixasHTML();
    }

    const isOut = abaAtiva === 'mercado' && subAbaMercado === 'out';
    const srcArr = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? s.mercado : s.jogadores) : s.jogadores;
    let f = srcArr.filter(j => (abaAtiva === 'base' ? j.situacao === 'Base' : (abaAtiva === 'jogadores' ? (j.situacao !== 'Base' && j.situacao !== 'Emprest. - OUT') : (abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? true : (subAbaMercado === 'vendas' ? j.situacao === 'Vender' : (subAbaMercado === 'emprestar' ? j.situacao === 'Emprestar' : j.situacao === 'Emprest. - OUT'))) : true))) &&
        (!filtros.pos.length || filtros.pos.includes(j.pos)) &&
        (!filtros.sit.length || filtros.sit.includes(j.situacao)) &&
        (!filtros.status.length || filtros.status.includes(j.status)) &&
        (`${j.primeiroNome} ${j.sobrenome}`.toLowerCase().includes(tm)) &&
        (!filtroRenovacaoAtivo || (+j.contAnos === 0 && +j.contMeses <= 6)) &&
        (j.idade >= filtros.fx.idade[0] && j.idade <= filtros.fx.idade[1]) &&
        (j.ovr >= filtros.fx.ovr[0] && j.ovr <= filtros.fx.ovr[1]) &&
        (j.pot >= filtros.fx.pot[0] && j.pot <= filtros.fx.pot[1]) &&
        (j.valor >= filtros.fx.valor[0] && j.valor <= filtros.fx.valor[1])
    );

    if (srt !== 'none') f.sort((a, b) => {
        let A = srt === 'pos' ? pO.indexOf(a.pos) : srt === 'sobrenome' ? a.sobrenome.toLowerCase() : +a[srt],
            B = srt === 'pos' ? pO.indexOf(b.pos) : srt === 'sobrenome' ? b.sobrenome.toLowerCase() : +b[srt];
        if (srt === 'contAnos') {
            A = (parseInt(a.contAnos) || 0) * 12 + (parseInt(a.contMeses) || 0);
            B = (parseInt(b.contAnos) || 0) * 12 + (parseInt(b.contMeses) || 0);
        }
        return A < B ? (sortDir === 'asc' ? -1 : 1) : A > B ? (sortDir === 'asc' ? 1 : -1) : 0;
    });

    renderizarDashboard(f);

    let tabsHtml = '';
    if (abaAtiva === 'mercado') {
        tabsHtml = `<div class="aba-mercado-tabs"><button class="filtro-btn ${subAbaMercado==='alvos'?'ativo':''}" style="font-size:1em;padding:8px 15px" onclick="subAbaMercado='alvos';renderizar()">🎯 Lista de Alvos</button><button class="filtro-btn ${subAbaMercado==='out'?'ativo':''}" style="font-size:1em;padding:8px 15px" onclick="subAbaMercado='out';renderizar()">✈️ Nossos Emprestados (OUT)</button></div>`;
    }

    if (modoTabela) {
        const mapSt = {
            'Titular': 'TIT',
            'Reserva': 'RES',
            'Não Relacionado': 'N/R'
        };
        const colG = `<colgroup>${(modoEdicao||abaAtiva==='mercado'||abaAtiva==='base')?'<col width="60">':''}<col width="75"><col><col width="60"><col width="65"><col width="65"><col width="100"><col width="100"><col width="100"><col width="110"><col width="75"></colgroup>`;
        c.innerHTML = tabsHtml + `<div class="table-container"><table class="table-view">${colG}<thead><tr>${(modoEdicao||abaAtiva==='mercado'||abaAtiva==='base')?'<th>Ação</th>':''}${['pos','sobrenome','idade','ovr','pot','multa','valor','salario'].map(x=>`<th style="cursor:pointer;" onclick="ordenarPelaTabela('${x}')">${x === 'pos' ? 'POSIÇÃO' : x.toUpperCase()}${srt === x ? (sortDir === 'desc' ? ' ⬇️' : ' ⬆️') : ''}</th>`).join('')}<th>Situação</th><th>Status</th></tr></thead><tbody>` +
        f.map(j => {
            inicializarBases(j);
            const i = srcArr.indexOf(j),
                al = (+j.contAnos === 0 && +j.contMeses <= 6),
                stHtml = abaAtiva === 'jogadores' ? `<span style="font-weight:700;font-size:0.9em">${mapSt[j.status]||'N/R'}</span>` : `<span style="font-size:1.2em;">${getStatusEmoji(j.status)}</span>`,
                tblImg = j.img ? `<img src="${j.img}" style="width:24px;height:24px;vertical-align:middle;object-fit:contain;margin-right:5px;border-radius:4px">` : tblSvg;
            return `<tr class="${al?'alerta-contrato':''}">${(modoEdicao||abaAtiva==='mercado'||abaAtiva==='base')?`<td>${modoEdicao?`<input type="checkbox" style="transform:scale(1.3);cursor:pointer;margin-right:5px" ${selCards.includes(i)?'checked':''} onclick="toggleSel(${i})"> <button style="background:transparent;border:none;cursor:pointer;font-size:1.2em;" onclick="excluirJogador(${i})">🗑️</button>${(abaAtiva==='jogadores'||abaAtiva==='base')?`<button style="background:transparent;border:none;cursor:pointer;font-size:1.2em;margin-left:5px;" onclick="abrirModalNegociar(${i})">🤝</button>`:''}`:(abaAtiva==='mercado'&&subAbaMercado==='alvos'&&!modoEdicao)?`<button style="background:#15803d;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-weight:700;font-size:.8em;" onclick="abrirModalContratar(${i})">🤝 Contratar</button>`:(abaAtiva==='base'&&!modoEdicao)?`<button style="background:#3b82f6;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-weight:700;font-size:.8em;" onclick="abrirModalPromover(${i})">⬆️</button>`:''}</td>`:''}<td><div class="pos-stat-box" style="font-size:.9em;padding:2px 4px;">${j.pos}</div></td><td class="nome-col">${tblImg}${j.primeiroNome} <span>${j.sobrenome}</span></td><td>${j.idade}</td><td><div class="stat-box ${getBg(j.ovr)}" style="display:inline-block;min-width:25px;padding:2px;">${j.ovr}${renderDeltaSpan(j,'ovr',null)}</div></td><td><div class="stat-box ${getBg(abaAtiva==='base'?j.potMax:j.pot)}" style="display:inline-block;min-width:25px;padding:2px;">${abaAtiva==='base'?`${j.potMin}-${j.potMax} ${renderDeltaSpan(j,'potMax',null)}`:`${j.pot}${renderDeltaSpan(j,'pot',null)}`}</div></td><td>${formatMoney(j.multa)}</td><td>${formatMoney(j.valor)}</td><td>${formatMoney(j.salario)}</td><td><div class="status-faixa" style="margin:0;padding:2px 4px;font-size:.75em;background:${cSit[j.situacao]||'#15803d'}">${j.situacao}</div></td><td>${stHtml}</td></tr>`
        }).join('') + `</tbody></table></div>`;
    } else {
        c.innerHTML = tabsHtml + f.map(j => {
            inicializarBases(j);
            const i = srcArr.indexOf(j),
                al = (+j.contAnos === 0 && +j.contMeses <= 6),
                lb = j.pos === 'GOL' ? ['ELA', 'MAN', 'CHU', 'REF', 'VEL', 'POS'] : ['RIT', 'FIN', 'PAS', 'CON', 'DEF', 'FIS'];
            const bS = (cp, v, mn, mx) => `<div style="display:flex;justify-content:center;align-items:center;gap:5px;margin-top:2px;"><button class="btn-inc btn-square" onclick="alterarValor(${i},'${cp}',-1,null,${mn},${mx})">-</button><span style="font-weight:900;cursor:pointer;" onclick="transformarEmInput(this,${i},'${cp}',null,${v})">${v}</span><button class="btn-inc btn-square" onclick="alterarValor(${i},'${cp}',1,null,${mn},${mx})">+</button>${renderDeltaSpan(j,cp,null)}</div>`;
            const isM = abaAtiva === 'mercado',
                stTxt = isM ? j.status : ({
                    'Titular': 'TIT',
                    'Reserva': 'RES',
                    'Não Relacionado': 'N/R'
                } [j.status] || 'N/R'),
                stCls = isM ? ({
                    'Prioridade': 'c-pri',
                    'Alternativa': 'c-alt',
                    'Fim de Contrato': 'c-fim'
                } [j.status] || 'c-neu') : 'c-neu',
                pCls = j.pos === 'GOL' ? 'c-gol' : ['ZAG', 'LE', 'LD'].includes(j.pos) ? 'c-def' : ['VOL', 'MC', 'MEI', 'MD', 'ME'].includes(j.pos) ? 'c-mid' : 'c-atk';
            const imgH = `<div class="avatar-wrapper" ${modoEdicao?`onclick="abrirUpload(${i})"`:''}>${j.img?`<img src="${j.img}" class="avatar-img">`:defSvg}${modoEdicao?`<div class="avatar-edit-icon">📷</div>`:''}</div>`;
            let cb = `Contrato: ${j.contAnos}a ${j.contMeses}m`;
            if (isOut) cb = `Emprestado para <b>${j.empClube||'Desconhecido'}</b><br>Prazo: ${j.empAnos}a ${j.empMeses}m <br><span style="color:#fbbf24">${j.empOpcaoCompra?`Opção: ${formatMoney(j.empValorCompra)}`:'Sem Opção de Compra'}</span>`;
            else if (j.situacao === 'Emprest. - IN') cb = `Emprestado de <b>${j.empClube||'Desconhecido'}</b><br>Prazo: ${j.contAnos}a ${j.contMeses}m <br><span style="color:#fbbf24">${j.empOpcaoCompra?`Opção: ${formatMoney(j.empValorCompra)}`:'Sem Opção de Compra'}</span>`;
            return `<div class="card ${modoEdicao?'card-edit':''} ${al?'alerta-contrato':''} ${selCards.includes(i)?'sel-card':''}" style="border-left:5px solid ${cSit[j.situacao]||'transparent'}" data-index="${i}">
${(!modoEdicao&&abaAtiva==='mercado'&&subAbaMercado==='alvos')?`<button onclick="abrirModalContratar(${i})" style="position:absolute;top:5px;right:5px;background:#15803d;color:#fff;border:none;padding:4px 8px;border-radius:4px;font-weight:700;cursor:pointer;font-size:.8em;z-index:10;">🤝 Contratar</button>`:''}
${(!modoEdicao&&abaAtiva==='base')?`<button onclick="abrirModalPromover(${i})" style="position:absolute;top:5px;right:5px;background:#3b82f6;color:#fff;border:none;padding:4px 8px;border-radius:4px;font-weight:700;cursor:pointer;font-size:.8em;z-index:10;">📈 Promover</button>`:''}
<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
    <div style="display:flex; flex-direction:column; gap:4px;">
        ${modoEdicao?`<select data-field="situacao" class="compact-select">${sO.map(o=>`<option ${j.situacao===o?'selected':''}>${o}</option>`).join('')}</select><select data-field="status" class="compact-select">${stO.map(o=>`<option ${j.status===o?'selected':''}>${o}</option>`).join('')}</select>`:`<div style="display:flex; align-items:center;"><div class="status-faixa" style="background:transparent;color:#94a3b8;margin:0;">${j.situacao}</div></div>`}
    </div>
    <div style="display:flex; gap:10px; align-items:center;">
        ${['Elenco', 'Emprest. - OUT', 'Vender', 'Emprestar'].includes(j.situacao)?`<button class="btn-vender" onclick="abrirModalNegociar(${i})" title="Negociar" style="position:static;padding:0;background:transparent;border:none;cursor:pointer;font-size:1.2em;">💰</button>`:''}
        ${modoEdicao?`<button class="btn-lixeira" onclick="excluirJogador(${i})" title="Excluir" style="position:static;padding:0;background:transparent;border:none;cursor:pointer;font-size:1.2em;">🗑️</button>`:''}
    </div>
</div>
<div class="header" style="flex-direction:column;gap:5px;align-items:stretch"><div style="display:flex;width:100%;align-items:center;gap:5px">${modoEdicao?`<input type="checkbox" style="transform:scale(1.3);cursor:pointer;margin-right:2px" ${selCards.includes(i)?'checked':''} onclick="toggleSel(${i})">`:''}${imgH}<div class="nome">${modoEdicao?`<input type="text" data-field="primeiroNome" class="name-input" value="${j.primeiroNome}">`:j.primeiroNome}</div><div class="sobrenome">${modoEdicao?`<input type="text" data-field="sobrenome" class="name-input" value="${j.sobrenome}">`:j.sobrenome}</div></div><div style="display:flex;width:100%;align-items:center"><div style="flex:1;text-align:left"><div class="pos-stat-box ${stCls}" style="border:none;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${stTxt}</div></div><div style="flex:1;text-align:center"><div class="pos-stat-box ${pCls}" style="border:none">${modoEdicao?`<select data-field="pos" style="width:55px;background:transparent;color:inherit;border:none;font-weight:inherit">${pO.map(o=>`<option ${j.pos===o?'selected':''}>${o}</option>`).join('')}</select>`:j.pos}</div></div><div style="flex:1;text-align:right"><div class="numero">${modoEdicao?`<input type="text" data-field="num" value="${j.num}" style="width:30px">`:'#'+j.num}</div></div></div></div><div class="ratings-container"><div class="rat-box ${getBg(j.ovr)}">OVR<br>${modoEdicao?bS('ovr',j.ovr,1,99):j.ovr+' '+renderDeltaSpan(j,'ovr',null)}</div><div class="rat-box ${getBg(abaAtiva==='base'?j.potMax:j.pot)}">POT<br>${abaAtiva==='base'?(modoEdicao?`<div style="display:flex;flex-direction:column;gap:1px;font-size:.85em">${bS('potMin',j.potMin,1,99)}${bS('potMax',j.potMax,1,99)}</div>`:`${j.potMin}-${j.potMax} ${renderDeltaSpan(j,'potMax',null)}`):(modoEdicao?bS('pot',j.pot,1,99):j.pot+' '+renderDeltaSpan(j,'pot',null))}</div></div><div class="phys-row">${modoEdicao?bS('idade',j.idade,1,99):j.idade+' anos'} <span style="color:#475569">|</span> ${modoEdicao?bS('alt',j.alt,1,220):j.alt+' cm'} <span style="color:#475569">|</span> ${modoEdicao?`<select data-field="pe" class="compact-select" style="width:55px">${['Dir.','Esq.'].map(o=>`<option ${j.pe===o?'selected':''}>${o}</option>`).join('')}</select>`:j.pe}</div><div class="phys-row" style="margin-top:2px;">Contrato: ${modoEdicao?`<div style="display:inline-flex;align-items:center;gap:2px;margin-left:5px"><input type="number" data-field="contAnos" value="${j.contAnos}" style="width:35px;margin:0;background:#0f172a;color:#fbbf24;border:1px solid #334155;text-align:center;">a <input type="number" data-field="contMeses" value="${j.contMeses}" style="width:35px;margin:0;background:#0f172a;color:#fbbf24;border:1px solid #334155;text-align:center;">m</div>`:j.contAnos+'a '+j.contMeses+'m'}</div><button class="btn-acc" onclick="toggleAcc(this)">▼ Contrato e Finanças</button><div class="acc-content"><div class="cont-box">${cb}</div><div class="finance-grid"><div class="dado-box">Multa:<br>${modoEdicao?`<input type="number" data-field="multa" value="${j.multa}" style="width:100%;box-sizing:border-box">`:formatMoney(j.multa)}</div><div class="dado-box">Valor:<br>${modoEdicao?`<input type="number" data-field="valor" value="${j.valor}" style="width:100%;box-sizing:border-box">`:formatMoney(j.valor)}</div><div class="dado-box">Salário:<br>${modoEdicao?`<input type="number" data-field="salario" value="${j.salario}" style="width:100%;box-sizing:border-box">`:formatMoney(j.salario)}</div></div></div><div class="extra-stats"><div class="stars-box">Dribles<br>${modoEdicao?`<select data-field="dr">${[1,2,3,4,5].map(n=>`<option value="${n}" ${j.dr===n?'selected':''}>${n} Estrela</option>`).join('')}</select>`:rSt(j.dr)}</div><div class="stars-box">P. Ruim<br>${modoEdicao?`<select data-field="pr">${[1,2,3,4,5].map(n=>`<option value="${n}" ${j.pr===n?'selected':''}>${n} Estrela</option>`).join('')}</select>`:rSt(j.pr)}</div></div><div class="stats-grid">${j.s.map((v,x)=>`<div class="stat-box ${getBg(v)}"><span style="font-size:.8em">${lb[x]}</span>${modoEdicao?`<div style="display:flex;justify-content:center;align-items:center;gap:3px;width:100%;padding:2px 0;"><button class="btn-inc btn-square" onclick="alterarValor(${i},'s',-1,${x},1,99)">-</button><span style="font-weight:900;cursor:pointer;" onclick="transformarEmInput(this,${i},'s',${x},${v})">${v}</span><button class="btn-inc btn-square" onclick="alterarValor(${i},'s',1,${x},1,99)">+</button>${renderDeltaSpan(j,'s',x)}</div>`:`<span style="font-weight:900;margin-top:2px;display:flex;align-items:center;justify-content:center;gap:2px;">${v}${renderDeltaSpan(j,'s',x)}</span>`}</div>`).join('')}</div></div>`
        }).join('');
    }
}
syncCal();
renderizar();

window.ManagerApp = {
    attachUser(userId, remoteState = null) {
        const migrationCandidate = cloneData(appData);
        const userStorageKey = `${STORAGE_KEY}:${userId}`;
        const cachedState = readStoredJSON(userStorageKey);
        currentUserId = userId;
        activeStorageKey = userStorageKey;
        appData = normalizarDados(remoteState || cachedState || migrationCandidate);
        localStorage.removeItem(STORAGE_KEY);
        salvarDados(false);
        syncCal();
        renderizar();
        return cloneData(appData);
    },
    detachUser({ clearCache = true } = {}) {
        if (clearCache) localStorage.removeItem(activeStorageKey);
        currentUserId = null;
        activeStorageKey = STORAGE_KEY;
        localStorage.removeItem(STORAGE_KEY);
        appData = normalizarDados(criarCarreiraInicial());
    },
    clearSignedOutCaches() {
        const prefix = `${STORAGE_KEY}:`;
        Object.keys(localStorage)
            .filter(key => key.startsWith(prefix))
            .forEach(key => localStorage.removeItem(key));
    },
    async replaceData(nextState) {
        appData = normalizarDados(nextState);
        salvarDados();
        await window.ManagerAuth?.flushSave();
        syncCal();
        renderizar();
        return cloneData(appData);
    },
    getData: () => cloneData(appData)
};


function excluirSelecionados() {
    if (selCards.length === 0) return alert("Nenhum jogador selecionado.");
    if (!confirm(`Você está prestes a excluir definitivamente ${selCards.length} jogadores selecionados. Tem certeza?`)) return;

    consolidarEdicoes();
    const src = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;
    
    // Reverse sort to splice safely
    selCards.sort((a, b) => b - a);
    
    selCards.forEach(i => {
        const r = src.splice(i, 1)[0];
        if (src === getSeason().jogadores) {
            const l = getSeason().lineup;
            for (let k in l) {
                if (l[k] === r) delete l[k];
            }
        }
    });

    selCards = []; // Limpa a seleção
    salvarDados();
    renderizar();
}

function excluirVisiveis() {
    const tm = ($('#search-input') ? $('#search-input').value : '').toLowerCase();
    const isOut = abaAtiva === 'mercado' && subAbaMercado === 'out';
    const srcArr = abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? getSeason().mercado : getSeason().jogadores) : getSeason().jogadores;

    let f = srcArr.filter(j => (abaAtiva === 'base' ? j.situacao === 'Base' : (abaAtiva === 'jogadores' ? (j.situacao !== 'Base' && j.situacao !== 'Emprest. - OUT') : (abaAtiva === 'mercado' ? (subAbaMercado === 'alvos' ? true : (subAbaMercado === 'vendas' ? j.situacao === 'Vender' : (subAbaMercado === 'emprestar' ? j.situacao === 'Emprestar' : j.situacao === 'Emprest. - OUT'))) : true))) &&
        (!filtros.pos.length || filtros.pos.includes(j.pos)) &&
        (!filtros.sit.length || filtros.sit.includes(j.situacao)) &&
        (!filtros.status.length || filtros.status.includes(j.status)) &&
        (`${j.primeiroNome} ${j.sobrenome}`.toLowerCase().includes(tm)) &&
        (!filtroRenovacaoAtivo || (+j.contAnos === 0 && +j.contMeses <= 6)) &&
        (j.idade >= filtros.fx.idade[0] && j.idade <= filtros.fx.idade[1]) &&
        (j.ovr >= filtros.fx.ovr[0] && j.ovr <= filtros.fx.ovr[1]) &&
        (j.pot >= filtros.fx.pot[0] && j.pot <= filtros.fx.pot[1]) &&
        (j.valor >= filtros.fx.valor[0] && j.valor <= filtros.fx.valor[1])
    );

    if (f.length === 0) return alert("Nenhum jogador visível para excluir.");
    if (!confirm(`Você está prestes a excluir definitivamente ${f.length} jogadores listados na tela. Tem certeza?`)) return;

    f.forEach(j => {
        const idx = srcArr.indexOf(j);
        if (idx > -1) {
            const r = srcArr.splice(idx, 1)[0];
            if (srcArr === getSeason().jogadores) {
                const l = getSeason().lineup;
                for (let k in l) {
                    if (l[k] === r) delete l[k];
                }
            }
        }
    });
    selCards = [];
    salvarDados();
    renderizar();
}
let debounceTimer;
function debounceBusca() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        consolidarEdicoes();
        renderizar(true);
    }, 300);
}

function exportarBackup() {
    try {
        const dataStr = JSON.stringify(appData);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "manager_fc_backup_" + new Date().toISOString().split('T')[0] + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch(e) {
        alert("Erro ao exportar backup.");
    }
}

function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.elencos || !Array.isArray(parsed.elencos)) throw new Error("Save inválido.");
            if (confirm("ATENÇÃO: importar um backup substituirá TODO o progresso deste usuário. Deseja continuar?")) {
                await window.ManagerApp.replaceData(parsed);
                window.mostrarToast?.('Backup restaurado e sincronizado.');
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao ler ou salvar o backup. Verifique se o JSON é válido e se há conexão com a internet.");
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}




function verificarEventosNarrativos(s) {
    if (!s.narrativas) s.narrativas = [];
    if (!s.narrativas) s.narrativas = [];
    if (!s.narrativas) s.narrativas = [];
    if (!s.narrativas) s.narrativas = [];
    const jaTeve = (id) => s.narrativas.includes(id);
    const registrar = (id) => s.narrativas.push(id);
    const dA = s.dataAtual.split('-'); // [YYYY, MM, DD]
    const dStr = s.dataAtual;
    const y = parseInt(dA[0]), m = parseInt(dA[1]), d = parseInt(dA[2]);
    const isUltimoDia = (new Date(y, m, 0).getDate() === d);

    // 1. Mensal: Fechamento (Valores e Salários)
    if (isUltimoDia) {
        let pid = `fechamento_${dA[0]}_${dA[1]}`;
        if (!jaTeve(pid)) {
            addNotif(pid, `Diretoria Financeira e Técnica: Hoje é o último dia do mês. Lembre-se de acessar o EA FC e atualizar os Valores de Mercado, Salários, Overall (OVR), Potencial (POT) e atributos de todos os jogadores que evoluíram.`);
            registrar(pid);
        }
    }

    // 2. Auxiliar Técnico (Bimestral - dias 05 dos meses pares)
    if (d === 5 && m % 2 === 0) {
        let pid = `aux_tec_${dA[0]}_${dA[1]}`;
        if (!jaTeve(pid)) {
            let relatorio = `Relatório do Auxiliar Técnico:
`;
            
            // Analise de elenco (Carências vs Tática)
            // Lógica simples: conta defensores, meias e atacantes
            let defs = s.jogadores.filter(j => ['ZAG','LD','LE'].includes(j.pos) && j.situacao === 'Elenco').length;
            let meias = s.jogadores.filter(j => ['VOL','MC','MEI','MD','ME'].includes(j.pos) && j.situacao === 'Elenco').length;
            let atqs = s.jogadores.filter(j => ['ATA','SA','PE','PD'].includes(j.pos) && j.situacao === 'Elenco').length;
            
            if (defs < 6) relatorio += `- Defesa: Temos poucos defensores de ofício no elenco principal. Considere buscar reforços no Mercado.
`;
            if (meias < 6) relatorio += `- Meio-campo: Precisamos de mais opções no setor criativo ou de marcação.
`;
            if (atqs < 4) relatorio += `- Ataque: Falta profundidade no ataque, um lesão pode nos complicar.
`;

            // Jogadores sem espaço / má fase (Baixa média de notas)
            // Agrega estatísticas de todas as competições para análise narrativa
            let jogadoresComNota = s.jogadores.filter(j => j.situacao === 'Elenco').map((j, idx) => {
                let numJogos = 0, somaMedia = 0;
                if (j.est) Object.values(j.est).forEach(e => {
                    numJogos += e.jogos || 0;
                    let m = e.media !== undefined ? parseFloat(e.media) : 0;
                    somaMedia += m * (e.jogos || 1);
                });
                let media = numJogos > 0 ? somaMedia / numJogos : 0;
                return { j, idx, media, numJogos };
            });
            
            let encostados = jogadoresComNota.filter(x => x.numJogos > 0 && x.media < 6.0);
            if (encostados.length > 0) {
                relatorio += `- Má Fase: ${encostados[0].j.primeiroNome} ${encostados[0].j.sobrenome} não vem rendendo (média abaixo de 6.0). Considere colocá-lo na Lista de Vendas ou Empréstimos para recuperar confiança.
`;
            }

            // Promessas pedindo passagem
            let reservasPedindoPassagem = jogadoresComNota.filter(x => x.media >= 7.5 && x.numJogos < 5 && x.j.idade <= 23);
            if (reservasPedindoPassagem.length > 0) {
                relatorio += `- Pedindo Passagem: O jovem ${reservasPedindoPassagem[0].j.primeiroNome} ${reservasPedindoPassagem[0].j.sobrenome} tem treinado muito bem e entrado bem nos jogos. Merece mais minutos como titular.
`;
            }

            addNotif(pid, relatorio);
            registrar(pid);
        }
    }

    // 3. Gatilhos Analíticos de Partidas
    let ultimosJogos = (s.calendario || []).filter(e => e.relatorio).sort((a,b) => a.data.localeCompare(b.data)).slice(-3);
    if (ultimosJogos.length === 3) {
        // Alerta de Má Fase (substituindo Demissão)
        let derrotas = ultimosJogos.filter(e => +e.gc > +e.gp).length;
        if (derrotas === 3) {
            let pid = `ma_fase_${ultimosJogos[2].id}`;
            if (!jaTeve(pid)) {
                addNotif(pid, `Cobrança da Diretoria: Três derrotas seguidas. O time precisa reagir imediatamente para não comprometer os objetivos da temporada.`);
                registrar(pid);
            }
        }
        
        // Elogio à Defesa
        let cleanSheets = ultimosJogos.filter(e => +e.gc === 0).length;
        if (cleanSheets === 3) {
            let pid = `muralha_${ultimosJogos[2].id}`;
            if (!jaTeve(pid)) {
                addNotif(pid, `Imprensa Esportiva: A equipe não sofreu gols nos últimos 3 jogos. O sistema defensivo vem sendo muito elogiado.`);
                registrar(pid);
            }
        }
    }

    // 4. Rumores Genéricos de Transferência (Apenas destaques)
    s.jogadores.forEach((j, i) => {
        if (j.situacao === 'Elenco') {
            let est = j.est && j.est[s.campeonatoAtual] ? j.est[s.campeonatoAtual] : null;
            let totalJogosRumor = 0; if (j.est) Object.values(j.est).forEach(e => totalJogosRumor += e.jogos || 0);
                let mediaRumor = 0; if (j.est) { let sm = 0; Object.values(j.est).forEach(e => { sm += (parseFloat(e.media) || 0) * (e.jogos || 1); }); mediaRumor = totalJogosRumor > 0 ? sm / totalJogosRumor : 0; }
                if (totalJogosRumor >= 5 && mediaRumor >= 8.0) {
                let pid = `rumor_${j.primeiroNome}_${j.sobrenome}_${dA[1]}`;
                if (!jaTeve(pid)) {
                    addNotif(pid, `Rumor de Mercado: As atuações brilhantes de ${j.primeiroNome} ${j.sobrenome} despertaram o interesse de clubes do exterior. Fique atento a propostas.`);
                    registrar(pid);
                }
            }
        }
        
        // Base Prodígio
        if (j.situacao === 'Base' && j.potMax >= 90) {
            let pid = `base_prod_${j.primeiroNome}_${j.sobrenome}`;
            if (!jaTeve(pid)) {
                addNotif(pid, `Olheiro da Base: Temos um garoto de ouro. ${j.primeiroNome} ${j.sobrenome} tem potencial para se tornar um dos melhores do mundo. De olho nele!`);
                registrar(pid);
            }
        }
    });
}

window.comprimirTudo = async function() {
    if (!confirm("Isso vai comprimir todas as imagens de todos os elencos e temporadas para liberar espaço. A qualidade vai diminuir um pouco, mas evitará que o site trave. Deseja continuar?")) return;
    
    $('#storage-info').innerText = "Comprimindo...";
    
    const recompress = (src) => new Promise(resolve => {
        let img = new Image();
        img.onload = () => {
            let cvs = document.createElement('canvas');
            let ctx = cvs.getContext('2d');
            let w = img.width, h = img.height, max = 64;
            if (w > h) { if (w > max) { h *= max / w; w = max; } } 
            else { if (h > max) { w *= max / h; h = max; } }
            cvs.width = w; cvs.height = h;
            ctx.fillStyle = "#1e293b"; ctx.fillRect(0,0,w,h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(cvs.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });

    for (let e of appData.elencos) {
        // Comprimir temporadas ativas
        for (let t of e.temporadas) {
            for (let arr of [t.jogadores, t.mercado]) {
                if (!arr) continue;
                for (let j of arr) {
                    if (j.img && j.img.length > 3000) {
                        j.img = await recompress(j.img);
                    }
                }
            }
        }
        // Comprimir snapshots do histórico também
        if (e.historico) {
            for (let snap of e.historico) {
                for (let arr of [snap.jogadores, snap.mercado]) {
                    if (!arr) continue;
                    for (let j of arr) {
                        if (j.img && j.img.length > 3000) {
                            j.img = await recompress(j.img);
                        }
                    }
                }
            }
        }
    }
    salvarDados();
    renderizar();
    alert("Compressão concluída com sucesso! Verifique o novo uso de espaço.");
};

window.mostrarToast = function(msg, isError = false) {
    const c = $('#toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.style.background = isError ? '#ef4444' : '#10b981';
    t.style.color = '#fff';
    t.style.padding = '10px 20px';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    t.style.fontWeight = 'bold';
    t.style.transition = 'opacity 0.3s, transform 0.3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(20px)';
    t.innerText = msg;
    c.appendChild(t);
    
    requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(20px)';
        setTimeout(() => t.remove(), 300);
    }, 3000);
};
