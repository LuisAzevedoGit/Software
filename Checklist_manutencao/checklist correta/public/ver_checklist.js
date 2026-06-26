let registros = [];
let paginaAtual = 1;
const itensPorPagina = 10;

// ------------------ FORMATAR DATA ------------------
function formatarDataHora(data) {
  const d = new Date(data);

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos} ${dia}/${mes}/${ano}`;
}

document.addEventListener("DOMContentLoaded", () => {

  const tabelaDiv = document.getElementById("registros");

  // ------------------ REDIRECIONAR ------------------
  window.verChecklist = function(id) {
    window.location.href = `ver_checklist_detalhado.html?id=${id}`;
  };

  window.editarChecklist = function(id) {
    window.location.href = `editar.html?id=${id}`;
  };

  window.assinarChecklist = function(id) {
    window.location.href = `assinar.html?id=${id}`;
  };

  window.irParaOrdem = function(checklistId, ordemId) {
    if (ordemId) {
      window.location.href = `ver_ordens_detalhado.html?id=${ordemId}`;
    } else {
      window.location.href = `ord-trabalho.html?checklist_id=${checklistId}`;
    }
  };

  // ------------------ RENDER TABELA ------------------
  async function renderTabela() {

    if (!registros || registros.length === 0) {
      tabelaDiv.innerHTML = "<p>Nenhum registo encontrado.</p>";
      document.getElementById("pagina-info").textContent = "";
      return;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const registrosPagina = registros.slice(inicio, fim);

    // Verificar ordens existentes para cada checklist desta página
    const ordemPorChecklist = {};
    await Promise.all(
      registrosPagina.map(reg =>
        fetch(`/ver_ordens_por_checklist/${reg.id}`)
          .then(r => r.json())
          .then(ordens => {
            ordemPorChecklist[reg.id] = ordens.length > 0 ? ordens[0].id : null;
          })
          .catch(() => {
            ordemPorChecklist[reg.id] = null;
          })
      )
    );

    let html = `
      <table id="tabela-ordem">
        <thead>
          <tr>
            <th>ID</th>
            <th>Máquina</th>
            <th>Data</th>
            <th>Progresso</th>
            <th style="min-width:250px">Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    registrosPagina.forEach(reg => {

      const acoes = reg.acoes || [];
      const total = acoes.length;
      const preenchidas = acoes.filter(a => a.status && a.status.trim() !== "").length;

      const ordemId = ordemPorChecklist[reg.id];
      const temOrdem = ordemId !== null;

      const btnOrdemStyle = temOrdem
        ? `background:#10b981`
        : `background:#c0392b`;

      const btnOrdemLabel = temOrdem
        ? `📋 Ver Ordem`
        : `➕ Criar Ordem`;

      html += `
        <tr>
          <td>${reg.id}</td>
          <td>${reg.nome || reg.maquina}</td>
          <td>${formatarDataHora(reg.data_registro)}</td>
          <td>${preenchidas}/${total}</td>
          <td style="white-space:nowrap;min-width:250px;text-align:center">
            <button class="btn-padrao" onclick="verChecklist(${reg.id})">
              Ver
            </button>
            <button class="btn-padrao" style="background:#c8a84b" onclick="editarChecklist(${reg.id})">
              Editar
            </button>
            <button class="btn-padrao" style="background:#1e6b3c" onclick="assinarChecklist(${reg.id})">
              Assinar
            </button>
            <button class="btn-padrao" style="${btnOrdemStyle}" onclick="irParaOrdem(${reg.id}, ${ordemId ?? 'null'})">
              ${btnOrdemLabel}
            </button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    tabelaDiv.innerHTML = html;

    atualizarPaginacao();
  }

  // ------------------ PAGINAÇÃO ------------------
  function atualizarPaginacao() {

    const totalPaginas = Math.ceil(registros.length / itensPorPagina);

    document.getElementById("pagina-info").textContent =
      `Página ${paginaAtual} de ${totalPaginas}`;

    document.getElementById("btn-anterior").disabled =
      paginaAtual === 1;

    document.getElementById("btn-proximo").disabled =
      paginaAtual === totalPaginas;
  }

  // ------------------ BUSCAR TODOS ------------------
  function buscarRegistros() {

    fetch("/ver-registos")
      .then(res => res.json())
      .then(data => {

        registros = data;
        paginaAtual = 1;

        renderTabela();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao buscar registros.");
      });
  }

  // ------------------ BUSCAR COM FILTRO ------------------
  function buscarComFiltro() {

    const id = document.getElementById("filtro-id").value;
    const maquina = document.getElementById("filtro-maquina").value;
    const linha = document.getElementById("filtro-linha").value.trim();

    let url = "/ver-registos?";
    const params = [];

    if (id) params.push(`id=${id}`);
    if (maquina) params.push(`maquina=${maquina}`);
    if (linha) params.push(`linha=${encodeURIComponent(linha)}`);

    url += params.join("&");

    fetch(url)
      .then(res => res.json())
      .then(data => {

        registros = data;
        paginaAtual = 1;

        renderTabela();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao buscar registros.");
      });
  }

  // ------------------ BOTÕES ------------------
  document.getElementById("btn-filtrar")
    .addEventListener("click", buscarComFiltro);

  document.getElementById("btn-anterior")
    .addEventListener("click", () => {
      if (paginaAtual > 1) {
        paginaAtual--;
        renderTabela();
      }
    });

  document.getElementById("btn-proximo")
    .addEventListener("click", () => {
      const totalPaginas = Math.ceil(registros.length / itensPorPagina);
      if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderTabela();
      }
    });

  // ------------------ INIT ------------------
  buscarRegistros();
});