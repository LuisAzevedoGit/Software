// ============================================================
// vacudest.js  –  grelha fiel à folha física
// v5 – Tabela diária separada da tabela semanal/mensal
//       Painel 1: Vacudest (óleo) | Painel 2: Sistema Água 2A
// ============================================================

const VD_API  = "/vacudest";
const STA_API = "/sta2";

// ── TAREFAS PAINEL 1 – VACUDEST ───────────────────────────
const VD_TAREFAS = [
  { id:"1.1", desc:"Verificar o nível de hidróxido de potássio (corrigir PH da água de processo) *",      aval:"Bidão cheio – OK\nBidão Vazio – NG", freq:"diario"   },
  { id:"1.2", desc:'Verificar o nível de anti-espuma no bidão 1.5 "defoamer" * (ver procedimento) *',     aval:"Bidão cheio – OK\nBidão Vazio – NG", freq:"diario"   },
  { id:"1.3", desc:"Verificar o PH do tanque de ácido VacuCIP 1.22 (ver procedimento) **",                aval:"0 > PH > 1 → OK",                    freq:"semanal"  },
  { id:"1.4", desc:"Verificar o PH do tanque de alcalino VacuCIP 1.26 (ver procedimento) **",             aval:"13 > PH > 14 → OK",                  freq:"semanal"  },
  { id:"1.5", desc:"Trocar o ácido e o alcalino dos tanques 1.22 e 1.26 VacuCIP (ver procedimento) **",   aval:"Trocar quando a máquina der alarme",  freq:"indicacao"},
  { id:"1.6", desc:"Reapertar os parafusos da bomba de circulação dos produtos alcalinos e ácidos",        aval:"—",                                  freq:"mensal"   }
];

// ── TAREFAS PAINEL 2 – SISTEMA TRATAMENTO ÁGUA 2A ─────────
const STA_TAREFAS = [
  { id:"1.1",  desc:"Verificar o valor de redox (valor perto dos 700mV)",                                 freq:"diario"  },
  { id:"1.2",  desc:"Verificar o valor da condutividade (valor entre 600 e 800)",                         freq:"diario"  },
  { id:"1.3",  desc:"Verificar o correto funcionamento da válvula da purga",                              freq:"diario"  },
  { id:"1.4",  desc:"Verificar o valor de caudal de entrada de água (>20/min)",                           freq:"diario"  },
  { id:"1.5",  desc:"Verificar o nível de produto de EGBox 13 *",                                         freq:"diario"  },
  { id:"1.6",  desc:"Verificar o nível de produto de ENK BDP 424 *",                                      freq:"diario"  },
  { id:"1.7",  desc:"Verificar o nível de produto de Kurita *",                                           freq:"diario"  },
  { id:"1.8",  desc:"Verificar a correta regulação da bomba de EGBox 13 (100% e Ext.)",                   freq:"diario"  },
  { id:"1.9",  desc:"Verificar a correta regulação da bomba de ENK BDP 424 (100% e Ext.)",                freq:"diario"  },
  { id:"1.10", desc:"Verificar a correta regulação da bomba de Kurita (100% e Ext.)",                     freq:"diario"  },
  { id:"1.11", desc:"Limpeza geral do sistema",                                                           freq:"mensal"  },
  { id:"1.12", desc:"Medição do cloro (valor entre 1 e 2 ppm) **",                                        freq:"diario"  },
  { id:"1.13", desc:"Limpeza da sonda de condutividade",                                                  freq:"mensal"  }
];

// ══════════════════════════════════════════════════════════
// ESTADO – separado por painel
// ══════════════════════════════════════════════════════════
let vd1DayStates = {}, vd1WeekDates = {}, vd1MonthDate = {}, vd1EditId = null;
let vd2DayStates = {}, vd2WeekDates = {}, vd2MonthDate = {}, vd2EditId = null;

