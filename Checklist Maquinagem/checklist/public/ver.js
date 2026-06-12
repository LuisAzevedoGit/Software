console.log("✅ ver.js carregado");

const DIAS      = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const DIAS_KEYS = ["seg", "ter", "qua", "qui", "sex"];
const TURNOS    = ["1º", "2º", "3º"];

let registoAberto = null;

/* =========================
   NORMALIZAR REGISTO
   - maquinaID  → maquinaId
   - resultados string → array
   - updated_at → updatedAt
========================= */
function normalizar(reg) {
  if (!reg) return reg;
  const r = Object.assign({}, reg);
  if (r.maquinaID !== undefined && r.maquinaId === undefined) r.maquinaId = r.maquinaID;
  if (typeof r.resultados === "string") {
    try { r.resultados = JSON.parse(r.resultados); } catch { r.resultados = []; }
  }
  if (!Array.isArray(r.resultados)) r.resultados = [];
  if (r.updated_at && !r.updatedAt) r.updatedAt = r.updated_at;
  if (r.created_at && !r.createdAt) r.createdAt = r.created_at;
  return r;
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const filtroLinha   = document.getElementById("filtro-linha");
  const filtroMaquina = document.getElementById("filtro-maquina");
  const filtroSemana  = document.getElementById("filtro-semana");

  const hoje = new Date();
  filtroSemana.value = `${hoje.getFullYear()}-W${String(getNumeroSemana(hoje)).padStart(2, "0")}`;

  filtroLinha.addEventListener("change", () => {
    const linha = filtroLinha.value.toUpperCase();
    filtroMaquina.innerHTML = '<option value="">Todas as máquinas</option>';
    if (linha && sistemaChecklists[linha]) {
      Object.keys(sistemaChecklists[linha]).forEach(id => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = `Máquina ${id}`;
        filtroMaquina.appendChild(opt);
      });
    }
  });

  document.getElementById("btn-pesquisar").addEventListener("click", pesquisar);

  document.getElementById("btn-fechar").addEventListener("click", () => {
    document.getElementById("detalhe-container").style.display    = "none";
    document.getElementById("resultados-container").style.display = "block";
    registoAberto = null;
  });
});

/* =========================
   PESQUISAR
========================= */
async function pesquisar() {
  const linha   = document.getElementById("filtro-linha").value;
  const maquina = document.getElementById("filtro-maquina").value;
  const semana  = document.getElementById("filtro-semana").value;

  const params = new URLSearchParams();
  if (linha)   params.set("linha",     linha);
  if (maquina) params.set("maquinaId", maquina);
  if (semana)  params.set("semana",    semana);

  const lista = document.getElementById("lista-checklists");
  lista.innerHTML = `<div class="loading" style="grid-column:1/-1">
    <i class="fas fa-spinner"></i> A carregar...
  </div>`;

  document.getElementById("resultados-container").style.display = "block";
  document.getElementById("detalhe-container").style.display    = "none";

  try {
    const res  = await fetch(`/checklists?${params.toString()}`);
    const data = await res.json();
    renderResultados((Array.isArray(data) ? data : []).map(normalizar), { linha, maquina, semana });
  } catch (err) {
    console.error("Erro ao pesquisar:", err);
    lista.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-exclamation-triangle"></i>
      Erro ao carregar checklists. Tenta novamente.
    </div>`;
  }
}

/* =========================
   RENDER LISTA
========================= */
function renderResultados(registos, filtros) {
  const lista = document.getElementById("lista-checklists");
  const info  = document.getElementById("resultado-info");

  info.textContent =
    `${registos.length} checklist${registos.length !== 1 ? "s" : ""} encontrada${registos.length !== 1 ? "s" : ""}` +
    (filtros.semana  ? ` — Semana ${filtros.semana}`   : "") +
    (filtros.linha   ? ` — Linha ${filtros.linha}`     : "") +
    (filtros.maquina ? ` — Máquina ${filtros.maquina}` : "");

  lista.innerHTML = "";

  if (!registos.length) {
    lista.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-clipboard-list"></i>
      Nenhuma checklist encontrada para os filtros selecionados.
    </div>`;
    return;
  }

  registos.forEach(reg => {
    const validos     = reg.resultados.filter(r => !r.key?.includes("undefined"));
    const preenchidos = validos.filter(r => r.valor?.trim()).length;

    const card = document.createElement("div");
    card.className = "card-checklist";
    card.innerHTML = `
      <div class="card-header">
        <span class="tag-linha">${reg.linha || "—"}</span>
        <span class="tag-semana">
          <i class="fas fa-calendar-week" style="margin-right:4px;"></i>${reg.semana || "—"}
        </span>
      </div>
      <div class="maquina-nome">Máquina ${reg.maquinaId}</div>
      <div class="meta-info">
        <span><i class="fas fa-check-circle" style="color:#2e7d32;"></i>
          ${preenchidos} campo${preenchidos !== 1 ? "s" : ""} preenchido${preenchidos !== 1 ? "s" : ""}
        </span>
        <span><i class="fas fa-clock" style="color:#999;"></i>
          ${formatarData(reg.updatedAt || reg.createdAt)}
        </span>
      </div>`;
    card.addEventListener("click", () => abrirDetalhe(reg));
    lista.appendChild(card);
  });
}

