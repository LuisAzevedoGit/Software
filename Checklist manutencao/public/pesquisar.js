function pesquisar() {
    const id = document.getElementById("id").value.trim();
    const data = document.getElementById("data").value.trim();

    if (!id && !data) {
      alert("Preenche pelo menos o ID ou a Data.");
      return;
    }

    let url = "http://192.168.100.28:3001/pesquisar?"; //////verificar isto 
    if (id) url += `id=${id}`;
    if (data) url += `${id ? '&' : ''}data=${data}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const div = document.getElementById("resultados");
        div.innerHTML = "";

        if (data.length === 0) {
          div.innerHTML = "<p>Nenhum registro encontrado.</p>";
          return;
        }

        data.forEach(reg => {
        const dataFormatada = new Date(reg.data_registro).toLocaleString("pt-PT", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });

        div.innerHTML += `
          <div class="registro">
            <div class="info-linha">
              <p><strong>ID:</strong> ${reg.id}</p>
              <p><strong>Maquina:</strong> ${reg.nome}</p>
              <p><strong>Data:</strong> ${dataFormatada}</p>
            </div>
            <p><strong>Relatório:</strong></p>
            <pre class="relatorio-texto">${reg.relatorio}</pre>
            ${reg.assinatura ? `<img src="${reg.assinatura}" width="350" />` : "<em>Sem assinatura</em>"}
          </div>
        `;
      });
             // Armazena o primeiro registro encontrado na variável global
             registroAtual = data[0];
         // Exibe o canvas para assinatura
  document.getElementById("assinatura-container").style.display = "block"; // Torna o canvas visível
      })
      .catch(err => console.error("Erro ao pesquisar:", err));
  }