function initState(panel) {
  if (panel === 1) {
    VD_TAREFAS.forEach(t => { vd1DayStates[t.id] = {}; vd1WeekDates[t.id] = {}; vd1MonthDate[t.id] = ""; });
  } else {
    STA_TAREFAS.forEach(t => { vd2DayStates[t.id] = {}; vd2WeekDates[t.id] = {}; vd2MonthDate[t.id] = ""; });
  }
}

// ── Calendário ────────────────────────────────────────────
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function isWeekend(y, m, d)   { const w = new Date(y, m, d).getDay(); return w === 0 || w === 6; }
function getWeeksOfMonth(y, m) {
  const total = getDaysInMonth(y, m), weeks = [];
  let cur = 1;
  while (cur <= total) {
    const dow = new Date(y, m, cur).getDay();
    const end = Math.min(cur + (dow === 0 ? 0 : 7 - dow), total);
    weeks.push({ start: cur, end });
    cur = end + 1;
  }
  return weeks;
}

// ══════════════════════════════════════════════════════════
// CONSTRUIR GRELHA DIÁRIA
// ══════════════════════════════════════════════════════════
function vdBuildDailyGrid(panel, year, month, tarefas, dayStates) {
  const gridId = panel === 1 ? "vd1Grid" : "vd2Grid";
  const total  = getDaysInMonth(year, month);

  const table = document.getElementById(gridId);
  table.innerHTML = "";
  const thead = table.createTHead();

  function th(text, colspan, cls) {
    const el = document.createElement("th");
    el.innerHTML = text;
    if (colspan > 1) el.colSpan = colspan;
    if (cls) el.className = cls;
    return el;
  }

  const tarefasDiarias = tarefas.filter(t => t.freq === "diario");
  if (!tarefasDiarias.length) return;

  // Row 1 – título
  const rT = thead.insertRow(); rT.className = "row-title";
  rT.appendChild(th("#", 1, "th-left"));
  rT.appendChild(th("Descrição da Tarefa", 1, "th-left"));
  if (panel === 1) rT.appendChild(th("Avaliação", 1, "th-left"));
  rT.appendChild(th("Period.", 1));
  const monthName = new Date(year, month, 1).toLocaleString("pt-PT", { month:"long", year:"numeric" });
  rT.appendChild(th(`Mês: ${monthName.charAt(0).toUpperCase()+monthName.slice(1)}`, total + 1));

  // Row 2 – dias
  const rD = thead.insertRow(); rD.className = "row-days";
  rD.appendChild(th("",1,"th-fixed")); rD.appendChild(th("",1,"th-fixed"));
  if (panel === 1) rD.appendChild(th("",1,"th-fixed"));
  rD.appendChild(th("Dia",1,"th-fixed"));
  for (let d = 1; d <= total; d++) {
    const we = isWeekend(year,month,d);
    const t = th(String(d).padStart(2,"0"), 1, we ? "weekend" : "");
    if (we) t.title = new Date(year,month,d).toLocaleString("pt-PT",{weekday:"short"}).toUpperCase();
    rD.appendChild(t);
  }
  rD.appendChild(th("Total",1,"th-total"));

  const tbody = table.createTBody();

  tarefasDiarias.forEach(t => {
    const tr = tbody.insertRow();
    const tdId = tr.insertCell(); tdId.className="td-id"; tdId.textContent=t.id;
    const tdDesc = tr.insertCell(); tdDesc.className="td-desc"; tdDesc.textContent=t.desc;
    if (panel === 1) {
      const tdAval = tr.insertCell(); tdAval.className="td-aval"; tdAval.style.whiteSpace="pre-line"; tdAval.textContent=t.aval||"";
    }
    const tdFreq = tr.insertCell(); tdFreq.className="td-freq"; tdFreq.textContent = "Diário";

    const totalCell = document.createElement("td");
    totalCell.className = "td-total"; totalCell.textContent = "—";

    function recalcTotal() {
      const vals = Object.values(dayStates[t.id]);
      const sum  = vals.reduce((acc,v) => { const n=parseFloat(v); return acc+(isFinite(n)?n:0); }, 0);
      const hasNum = vals.some(v => v && isFinite(parseFloat(v)));
      totalCell.textContent = hasNum ? sum : "—";
      totalCell.classList.toggle("has-value", hasNum && sum > 0);
    }

    for (let d = 1; d <= total; d++) {
      const td = tr.insertCell();
      const we = isWeekend(year, month, d);
      td.className = "day-cell" + (we ? " weekend" : "");
      if (we) {
        td.innerHTML = '<div class="dc-we"></div>';
      } else {
        const inp = document.createElement("input");
        inp.type="text"; inp.className="dc-input"; inp.maxLength=8;
        inp.placeholder="—"; inp.autocomplete="off"; inp.spellcheck=false;
        const existing = dayStates[t.id][d];
        if (existing) inp.value = existing;
        inp.addEventListener("input", function() {
          const raw = this.value.trim();
          dayStates[t.id][d] = raw || null;
          td.classList.remove("s-ok","s-ng","s-par","s-num");
          if (raw) {
            const lower = raw.toLowerCase();
            if (lower==="ok") td.classList.add("s-ok");
            else if (lower==="ng"||lower==="0") td.classList.add("s-ng");
            else if (lower==="-"||lower==="—") td.classList.add("s-par");
            else if (isFinite(parseFloat(raw))) td.classList.add("s-num");
          }
          recalcTotal();
        });
        if (existing) {
          const lower = existing.toLowerCase();
          if (lower==="ok") td.classList.add("s-ok");
          else if (lower==="ng"||lower==="0") td.classList.add("s-ng");
          else if (lower==="-"||lower==="—") td.classList.add("s-par");
          else if (isFinite(parseFloat(existing))) td.classList.add("s-num");
        }
        td.appendChild(inp);
      }
    }
    tr.appendChild(totalCell);
    recalcTotal();
  });
}

