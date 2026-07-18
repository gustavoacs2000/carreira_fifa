const dragCal = (ev, id) => ev.dataTransfer.setData("evtId", id);
const allowDropCal = ev => ev.preventDefault();
const dropCal = (ev, dS) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("evtId");
    if (id) {
        const e = getSeason().calendario.find(x => x.id === +id);
        if (e) {
            e.data = dS;
            salvarDados();
            renderizar();
        }
    }
};

const abrirModalEvento = (dS, id) => {
    const s = getSeason(),
        p = dS.split('-');
    $('#modal-evento-data').value = dS;
    $('#modal-evento-data-display').value = `${p[2]}/${p[1]}/${p[0]}`;
    const c = getCompC();
    $('#modal-evento-camp').innerHTML = Object.keys(c).map(k => `<option value="${k}">${k}</option>`).join('');
    if (id !== null) {
        const e = s.calendario.find(x => x.id === id);
        if (e) {
            $('#modal-evento-id').value = id;
            let a = e.adversario || '';
            $('#modal-evento-adv').value = a.replace(/\\s\\([CF]\\)$/, '');
            $('#modal-evento-mando').value = e.mando || (a.includes('(C)') ? 'C' : 'F');
            $('#modal-evento-rodada').value = e.rodada;
            $('#modal-evento-camp').value = e.campeonato;
            $('#modal-evento-gp').value = e.gp != null ? e.gp : '';
            $('#modal-evento-gc').value = e.gc != null ? e.gc : '';
            $('#btn-excluir-evento').style.display = 'block';
        }
    } else {
        ['id', 'adv', 'rodada', 'gp', 'gc'].forEach(k => $('#modal-evento-' + k).value = '');
        $('#modal-evento-mando').value = 'C';
        $('#modal-evento-camp').value = Object.keys(c)[0] || '';
        $('#btn-excluir-evento').style.display = 'none';
    }
    $('#modal-evento').style.display = 'flex';
};
const fecharModalEvento = () => $('#modal-evento').style.display = 'none';

window.salvarEvento = function() {
    try {
        const s = getSeason(),
            id = $('#modal-evento-id').value,
            advNome = $('#modal-evento-adv').value,
            mando = $('#modal-evento-mando').value,
            dataForm = $('#modal-evento-data').value,
            camp = $('#modal-evento-camp').value;
        if (!advNome || !dataForm || !camp) {
            mostrarToast("Preencha Data, Adversário e Campeonato.", true);
            return;
        }
        const obj = {
            adversario: `${advNome.replace(/\s\([CF]\)$/,'')} (${mando})`,
            mando: mando,
            rodada: $('#modal-evento-rodada').value,
            campeonato: camp,
            gp: $('#modal-evento-gp').value,
            gc: $('#modal-evento-gc').value
        };
        if (id) Object.assign(s.calendario.find(e => e.id === +id), obj);
        else s.calendario.push({
            id: s.calendario.length ? Math.max(...s.calendario.map(e => e.id)) + 1 : 1,
            data: dataForm,
            ...obj
        });
        salvarDados();
        fecharModalEvento();
        renderizar();
        mostrarToast("Partida no calendário salva com sucesso!");
    } catch (e) {
        console.error(e);
        mostrarToast("Erro interno ao salvar partida.", true);
    }
}

window.excluirEvento = function() {
    try {
        const id = $('#modal-evento-id').value;
        if (id && confirm("Excluir este evento?")) {
            getSeason().calendario = getSeason().calendario.filter(e => e.id !== +id);
            salvarDados();
            fecharModalEvento();
            renderizar();
            mostrarToast("Evento excluído.");
        }
    } catch (e) {
        console.error(e);
        mostrarToast("Erro ao excluir evento.", true);
    }
}

window.abrirRelatorioPartida = () => {
    const s = getSeason(),
        tits = Object.values(s.lineup);
    if (tits.length !== 11) return alert("Escale exatamente 11 titulares para registrar a partida.");
    if (!s.calendario.filter(e => !e.relatorio).length) return alert("Nenhuma partida pendente no calendário.");
    window.relSt = {
        t: tits.map(j => s.jogadores.indexOf(j)),
        s: [],
        st: {},
        gp: 0,
        gc: 0
    };
    tits.forEach(j => window.relSt.st[s.jogadores.indexOf(j)] = {
        g: 0,
        a: 0,
        cv: 0
    });
    renderRelatorio();
    $('#modal-relatorio').style.display = 'flex';
};
window.updRelStat = (i, k, v) => {
    window.relSt.st[i][k] = Math.max(0, window.relSt.st[i][k] + v);
    renderRelatorio();
};
window.addRelSub = i => {
    i = +i;
    window.relSt.s.push(i);
    window.relSt.st[i] = {
        g: 0,
        a: 0,
        cv: 0
    };
    renderRelatorio();
};
window.rmRelSub = i => {
    window.relSt.s = window.relSt.s.filter(x => x !== i);
    delete window.relSt.st[i];
    renderRelatorio();
};

