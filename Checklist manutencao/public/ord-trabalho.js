let registroAtual = null;

function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function atualizarCampo(index, campo, valor) {
  if (reparacoesEmCurso[index]) {
    reparacoesEmCurso[index][campo] = valor;
  }
}


const listaResponsaveis = ["João Carneiro", "Dinis Ribeiro", "Rui Martins"];

let reparacoesEmCurso = [];

function pesquisar_filtrada_apenas_reparacao() {
  const id = document.getElementById("checklist_id").value;
  if (!id) {
    alert("Preenche o ID.");
    return;
  }

  const url = `http://192.168.100.28:3001/pesquisar?id=${id}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("resultados");
      div.innerHTML = "";

      const registro = data[0];
      if (!registro) {
        div.innerHTML = "<p>Nenhum registro encontrado.</p>";
        return;
      }

      registroAtual = registro;

      const acoesReparar = (registro.acoes || []).filter(acao => {

  const status = (acao.status || "").toLowerCase().trim();

  return status.includes("reparação") || status === "";

});

      if (acoesReparar.length === 0) {
        div.innerHTML = "<p>Sem ações de reparação.</p>";
        return;
      }

      //"NAO SEI SE É NECESSARIO ADICIONAR O ESTADO : REPARÇAO URGENTE OU NAO URGENTE"
      reparacoesEmCurso = acoesReparar.map((acao, idx) => ({
        id: (idx + 1).toString(),
        grupo: acao.grupo || "-",
        status: acao.status,
        descricao: acao.nome || "-",
        data: "",
        responsaveis: "",
        estado: "Pendente"
        
      }));
      console.log(reparacoesEmCurso);

      let html = `
      <div class="secao-ordem-trabalho">
        <p><strong>Checklist:</strong> ${registro.id} | <strong>Máquina:</strong> ${registro.nome || 'Não disponível'}</p>
        <label for="descricaoGeral"><strong>Descrição de trabalho:</strong >  <input type="text" id="descricaoGeral" placeholder="Procedimentos de ordem de reparação..."  style="width: 100%; margin: 10px 0;" /></label>
        <table id="tabela-ordem">
          <thead> 
            <tr><th>Grupo</th><th>Descrição</th> <th>Estado</th><th>Data</th><th>Responsáveis</th></tr>
          </thead>
          <tbody>
           
      `;

      reparacoesEmCurso.forEach((rep, i) => {
        const classeStatus = removerAcentos(rep.status?.toLowerCase().replace(/\s+/g, '-'));
        html += `
        
           <tr class="${classeStatus}">
            <td>${rep.grupo}</td>
            
            <td>${rep.descricao}</td>
            <td>
              pendente
            </td>
            <td><input type="date" onchange="atualizarCampo(${i}, 'data', this.value)" /></td>
           <td>
  <select onchange="atualizarCampo(${i}, 'responsaveis', this.value)">
    <option value="">Selecione</option>
    ${listaResponsaveis.map(nome => `<option value="${nome}">${nome}</option>`).join("")}
  </select>
</td>
           
          </tr>
          
        `;
      });

     html += '</tbody></table><br><button class="btn-padrao" onclick="criarOrdem()">Criar Ordem</button> </div>';

      div.innerHTML = html;
    })
    .catch(err => {
      console.error("Erro ao buscar checklist:", err);
      alert("Erro ao buscar checklist.");
    });
}


//---------Criar ordem de trabalho------

function criarOrdem() {
  if (!registroAtual || reparacoesEmCurso.length === 0) {
    alert("Checklist não carregada ou sem ações.");
    return;
  }

  const incompletas = reparacoesEmCurso.filter(r =>
    !r.data || !r.responsaveis
  );

  if (incompletas.length > 0) {
    alert("Preenche todos os campos de cada reparação.");
    return;
  }

  const descricaoGeral = document.getElementById("descricaoGeral").value || "Sem descrição";

  // FRONTEND
const ordem = {
  checklist_id: registroAtual.id,
  nome_maquina: registroAtual.nome || "Sem nome definido",
  descricao: descricaoGeral,  // <-- sem acento
  reparacoes_json: reparacoesEmCurso
};



  console.log(ordem);
  fetch("http://192.168.100.28:3001/ordem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ordem)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Resposta inválida do servidor");
      }
      return res.json();
    })
    .then(data => {
     alert("✅ Ordem criada com sucesso. ID: " + data.id);
      reparacoesEmCurso = [];
      window.location.href = "menu.html";
    })
    .catch(err => {
      console.error("Erro ao criar ordem:", err);
      alert("Erro ao criar ordem.");
    });
}