// ══════════════════════════════════════════════════════════
// CONSTRUIR GRELHA SEMANAL / MENSAL (tabela separada em baixo)
// ══════════════════════════════════════════════════════════
function vdBuildPeriodicGrid(panel, year, month, tarefas, weekDates, monthDate) {
  const gridId = panel === 1 ? "vd1GridPeriodic" : "vd2GridPeriodic";
  const wrapId = panel === 1 ? "vd1GridPeriodicWrap" : "vd2GridPeriodicWrap";
  const m = month + 1;

  const tarefasPeriodicas = tarefas.filter(t => t.freq !== "diario");
  if (!tarefasPeriodicas.length) {
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.style.display = "none";
    return;
  }

  const wrap = document.getElementById(wrapId);
  if (wrap) wrap.style.display = "";

  const weeks = getWeeksOfMonth(year, month);
  const total = getDaysInMonth(year, month);

  const table = document.getElementById(gridId);
  table.innerHTML = "";
  const thead = table.createTHead();

  function th(text, colspan, cls) {
    const el = document.createElement("th");
    el.innerHTML = text;
    if (colspan > 1) el.colSpan = colspan;
    if (cls) el.className = cls;
    return el;
  }

  const freqLabels = { semanal:"Semanal", indicacao:"Indicação\nmáquina", mensal:"Mensal" };

  // Row 1 – título
  const rT = thead.insertRow(); rT.className = "row-title";
  rT.appendChild(th("#", 1, "th-left"));
  rT.appendChild(th("Descrição da Tarefa", 1, "th-left"));
  if (panel === 1) rT.appendChild(th("Avaliação", 1, "th-left"));
  rT.appendChild(th("Period.", 1));
  // week columns
  weeks.forEach((w, wi) => {
    rT.appendChild(th(`Semana ${wi+1}<br><span style="font-size:9px;font-weight:400;opacity:.8">${String(w.start).padStart(2,"0")}-${String(w.end).padStart(2,"0")}</span>`, 1, "th-left"));
  });
  rT.appendChild(th("Data Mensal", 1, "th-left"));

  const tbody = table.createTBody();

  tarefasPeriodicas.forEach(t => {
    const tr = tbody.insertRow();
    const tdId = tr.insertCell(); tdId.className="td-id"; tdId.textContent=t.id;
    const tdDesc = tr.insertCell(); tdDesc.className="td-desc"; tdDesc.textContent=t.desc;
    if (panel === 1) {
      const tdAval = tr.insertCell(); tdAval.className="td-aval"; tdAval.style.whiteSpace="pre-line"; tdAval.textContent=t.aval||"";
    }
    const tdFreq = tr.insertCell(); tdFreq.className="td-freq"; tdFreq.style.whiteSpace="pre-line";
    tdFreq.textContent = freqLabels[t.freq] || t.freq;

    if (t.freq === "semanal" || t.freq === "indicacao") {
      weeks.forEach((w, wi) => {
        const td = tr.insertCell(); td.className="week-cell";
        const lbl = document.createElement("span"); lbl.className="wk-label"; lbl.textContent=`Sem. ${wi+1}`; td.appendChild(lbl);
        const inp = document.createElement("input"); inp.type="date";
        inp.min=`${year}-${String(m).padStart(2,"0")}-${String(w.start).padStart(2,"0")}`;
        inp.max=`${year}-${String(m).padStart(2,"0")}-${String(w.end).padStart(2,"0")}`;
        if (weekDates[t.id] && weekDates[t.id][wi]) inp.value = weekDates[t.id][wi];
        inp.addEventListener("change", function() {
          if (!weekDates[t.id]) weekDates[t.id] = {};
          weekDates[t.id][wi] = this.value;
        });
        td.appendChild(inp);
      });
      // empty monthly cell
      tr.insertCell().className="filler";

    } else { // mensal
      // empty week cells
      weeks.forEach(() => tr.insertCell().className="filler");
      // monthly date
      const td = tr.insertCell(); td.className="month-cell";
      const inp = document.createElement("input"); inp.type="date";
      inp.min=`${year}-${String(m).padStart(2,"0")}-01`;
      inp.max=`${year}-${String(m).padStart(2,"0")}-${String(total).padStart(2,"0")}`;
      if (monthDate[t.id]) inp.value = monthDate[t.id];
      inp.addEventListener("change", function() { monthDate[t.id] = this.value; });
      td.appendChild(inp);
    }
  });
}