window.renderRelatorio = () => {
    const s = getSeason(),
        st = window.relSt,
        m = s.calendario.filter(e => !e.relatorio);
    let avS = s.jogadores.map((j, i) => i).filter(i => ['Elenco', 'Emprest. - IN'].includes(s.jogadores[i].situacao) && !st.t.includes(i) && !st.s.includes(i));
    const pR = (i, isS) => {
        const j = s.jogadores[i],
            d = st.st[i],
            b = (k, v) => `<button onclick="updRelStat(${i},'${k}',${v})" style="background:#334155;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-weight:900">${v>0?'+':'-'}</button>`;
        return `<div style="display:flex;align-items:center;gap:8px;background:#0f172a;padding:6px;border-radius:6px;border:1px solid #1e293b">${isS?`<button onclick="rmRelSub(${i})" style="background:#ef4444;color:#fff;border:none;border-radius:4px;cursor:pointer;padding:2px 6px">🗑️</button>`:`<div class="pos-stat-box" style="font-size:.75em;padding:2px 4px">${j.pos}</div>`}<div style="flex:1;font-weight:bold;font-size:.85em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j.primeiroNome} ${j.sobrenome}</div><div style="display:flex;align-items:center;gap:4px;font-size:.9em;color:#fbbf24">⚽ ${b('g',-1)} <span style="width:15px;text-align:center">${d.g}</span> ${b('g',1)}</div><div style="display:flex;align-items:center;gap:4px;font-size:.9em;color:#3b82f6">👟 ${b('a',-1)} <span style="width:15px;text-align:center">${d.a}</span> ${b('a',1)}</div><div style="display:flex;align-items:center;gap:4px;font-size:.9em;color:#ef4444">🟥 ${b('cv',-1)} <span style="width:15px;text-align:center">${d.cv}</span> ${b('cv',1)}</div></div>`;
    };
    $('#rel-body').innerHTML = `<div class="modal-row"><label>Partida Pendente:</label><select id="rel-evt" style="background:#0f172a;color:#fff;padding:8px;border:1px solid #3b82f6;border-radius:6px;font-weight:bold">${m.map(e=>`<option value="${e.id}">${e.data.split('-').reverse().join('/')} - ${e.adversario} (${e.campeonato})</option>`).join('')}</select></div><div class="modal-row" style="flex-direction:row;justify-content:center;align-items:center;gap:15px;background:#0f172a;padding:10px;border-radius:8px;border:1px solid #1e293b"><div style="text-align:center;color:#10b981;font-weight:bold">Nós<br><input type="number" id="rel-gp" value="${st.gp}" min="0" style="width:60px;text-align:center;font-size:1.2em;margin-top:5px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:4px" onchange="window.relSt.gp=this.value"></div><div style="font-weight:900;font-size:1.5em;color:#64748b">X</div><div style="text-align:center;color:#ef4444;font-weight:bold">Adv.<br><input type="number" id="rel-gc" value="${st.gc}" min="0" style="width:60px;text-align:center;font-size:1.2em;margin-top:5px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:4px" onchange="window.relSt.gc=this.value"></div></div><div style="color:#fbbf24;font-weight:900;text-transform:uppercase;font-size:.8em;letter-spacing:1px;margin-top:5px">Titulares (${st.t.length})</div><div style="display:flex;flex-direction:column;gap:5px;max-height:180px;overflow-y:auto;padding-right:5px">${st.t.map(i=>pR(i,!1)).join('')}</div><div style="color:#fbbf24;font-weight:900;text-transform:uppercase;font-size:.8em;letter-spacing:1px;margin-top:5px;display:flex;justify-content:space-between"><span>Reservas</span><span style="color:#94a3b8">${st.s.length}/5</span></div><div style="display:flex;flex-direction:column;gap:5px;">${st.s.map(i=>pR(i,!0)).join('')}${st.s.length<5?`<select onchange="if(this.value!=='') addRelSub(this.value)" style="background:#1e293b;color:#fff;padding:8px;border:1px dashed #fbbf24;border-radius:6px;cursor:pointer"><option value="">+ Adicionar Reserva...</option>${avS.map(i=>`<option value="${i}">${s.jogadores[i].pos} - ${s.jogadores[i].primeiroNome} ${s.jogadores[i].sobrenome}</option>`).join('')}</select>`:''}</div>`;
};

