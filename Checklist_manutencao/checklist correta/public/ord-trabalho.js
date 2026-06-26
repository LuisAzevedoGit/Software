// ------------------ AUTO-PREENCHER CHECKLIST_ID DA URL ------------------
// Adiciona isto no DOMContentLoaded do ord-trabalho.js (ou no início do ficheiro)

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const checklistId = params.get("checklist_id");

  if (checklistId) {
    const input = document.getElementById("checklist_id");
    if (input) {
      input.value = checklistId;
      // Se tens uma função para carregar/pesquisar automaticamente, chama aqui:
      pesquisar_filtrada_apenas_reparacao();
    }
  }
});


let registroAtual = null;
let contadorIDS = 0;
let reparacoesEmCurso = [];
let mostrarExtras = false;
let selecaoExtras = [];

const listaResponsaveis = ["João Carneiro", "Dinis Ribeiro", "Rui Martins"];

// ------------------ UTIL ------------------
function removerAcentos(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function atualizarCampo(index, campo, valor) {
  if (reparacoesEmCurso[index]) {
    reparacoesEmCurso[index][campo] = valor;
  }
}

// ------------------ BUSCAR CHECKLIST ------------------
function pesquisar_filtrada_apenas_reparacao() {
  const id = document.getElementById("checklist_id").value;

  if (!id) {
    alert("Preenche o ID.");
    return;
  }

  fetch(`/pesquisar?id=${id}`)
    .then(res => res.json())
    .then(data => {
      const registro = data[0];

      if (!registro) {
        document.getElementById("resultados").innerHTML =
          "<p>Nenhum registo encontrado.</p>";
        return;
      }

      registroAtual = registro;

      let listaAcoes = [];
      try {
        listaAcoes =
          typeof registro.acoes === "string"
            ? JSON.parse(registro.acoes)
            : registro.acoes || [];
      } catch {
        listaAcoes = [];
      }

      const acoesReparar = listaAcoes.filter(acao => {
        const status = (acao.status || "").toLowerCase().trim();
        return status.includes("reparação") || status === "";
      });

      reparacoesEmCurso = acoesReparar.map((acao, idx) => ({
        id: contadorIDS++,
        grupo: acao.grupo || "-",
        status: acao.status || "",
        descricao: acao.nome || "-",
        data: "",
        responsaveis: "",
        estado: "Pendente",
        removivel: false,
        manual: false
      }));

      renderTabela(listaAcoes);
    });
}

// ------------------ RENDER ------------------
function renderTabela(listaAcoes = []) {
  const div = document.getElementById("resultados");

  const descricaoGuardada =
    document.getElementById("descricaoGeral")?.value || "";

  let html = `
  <div class="secao-ordem-trabalho">

    <p>
      <strong>Checklist:</strong> ${registroAtual.id}
      |
      <strong>Máquina:</strong> ${registroAtual.nome || "-"}
    </p>

    <label>
      <strong>Descrição de trabalho:</strong>
      <input type="text"
        id="descricaoGeral"
        value="${descricaoGuardada}"
        style="width:100%; margin:10px 0;"
        placeholder="Procedimentos..." />
    </label>

    <table id="tabela-ordem">
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Descrição</th>
          <th>Status</th>
          <th>Data</th>
          <th>Responsáveis</th>
          <th>❌</th>
        </tr>
      </thead>
      <tbody>
  `;

  reparacoesEmCurso.forEach((rep, i) => {
    const classe = removerAcentos(
      (rep.status || "").toLowerCase().replace(/\s+/g, "-")
    );

    html += `<tr class="${classe}">`;

    html += `
      <td>
        ${
          rep.manual
            ? `<input value="${rep.grupo}" onchange="atualizarCampo(${i}, 'grupo', this.value)">`
            : rep.grupo
        }
      </td>
    `;

    html += `
      <td>
        ${
          rep.manual
            ? `<input value="${rep.descricao}" onchange="atualizarCampo(${i}, 'descricao', this.value)">`
            : rep.descricao
        }
      </td>
    `;

    html += `
      <td>
        ${
          rep.manual
            ? `<input value="${rep.status}" onchange="atualizarCampo(${i}, 'status', this.value)">`
            : rep.status
        }
      </td>
    `;

    html += `
      <td>
        <input type="date"
          value="${rep.data}"
          onchange="atualizarCampo(${i}, 'data', this.value)">
      </td>
    `;

    html += `
      <td>
        <select onchange="atualizarCampo(${i}, 'responsaveis', this.value)">
          <option value="">Selecione</option>
          ${listaResponsaveis.map(nome => `
            <option value="${nome}"
              ${rep.responsaveis === nome ? "selected" : ""}>
              ${nome}
            </option>
          `).join("")}
        </select>
      </td>
    `;

    html += `
  <td>
    <button type="button" class="btn-danger" onclick="removerLinha(${i})">
      ❌
    </button>
  </td>
`;
    html += `</tr>`;
  });

  html += `
      </tbody>
    </table>

    <br>

    <button class="btn-padrao" onclick="toggleExtras()">
      ➕ Adicionar outros campos
    </button>

    <button class="btn-padrao" onclick="adicionarLinhaManual()">
      ✏️ Linha manual
    </button>

    <div id="extras-container"></div>

    <br><br>

    <button class="btn-padrao" onclick="criarOrdem()">
      Criar Ordem
    </button>

  </div>
  `;

  div.innerHTML = html;

  if (mostrarExtras) {
    renderExtras(listaAcoes);
  }
}

// ------------------ REMOVER LINHA ------------------
function removerLinha(index) {
  if (!reparacoesEmCurso[index]) return;

  const confirmar = confirm("Tens a certeza que queres eliminar esta linha?");

  if (!confirmar) return;

  reparacoesEmCurso.splice(index, 1);
  renderTabela(obterListaAcoes());
}

function obterListaAcoes() {
  try {
    return typeof registroAtual.acoes === "string"
      ? JSON.parse(registroAtual.acoes)
      : registroAtual.acoes || [];
  } catch {
    return [];
  }
}

// ------------------ LINHA MANUAL ------------------
function adicionarLinhaManual() {
  reparacoesEmCurso.push({
    id: contadorIDS++,
    grupo: "",
    status: "",
    descricao: "",
    data: "",
    responsaveis: "",
    estado: "Pendente",
    removivel: true,
    manual: true
  });

  let listaAcoes = [];
  try {
    listaAcoes =
      typeof registroAtual.acoes === "string"
        ? JSON.parse(registroAtual.acoes)
        : registroAtual.acoes || [];
  } catch {
    listaAcoes = [];
  }

  renderTabela(listaAcoes);
}

// ------------------ EXTRAS ------------------
function toggleExtras() {
  mostrarExtras = !mostrarExtras;

  if (!mostrarExtras) {
    document.getElementById("extras-container").innerHTML = "";
    return;
  }

  let listaAcoes = [];
  try {
    listaAcoes =
      typeof registroAtual.acoes === "string"
        ? JSON.parse(registroAtual.acoes)
        : registroAtual.acoes || [];
  } catch {
    listaAcoes = [];
  }

  renderExtras(listaAcoes);
}

function renderExtras(listaAcoes) {
  const div = document.getElementById("extras-container");

  let html = `
    <h4>Selecionar ações adicionais</h4>

    <table border="1">
      <tr>
        <th></th>
        <th>Grupo</th>
        <th>Nome</th>
        <th>Status</th>
      </tr>
  `;

  listaAcoes.forEach((acao, i) => {
    html += `
      <tr>
        <td>
          <input type="checkbox"
            onchange="selecionarExtra(${i}, this.checked)">
        </td>
        <td>${acao.grupo}</td>
        <td>${acao.nome}</td>
        <td>${acao.status || "-"}</td>
      </tr>
    `;
  });

  html += `
    </table>

    <br>

    <button class="btn-padrao" onclick="adicionarExtras()">
      Adicionar selecionados
    </button>
  `;

  div.innerHTML = html;
}

function selecionarExtra(index, checked) {
  if (checked) {
    if (!selecaoExtras.includes(index)) {
      selecaoExtras.push(index);
    }
  } else {
    selecaoExtras = selecaoExtras.filter(i => i !== index);
  }
}

function adicionarExtras() {
  let listaAcoes = [];

  try {
    listaAcoes =
      typeof registroAtual.acoes === "string"
        ? JSON.parse(registroAtual.acoes)
        : registroAtual.acoes || [];
  } catch {
    listaAcoes = [];
  }

  selecaoExtras.forEach(idx => {
    const acao = listaAcoes[idx];

    reparacoesEmCurso.push({
      id: contadorIDS++,
      grupo: acao.grupo || "-",
      status: acao.status || "",
      descricao: acao.nome || "-",
      data: "",
      responsaveis: "",
      estado: "Pendente",
      removivel: true,
      manual: false
    });
  });

  selecaoExtras = [];
  mostrarExtras = false;

  renderTabela(listaAcoes);
}

// ------------------ CRIAR ORDEM ------------------
function criarOrdem() {
  const incompletas = reparacoesEmCurso.filter(
    r => !r.data || !r.responsaveis
  );

  if (incompletas.length > 0) {
    alert("Preenche data e responsáveis.");
    return;
  }

  const ordem = {
    checklist_id: registroAtual.id,
    nome_maquina: registroAtual.nome,
    descricao:
      document.getElementById("descricaoGeral").value || "Sem descrição",
    reparacoes_json: reparacoesEmCurso
  };

  fetch("/ordem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ordem)
  })
    .then(res => res.json())
    .then(data => {
      alert("✅ Ordem criada! ID: " + data.id);
      location.href = "menu.html";
    });
}