// ══════════════════════════════════════════════════════════
// CONSTRUIR AMBAS AS GRELHAS
// ══════════════════════════════════════════════════════════
function vdBuildGrid(panel) {
  const mesId    = panel === 1 ? "vd1Mes"  : "vd2Mes";
  const tarefas  = panel === 1 ? VD_TAREFAS : STA_TAREFAS;
  const dayStates = panel === 1 ? vd1DayStates : vd2DayStates;
  const weekDates = panel === 1 ? vd1WeekDates : vd2WeekDates;
  const monthDate = panel === 1 ? vd1MonthDate : vd2MonthDate;

  const mesVal = document.getElementById(mesId).value;
  if (!mesVal) return;

  if (panel === 2) {
    const ph = document.getElementById("vd2Placeholder");
    const fc = document.getElementById("vd2FormContent");
    if (ph) ph.style.display = "none";
    if (fc) fc.style.display = "";
  }

  const [y, m] = mesVal.split("-").map(Number);
  const year = y, month = m - 1;

  const editId = panel === 1 ? vd1EditId : vd2EditId;
  if (!editId) initState(panel);

  vdBuildDailyGrid(panel, year, month, tarefas, dayStates);
  vdBuildPeriodicGrid(panel, year, month, tarefas, weekDates, monthDate);
}