window.salvarRelatorio = () => {
    const s = getSeason(),
        st = window.relSt,
        eId = $('#rel-evt').value;
    if (!eId) return alert("Selecione uma partida.");
    st.gp = parseInt($('#rel-gp').value) || 0;
    st.gc = parseInt($('#rel-gc').value) || 0;
    let sG = 0;
    for (let i in st.st) sG += st.st[i].g;
    if (sG > st.gp)
        if (!confirm(`Aviso: Soma de gols (${sG}) é maior que os gols do time (${st.gp}). Salvar mesmo assim?`)) return;
    const e = s.calendario.find(x => x.id == eId);
    if (!e) return;
    if (e.relatorio) reverterRelatorio(e);
    e.gp = st.gp;
    e.gc = st.gc;
    const c = e.campeonato;
    s.jogadores.forEach(j => {
        if (j.suspenso) j.suspenso = false;
    });
    [...st.t, ...st.s].forEach(i => {
        const j = s.jogadores[i];
        if (!j) return;
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
        j.est[c].jogos++;
        j.est[c].gols += st.st[i].g;
        j.est[c].ast += st.st[i].a;
        j.est[c].cv += st.st[i].cv;
        if (st.st[i].cv > 0) {
            j.suspenso = true;
            addNotif(`susp_${eId}_${s.dataAtual}_${i}`, `Suspensão: ${j.primeiroNome} ${j.sobrenome} recebeu cartão vermelho e está fora do próximo jogo.`);
        }
    });
    e.relatorio = {
        f: s.formacao || '4-3-3',
        l: JSON.parse(JSON.stringify(s.lineup)),
        j: [...st.t, ...st.s].map(i => {
            const j = s.jogadores[i];
            return {
                n: `${j.primeiroNome} ${j.sobrenome}`,
                g: st.st[i].g,
                a: st.st[i].a,
                cv: st.st[i].cv,
                s: st.s.includes(i)
            }
        })
    };
    if (st.gp - st.gc >= 3) addNotif(`gol_${eId}_${s.dataAtual}`, `Diretoria parabeniza: Vitória esmagadora por ${st.gp}x${st.gc}! Os torcedores estão eufóricos.`);
    if (st.gc > st.gp && (e.mando === 'C' || e.adversario.includes('(C)'))) addNotif(`der_${eId}_${s.dataAtual}`, `Aviso da Diretoria: A derrota em casa por ${st.gp}x${st.gc} pegou muito mal. Exigimos melhoras.`);
    salvarDados();
    $('#modal-relatorio').style.display = 'none';
    renderizar();
};

window.reverterRelatorio = e => {
    const s = getSeason();
    if (!e.relatorio) return;
    e.relatorio.j.forEach(rj => {
        const j = s.jogadores.find(x => `${x.primeiroNome} ${x.sobrenome}` === rj.n);
        if (j && j.est && j.est[e.campeonato]) {
            j.est[e.campeonato].jogos = Math.max(0, j.est[e.campeonato].jogos - 1);
            j.est[e.campeonato].gols = Math.max(0, j.est[e.campeonato].gols - rj.g);
            j.est[e.campeonato].ast = Math.max(0, j.est[e.campeonato].ast - rj.a);
            if (rj.cv) j.est[e.campeonato].cv = Math.max(0, j.est[e.campeonato].cv - rj.cv);
        }
    });
    delete e.relatorio;
};