/* =========================
   ABRIR DETALHE
========================= */
async function abrirDetalhe(reg) {
  let regCompleto = reg;

  if (!reg.resultados || !reg.resultados.length) {
    try {
      const raw = await fetch(`/checklist?maquinaId=${reg.maquinaId}&semana=${reg.semana}`)
        .then(r => r.json());
      regCompleto = normalizar(raw);
    } catch (err) {
      console.error("Erro ao carregar detalhe:", err);
      alert("Erro ao carregar detalhe da checklist.");
      return;
    }
  }

  registoAberto = regCompleto;

  document.getElementById("resultados-container").style.display = "none";
  document.getElementById("detalhe-container").style.display    = "block";

  document.getElementById("detalhe-titulo").innerHTML =
    `<i class="fas fa-clipboard-check" style="color:#0055b3;margin-right:8px;"></i>
     Checklist — Linha ${regCompleto.linha} — Máquina ${regCompleto.maquinaId} — ${regCompleto.semana}`;

  const maquinaDef = sistemaChecklists?.[regCompleto.linha]?.[regCompleto.maquinaId];

  if (!maquinaDef) {
    document.getElementById("detalhe-conteudo").innerHTML =
      `<div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        Modelo não encontrado (Linha: <strong>${regCompleto.linha}</strong>,
        Máquina: <strong>${regCompleto.maquinaId}</strong>).
      </div>`;
    return;
  }

  const secoes  = maquinaDef.secoes || maquinaDef;
  const conteudo = document.getElementById("detalhe-conteudo");
  conteudo.innerHTML = "";

  conteudo.appendChild(renderSecaoOperador(secoes.Operador         || [], regCompleto.resultados));
  conteudo.appendChild(renderSecaoManutencao(secoes["Manutenção"]   || [], regCompleto.resultados));
  conteudo.appendChild(renderSecaoLider(secoes.Lider               || [], regCompleto.resultados));

  setTimeout(() => conteudo.scrollIntoView({ behavior: "smooth" }), 100);
}

