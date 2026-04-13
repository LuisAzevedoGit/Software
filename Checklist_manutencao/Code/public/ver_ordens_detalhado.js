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
      if (botao) botao.remove(); // remove o botão passado
      verificarConclusao(ordemId); // ✅ chamada aqui
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

      if (todasConcluidas) {
        fetch(`/atualizar_concluido/${ordemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concluido: true })
        }).catch(err => {
          console.error("Erro ao atualizar status de concluído:", err);
        });
      } else {
        fetch(`/atualizar_concluido/${ordemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concluido: false })
        }).catch(err => {
          console.error("Erro ao atualizar status de concluído:", err);
        });
      }
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
  ? ordem.reparacoes.map(r => `
      <div class="reparacao">
        <p><span><strong>ID de trabalho:</strong> ${r.id}</span> <span><strong>Status:</strong> ${r.status}</span></p>
        <p><span><strong>Grupo:</strong> ${r.grupo}</span> <span><strong>Descrição:</strong> ${r.descricao}</span></p>
        <p><span><strong>Data prevista:</strong> ${r.data}</span> <span><strong>Responsáveis:</strong> ${r.responsaveis}</span></p>
         <p>
        <strong>Estado de reparação:</strong> 
        <span id="estado-${r.id}">${r.estado || 'pendente'}</span>
        ${r.estado !== "✅" ? `<button onclick="concluirTarefa(${ordem.id}, ${r.id}, this)">Concluir tarefa</button>` : ""}
      </p>
      </div>
    `).join("")
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

        <h3>Trabalhos:</h3>
        </div>
         <img src="imagens/mechanic.png" alt="Ordem" class="ordem-img" /></div>
        ${reparacoesHTML}
      `;
    })
    .catch(err => {
      document.getElementById("detalhes").textContent = "Erro ao carregar detalhes da ordem.";
      console.error(err);
    });
});