window.abrirViewRelatorio = id => {
    const s = getSeason(),
        e = s.calendario.find(x => x.id === id);
    if (!e || !e.relatorio) return;
    const r = e.relatorio,
        cF = formacoesTaticas[r.f || '4-3-3'];
    let mH = Object.keys(r.l).map(k => {
        let l = r.l[k],
            rj = r.j.find(x => x.n === `${l.primeiroNome} ${l.sobrenome}`),
            b = '';
        if (rj) {
            if (rj.g > 0) b += `<div style="background:#fff;border-radius:10px;padding:2px 5px;font-size:14px;color:#000;position:absolute;top:-10px;right:-10px;z-index:20;box-shadow:0 2px 5px rgba(0,0,0,.5)">⚽${rj.g>1?rj.g+'x':''}</div>`;
            if (rj.a > 0) b += `<div style="background:#fff;border-radius:10px;padding:2px 5px;font-size:14px;color:#000;position:absolute;top:-10px;right:${rj.g>0?'-35px':'-10px'};z-index:20;box-shadow:0 2px 5px rgba(0,0,0,.5)">👟${rj.a>1?rj.a+'x':''}</div>`;
            if (rj.cv > 0) b += `<div style="background:#fff;border-radius:10px;padding:2px 5px;font-size:14px;color:#000;position:absolute;top:-10px;left:-10px;z-index:20;box-shadow:0 2px 5px rgba(0,0,0,.5)">🟥</div>`;
        }
        let idJ = l.primeiroNome + l.sobrenome,
            isCap = s.capitao === idJ;
        return `<div class="pos-marker occupied" style="${cF.slots[k]||''};position:absolute;transform:translate(-50%,-50%);cursor:default">${b}
                ${isCap?'<div style="position:absolute;bottom:-10px;left:-10px;background:#fbbf24;color:#000;border-radius:50%;font-size:18px;padding:6px 8px;z-index:50;font-weight:900;line-height:1;box-shadow:0 0 8px rgba(0,0,0,0.8);border:2px solid #000">C</div>':''}
                <div class="name" style="margin-top:8px">${l.primeiroNome[0]}. ${l.sobrenome}</div><div class="ovr">${l.ovr}</div><div class="pos">${l.pos}</div></div>`;
    }).join('');
    let sub = r.j.filter(x => x.s).map(x => `${x.n} ${x.g>0||x.a>0?'('+(x.g>0?`⚽${x.g>1?x.g+'x':''}`:'')+(x.g>0&&x.a>0?' ':'')+(x.a>0?`👟${x.a>1?x.a+'x':''}`:'')+')':''}`.trim());
    $('#view-rel-header').innerHTML = `<div style="font-size:.7em;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">${e.data.split('-').reverse().join('/')} - ${e.campeonato}</div><div style="font-size:1.3em;color:#fbbf24">${e.adversario}</div><div style="font-size:2em;color:#fff;margin-top:5px;font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,.5)">${e.gp} x ${e.gc}</div>`;
    $('#view-rel-pitch').innerHTML = `<div class="pitch-line" style="top:50%;left:0;width:100%;"></div><div class="center-circle"></div>${mH}`;
    $('#view-rel-subs').innerHTML = sub.length ? `⬆️ <b>Entraram:</b> ${sub.join(', ')}` : '<i>Nenhuma substituição.</i>';
    $('#btn-del-rel').onclick = () => {
        if (confirm("Excluir relatório e reverter estatísticas?")) {
            reverterRelatorio(e);
            e.gp = '';
            e.gc = '';
            salvarDados();
            $('#modal-view-rel').style.display = 'none';
            renderizar();
        }
    };
    $('#modal-view-rel').style.display = 'flex';
};

