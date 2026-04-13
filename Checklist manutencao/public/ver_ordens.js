function formatarDataHora(data) {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos} ${dia}/${mes}/${ano}`;
}

function pesquisar() {
  const filtro = document.getElementById("filtroConcluido").value;


   let url = "/ver_ordens";
    if (filtro === "true" || filtro === "false") {
    url += `?concluido=${filtro}`;
  }
 fetch(url)
    .then(res => res.json())
    .then(ordens => {
      const div = document.getElementById("ordens");
      div.innerHTML = "";

      if (ordens.length === 0) {
        div.innerHTML = "<p>Nenhuma ordem encontrada.</p>";
        return;
      }

      ordens.forEach(o => {
        const card = document.createElement("div");
        card.className = "ordem-card";

        card.innerHTML = `
          <img src="imagens/mechanic.png" alt="Ordem" class="ordem-img" />
          <div class="ordem-conteudo">
            <p><strong>Ordem ID:</strong> ${o.id}</p>
            <p><strong>Máquina:</strong> ${o.nome_maquina}</p>
            <p><strong>Descrição:</strong> ${o.descricao}</p>
            <p><strong>Criado em:</strong> ${formatarDataHora(o.criado_em)}</p>
            <p><strong>Concluído:</strong> ${o.concluido ? "✅ Sim" : "❌ Não"}</p>
            <a class="ver-mais" href="ver_ordens_detalhado.html?id=${o.id}">Ver mais</a>
          </div>
        `;

        div.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Erro ao buscar ordens:", err);
      document.getElementById("ordens").innerHTML = "<p>Erro ao carregar ordens.</p>";
    });
}

// Carrega tudo ao iniciar
document.addEventListener("DOMContentLoaded", pesquisar);
