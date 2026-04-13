function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatarDataHora(data) {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos} ${dia}/${mes}/${ano}`;
}

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

document.addEventListener('DOMContentLoaded', function () {
  let registros = [];
  let paginaAtual = 0;

  const registrosDiv = document.getElementById('registros');
  const filtroSelect = document.getElementById('filtro-maquina');

  function renderizarPagina() {
    registrosDiv.innerHTML = '';

    if (registros.length === 0) {
      registrosDiv.innerHTML = 'Nenhum registro encontrado.';
      return;
    }

    const registro = registros[paginaAtual];
    const maquinaId = String(registro.maquina);
    const nomeMaquina = checklistsModelos[maquinaId]?.Nome || `Máquina ${maquinaId}`;

    const div = document.createElement('div');
    div.classList.add('registro');

    console.log("ANEXOS RAW:", registro.anexos);
  let anexos = [];

try {
  if (registro.anexos) {
    // se já for array
    if (Array.isArray(registro.anexos)) {
      anexos = registro.anexos;
    } 
    // se for string tenta converter
    else if (typeof registro.anexos === "string") {
      anexos = JSON.parse(registro.anexos);
    }
  }
} catch (e) {
  console.warn("Erro ao fazer parse dos anexos:", registro.anexos);

  // fallback: tenta tratar como string simples
  anexos = [registro.anexos];
}

div.innerHTML = `
  <h3>${nomeMaquina} (Relatório ID: ${registro.id})</h3>
  <p><strong>Data do Registo:</strong> ${formatarDataHora(registro.data_registro)}</p>
  <p><strong>Relatório:</strong> ${registro.relatorio || "Sem relatório"}</p>

  <div class="acoes-tabela">
    <table>
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Ação</th>
          <th>Status</th>
          <th>Proxima verificação</th>
        </tr>
      </thead>
      <tbody>
        ${registro.acoes.map(acao => `
          <tr class="${removerAcentos(acao.status.toLowerCase().replace(/\s+/g, '-'))}">
            <td>${acao.grupo}</td>
            <td>${acao.nome}</td>
            <td>${acao.status}</td>
            <td>${acao["next check"] ? formatarData(acao["next check"]) : "-"}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <p><strong>Anexos:</strong></p>
  <div class="anexos-container">
    ${
      anexos.length > 0
        ? anexos.map(nome => {
            const caminho = `/uploads/${nome}`;

            // 🔥 se for imagem mostra preview
            if (nome.match(/\.(jpg|jpeg|png|gif)$/i)) {
              return `<img src="${caminho}" style="max-width:200px; margin:5px; cursor:pointer;" onclick="window.open('${caminho}')">`;
            }

            // 📄 outros ficheiros (pdf etc)
            return `<a href="${caminho}" target="_blank">📎 ${nome}</a>`;
          }).join('')
        : "<p>Sem anexos</p>"
    }
  </div>

  <p><strong>Validado por:</strong></p>
  ${
    registro.assinatura
      ? `<img src="${registro.assinatura}" alt="Assinatura" style="max-width: 300px; max-height: 150px;">`
      : "<p>Sem assinatura</p>"
  }
`;

    registrosDiv.appendChild(div);
    document.getElementById('pagina-info').textContent = `Página ${paginaAtual + 1} de ${registros.length}`;
  }

  function mudarPagina(delta) {
    paginaAtual += delta;
    if (paginaAtual < 0) paginaAtual = 0;
    if (paginaAtual >= registros.length) paginaAtual = registros.length - 1;
    renderizarPagina();
  }

function buscarRegistros() {

  fetch("/ver-registos")
    .then(response => response.json())
    .then(data => {
      registros = data;
      paginaAtual = 0;
      renderizarPagina();
    })
    .catch(error => {
      console.error(error);
      alert("Erro ao buscar registros.");
    });

}

  // Inicializar
  buscarRegistros();



  function buscarComFiltro() {

  const id = document.getElementById("filtro-id").value;
  const maquina = document.getElementById("filtro-maquina").value;

  let url = "/ver-registos?";
  const params = [];

  if (id) params.push(`id=${id}`);
  if (maquina) params.push(`maquina=${maquina}`);

  url += params.join("&");

  fetch(url)
    .then(res => res.json())
    .then(data => {
      registros = data;
      paginaAtual = 0;
      renderizarPagina();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao buscar registros");
    });

}
 


  document.getElementById('btn-anterior').addEventListener('click', function () {
    mudarPagina(-1);
  });

  document.getElementById('btn-proximo').addEventListener('click', function () {
    mudarPagina(1);
  });
  document.getElementById("btn-filtrar").addEventListener("click", buscarComFiltro);
});
