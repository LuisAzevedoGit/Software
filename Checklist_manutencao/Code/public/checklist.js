function calcularNextCheck(status, periodicidade) {
  if (status.toLowerCase() !== "realizado") return null;

  const hoje = new Date();

  switch (periodicidade?.toLowerCase()) {
      case 'trimestral':
    hoje.setMonth(hoje.getMonth() + 3);
    break;
  case 'semestral':
    hoje.setMonth(hoje.getMonth() + 6);
    break;
  case 'anual':
    hoje.setFullYear(hoje.getFullYear() + 1);
    break;
  case 'bianual':
    hoje.setFullYear(hoje.getFullYear() + 2);
    break;
  case '3-3 anos':
  case '3 anos':
  case 'trianual':
    hoje.setFullYear(hoje.getFullYear() + 3);
    break;
  case '5-5 anos':
  case '5 anos':
    hoje.setFullYear(hoje.getFullYear() + 5);
    break;
  case '10-10 anos':
  case '10 anos':
    hoje.setFullYear(hoje.getFullYear() + 10);
    break;
  default:
    return null;

  }

  // Retorna a data formatada como YYYY-MM-DD (para guardar no JSON/banco)
  return hoje.toISOString().split('T')[0];
}



let categoriaSelecionada = "";

document.getElementById("categoria").addEventListener("change", function () {
  const cat = this.value;
  categoriaSelecionada = cat;

  const selectMachine = document.getElementById("select-machine");
  selectMachine.innerHTML = '<option value="">Selecione uma máquina</option>';

  if (checklistsModelos[cat]) {
    for (const [id, modelo] of Object.entries(checklistsModelos[cat])) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = modelo.Nome;
      selectMachine.appendChild(opt);
    }
  }
});


document.getElementById("next-btn").addEventListener("click", function () {
  const idSelecionado = document.getElementById("select-machine").value;

  if (!categoriaSelecionada || !idSelecionado) {
    alert("Selecione uma categoria e uma máquina.");
    return;
  }

  exibirChecklist(categoriaSelecionada, idSelecionado);
});

function exibirChecklist(categoria, maquinaId) {
  const modelo = checklistsModelos[categoria]?.[maquinaId];
  if (!modelo) {
    alert("Modelo não encontrado.");
    return;
  }

  // Atualizar o nome da máquina na página
  const maquinaNome = document.getElementById("maquina-nome");
  maquinaNome.textContent = modelo.Nome || `Máquina ${maquinaId}`;

  // Limpar tabela
  const tabelaChecklist = document.getElementById("tabela-checklist").getElementsByTagName("tbody")[0];
  tabelaChecklist.innerHTML = "";

  const checklist = modelo.acoes;

  // Agrupamento e criação da tabela como já está no teu código...
  const grupos = {};
  checklist.forEach(acao => {
    if (!grupos[acao.grupo]) grupos[acao.grupo] = [];
    grupos[acao.grupo].push(acao);
  });

  const grupoNomes = Object.keys(grupos);
  grupoNomes.forEach((grupo, idx) => {
    const corFundo = idx % 2 === 0 ? "#f0f0f0" : "#ffffff";

    grupos[grupo].forEach(acao => {
      const row = tabelaChecklist.insertRow();
      row.style.backgroundColor = corFundo;

      const cellGrupo = row.insertCell(0);
      const cellNome = row.insertCell(1);
      const cellFazer = row.insertCell(2);
      const cellMaterial = row.insertCell(3);
      const cellPeriodicidade = row.insertCell(4);
      const cellTempo = row.insertCell(5);
      const cellStatus = row.insertCell(6);
      const cellNextCheck = row.insertCell(7);

      cellGrupo.textContent = acao.grupo;
      cellNome.textContent = acao.nome;
      cellFazer.textContent = acao.Fazer;
      cellMaterial.textContent = acao.material;
      cellPeriodicidade.textContent = acao.periodicidade;
      cellTempo.textContent = acao.tempo;

      const statusSelect = document.createElement("select");
      ["", "Realizado", "Reparação não urgente", "Reparação urgente"].forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        statusSelect.appendChild(opt);
      });
      cellStatus.appendChild(statusSelect);

      const nextCheckInput = document.createElement("input");
      nextCheckInput.type = "date";
      cellNextCheck.appendChild(nextCheckInput);
    });
  });

  document.getElementById("checklist-form").style.display = "block";
}


// Envio do formulário para a base de dados
document.getElementById("checklist-form").addEventListener("submit", function(event) {
  event.preventDefault(); // Impedir o envio padrão do formulário

  
const categoria = document.getElementById("categoria").value;
const maquinaId = document.getElementById("select-machine").value;
const maquina = checklistsModelos[categoria]?.[maquinaId];

if (!maquina) {
  alert("Checklist não encontrada para esta máquina.");
  return;
}

const relatorio = document.getElementById("relatorio").value;
const assinatura = document.getElementById("assinatura").value;
const maquinaNome = document.getElementById("maquina-nome");
maquinaNome.textContent = maquina.Nome || `Máquina ${maquinaId}`;

const checklistData = {
  maquina: maquinaId,
  nome: maquina.Nome,
  data_registro: moment().format('YYYY-MM-DD HH:mm:ss'),
  acoes: [],
  relatorio: relatorio,
  assinatura: assinatura
};

const tabela = document.getElementById("tabela-checklist");
const rows = tabela.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

for (let i = 0; i < rows.length; i++) {
  const statusSelect = rows[i].cells[6].getElementsByTagName("select")[0];
  const status = statusSelect.value;
  const nome = rows[i].cells[1].textContent;
  const grupo = rows[i].cells[0].textContent;

  const acaoOriginal = maquina.acoes.find(a =>
    a.nome === nome && a.grupo === grupo
  );
  const periodicidade = acaoOriginal?.periodicidade;

  const nextCheckInput = rows[i].cells[7].querySelector("input[type='date']");
  let nextCheck = nextCheckInput.value;

  if (!nextCheck) {
    nextCheck = calcularNextCheck(status, periodicidade);
  }

  checklistData.acoes.push({
    nome: nome,
    grupo: grupo,
    status: status,
    periodicidade: periodicidade || "",
    "next check": nextCheck || ""
  });
}




  // Aqui você pode enviar os dados para o servidor via fetch ou qualquer outra forma
  console.log(checklistData); // Para testar, mostra os dados no console

const formData = new FormData();

// Dados normais
formData.append("maquina", maquinaId);
formData.append("nome", maquina.Nome);
formData.append("data_registro", moment().format('YYYY-MM-DD HH:mm:ss'));
formData.append("acoes", JSON.stringify(checklistData.acoes));
formData.append("relatorio", relatorio);
formData.append("assinatura", assinatura);

// 🔥 ficheiros
const ficheiros = document.getElementById("file").files;

for (let i = 0; i < ficheiros.length; i++) {
  formData.append("anexos", ficheiros[i]);
}

// envio
fetch("/saveChecklist", {
  method: "POST",
  body: formData
})
.then(response => response.json())
.then(data => {
  alert("Checklist enviada com sucesso!");
  window.location.href = "menu.html";
})
.catch(error => {
  alert("Erro ao enviar checklist.");
  console.error(error);
});
});
