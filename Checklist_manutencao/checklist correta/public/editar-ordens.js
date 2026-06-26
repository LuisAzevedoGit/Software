let ordemAtual = null;

// 🔥 anexos por reparação
let novosAnexos = {};   // { index: [files] }
let anexosRemover = {}; // { index: [nomes] }


// ------------------ AUTO-CARREGAR SE VIER ?id= NA URL ------------------
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    document.getElementById("ordem_id").value = id;
    carregarOrdem();
  }
});


// ------------------ CARREGAR ORDEM ------------------
function carregarOrdem() {
  const id = document.getElementById("ordem_id").value;

  if (!id) {
    alert("Introduz um ID");
    return;
  }

  fetch(`/ver_ordens/${id}`)
    .then(res => res.json())
    .then(ordem => {

      if (!ordem || !ordem.reparacoes) {
        alert("Ordem não encontrada");
        return;
      }

      ordemAtual = ordem;

      ordemAtual.reparacoes.forEach(r => {
        if (!r.anexos) r.anexos = [];
      });

      novosAnexos = {};
      anexosRemover = {};

      renderizar();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao carregar ordem");
    });
}


// ------------------ RENDER ------------------
function renderizar() {
  const div = document.getElementById("editor");

  let html = `
    <h3>Ordem #${ordemAtual.id}</h3>
    <button class="btn-danger" onclick="eliminarOrdem()">
      🗑️ Eliminar Ordem
    </button>
    <br><br>
    <p><strong>Máquina:</strong> ${ordemAtual.nome_maquina}</p>
    <p><strong>Descrição:</strong> ${ordemAtual.descricao}</p>

    <table border="1">
      <tr>
        <th>ID</th>
        <th>Grupo</th>
        <th>Descrição</th>
        <th>Status</th>
        <th>Estado</th>
        <th>Data</th>
        <th>Responsáveis</th>
        <th>Comentário</th>
        <th>Anexos</th>
      </tr>
  `;

  ordemAtual.reparacoes.forEach((r, i) => {

    const anexosExistentes = r.anexos || [];
    const novos = novosAnexos[i] || [];

    html += `
      <tr>
        <td>${r.id}</td>
        <td>${r.grupo}</td>
        <td>${r.descricao}</td>
        <td>${r.status}</td>


        <td>
          <select onchange="alterarCampo(${i}, 'estado', this.value)">
            <option value="pendente" ${r.estado === "pendente" ? "selected" : ""}>Pendente</option>
            <option value="✅" ${r.estado === "✅" ? "selected" : ""}>Concluído</option>
          </select>
        </td>

        <td>
          <input type="date" value="${r.data || ""}"
            onchange="alterarCampo(${i}, 'data', this.value)">
        </td>

        <td>
          <input type="text" value="${r.responsaveis || ""}"
            onchange="alterarCampo(${i}, 'responsaveis', this.value)">
        </td>

        <td>
          <textarea onchange="alterarCampo(${i}, 'comentario', this.value)"
            placeholder="Escreve um comentário…"
          >${r.comentario || r.procedimentos || ""}</textarea>
        </td>

        <td>
          <div>
            <strong>📂 Existentes:</strong><br>
            ${
              anexosExistentes.length
                ? anexosExistentes.map(nome => `
                    <div>
                      📎 ${nome}
                      <button onclick="removerAnexo(${i}, '${nome}')">❌</button>
                    </div>
                  `).join("")
                : "<p>Sem anexos</p>"
            }

            <br><strong>🆕 Novos:</strong><br>
            ${
              novos.length
                ? novos.map((f, idx) => `
                    <div>
                      📎 ${f.name}
                      <button onclick="removerNovoAnexo(${i}, ${idx})">❌</button>
                    </div>
                  `).join("")
                : "<p>Sem novos anexos</p>"
            }

            <input type="file" multiple onchange="adicionarAnexos(event, ${i})">
          </div>
        </td>

      </tr>
    `;
  });

  html += `</table>`;
  div.innerHTML = html;
}


// ------------------ ALTERAR CAMPOS ------------------
function alterarCampo(index, campo, valor) {
  ordemAtual.reparacoes[index][campo] = valor;
}

// ------------------ ELIMINAR ORDEM ------------------
function eliminarOrdem() {
  if (!ordemAtual) {
    alert("Nenhuma ordem carregada.");
    return;
  }

  const confirmar = confirm(
    `⚠️ Tens a certeza que queres eliminar a ordem ID ${ordemAtual.id}?`
  );

  if (!confirmar) return;

  fetch(`/eliminar-ordem/${ordemAtual.id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      alert("🗑️ Ordem eliminada!");
      window.location.href = "menu.html";
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao eliminar ordem.");
    });
}


// ------------------ ANEXOS ------------------
function adicionarAnexos(event, index) {
  const files = Array.from(event.target.files);

  if (!novosAnexos[index]) novosAnexos[index] = [];

  files.forEach(f => {
    if (!novosAnexos[index].some(n => n.name === f.name && n.size === f.size)) {
      novosAnexos[index].push(f);
    }
  });

  event.target.value = "";
  renderizar();
}

function removerAnexo(index, nome) {
  if (!anexosRemover[index]) anexosRemover[index] = [];

  anexosRemover[index].push(nome);

  ordemAtual.reparacoes[index].anexos =
    (ordemAtual.reparacoes[index].anexos || []).filter(a => a !== nome);

  renderizar();
}

function removerNovoAnexo(index, fileIndex) {
  novosAnexos[index].splice(fileIndex, 1);
  renderizar();
}


// ------------------ GUARDAR ------------------
function guardarAlteracoes() {
  if (!ordemAtual) {
    alert("Nenhuma ordem carregada");
    return;
  }

  const formData = new FormData();

  formData.append("ordemId", ordemAtual.id);
  formData.append("reparacoes", JSON.stringify(ordemAtual.reparacoes));
  formData.append("remover", JSON.stringify(anexosRemover));

  Object.keys(novosAnexos).forEach(index => {
    novosAnexos[index].forEach(file => {
      formData.append(`anexos_${index}`, file);
    });
  });

  fetch(`/editar_reparacao`, {
    method: "PUT",
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao guardar");
      alert("✅ Reparações atualizadas!");
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao guardar");
    });
}