// ── Topbar ────────────────────────────────────────────────
function vdUpdateTopbar(panel) {
  const resp = document.getElementById(panel===1?"vd1Resp":"vd2Resp")?.value || "—";
  const el   = document.getElementById(panel===1?"vdTopRight1":"vdTopRight2");
  if (el) el.innerHTML = `Resp: <strong>${resp}</strong><br>
    ${new Date().toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}`;
}

// ── Collect ───────────────────────────────────────────────
function vdCollect(panel) {
  const mesVal = document.getElementById(panel===1?"vd1Mes":"vd2Mes").value;
  if (!mesVal) return null;
  const [y, m] = mesVal.split("-").map(Number);
  const year=y, month=m-1;
  const total  = getDaysInMonth(year, month);
  const weeks  = getWeeksOfMonth(year, month);
  const tarefas   = panel===1 ? VD_TAREFAS   : STA_TAREFAS;
  const dayStates = panel===1 ? vd1DayStates : vd2DayStates;
  const weekDates = panel===1 ? vd1WeekDates : vd2WeekDates;
  const monthDate = panel===1 ? vd1MonthDate : vd2MonthDate;

  const verificacoes = tarefas.map(t => {
    if (t.freq==="diario") {
      const dias={};
      for (let d=1;d<=total;d++){const s=dayStates[t.id][d];if(s)dias[d]=s;}
      const soma=Object.values(dias).reduce((a,b)=>{const n=parseFloat(b);return a+(isFinite(n)?n:0);},0);
      return {id:t.id,freq:t.freq,dias,total_numerico:soma};
    } else if (t.freq==="semanal"||t.freq==="indicacao") {
      return {id:t.id,freq:t.freq,semanas:weeks.map((_,wi)=>weekDates[t.id]?weekDates[t.id][wi]||null:null)};
    } else {
      return {id:t.id,freq:t.freq,data:monthDate[t.id]||null};
    }
  });

  if (panel===1) {
    return {
      responsavel: document.getElementById("vd1Resp").value.trim(),
      maquina:     document.getElementById("vd1Maq").value.trim(),
      modelo:      document.getElementById("vd1Mod").value.trim(),
      mes_ano:     mesVal, verificacoes,
      observacoes: document.getElementById("vd1Obs").value.trim()
    };
  } else {
    return {
      responsavel: document.getElementById("vd2Resp").value.trim(),
      maquina: document.getElementById("vd2MaqSel").value,
      mes_ano: mesVal,
      verificacoes,
      observacoes: document.getElementById("vd2Obs").value.trim()
    };
  }
}

// ── Guardar / Atualizar ───────────────────────────────────
async function vdGuardar(panel) {
  const payload = vdCollect(panel);
  if (!payload) return vdToast("Selecione o mês antes de guardar.", true);
  const editId = panel===1 ? vd1EditId : vd2EditId;
  const api    = panel===1 ? VD_API    : STA_API;
  const isEdit = editId !== null;
  const url    = isEdit ? `${api}/registos/${editId}` : `${api}/save`;
  const method = isEdit ? "PUT" : "POST";
  try {
    const res  = await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const text = await res.text();
    let data={};try{data=JSON.parse(text);}catch{data={};}
    if (res.ok && (data.sucesso||res.status===200||res.status===201)) {
      vdToast(isEdit?"Registo atualizado!":"Registo guardado com sucesso!");
      vdCancelEdit(panel); vdLoad(panel);
    } else { vdToast(data.erro||"Erro ao guardar.",true); }
  } catch(e){console.error(e);vdToast("Erro de ligação ao servidor.",true);}
}

