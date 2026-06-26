function formatarDataHora(data) {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos} ${dia}/${mes}/${ano}`;
}

function concluirTarefa(ordemId, reparacaoId, botao) {
  fetch(`/concluir_tarefa`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordemId, reparacaoId })
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao atualizar");
      document.getElementById(`estado-${reparacaoId}`).textContent = "✅";
      if (botao) botao.remove();
      verificarConclusao(ordemId);
    })
    .catch(err => {
      console.error("Erro ao concluir tarefa:", err);
      alert("Erro ao concluir tarefa.");
    });
}

function verificarConclusao(ordemId) {
  fetch(`/ver_ordens/${ordemId}`)
    .then(res => res.json())
    .then(ordem => {
      const todasConcluidas = ordem.reparacoes.every(r => r.estado === "✅");

      const statusEl = document.getElementById("status-concluido");
      if (statusEl) {
        statusEl.innerHTML = `<strong>Concluído:</strong> ${todasConcluidas ? "✅ Sim" : "❌ Não"}`;
      }

      fetch(`/atualizar_concluido/${ordemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido: todasConcluidas })
      }).catch(err => console.error("Erro ao atualizar status de concluído:", err));
    });
}

// ------------------ GUARDAR COMENTÁRIO ------------------
function guardarComentario(ordemId, reparacaoId) {
  const textarea = document.getElementById(`comentario-${reparacaoId}`);
  const btn      = document.getElementById(`btn-comentario-${reparacaoId}`);
  const texto    = textarea.value.trim();

  btn.disabled    = true;
  btn.textContent = "A guardar…";

  fetch(`/atualizar_comentario_ordem/${ordemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reparacaoId, comentario: texto })
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao guardar");
      btn.textContent      = "✅ Guardado";
      btn.style.background = "#1e6b3c";
      setTimeout(() => {
        btn.disabled         = false;
        btn.textContent      = "Guardar comentário";
        btn.style.background = "";
      }, 2000);
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao guardar comentário.");
      btn.disabled    = false;
      btn.textContent = "Guardar comentário";
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("detalhes").textContent = "ID não fornecido.";
    return;
  }

  fetch(`/ver_ordens/${id}`)
    .then(res => {
      if (!res.ok) throw new Error("Ordem não encontrada");
      return res.json();
    })
    .then(ordem => {
      const div = document.getElementById("detalhes");

      let reparacoesHTML = ordem.reparacoes && ordem.reparacoes.length
        ? ordem.reparacoes.map(r => {

          let anexos = r.anexos || [];

          return `
            <div class="reparacao">

              <p><strong>ID de trabalho:</strong> ${r.id}</p>
              <p><strong>Status:</strong> ${r.status}</p>
              <p><strong>Grupo:</strong> ${r.grupo}</p>
              <p><strong>Descrição:</strong> ${r.descricao}</p>
              <p><strong>Data prevista:</strong> ${r.data || "-"}</p>
              <p><strong>Responsáveis:</strong> ${r.responsaveis || "-"}</p>

              <p>
                <strong>Estado de reparação:</strong>
                <span id="estado-${r.id}">${r.estado || 'pendente'}</span>
                ${r.estado !== "✅" ? `<button onclick="concluirTarefa(${ordem.id}, ${r.id}, this)">Concluir tarefa</button>` : ""}
              </p>

              <div class="comentario-wrap">
                <label for="comentario-${r.id}"><strong>Comentário:</strong></label>
                <textarea
                  id="comentario-${r.id}"
                  rows="3"
                  placeholder="Escreve um comentário sobre esta reparação…"
                  style="width:100%;margin-top:5px;border-radius:4px;border:1px solid #ccc;padding:8px;font-family:inherit;font-size:13px;resize:vertical;"
                >${r.comentario || r.procedimentos || ""}</textarea>
                <button
                  id="btn-comentario-${r.id}"
                  class="btn-padrao"
                  style="margin-top:6px"
                  onclick="guardarComentario(${ordem.id}, '${r.id}')"
                >Guardar comentário</button>
              </div>

              <p><strong>Anexos:</strong></p>
              <div class="anexos-container">
                ${
                  anexos.length > 0
                    ? anexos.map(nome => {
                        const caminho = `/uploads/${nome}`;
                        if (nome.match(/\.(jpg|jpeg|png|gif)$/i)) {
                          return `<img src="${caminho}"
                                      style="max-width:150px;margin:5px;cursor:pointer;"
                                      onclick="window.open('${caminho}')">`;
                        }
                        return `<a href="${caminho}" target="_blank">📎 ${nome}</a><br>`;
                      }).join("")
                    : "<p>Sem anexos</p>"
                }
              </div>

            </div>
          `;
        }).join("")
        : "<p><em>Sem reparações registadas.</em></p>";

      div.innerHTML = `
        <div class="ordem-cabecalho">
          <div class="ordem-info">
            <h2>Ordem de trabalho #${ordem.id}</h2>
            <p><strong>Máquina:</strong> ${ordem.nome_maquina}</p>
            <p><strong>Checklist:</strong> ${ordem.checklist_id}</p>
            <p><strong>Descrição:</strong> ${ordem.descricao}</p>
            <p><strong>Data de Criação:</strong> ${formatarDataHora(ordem.criado_em)}</p>
            <p id="status-concluido"><strong>Concluído:</strong> ${ordem.concluido ? "✅ Sim" : "❌ Não"}</p>

            <a href="editar-ordens.html?id=${ordem.id}" class="btn-padrao" style="display:inline-block;margin-bottom:1rem;">
              ✏️ Editar Ordem
            </a>

            <h3>Trabalhos:</h3>
          </div>
          <img src="imagens/mechanic.png" alt="Ordem" class="ordem-img" />
        </div>
        ${reparacoesHTML}
      `;
    })
    .catch(err => {
      document.getElementById("detalhes").textContent = "Erro ao carregar detalhes da ordem.";
      console.error(err);
    });
});