function renderizarCalendario() {
    const s = getSeason(),
        ds = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        ms = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const pD = new Date(anoAtualCal, mesAtualCal, 1).getDay(),
        dNM = new Date(anoAtualCal, mesAtualCal + 1, 0).getDate();
    const legH = `<div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;align-items:center"><span style="font-weight:bold;color:#cbd5e1;margin-right:5px">Legenda:</span>${Object.entries(getCompC()).map(([n,c])=>gBd(n)).join('')}</div>`;
    const topB = `<div class="calendar-header"><button class="btn-cal-nav" onclick="mudarMesCal(-1)">⬅️</button><h2>${ms[mesAtualCal]} ${anoAtualCal}</h2><div style="display:flex;gap:10px"><button class="btn-cal-nav" onclick="calModoLista=!calModoLista;renderizar()">🪟 Alternar</button><button class="btn-cal-nav" onclick="mudarMesCal(1)">➡️</button></div></div>`;
    if (calModoLista) {
        let lst = s.calendario.sort((a, b) => new Date(a.data) - new Date(b.data)).map(e => {
            const isC = e.mando ? e.mando === 'C' : e.adversario.includes('(C)'),
                advNm = e.adversario.replace(/\s\([CF]\)$/, ''),
                btnRel = e.relatorio ? `<button onclick="event.stopPropagation(); abrirViewRelatorio(${e.id})" style="background:#10b981;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-weight:bold;margin-left:10px;font-size:0.8em">👁️ Ver</button>` : '';
            return `<div style="display:flex;align-items:center;background:#0f172a;padding:12px;margin-bottom:8px;border-radius:6px;border-left:4px solid ${isC?'#10b981':'#ef4444'};opacity:${isC?1:0.75};cursor:pointer" onclick="abrirModalEvento('${e.data}',${e.id})"><div style="width:110px;font-weight:bold;color:#cbd5e1">${e.data.split('-').reverse().join('/')}</div><div style="flex:1;font-weight:bold;font-size:1.1em">${isC?'🏠':'✈️'} ${advNm}</div><div style="flex:1">${gBd(e.campeonato)} ${e.rodada}</div><div style="width:140px;text-align:right;font-weight:bold;color:${+e.gp>+e.gc?'#10b981':+e.gp==+e.gc?'#cbd5e1':'#ef4444'};font-size:1.2em;display:flex;align-items:center;justify-content:flex-end;white-space:nowrap">${e.gp!=null&&e.gp!==""?e.gp+' x '+e.gc:'-'}${btnRel}</div></div>`;
        }).join('');
        return `<div class="calendar-wrapper">${topB}${legH}<div>${lst||'<div style="text-align:center;padding:20px">Sem eventos cadastrados.</div>'}</div></div>`;
    }
    let g = ds.map(d => `<div class="cal-day-header">${d}</div>`).join('') + `<div class="cal-day empty"></div>`.repeat(pD);
    for (let i = 1; i <= dNM; i++) {
        const dS = `${anoAtualCal}-${String(mesAtualCal+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isJ = [0, 6, 7].includes(mesAtualCal);
        g += `<div class="cal-day" style="${isJ?'border-top:4px solid #10b981;':''}" ondragover="allowDropCal(event)" ondrop="dropCal(event,'${dS}')"><button class="btn-add-event" onclick="abrirModalEvento('${dS}',null)">+</button><div class="cal-date">${i}</div>` +
            (s.calendario || []).filter(e => e.data === dS).map(e => {
                const isC = e.mando ? e.mando === 'C' : e.adversario.includes('(C)');
                const pl = (e.gp !== "" && e.gc !== "" && e.gp != null && e.gc != null) ? `<div style="background:${+e.gp>+e.gc?'#15803d':+e.gp==+e.gc?'#374151':'#b91c1c'};border-radius:4px;text-align:center;font-weight:900;margin-top:3px;font-size:1.1em">${e.gp} x ${e.gc}</div>` : '';
                const rIcon = e.relatorio ? `<span onclick="event.stopPropagation(); abrirViewRelatorio(${e.id})" style="position:absolute;top:2px;right:2px;background:#10b981;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.75em;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.5)" title="Ver Relatório">👁️</span>` : '';
                return `<div class="cal-event" style="border-left-color:${isC?'#10b981':'#ef4444'};opacity:${isC?1:0.75};position:relative" draggable="true" ondragstart="dragCal(event,${e.id})" onclick="abrirModalEvento('${dS}',${e.id})" title="${e.campeonato} - ${e.rodada}">${rIcon}<div class="cal-event-title">${isC?'🏠':'✈️'} ${e.adversario.replace(/\s\([CF]\)$/,'')}</div><div style="margin-top:2px">${gBd(e.campeonato)} <span style="font-size:0.9em;color:#cbd5e1">${e.rodada}</span></div>${pl}</div>`;
            }).join('') + `</div>`;
    }
    return `<div class="calendar-wrapper">${topB}${legH}<div class="calendar-grid">${g}</div></div>`;
}

const visualizarSnapshot = i => {
    snapshotVisualizando = i;
    renderizar();
};
const fecharSnapshot = () => {
    snapshotVisualizando = null;
    renderizar();
};
const excluirSnapshot = i => {
    if (confirm("Excluir snapshot?")) {
        appData.elencos[appData.indiceAtivo].historico.splice(i, 1);
        if (snapshotVisualizando === i) snapshotVisualizando = null;
        salvarDados();
        renderizar();
    }
};
const mudarAbaSnapshot = a => {
    snapshotAbaSelecionada = a;
    renderizar();
};