// ── Modo edição ───────────────────────────────────────────
function vdStartEdit(panel, registo) {
  if (panel===1) {
    vd1EditId=registo.id;
    document.getElementById("vd1Resp").value=registo.responsavel||"";
    document.getElementById("vd1Maq").value =registo.maquina||"";
    document.getElementById("vd1Mod").value =registo.modelo||"";
    document.getElementById("vd1Mes").value =registo.mes_ano||"";
    document.getElementById("vd1Obs").value =registo.observacoes||"";
  } else {
    vd2EditId = registo.id;
    document.getElementById("vd2Resp").value =registo.responsavel || "";
    document.getElementById("vd2Mes").value =registo.mes_ano || "";
    document.getElementById("vd2Obs").value =registo.observacoes || "";
    document.getElementById("vd2MaqSel").value =registo.maquina || "";
  }

  initState(panel);
  const dayStates = panel===1 ? vd1DayStates : vd2DayStates;
  const weekDates = panel===1 ? vd1WeekDates : vd2WeekDates;
  const monthDate = panel===1 ? vd1MonthDate : vd2MonthDate;

  (registo.verificacoes||[]).forEach(v => {
    if (!dayStates[v.id])  dayStates[v.id]  = {};
    if (!weekDates[v.id])  weekDates[v.id]  = {};
    if (!monthDate[v.id])  monthDate[v.id]  = "";
    if (v.freq==="diario"&&v.dias)
      Object.entries(v.dias).forEach(([d,val])=>{dayStates[v.id][Number(d)]=val;});
    else if ((v.freq==="semanal"||v.freq==="indicacao")&&v.semanas)
      v.semanas.forEach((dt,wi)=>{weekDates[v.id][wi]=dt||"";});
    else if (v.freq==="mensal"&&v.data)
      monthDate[v.id]=v.data;
  });

  vdBuildGrid(panel);

  const saveBtn = document.getElementById(panel===1?"vd1SaveBtn":"vd2SaveBtn");
  if (saveBtn) { saveBtn.textContent="Atualizar Registo"; saveBtn.style.background="#c8a84b"; }
  const banner = document.getElementById(panel===1?"vdEditBanner1":"vdEditBanner2");
  if (banner) banner.classList.add("show");
  const lbl = document.getElementById(panel===1?"vdEditLabel1":"vdEditLabel2");
  if (lbl) lbl.textContent=`A editar registo #${registo.id} — ${registo.mes_ano}`;
  const title = document.getElementById(panel===1?"vd1FormTitle":"vd2FormTitle");
  if (title) title.textContent=`A editar registo #${registo.id} — ${registo.mes_ano}`;
  document.getElementById(panel===1?"vd1Grid":"vd2Grid").scrollIntoView({behavior:"smooth",block:"start"});
}

function vdCancelEdit(panel) {
  if (panel===1) vd1EditId=null; else vd2EditId=null;
  initState(panel);
  const obs = document.getElementById(panel===1?"vd1Obs":"vd2Obs");
  if (obs) obs.value="";
  const saveBtn = document.getElementById(panel===1?"vd1SaveBtn":"vd2SaveBtn");
  if (saveBtn) { saveBtn.textContent="Guardar Registo"; saveBtn.style.background=""; }
  const banner = document.getElementById(panel===1?"vdEditBanner1":"vdEditBanner2");
  if (banner) banner.classList.remove("show");
  const title = document.getElementById(panel===1?"vd1FormTitle":"vd2FormTitle");
  if (title) title.textContent="Verificações Diárias";
  vdBuildGrid(panel);
}

// ── Reset ─────────────────────────────────────────────────
function vdReset(panel) {
  const editId = panel===1 ? vd1EditId : vd2EditId;
  if (editId) { vdCancelEdit(panel); return; }
  initState(panel);
  const obs = document.getElementById(panel===1?"vd1Obs":"vd2Obs");
  if (obs) obs.value="";
  vdBuildGrid(panel);
}

// ── Tabs ──────────────────────────────────────────────────
function vdSwitchTab(panel) {
  document.getElementById("panel1").style.display = panel===1 ? "" : "none";
  document.getElementById("panel2").style.display = panel===2 ? "" : "none";
  document.getElementById("tab1").classList.toggle("active", panel===1);
  document.getElementById("tab2").classList.toggle("active", panel===2);
  if (panel===2 && !document.getElementById("vd2Mes").value) {
    const t=new Date();
    document.getElementById("vd2Mes").value=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;
  }
}

