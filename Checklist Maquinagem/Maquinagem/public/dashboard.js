console.log("✅ dashboard.js carregado");

const DIAS_KEYS  = ["seg", "ter", "qua", "qui", "sex"];
const DIAS_LABEL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

let chartTrend  = null;
let chartLinhas = null;

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date();
  document.getElementById("ctrl-semana").value =
    `${hoje.getFullYear()}-W${String(getNumeroSemana(hoje)).padStart(2, "0")}`;

  document.getElementById("btn-atualizar").addEventListener("click", carregarDashboard);
  carregarDashboard();
});

/* =========================
   CARREGAR
========================= */
async function carregarDashboard() {
  const semana = document.getElementById("ctrl-semana").value;
  const linha  = document.getElementById("ctrl-linha").value;

  const btn = document.getElementById("btn-atualizar");
  btn.classList.add("loading");
  btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> A carregar...';

  try {
    const params = new URLSearchParams();
    if (semana) params.set("semana", semana);
    if (linha)  params.set("linha",  linha);

    const raw = await fetch(`/checklists?${params.toString()}`).then(r => r.json());
    const registos = (Array.isArray(raw) ? raw : []).map(normalizar);

    /* DEBUG — abre a consola para verificar o que chegou */
    console.group("📊 Dashboard — dados recebidos");
    console.log("Total registos:", registos.length);
    registos.forEach((r, i) => {
      console.log(`[${i}] Linha:${r.linha} Máquina:${r.maquinaId} Semana:${r.semana}`);
      console.log(`     resultados (${r.resultados.length}):`, r.resultados.slice(0, 3));
    });
    console.groupEnd();

    const historico = await carregarHistorico(semana, linha);
    renderDashboard(registos, historico, semana, linha);

  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
    document.getElementById("dash-subtitle").textContent = "Erro ao carregar dados — ver consola.";
  } finally {
    btn.classList.remove("loading");
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
  }
}

/* =========================
   HISTÓRICO — 6 semanas
========================= */
async function carregarHistorico(semanaAtual, linha) {
  const semanas = semanaAnterior(semanaAtual, 6);
  const out = [];
  for (const s of semanas) {
    try {
      const p = new URLSearchParams({ semana: s });
      if (linha) p.set("linha", linha);
      const data = await fetch(`/checklists?${p}`).then(r => r.json())
        .then(d => (Array.isArray(d) ? d : []).map(normalizar));
      out.push({ semana: s, conf: calcularConformidadeGlobal(data) });
    } catch {
      out.push({ semana: s, conf: null });
    }
  }
  return out;
}

