function formatarData(data) {

  if (!data) return "-";

  const d = new Date(data);

  if (isNaN(d)) return "-";

  return d.toLocaleDateString("pt-PT");
}

// ------------------ BUSCAR CHECKLISTS ------------------
fetch("/ver-registos")

  .then(res => res.json())

  .then(registros => {

    const tbody =
      document.getElementById("tabela-pendentes");

    tbody.innerHTML = "";

    let totalPendentes = 0;

    registros.forEach(reg => {

      let acoes = [];

      try {

        acoes =
          typeof reg.acoes === "string"
            ? JSON.parse(reg.acoes)
            : reg.acoes || [];

      } catch (e) {

        console.error("Erro parse ações:", e);
      }

      acoes.forEach(acao => {

        const status =
          (acao.status || "").trim();

        // 🔥 mostrar apenas não realizadas
        if (
          status === "" ||
          status === "-" ||
          status.toLowerCase() === "pendente"
        ) {

          totalPendentes++;

          tbody.innerHTML += `

            <tr>

              <td>${reg.id}</td>

              <td>${reg.nome || reg.maquina || "-"}</td>

              <td>${acao.grupo || "-"}</td>

              <td>${acao.nome || "-"}</td>

              <td>
                <span class="badge-pendente">
                  Não realizado
                </span>
              </td>

              <td>
                ${formatarData(acao["next check"])}
              </td>

              <td>

                <a
                  href="ver_checklist_detalhado.html?id=${reg.id}"
                  class="btn-padrao"
                >
                  Ver
                </a>

              </td>

            </tr>
          `;
        }

      });

    });

    // sem resultados
    if (totalPendentes === 0) {

      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            ✅ Não existem ações pendentes.
          </td>
        </tr>
      `;
    }

  })

  .catch(err => {

    console.error(err);

    alert("Erro ao carregar ações pendentes.");
  });