/* =========================
   RENDER OPERADOR
   Colunas fixas: Local | Item | Caract | Standard | Método | Período
   Dados: seg…sex × 3 turnos
========================= */
function renderSecaoOperador(itens, resultados) {
  const wrapper = criarWrapper("secao-operador");

  const preenchidos = contarPreenchidos(resultados, "Operador");
  const total       = itens.length * DIAS_KEYS.length * TURNOS.length;

  wrapper.innerHTML = `
    <div class="secao-titulo">
      👤 OPERADOR
      <span class="badge-preenchido">${preenchidos} / ${total}</span>
    </div>
    <div style="overflow-x:auto;">
      <table class="tabela-checklist">
        <thead></thead><tbody></tbody>
      </table>
    </div>
    <div class="legenda-wrapper">
      <span><strong>Legenda:</strong></span>
      <span>V – Normal/Realizado</span>
      <span>X – Anormal/Não Realizado</span>
      <span>A – Nível Alto</span>
      <span>M – Nível Médio</span>
      <span>B – Nível Baixo</span>
      <span style="margin-left:auto;"><strong>◇</strong> Característica Especial</span>
    </div>`;

  const thead = wrapper.querySelector("thead");
  const tbody = wrapper.querySelector("tbody");

  /* Cabeçalho linha 1 */
  const tr1 = document.createElement("tr");
  ["Local","Item","Caract","Standard","Método","Período"].forEach(t => {
    const th = document.createElement("th");
    th.textContent = t;
    th.rowSpan = 2;
    tr1.appendChild(th);
  });
  DIAS.forEach(d => {
    const th = document.createElement("th");
    th.textContent = d;
    th.colSpan = 3;
    th.className = "th-dia";
    tr1.appendChild(th);
  });
  thead.appendChild(tr1);

  /* Cabeçalho linha 2 — turnos */
  const tr2 = document.createElement("tr");
  DIAS.forEach(() => {
    TURNOS.forEach(t => {
      const th = document.createElement("th");
      th.textContent = t;
      th.className = "th-turno";
      tr2.appendChild(th);
    });
  });
  thead.appendChild(tr2);

  itens.forEach(item => {
    const tr = document.createElement("tr");
    tr.insertCell().textContent = item.local;
    tr.insertCell().textContent = item.nome;
    tr.insertCell().textContent = item.caracteristica_especiais === "✔️" ? "◇" : "";
    tr.insertCell().textContent = item.standard;
    tr.insertCell().textContent = item.metodo;

    const tdPer = tr.insertCell();
    tdPer.textContent   = item.Periodo || "T";
    tdPer.style.textAlign  = "center";
    tdPer.style.fontWeight = "700";

    DIAS_KEYS.forEach(dia => {
      TURNOS.forEach((_, i) => {
        const key   = `Operador_${item.id}_${dia}_t${i + 1}`;
        const valor = getValor(resultados, key);
        const td    = tr.insertCell();
        td.className   = "valor-cell " + classeValor(valor);
        td.textContent = valor || "–";
      });
    });

    tbody.appendChild(tr);
  });

  return wrapper;
}

/* =========================
   RENDER MANUTENÇÃO
   Colunas fixas: Local | Item | Caract | Standard | Método | Período
   Dados: uma célula por dia (D = diário)
========================= */
function renderSecaoManutencao(itens, resultados) {
  const wrapper = criarWrapper("secao-manutencao");

  const preenchidos = contarPreenchidos(resultados, "Manutenção");
  const total       = itens.length * DIAS_KEYS.length;

  wrapper.innerHTML = `
    <div class="secao-titulo">
      🔧 MANUTENÇÃO
      <span class="badge-preenchido">${preenchidos} / ${total}</span>
    </div>
    <div style="overflow-x:auto;">
      <table class="tabela-checklist">
        <thead></thead><tbody></tbody>
      </table>
    </div>
    <div class="legenda-wrapper">
      <span><strong>Legenda:</strong></span>
      <span>A – Nível Alto</span>
      <span>M – Nível Médio</span>
      <span>B – Nível Baixo</span>
    </div>`;

  const thead = wrapper.querySelector("thead");
  const tbody = wrapper.querySelector("tbody");

  const trH = document.createElement("tr");
  ["Local","Item","Caract","Standard","Método","Período"].forEach(t => {
    const th = document.createElement("th");
    th.textContent = t;
    trH.appendChild(th);
  });
  DIAS.forEach(d => {
    const th = document.createElement("th");
    th.textContent = d;
    th.className = "th-dia";
    trH.appendChild(th);
  });
  thead.appendChild(trH);

  itens.forEach(item => {
    const tr = document.createElement("tr");
    tr.insertCell().textContent = item.local;
    tr.insertCell().textContent = item.nome;
    tr.insertCell().textContent = item.caracteristica_especiais === "✔️" ? "◇" : "";
    tr.insertCell().textContent = item.standard || "";
    tr.insertCell().textContent = item.metodo   || "";

    const tdPer = tr.insertCell();
    tdPer.textContent      = item.Periodo || "D";
    tdPer.style.textAlign  = "center";
    tdPer.style.fontWeight = "700";

    DIAS_KEYS.forEach(dia => {
      const key   = `Manutenção_${item.id}_${dia}`;
      const valor = getValor(resultados, key);
      const td    = tr.insertCell();
      td.className   = "valor-cell " + classeValor(valor);
      td.textContent = valor || "–";
    });

    tbody.appendChild(tr);
  });

  return wrapper;
}

