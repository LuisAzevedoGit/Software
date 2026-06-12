console.log("✅ checklist-semanal.js carregado");

let linhaSelecionada = "";
let maquinaSelecionada = "";
let semanaSelecionada = "";
let registroAtual = null;

const DIAS      = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const DIAS_KEYS = ["seg", "ter", "qua", "qui", "sex"];
const TURNOS    = ["1º", "2º", "3º"];

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM pronto");

  if (typeof sistemaChecklists === "undefined") {
    alert("Erro: modelo.js não carregado.");
    return;
  }

  const linha       = document.getElementById("linha");
  const maquina     = document.getElementById("select-machine");
  const btn         = document.getElementById("btn-carregar");
  const form        = document.getElementById("checklist-form");
  const semanaInput = document.getElementById("semana");

  const hoje = new Date();
  semanaInput.value = `${hoje.getFullYear()}-W${String(getNumeroSemana(hoje)).padStart(2, "0")}`;

  /* Linha → Máquinas */
  linha.addEventListener("change", (e) => {
    linhaSelecionada = e.target.value.toUpperCase();
    maquina.innerHTML = '<option value="">Selecione uma máquina</option>';
    if (!sistemaChecklists[linhaSelecionada]) return;
    Object.keys(sistemaChecklists[linhaSelecionada]).forEach(id => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = `Máquina ${id}`;
      maquina.appendChild(opt);
    });
  });

  /* Carregar checklist */
  btn.addEventListener("click", async () => {
    maquinaSelecionada = maquina.value;
    semanaSelecionada  = semanaInput.value;

    if (!linhaSelecionada || !maquinaSelecionada || !semanaSelecionada) {
      alert("Preenche tudo");
      return;
    }

    document.getElementById("info-semana").textContent =
      `📅 Semana ${semanaSelecionada} — Linha: ${linhaSelecionada} — Máquina: ${maquinaSelecionada}`;

    try {
      let reg = await fetch(`/checklist?maquinaId=${maquinaSelecionada}&semana=${semanaSelecionada}`)
        .then(r => r.json());

      if (!reg || !reg.id) {
        reg = await fetch("/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linha: linhaSelecionada,
            maquinaId: maquinaSelecionada,
            semana: semanaSelecionada,
            resultados: []
          })
        }).then(r => r.json());
      }

      // normalizar resultados caso venham como string JSON da BD
      if (typeof reg.resultados === "string") {
        try { reg.resultados = JSON.parse(reg.resultados); } catch { reg.resultados = []; }
      }
      if (!Array.isArray(reg.resultados)) reg.resultados = [];

      registroAtual = reg;
      construirTabelas();

      const container = document.getElementById("checklist-container");
      container.style.display = "block";
      setTimeout(() => container.scrollIntoView({ behavior: "smooth" }), 150);

    } catch (err) {
      console.error(err);
      alert("Erro ao carregar checklist");
    }
  });

  /* Guardar */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = document.querySelectorAll(".cell-input, .ad-input");

    const resultados = Array.from(inputs)
      .map(i => ({
        key:     buildKey(i),
        itemId:  i.dataset.itemId,
        dia:     i.dataset.dia,
        turno:   i.dataset.turno   || null,
        momento: i.dataset.momento || null,
        secao:   i.dataset.secao,
        valor:   i.value
      }))
      .filter(r => r.valor.trim() !== "");

    try {
      const res = await fetch(`/checklist/${maquinaSelecionada}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semana: semanaSelecionada, resultados })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro");
      alert("Guardado com sucesso");

    } catch (err) {
      console.error(err);
      alert("Erro ao guardar");
    }
  });
});

/* =========================
   CONSTRUIR TABELAS
========================= */
function construirTabelas() {
  const maquina = sistemaChecklists?.[linhaSelecionada]?.[maquinaSelecionada];
  if (!maquina) { alert("Máquina não encontrada"); return; }

  const secoes = maquina.secoes || maquina;

  construirOperador(secoes.Operador        || []);
  construirManutencao(secoes["Manutenção"] || []);
  construirLider(secoes.Lider             || []);
}

/* =========================
   OPERADOR
   Colunas fixas: Local | Item | Caract | Standard | Método | Período
   Colunas de dados: Segunda(t1,t2,t3) … Sexta(t1,t2,t3)
========================= */
function construirOperador(itens) {
  const thead = document.getElementById("thead-operador");
  const tbody = document.getElementById("tbody-operador");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* — Cabeçalho linha 1 — */
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

  /* — Cabeçalho linha 2 — turnos — */
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

  /* — Linhas de dados — */
  itens.forEach(item => {
    const tr = document.createElement("tr");

    tr.insertCell().textContent = item.local;
    tr.insertCell().textContent = item.nome;
    tr.insertCell().textContent = item.caracteristica_especiais === "✔️" ? "◇" : "";
    tr.insertCell().textContent = item.standard;
    tr.insertCell().textContent = item.metodo;

    /* Período — operador é sempre "T" (Turno) */
    const tdPer = tr.insertCell();
    tdPer.textContent  = item.Periodo || "T";
    tdPer.style.textAlign = "center";
    tdPer.style.fontWeight = "700";

    DIAS_KEYS.forEach(dia => {
      TURNOS.forEach((_, i) => {
        const td    = tr.insertCell();
        const input = document.createElement("input");
        input.className        = "cell-input";
        input.dataset.itemId   = item.id;
        input.dataset.dia      = dia;
        input.dataset.turno    = i + 1;
        input.dataset.secao    = "Operador";
        preencherValor(input);
        td.appendChild(input);
      });
    });

    tbody.appendChild(tr);
  });
}

/* =========================
   MANUTENÇÃO
   Período: D (Diária) → uma célula por dia (seg…sex)
   Colunas fixas: Local | Item | Caract | Standard | Método | Período
========================= */
function construirManutencao(itens) {
  const thead = document.getElementById("thead-manutencao");
  const tbody = document.getElementById("tbody-manutencao");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* — Cabeçalho — */
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

  /* — Linhas de dados — */
  itens.forEach(item => {
    const tr = document.createElement("tr");

    tr.insertCell().textContent = item.local;
    tr.insertCell().textContent = item.nome;
    tr.insertCell().textContent = item.caracteristica_especiais === "✔️" ? "◇" : "";
    tr.insertCell().textContent = item.standard || "";
    tr.insertCell().textContent = item.metodo   || "";

    /* Período — manutenção é sempre "D" (Diário) */
    const tdPer = tr.insertCell();
    tdPer.textContent     = item.Periodo || "D";
    tdPer.style.textAlign = "center";
    tdPer.style.fontWeight = "700";

    /* Uma célula por dia */
    DIAS_KEYS.forEach(dia => {
      const td    = tr.insertCell();
      const input = document.createElement("input");
      input.className        = "cell-input";
      input.dataset.itemId   = item.id;
      input.dataset.dia      = dia;
      input.dataset.secao    = "Manutenção";
      preencherValor(input);
      td.appendChild(input);
    });

    tbody.appendChild(tr);
  });
}

/* =========================
   LÍDER
   Período: S (Semanal) → uma única célula por item
   Colunas fixas: Local | Item | Caract | Standard | Método | Período
========================= */
function construirLider(itens) {
  const thead = document.getElementById("thead-lider");
  const tbody = document.getElementById("tbody-lider");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* — Cabeçalho — */
  const trH = document.createElement("tr");
  ["Local","Item","Caract","Standard","Método","Período","Realizado"].forEach(t => {
    const th = document.createElement("th");
    th.textContent = t;
    trH.appendChild(th);
  });
  thead.appendChild(trH);

  /* — Linhas de dados — */
  itens.forEach(item => {
    const tr = document.createElement("tr");

    tr.insertCell().textContent = item.local;
    tr.insertCell().textContent = item.nome;
    tr.insertCell().textContent = item.caracteristica_especiais === "✔️" ? "◇" : "";
    tr.insertCell().textContent = item.standard || "";
    tr.insertCell().textContent = item.metodo   || "";

    /* Período — líder é sempre "S" (Semanal) */
    const tdPer = tr.insertCell();
    tdPer.textContent     = item.Periodo || "S";
    tdPer.style.textAlign = "center";
    tdPer.style.fontWeight = "700";

    /* Uma única célula semanal */
    const td    = tr.insertCell();
    const input = document.createElement("input");
    input.className        = "cell-input";
    input.dataset.itemId   = item.id;
    input.dataset.dia      = "semana";   // chave fixa — é semanal
    input.dataset.secao    = "Lider";
    preencherValor(input);
    td.appendChild(input);

    tbody.appendChild(tr);
  });
}

/* =========================
   HELPERS
========================= */
function buildKey(input) {
  const d = input.dataset;

  if (d.secao === "Operador")
    return `Operador_${d.itemId}_${d.dia}_t${d.turno}`;

  if (d.secao === "Manutenção")
    return `Manutenção_${d.itemId}_${d.dia}`;

  /* Lider — semanal */
  return `Lider_${d.itemId}_semana`;
}

function preencherValor(input) {
  if (!registroAtual?.resultados) return;
  const key   = buildKey(input);
  const found = registroAtual.resultados.find(r => r.key === key);
  if (found) input.value = found.valor;
}

function getNumeroSemana(data) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}