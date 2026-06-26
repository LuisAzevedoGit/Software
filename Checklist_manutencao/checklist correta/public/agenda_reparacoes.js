function formatarData(data) {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Formata data para valor de input date (YYYY-MM-DD)
function toInputDate(d) {
  const ano  = d.getFullYear();
  const mes  = String(d.getMonth() + 1).padStart(2, '0');
  const dia  = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// ------------------ CONCLUIR ------------------
function concluirTarefa(ordemId, reparacaoId, checkbox) {
  fetch("/concluir_tarefa", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordemId, reparacaoId })
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro");
      checkbox.disabled = true;
      carregarAgenda();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao concluir tarefa.");
    });
}

// ------------------ CARREGAR ------------------
function carregarAgenda() {
  const dataInicio = document.getElementById("filtroDataInicio")?.value || "";
  const dataFim    = document.getElementById("filtroDataFim")?.value || "";
  const maquina    = document.getElementById("filtroMaquina")?.value.trim() || "";
  const estado     = document.getElementById("filtroEstado")?.value || "";

  // Busca todas as reparações (sem filtro de dias no servidor)
  fetch(`/agenda_reparacoes?dias=3650`)
    .then(res => res.json())
    .then(reparacoes => {
      const div = document.getElementById("agenda-container");

      let filtradas = reparacoes;

      // ------------------ FILTRO INTERVALO DE DATAS ------------------
      if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        filtradas = filtradas.filter(r => {
          const d = new Date(r.data);
          d.setHours(0, 0, 0, 0);
          return d >= inicio;
        });
      }

      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        filtradas = filtradas.filter(r => {
          const d = new Date(r.data);
          return d <= fim;
        });
      }

      // ------------------ FILTROS LOCAIS ------------------
      if (maquina) {
        filtradas = filtradas.filter(r =>
          r.maquina?.toLowerCase().includes(maquina.toLowerCase())
        );
      }

      if (estado === "concluido") {
        filtradas = filtradas.filter(r => r.estado === "✅");
      } else if (estado === "pendente") {
        filtradas = filtradas.filter(r => r.estado !== "✅");
      }

      if (!filtradas.length) {
        div.innerHTML = "<p>Sem reparações previstas para o intervalo selecionado.</p>";
        return;
      }

      let html = `
        <table id="tabela-ordem">
          <thead>
            <tr>
              <th>Máquina</th>
              <th>Grupo</th>
              <th>Ação</th>
              <th>Data Prevista</th>
              <th>Responsável</th>
              <th>Estado</th>
              <th>Concluir</th>
              <th>Ver</th>
            </tr>
          </thead>
          <tbody>
      `;

      filtradas.forEach(r => {
        const classe = r.atrasado ? "linha-atrasada" : "";

        html += `
          <tr class="${classe}">
            <td>${r.maquina}</td>
            <td>${r.grupo || "-"}</td>
            <td>${r.descricao}</td>
            <td>${formatarData(r.data)}</td>
            <td>${r.responsaveis || "-"}</td>
            <td>${r.estado === "✅" ? "✅ Concluído" : "⏳ Pendente"}</td>
            <td>
              ${r.estado !== "✅"
                ? `<input type="checkbox" onchange="concluirTarefa(${r.ordemId}, ${r.reparacaoId}, this)">`
                : "✔️"}
            </td>
            <td>
              <button class="btn-padrao" onclick="window.location.href='ver_ordens_detalhado.html?id=${r.ordemId}'">
                Ver
              </button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      div.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("agenda-container").innerHTML = "<p>Erro ao carregar agenda.</p>";
    });
}

// ------------------ INIT ------------------
document.addEventListener("DOMContentLoaded", () => {
  // Define intervalo padrão: hoje até +30 dias
  const hoje = new Date();
  const daqui30 = new Date();
  daqui30.setDate(hoje.getDate() + 30);

  const inputInicio = document.getElementById("filtroDataInicio");
  const inputFim    = document.getElementById("filtroDataFim");

  if (inputInicio && !inputInicio.value) inputInicio.value = toInputDate(hoje);
  if (inputFim    && !inputFim.value)    inputFim.value    = toInputDate(daqui30);

  carregarAgenda();
});