/* =========================
   RENDER LÍDER
   Colunas fixas: Local | Item | Caract | Standard | Método | Período
   Dados: uma única célula semanal
========================= */
function renderSecaoLider(itens, resultados) {
  const wrapper = criarWrapper("secao-lider");

  const preenchidos = contarPreenchidos(resultados, "Lider");
  const total       = itens.length;

  wrapper.innerHTML = `
    <div class="secao-titulo">
      👨‍💼 LÍDER
      <span class="badge-preenchido">${preenchidos} / ${total}</span>
    </div>
    <div style="overflow-x:auto;">
      <table class="tabela-checklist">
        <thead></thead><tbody></tbody>
      </table>
    </div>
    <div class="legenda-wrapper">
      <span><strong>Legenda:</strong></span>
      <span>V – Normal/Realizado</span>
      <span>X – Anormal/Não Realizado</span>
    </div>`;

  const thead = wrapper.querySelector("thead");
  const tbody = wrapper.querySelector("tbody");

  const trH = document.createElement("tr");
  ["Local","Item","Caract","Standard","Método","Período","Realizado"].forEach(t => {
    const th = document.createElement("th");
    th.textContent = t;
    trH.appendChild(th);
  });
  thead.appendChild(trH);

  itens.forEach(item => {
    const tr = document.createElement("tr");
    tr.insertCell().textContent = item.local;
    tr.insertCell().textContent = item.nome;
    tr.insertCell().textContent = item.caracteristica_especiais === "✔️" ? "◇" : "";
    tr.insertCell().textContent = item.standard || "";
    tr.insertCell().textContent = item.metodo   || "";

    const tdPer = tr.insertCell();
    tdPer.textContent      = item.Periodo || "S";
    tdPer.style.textAlign  = "center";
    tdPer.style.fontWeight = "700";

    const key   = `Lider_${item.id}_semana`;
    const valor = getValor(resultados, key);
    const td    = tr.insertCell();
    td.className   = "valor-cell " + classeValor(valor);
    td.textContent = valor || "–";

    tbody.appendChild(tr);
  });

  return wrapper;
}

/* =========================
   HELPERS
========================= */
function criarWrapper(cls) {
  const div = document.createElement("div");
  div.className = `secao-wrapper ${cls}`;
  return div;
}

function getValor(resultados, key) {
  if (!Array.isArray(resultados)) return "";
  const found = resultados.find(r => r.key === key);
  return found?.valor?.trim() || "";
}

function classeValor(v) {
  if (!v || v === "–") return "valor-vazio";
  switch (v.toUpperCase()) {
    case "V": return "valor-v";
    case "X": return "valor-x";
    case "A": return "valor-a";
    case "M": return "valor-m";
    case "B": return "valor-b";
    default:  return "";
  }
}

function contarPreenchidos(resultados, secao) {
  if (!Array.isArray(resultados)) return 0;
  return resultados.filter(r =>
    r.secao === secao &&
    r.valor?.trim() &&
    !r.key?.includes("undefined")
  ).length;
}

function formatarData(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  } catch { return "—"; }
}

function getNumeroSemana(data) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}