/* =========================
   RENDER PRINCIPAL
========================= */
function renderDashboard(registos, historico, semana, linha) {

  const linhaLabel = linha
    ? (document.querySelector(`#ctrl-linha option[value="${linha}"]`)?.textContent || linha)
    : "Todas as linhas";

  document.getElementById("dash-subtitle").textContent =
    `${semana || "Semana atual"} — ${linhaLabel}`;
  document.getElementById("dash-ts").textContent =
    "Atualizado: " + new Date().toLocaleString("pt-PT");

  /* ── Métricas ──
     Conformidade = campos com valor não vazio / total de campos existentes nos registos
     "Total de campos" vem do modelo (sistemaChecklists) para cada máquina registada.
     Se o modelo não estiver disponível, usa só os campos guardados como estimativa.
  */
  let totalCampos = 0;
  let camposPreenchidos = 0;
  let camposAnomalias  = 0;

  registos.forEach(reg => {
    const modelo = obterModeloMaquina(reg.linha, reg.maquinaId);
    const esperado = modelo ? contarCamposEsperados(modelo) : null;

    const preenchidos = reg.resultados.filter(x =>
      x.key && !x.key.includes("undefined") && x.valor?.trim()
    );
    const anomalias = preenchidos.filter(x => x.valor.trim().toUpperCase() === "X");

    camposPreenchidos += preenchidos.length;
    camposAnomalias   += anomalias.length;

    /* Se temos o modelo, usamos o total real de campos */
    if (esperado !== null) {
      totalCampos += esperado;
    } else {
      /* Fallback: usa os resultados guardados como estimativa do total */
      totalCampos += reg.resultados.filter(x => x.key && !x.key.includes("undefined")).length;
    }
  });

  const confGlobal  = totalCampos > 0 ? Math.round((camposPreenchidos / totalCampos) * 100) : 0;
  const emFalta     = totalCampos - camposPreenchidos;
  const linhasUnicas   = [...new Set(registos.map(r => r.linha).filter(Boolean))].length;
  const maquinasUnicas = [...new Set(registos.map(r => r.maquinaId).filter(Boolean))].length;

  console.log(`📈 Conformidade: ${camposPreenchidos}/${totalCampos} = ${confGlobal}%`);
  console.log(`❌ Anomalias: ${camposAnomalias} | Em falta: ${emFalta}`);

  /* ── KPIs ── */
  document.getElementById("kpi-total").textContent     = registos.length;
  document.getElementById("kpi-conf").textContent      = confGlobal + "%";
  document.getElementById("kpi-anomalias").textContent = camposAnomalias;
  document.getElementById("kpi-falta").textContent     = emFalta > 0 ? emFalta : 0;
  document.getElementById("kpi-linhas").textContent    = linhasUnicas;
  document.getElementById("kpi-maquinas").textContent  = maquinasUnicas;

  const pill = document.getElementById("kpi-conf-pill");
  if (confGlobal >= 85) {
    pill.textContent = "Dentro do objetivo"; pill.className = "kpi-pill pill-ok";
  } else if (confGlobal >= 70) {
    pill.textContent = "Atenção";            pill.className = "kpi-pill pill-warn";
  } else {
    pill.textContent = "Abaixo do objetivo"; pill.className = "kpi-pill pill-bad";
  }

  renderBarrasSecao(registos);
  renderStatusGeral(registos);
  renderChartLinhas(registos);
  renderChartTrend(historico);
  renderAnomalias(registos);
}

/* =========================
   BARRAS DE SECÇÃO
   Usa o modelo para saber o total real de campos
========================= */
function renderBarrasSecao(registos) {
  const secoes = [
    { nome: "Operador",    key: "Operador",    cor: "#e07b00" },
    { nome: "Manutenção",  key: "Manutenção",  cor: "#1565c0" },
    { nome: "Líder",       key: "Lider",       cor: "#2e7d32" }
  ];

  const container = document.getElementById("bars-secao");

  if (!registos.length) {
    container.innerHTML = `<div class="empty-state">
      <i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:0.3;"></i>
      Sem dados para este filtro.
    </div>`;
    return;
  }

  container.innerHTML = "";

  secoes.forEach(s => {
    let totalEsperado = 0;
    let totalPreen    = 0;

    registos.forEach(reg => {
      const modelo = obterModeloMaquina(reg.linha, reg.maquinaId);
      const secaoItens = modelo
        ? (s.key === "Manutenção"
            ? (modelo["Manutenção"] || [])
            : (modelo[s.key] || []))
        : null;

      /* Total esperado para esta secção nesta máquina */
      if (secaoItens !== null) {
        if (s.key === "Operador")   totalEsperado += secaoItens.length * DIAS_KEYS.length * 3;
        if (s.key === "Manutenção") totalEsperado += secaoItens.length * DIAS_KEYS.length;
        if (s.key === "Lider")      totalEsperado += secaoItens.length;
      } else {
        /* fallback sem modelo */
        const salvos = reg.resultados.filter(x => x.secao === s.key && !x.key?.includes("undefined"));
        totalEsperado += salvos.length;
      }

      /* Campos efectivamente preenchidos */
      totalPreen += reg.resultados.filter(x =>
        x.secao === s.key &&
        x.valor?.trim() &&
        !x.key?.includes("undefined")
      ).length;
    });

    const pct = totalEsperado > 0 ? Math.round((totalPreen / totalEsperado) * 100) : 0;

    container.innerHTML += `
      <div class="bar-secao-row">
        <div class="bar-secao-label">${s.nome}</div>
        <div class="bar-secao-track">
          <div class="bar-secao-fill" style="width:${pct}%;background:${s.cor}"></div>
        </div>
        <div class="bar-secao-pct">${pct}%</div>
      </div>
      <div style="font-size:11px;color:#aaa;margin-bottom:14px;margin-left:100px;">
        ${totalPreen} / ${totalEsperado} campos
      </div>`;
  });
}

