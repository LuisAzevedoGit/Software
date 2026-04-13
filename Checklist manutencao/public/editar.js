let checklistAtual = null;
let anexosRemover = [];
let novosAnexos = [];

// ------------------ CALCULAR NEXT CHECK ------------------
function calcularNextCheck(status, periodicidade) {
  if (!status || status.toLowerCase() !== "realizado") return null;

  const hoje = new Date();

  switch (periodicidade?.toLowerCase()) {
    case 'trimestral':
      hoje.setMonth(hoje.getMonth() + 3);
      break;
    case 'semestral':
      hoje.setMonth(hoje.getMonth() + 6);
      break;
    case 'anual':
      hoje.setFullYear(hoje.getFullYear() + 1);
      break;
    case 'bianual':
      hoje.setFullYear(hoje.getFullYear() + 2);
      break;
    case '3-3 anos':
    case '3 anos':
    case 'trianual':
      hoje.setFullYear(hoje.getFullYear() + 3);
      break;
    case '5-5 anos':
    case '5 anos':
      hoje.setFullYear(hoje.getFullYear() + 5);
      break;
    case '10-10 anos':
    case '10 anos':
      hoje.setFullYear(hoje.getFullYear() + 10);
      break;
    default:
      return null;
  }

  return hoje.toISOString().split('T')[0];
}

// ------------------ CARREGAR CHECKLIST ------------------
function carregarChecklist() {
  const id = document.getElementById("checklist_id").value;

  if (!id) {
    alert("Introduz um ID");
    return;
  }

  fetch(`/pesquisar?id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        alert("Checklist não encontrada");
        return;
      }

      checklistAtual = data[0];

      // garantir estrutura
      checklistAtual.checklist = checklistAtual.acoes || [];
      checklistAtual.relatorio = checklistAtual.relatorio || "";

      anexosRemover = [];
      novosAnexos = [];

      renderizarChecklist();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao carregar checklist");
    });
}

// ------------------ RENDER ------------------
function renderizarChecklist() {
  const div = document.getElementById("editor");

  let html = `
    <h3>Máquina: ${checklistAtual.nome}</h3>
    <button class="btn-danger" onclick="eliminarChecklist()">🗑️ Eliminar Checklist</button>
    <br><br>

    <table border="1">
      <tr>
        <th>Grupo</th>
        <th>Nome</th>
        <th>Status</th>
        <th>Próxima verificação</th>
      </tr>
  `;

  checklistAtual.checklist.forEach((acao, i) => {
    html += `
      <tr>
        <td>${acao.grupo}</td>
        <td>${acao.nome}</td>

        <td>
          <select onchange="alterarStatus(${i}, this.value)">
            <option value="">--</option>
            <option value="Realizado" ${acao.status === "Realizado" ? "selected" : ""}>Realizado</option>
            <option value="Reparação não urgente" ${acao.status === "Reparação não urgente" ? "selected" : ""}>Reparação não urgente</option>
            <option value="Reparação urgente" ${acao.status === "Reparação urgente" ? "selected" : ""}>Reparação urgente</option>
          </select>
        </td>

        <td>
          <input type="date" id="next-${i}" 
            value="${acao["next check"] || ""}" 
            onchange="alterarData(${i}, this.value)">
        </td>
      </tr>
    `;
  });

  html += `</table>`;

  // ------------------ RELATÓRIO ------------------
  html += `
    <h4>Relatório</h4>
    <textarea 
      id="relatorio-input" 
      rows="5" 
      style="width:100%;"
      onchange="alterarRelatorio(this.value)"
    >${checklistAtual.relatorio}</textarea>
  `;

  // ------------------ ANEXOS ------------------
  let anexos = [];

  try {
    anexos = typeof checklistAtual.anexos === "string"
      ? JSON.parse(checklistAtual.anexos)
      : checklistAtual.anexos || [];
  } catch {
    anexos = [];
  }

  html += `
    <h4>Anexos</h4>

    <div id="lista-anexos">
      ${
        anexos.length > 0
          ? anexos.map(nome => `
              <div>
                📎 ${nome}
                <button onclick="removerAnexo('${nome}')">❌</button>
              </div>
            `).join('')
          : "<p>Sem anexos</p>"
      }
    </div>

    <br>
    <input type="file" id="input-anexos" multiple onchange="adicionarAnexos(event)">
  `;

  div.innerHTML = html;
}

// ------------------ RELATÓRIO ------------------
function alterarRelatorio(valor) {
  checklistAtual.relatorio = valor;
}

// ------------------ ANEXOS ------------------
function removerAnexo(nome) {
  anexosRemover.push(nome);

  try {
    const lista = typeof checklistAtual.anexos === "string"
      ? JSON.parse(checklistAtual.anexos)
      : checklistAtual.anexos || [];

    checklistAtual.anexos = lista.filter(a => a !== nome);
  } catch {
    checklistAtual.anexos = [];
  }

  renderizarChecklist();
}

function adicionarAnexos(event) {
  const files = Array.from(event.target.files);
  novosAnexos.push(...files);

  alert(`${files.length} ficheiro(s) adicionados`);
}

// ------------------ ALTERAR STATUS ------------------
function alterarStatus(index, novoStatus) {
  const acao = checklistAtual.checklist[index];
  acao.status = novoStatus;

  const periodicidade = acao.periodicidade;
  const novaData = calcularNextCheck(novoStatus, periodicidade);

  if (novaData) {
    acao["next check"] = novaData;
    document.getElementById(`next-${index}`).value = novaData;
  } else {
    acao["next check"] = "";
    document.getElementById(`next-${index}`).value = "";
  }
}

// ------------------ ALTERAR DATA ------------------
function alterarData(index, novaData) {
  checklistAtual.checklist[index]["next check"] = novaData;
}

// ------------------ ELIMINAR ------------------
function eliminarChecklist() {
  if (!checklistAtual) {
    alert("Nenhuma checklist carregada.");
    return;
  }

  const confirmar = confirm(`⚠️ Tens a certeza que queres eliminar a checklist ID ${checklistAtual.id}?`);
  if (!confirmar) return;

  fetch(`/eliminar-checklist/${checklistAtual.id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(() => {
      alert("🗑️ Checklist eliminada!");
      window.location.href = "menu.html";
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao eliminar checklist.");
    });
}

// ------------------ GUARDAR ------------------
function guardarAlteracoes() {
  if (!checklistAtual) {
    alert("Nenhuma checklist carregada");
    return;
  }

  const formData = new FormData();

  // ações
  formData.append("acoes", JSON.stringify(checklistAtual.checklist));

  // 🔥 garantir leitura do textarea
  const relatorioInput = document.getElementById("relatorio-input");
  const relatorio = relatorioInput ? relatorioInput.value : "";

  formData.append("relatorio", relatorio);

  // remover anexos
  formData.append("remover", JSON.stringify(anexosRemover));

  // novos anexos
  novosAnexos.forEach(file => {
    formData.append("anexos", file);
  });

  fetch(`/atualizar-checklist/${checklistAtual.id}`, {
    method: "PUT",
    body: formData
  })
    .then(res => res.json())
    .then(() => {
      alert("✅ Checklist atualizada com sucesso!");
      location.reload();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao guardar");
    });
}