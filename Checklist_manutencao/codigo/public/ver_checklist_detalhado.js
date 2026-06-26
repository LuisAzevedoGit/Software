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
  if (!dataStr) return "-";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function getIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

document.addEventListener('DOMContentLoaded', function () {

  const registrosDiv = document.getElementById('registros');

  function renderizar(registro) {

    registrosDiv.innerHTML = '';

    if (!registro) {
      registrosDiv.innerHTML = 'Nenhum registro encontrado.';
      return;
    }

    const maquinaId = String(registro.maquina);
    const nomeMaquina = checklistsModelos[maquinaId]?.Nome || `Máquina ${maquinaId}`;

    const div = document.createElement('div');
    div.classList.add('registro');

    // 🔧 ANEXOS (igual ao antigo)
    let anexos = [];

    try {
      if (registro.anexos) {
        if (Array.isArray(registro.anexos)) {
          anexos = registro.anexos;
        } else if (typeof registro.anexos === "string") {
          anexos = JSON.parse(registro.anexos);
        }
      }
    } catch (e) {
      console.warn("Erro ao fazer parse dos anexos:", registro.anexos);
      anexos = [registro.anexos];
    }

    // 🔥 HTML IGUAL AO ANTIGO
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

                if (nome.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  return `<img src="${caminho}" style="max-width:200px; margin:5px; cursor:pointer;" onclick="window.open('${caminho}')">`;
                }

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
  }


  
  function carregarDetalhe() {

    const id = getIdFromURL();

    if (!id) {
      registrosDiv.innerHTML = "ID inválido";
      return;
    }

    fetch(`/ver-registos?id=${id}`)
      .then(res => res.json())
      .then(data => {

        if (!data || data.length === 0) {
          renderizar(null);
          return;
        }

        const registro = data[0];

        // 🔧 garantir parse das ações
        try {
          registro.acoes = typeof registro.acoes === "string"
            ? JSON.parse(registro.acoes)
            : registro.acoes || [];
        } catch {
          registro.acoes = [];
        }

        renderizar(registro);
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao carregar checklist.");
      });
  }

  carregarDetalhe();
});