/* =========================
   STATUS GERAL DOS CAMPOS
   Normais / Anomalias (X) / Não preenchido
========================= */
function renderStatusGeral(registos) {
  const container = document.getElementById("heatmap-grid");

  if (!registos.length) {
    container.innerHTML = `<div class="empty-state">
      <i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:0.3;"></i>
      Sem dados para este filtro.
    </div>`;
    return;
  }

  let total = 0, normais = 0, anomalias = 0;

  registos.forEach(reg => {
    const modelo = obterModeloMaquina(reg.linha, reg.maquinaId);
    const esperado = modelo ? contarCamposEsperados(modelo) : null;

    const validos = reg.resultados.filter(x => x.key && !x.key.includes("undefined"));
    const preenchidos = validos.filter(x => x.valor?.trim());
    const anom = preenchidos.filter(x => x.valor.trim().toUpperCase() === "X");

    normais   += preenchidos.length - anom.length;
    anomalias += anom.length;
    total     += esperado !== null ? esperado : validos.length;
  });

  const naoPreenchido = Math.max(total - normais - anomalias, 0);
  const pct = v => total > 0 ? Math.round((v / total) * 100) : 0;

  const itens = [
    { label: "Normais",        valor: normais,       cor: "#2e7d32" },
    { label: "Anomalias (X)",  valor: anomalias,     cor: "#c62828" },
    { label: "Não preenchido", valor: naoPreenchido, cor: "#bdbdbd" }
  ];

  container.innerHTML = itens.map(it => `
    <div class="bar-secao-row">
      <div class="bar-secao-label">${it.label}</div>
      <div class="bar-secao-track">
        <div class="bar-secao-fill" style="width:${pct(it.valor)}%;background:${it.cor}"></div>
      </div>
      <div class="bar-secao-pct">${pct(it.valor)}%</div>
    </div>
    <div style="font-size:11px;color:#aaa;margin-bottom:14px;margin-left:100px;">
      ${it.valor} / ${total} campos
    </div>
  `).join("");
}

/* =========================
   CHART TENDÊNCIA
========================= */
function renderChartTrend(historico) {
  if (chartTrend) { chartTrend.destroy(); chartTrend = null; }

  const labels = historico.map(h => h.semana.replace(/^\d{4}-/, ""));
  const data   = historico.map(h => h.conf);

  chartTrend = new Chart(document.getElementById("chart-trend"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Conformidade (%)",
        data,
        borderColor: "#0055b3",
        backgroundColor: "rgba(0,85,179,0.07)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: data.map(v =>
          v === null ? "#ccc" : v >= 85 ? "#2e7d32" : v >= 70 ? "#e07b00" : "#c62828"
        ),
        fill: true, tension: 0.3, spanGaps: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 100,
          ticks: { font:{size:11}, color:"#888", callback: v => v + "%" },
          grid: { color: "rgba(0,0,0,0.05)" }
        },
        x: {
          ticks: { font:{size:11}, color:"#888", autoSkip: false },
          grid: { display: false }
        }
      }
    }
  });
}

