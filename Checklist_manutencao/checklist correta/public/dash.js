// ---------------- RESUMO ----------------
fetch("/dashboard/resumo")
  .then(res => res.json())
  .then(data => {

    document.getElementById("ordensAbertas")
      .textContent = data.ordensAbertas;

    document.getElementById("checklistsMes")
      .textContent = data.checklistsMes;
  });


// ---------------- REPARAÇÕES ATRASADAS ----------------
fetch("/dashboard/reparacoes-atrasadas")
  .then(res => res.json())
  .then(data => {

    // contador
    document.getElementById("reparacoesAtrasadas")
      .textContent = data.total;

    // tabela
    let html = `
      <table class="dashboard-tabela">
        <tr>
          <th>Máquina</th>
          <th>Reparação</th>
          <th>Data Prevista</th>
          <th>Responsável</th>
          <th></th>
        </tr>
    `;

    if (data.lista.length === 0) {

      html += `
        <tr>
          <td colspan="5">
            ✅ Sem reparações atrasadas
          </td>
        </tr>
      `;
    }

    data.lista.forEach(r => {

      html += `
        <tr>

          <td>${r.maquina}</td>

          <td>${r.descricao}</td>

          <td>${r.data}</td>

          <td>${r.responsavel}</td>

          <td>
            <a
              href="ver_ordens_detalhado.html?id=${r.ordemId}"
              class="btn-padrao"
            >
              Ver
            </a>
          </td>

        </tr>
      `;
    });

    html += `</table>`;

    document.getElementById("tabela-atrasadas")
      .innerHTML = html;

  });


// ---------------- REPARAÇÕES URGENTES ----------------
fetch("/dashboard/reparacoes-urgentes")
  .then(res => res.json())
  .then(data => {

    // contador
    document.getElementById("reparacoesUrgentes")
      .textContent = data.urgentes;

    // tabela
    const urgentesBody =
      document.getElementById("tabela-urgentes");

    urgentesBody.innerHTML = "";

    if (data.lista.length === 0) {

      urgentesBody.innerHTML = `
        <tr>
          <td colspan="4">
            ✅ Nenhuma reparação urgente
          </td>
        </tr>
      `;

      return;
    }

    data.lista.forEach(r => {

      urgentesBody.innerHTML += `
        <tr>
          <td>${r.maquina}</td>
          <td>${r.descricao}</td>
          <td>${r.responsavel}</td>
          <td>${r.data}</td>
        </tr>
      `;
    });

  });


// ---------------- GRÁFICO MÁQUINAS COM MAIS PENDENTES ----------------
fetch("/dashboard/maquinas-pendentes")
  .then(res => res.json())
  .then(data => {

    new Chart(
      document.getElementById("graficoLinhas"),
      {

        type: 'bar',

        data: {

          labels: data.map(m => m.maquina),

          datasets: [{
            label: 'Reparações Pendentes',
            data: data.map(m => m.total)
          }]
        },

        options: {

          responsive: true,

          plugins: {
            legend: {
              display: false
            }
          }
        }
      }
    );

  });

  // ---------------- URGENTES POR MÁQUINA ----------------
fetch("/dashboard/urgentes-por-maquina")
  .then(res => res.json())
  .then(data => {

    new Chart(
      document.getElementById("graficoUrgentes"),
      {

        type: 'bar',

        data: {

          labels: data.map(m => m.maquina),

          datasets: [{
            label: 'Urgentes Pendentes',

            data: data.map(m => m.total)
          }]
        },

        options: {
          responsive: true,

          plugins: {
            legend: {
              display: false
            }
          }
        }
      }
    );

  });


  // ---------------- PENDENTES POR RESPONSÁVEL ----------------
fetch("/dashboard/pendentes-por-responsavel")
  .then(res => res.json())
  .then(data => {

    new Chart(
      document.getElementById("graficoResponsaveis"),
      {

        type: 'bar',

        data: {

          labels: data.map(r => r.responsavel),

          datasets: [{
            label: 'Pendentes',

            data: data.map(r => r.total)
          }]
        },

        options: {
          responsive: true,

          plugins: {
            legend: {
              display: false
            }
          }
        }
      }
    );

  });