// ── Machine change (painel 2) ─────────────────────────────
function vdOnMaqChange() {
  const sel = document.getElementById("vd2MaqSel").value;
  if (sel && document.getElementById("vd2Mes").value) {
    initState(2); vdBuildGrid(2);
  }
}

// ── Load & Render ─────────────────────────────────────────
async function vdLoad(panel) {
  const filtroId = panel===1 ? "vd1FiltroMes" : "vd2FiltroMes";
  const listaId  = panel===1 ? "vd1Lista"     : "vd2Lista";
  const api      = panel===1 ? VD_API         : STA_API;
  const mes = document.getElementById(filtroId)?.value||"";
  let url = `${api}/registos`;
  const params=[];
  if (mes) params.push(`mes_ano=${encodeURIComponent(mes)}`);
  if (panel===2) {
    const fm = document.getElementById("vd2FiltroMaq")?.value||"";
    if (fm) params.push(`maquina=${encodeURIComponent(fm)}`);
  }
  if (params.length) url+="?"+params.join("&");
  try {
    const res=await fetch(url);
    const list=await res.json();
    vdRenderList(panel, Array.isArray(list)?list:[]);
  } catch {
    const el=document.getElementById(listaId);
    if(el) el.innerHTML='<div class="vd-empty">Não foi possível ligar ao servidor.</div>';
  }
}

function vdRenderList(panel, registos) {
  const listaId = panel===1?"vd1Lista":"vd2Lista";
  const tarefas = panel===1?VD_TAREFAS:STA_TAREFAS;
  const container = document.getElementById(listaId);
  if (!container) return;
  if (!registos.length){container.innerHTML='<div class="vd-empty">Sem registos guardados.</div>';return;}
  if (panel===1) window._vd1Registos=registos; else window._vd2Registos=registos;

  container.innerHTML=registos.map(r=>{
    const verifs=Array.isArray(r.verificacoes)?r.verificacoes:[];
    const rows=verifs.map(v=>{
      const tarefa=tarefas.find(t=>t.id===v.id)||{desc:v.id};
      if (v.freq==="diario"&&v.dias) {
        const marks=Array.from({length:31},(_,i)=>{
          const s=v.dias[i+1];
          if(!s) return`<td><span class="mk na"></span></td>`;
          const lower=s.toLowerCase();
          const cls=lower==="ok"?"ok":(lower==="ng"||lower==="0")?"ng":(lower==="-"||lower==="—")?"par":isFinite(parseFloat(s))?"num":"na";
          return`<td><span class="mk ${cls}">${s}</span></td>`;
        }).join("");
        const soma=v.total_numerico!==undefined?v.total_numerico:Object.values(v.dias).reduce((a,b)=>{const n=parseFloat(b);return a+(isFinite(n)?n:0);},0);
        const hasNum=Object.values(v.dias).some(val=>val&&isFinite(parseFloat(val)));
        return`<tr><td class="td-l" style="font-weight:700;color:#1a3a5c">${v.id}</td><td class="td-l">${tarefa.desc.substring(0,52)}…</td><td style="font-size:10px;color:#888">Diário</td>${marks}<td colspan="6"></td><td class="td-total-val"><strong>${hasNum?soma:"—"}</strong></td></tr>`;
      } else if ((v.freq==="semanal"||v.freq==="indicacao")&&v.semanas) {
        const semCells=v.semanas.map(dt=>`<td class="dt-val">${dt?dt.split("-").reverse().join("/"):"—"}</td>`).join("");
        return`<tr><td class="td-l" style="font-weight:700;color:#1a3a5c">${v.id}</td><td class="td-l">${tarefa.desc.substring(0,52)}…</td><td style="font-size:10px;color:#888">${v.freq==="semanal"?"Semanal":"Indicação"}</td><td colspan="31"></td>${semCells}<td></td><td></td></tr>`;
      } else {
        return`<tr><td class="td-l" style="font-weight:700;color:#1a3a5c">${v.id}</td><td class="td-l">${tarefa.desc.substring(0,52)}…</td><td style="font-size:10px;color:#888">Mensal</td><td colspan="31"></td><td colspan="5"></td><td class="dt-val">${v.data?v.data.split("-").reverse().join("/"):"—"}</td><td></td></tr>`;
      }
    }).join("");
    const obsHtml=r.observacoes?`<div style="margin-top:10px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#555;white-space:pre-line"><strong style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999">Observações</strong><br>${r.observacoes}</div>`:"";
    const dateFmt=r.mes_ano?new Date(r.mes_ano+"-01").toLocaleString("pt-PT",{month:"long",year:"numeric"}):"—";
    return`<div class="vd-entry"><div class="vd-entry-head"><span><strong>${dateFmt.charAt(0).toUpperCase()+dateFmt.slice(1)}</strong> &nbsp;|&nbsp; ${r.maquina||"—"} &nbsp;|&nbsp; Resp: ${r.responsavel||"—"} &nbsp;|&nbsp; <span style="color:#888;font-size:11px">guardado em ${r.criado_em?new Date(r.criado_em).toLocaleDateString("pt-PT"):"—"}</span></span><div style="display:flex;gap:6px"><button class="vd-btn-edit" onclick="vdEdit(${panel},${r.id})"><i class="fas fa-pencil-alt" style="margin-right:4px"></i>Editar</button><button class="vd-btn-del" onclick="vdDel(${panel},${r.id})"><i class="fas fa-trash-alt" style="margin-right:4px"></i>Eliminar</button></div></div><div class="vd-entry-body"><table class="vd-mini"><thead><tr><th>#</th><th style="min-width:160px;text-align:left">Tarefa</th><th>Freq.</th>${Array.from({length:31},(_,i)=>`<th>${i+1}</th>`).join("")}<th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th><th>Data</th><th style="background:#1a3a5c;color:#fff">Total</th></tr></thead><tbody>${rows}</tbody></table>${obsHtml}</div></div>`;
  }).join("");
}