/* =========================
   ANOMALIAS POR LINHA DE PRODUÇÃO
========================= */
function renderChartLinhas(registos) {
  if (chartLinhas) { chartLinhas.destroy(); chartLinhas = null; }

  const wrap    = document.getElementById("chart-linhas-wrap");
  const canvas  = document.getElementById("chart-linhas");
  const emptyEl = wrap.querySelector(".empty-state") || (() => {
    const d = document.createElement("div");
    d.className = "empty-state";
    wrap.appendChild(d);
    return d;
  })();

  const porLinha = {};
  registos.forEach(reg => {
    const l = reg.linha || "?";
    if (!porLinha[l]) porLinha[l] = 0;
    porLinha[l] += reg.resultados.filter(x =>
      x.valor?.trim().toUpperCase() === "X" && !x.key?.includes("undefined")
    ).length;
  });

  const labels = Object.keys(porLinha).sort((a, b) => porLinha[b] - porLinha[a]);
  const data   = labels.map(l => porLinha[l]);

  // ✅ Sem dados — mostra empty state, esconde canvas
  if (!labels.length) {
    canvas.style.display  = "none";
    emptyEl.style.display = "block";
    emptyEl.innerHTML     = `<i class="fas fa-inbox"></i> Sem dados.`;
    return;
  }

  // ✅ Com dados — mostra canvas, esconde empty state
  canvas.style.display  = "";
  emptyEl.style.display = "none";

  const maxVal  = Math.max(...data, 1);
  const colors  = data.map(v =>
    v === 0 ? "#bdbdbd" : v >= maxVal * 0.66 ? "#c62828" : v >= maxVal * 0.33 ? "#e07b00" : "#2e7d32"
  );

  const altura = Math.max(160, labels.length * 44 + 60);
  wrap.style.height = altura + "px";

  chartLinhas = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Anomalias (X)",
        data, backgroundColor: colors,
        borderRadius: 4, borderSkipped: false
      }]
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          min: 0,
          ticks: { font:{size:11}, color:"#888", precision: 0 },
          grid: { color: "rgba(0,0,0,0.05)" }
        },
        y: {
          ticks: { font:{size:12}, color:"#444" },
          grid: { display: false }
        }
      }
    }
  });
}

