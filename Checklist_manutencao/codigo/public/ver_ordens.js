let ordens = [];
let paginaAtual = 1;
const itensPorPagina = 5;

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

// ------------------ PESQUISAR ------------------
function pesquisar() {

  const filtro = document.getElementById("filtroConcluido").value;
  const maquina = document.getElementById("filtroMaquina").value.trim();

  let url = "/ver_ordens?";
  const params = [];

  // filtro concluído
  if (filtro === "true" || filtro === "false") {
    params.push(`concluido=${filtro}`);
  }

  // filtro máquina
  if (maquina) {
    params.push(`maquina=${encodeURIComponent(maquina)}`);
  }

  url += params.join("&");

  fetch(url)
    .then(res => res.json())
    .then(data => {
      ordens = data;
      paginaAtual = 1;
      renderizar();
    })
    .catch(err => {
      console.error(err);
      document.getElementById("ordens").innerHTML =
        "<p>Erro ao carregar ordens.</p>";
    });
}

// ------------------ RENDER ------------------
function renderizar() {
  const div = document.getElementById("ordens");
  div.innerHTML = "";

  if (ordens.length === 0) {
    div.innerHTML = "<p>Nenhuma ordem encontrada.</p>";
    return;
  }

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;

  const ordensPagina = ordens.slice(inicio, fim);

  ordensPagina.forEach(o => {
    const card = document.createElement("div");
    card.className = "ordem-card";

    card.innerHTML = `
      <img src="imagens/mechanic.png" class="ordem-img" />
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

  renderizarPaginacao();
}

// ------------------ PAGINAÇÃO ------------------
function renderizarPaginacao() {
  let pagDiv = document.getElementById("paginacao");

  if (!pagDiv) {
    pagDiv = document.createElement("div");
    pagDiv.id = "paginacao";
    document.body.appendChild(pagDiv);
  }

  const totalPaginas = Math.ceil(ordens.length / itensPorPagina);

  pagDiv.innerHTML = `
    <button class="btn-padrao" onclick="paginaAnterior()" ${paginaAtual === 1 ? "disabled" : ""}>⬅️ Anterior</button>
    
    <span style="margin:0 10px;">
      Página ${paginaAtual} de ${totalPaginas}
    </span>
    
    <button class="btn-padrao" onclick="proximaPagina()" ${paginaAtual === totalPaginas ? "disabled" : ""}>Seguinte ➡️</button>
  `;
}

// ------------------ CONTROLO ------------------
function paginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    renderizar();
  }
}

function proximaPagina() {
  const totalPaginas = Math.ceil(ordens.length / itensPorPagina);

  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    renderizar();
  }
}

// ------------------ INIT ------------------
document.addEventListener("DOMContentLoaded", pesquisar);