function vdEdit(panel,id) {
  const registos=panel===1?(window._vd1Registos||[]):(window._vd2Registos||[]);
  const reg=registos.find(r=>Number(r.id)===Number(id));
  if(!reg){vdToast("Registo não encontrado.",true);return;}
  vdStartEdit(panel,reg);
}
window.vdEdit=vdEdit;

async function vdDel(panel,id) {
  if(!confirm("Eliminar este registo?"))return;
  const api=panel===1?VD_API:STA_API;
  try {
    const res=await fetch(`${api}/registos/${id}`,{method:"DELETE"});
    const text=await res.text();
    let d={};try{d=JSON.parse(text);}catch{d={};}
    if(res.ok&&(d.sucesso||res.status===200||res.status===204)){vdToast("Registo eliminado.");vdLoad(panel);}
    else vdToast(d.erro||"Erro ao eliminar.",true);
  } catch{vdToast("Erro de ligação.",true);}
}
window.vdDel=vdDel;

function vdToast(msg, isErr=false) {
  const el=document.getElementById("vdToast");
  el.textContent=msg;
  el.className="vd-toast show"+(isErr?" err":"");
  setTimeout(()=>{el.className="vd-toast";},3200);
}

// ── Init ──────────────────────────────────────────────────
(function() {
  const today=new Date();
  const mesVal=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
  // Painel 1
  document.getElementById("vd1Mes").value=mesVal;
  initState(1);
  vdBuildGrid(1);
  vdUpdateTopbar(1);
  vdLoad(1);
  document.getElementById("vd1Resp")?.addEventListener("input",()=>vdUpdateTopbar(1));
  // Painel 2
  document.getElementById("vd2Resp")?.addEventListener("input",()=>vdUpdateTopbar(2));
  vdUpdateTopbar(2);
  vdLoad(2);
})();