/* =========================
   ANOMALIAS
========================= */
function renderAnomalias(registos) {
  const container = document.getElementById("anomaly-container");
  const anomalias = [];

  registos.forEach(reg => {
    reg.resultados
      .filter(r =>
        r.valor?.trim().toUpperCase() === "X" &&
        !r.key?.includes("undefined")
      )
      .forEach(r => {
        const diaIdx = DIAS_KEYS.indexOf(r.dia);
        anomalias.push({
          maquina: `M-${reg.maquinaId} (${reg.linha})`,
          secao:   r.secao || "—",
          acao:    obterNomeItem(reg.linha, reg.maquinaId, r.secao, r.itemId),
          dia:     diaIdx >= 0 ? DIAS_LABEL[diaIdx] : (r.dia || "—"),
          turno:   r.turno ? `T${r.turno}` : "—"
        });
      });
  });

  if (!anomalias.length) {
    container.innerHTML = `<div class="empty-state" style="padding:24px;">
      <i class="fas fa-check-circle" style="color:#2e7d32;font-size:28px;display:block;margin-bottom:8px;"></i>
      Sem anomalias registadas.
    </div>`;
    return;
  }

  const badgeClass = s =>
    s === "Operador" ? "badge-op" : s === "Manutenção" ? "badge-man" : "badge-lid";

  const mostra = anomalias.slice(0, 10);
  container.innerHTML = `
    <table class="anomaly-table">
      <thead>
        <tr><th>Máquina</th><th>Secção</th><th>Ação</th><th>Dia</th><th>Turno</th></tr>
      </thead>
      <tbody>
        ${mostra.map(a => `
          <tr>
            <td><strong>${a.maquina}</strong></td>
            <td><span class="badge ${badgeClass(a.secao)}">${a.secao}</span></td>
            <td style="color:#666">${a.acao}</td>
            <td style="color:#666">${a.dia}</td>
            <td style="color:#666">${a.turno}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    ${anomalias.length > 10
      ? `<div style="text-align:center;padding:10px;font-size:11px;color:#aaa;">
           + ${anomalias.length - 10} anomalia${anomalias.length - 10 !== 1 ? "s" : ""} adicionais
         </div>`
      : ""}`;
}

/* =========================
   HELPERS — modelo
========================= */

/* Devolve as secoes da máquina do sistemaChecklists (ou null se não encontrar) */
function obterModeloMaquina(linha, maquinaId) {
  if (typeof sistemaChecklists === "undefined") return null;
  const m = sistemaChecklists?.[linha]?.[maquinaId];
  if (!m) return null;
  return m.secoes || m;
}

/* Devolve o nome do item (ação) a partir da secção e itemId */
function obterNomeItem(linha, maquinaId, secao, itemId) {
  const modelo = obterModeloMaquina(linha, maquinaId);
  if (!modelo) return "—";
  const itens = secao === "Manutenção" ? (modelo["Manutenção"] || []) : (modelo[secao] || []);
  const item = itens.find(i => String(i.id) === String(itemId));
  return item?.nome || "—";
}

/* Conta o total de campos esperados para uma máquina */
function contarCamposEsperados(secoes) {
  const opItens  = (secoes.Operador       || []).length;
  const manItens = (secoes["Manutenção"]  || []).length;
  const lidItens = (secoes.Lider          || []).length;

  /* Operador: por dia × 3 turnos */
  const totalOp  = opItens  * DIAS_KEYS.length * 3;
  /* Manutenção: por dia (D = diário) */
  const totalMan = manItens * DIAS_KEYS.length;
  /* Líder: 1 por item (S = semanal) */
  const totalLid = lidItens;

  return totalOp + totalMan + totalLid;
}

/* Conformidade global de uma lista de registos */
function calcularConformidadeGlobal(registos) {
  let preen = 0, total = 0;
  registos.forEach(reg => {
    const modelo = obterModeloMaquina(reg.linha, reg.maquinaId);
    const esp = modelo ? contarCamposEsperados(modelo) : null;
    preen += reg.resultados.filter(x => x.valor?.trim() && !x.key?.includes("undefined")).length;
    total += esp !== null
      ? esp
      : reg.resultados.filter(x => !x.key?.includes("undefined")).length;
  });
  return total > 0 ? Math.round((preen / total) * 100) : 0;
}

/* =========================
   HELPERS — datas
========================= */

/* Normaliza o registo vindo da API */
function normalizar(reg) {
  if (!reg) return reg;
  const r = Object.assign({}, reg);

  if (r.maquinaID !== undefined && r.maquinaId === undefined) r.maquinaId = r.maquinaID;

  // Parse resultados, handling possible double-stringified JSON
  let res = r.resultados;
  let tries = 0;
  while (typeof res === "string" && tries < 2) {
    try { res = JSON.parse(res); } catch { res = []; break; }
    tries++;
  }
  r.resultados = Array.isArray(res) ? res : [];

  if (r.updated_at && !r.updatedAt) r.updatedAt = r.updated_at;
  if (r.created_at && !r.createdAt) r.createdAt = r.created_at;
  return r;
}

/* Gera array das últimas N semanas */
function semanaAnterior(semanaISO, n) {
  const result = [];
  let [ano, w] = semanaISO.split("-W").map(Number);
  for (let i = 0; i < n; i++) {
    result.unshift(`${ano}-W${String(w).padStart(2, "0")}`);
    w--;
    if (w < 1) { ano--; w = semanasNoAno(ano); }
  }
  return result;
}

function semanasNoAno(ano) {
  const d = new Date(ano, 11, 31);
  return getNumeroSemana(d) === 1 ? 52 : getNumeroSemana(d);
}

function getNumeroSemana(data) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}