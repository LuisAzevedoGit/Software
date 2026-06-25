/* =============================================
   DASHBOARD CHECKLISTS SEMANAIS
   Depende de: sistemaChecklists (modelo.js)
   API: GET /checklist?maquinaId=X&semana=Y
============================================= */

// URL base da aplicação (sem trailing slash)
const BASE_URL = window.location.origin;

/* ── Semana atual ── */
function getNumeroSemana(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil((((dt - y) / 86400000) + 1) / 7);
}

function semanaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-W${String(getNumeroSemana(hoje)).padStart(2,'0')}`;
}

function labelSemana(val) {
  if (!val) return '';
  const [ano, w] = val.split('-W');
  return `Sem. ${w} / ${ano}`;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('semana-input');
  input.value = semanaAtual();
  input.addEventListener('change', () => carregarDashboard());
  carregarDashboard();
});

/* ── Carregar dashboard ── */
async function carregarDashboard() {
  if (typeof sistemaChecklists === 'undefined') {
    document.getElementById('main-content').innerHTML =
      '<p style="padding:40px;color:#c00">Erro: modelo.js não carregado.</p>';
    return;
  }

  const semana = document.getElementById('semana-input').value;
  document.getElementById('week-label').textContent = labelSemana(semana);
  document.getElementById('summary-bar').style.display = 'none';
  document.getElementById('main-content').innerHTML =
    '<div id="loading-overlay"><span class="spinner"></span> A verificar checklists...</div>';

  // Recolher todas as máquinas de todas as linhas
  const tarefas = []; // { linha, maquinaId }
  for (const linha of Object.keys(sistemaChecklists)) {
    for (const maqId of Object.keys(sistemaChecklists[linha])) {
      tarefas.push({ linha, maquinaId: maqId });
    }
  }

  // Consultar API em paralelo (com limite de concorrência para não sobrecarregar)
  const CHUNK = 10;
  const resultados = {}; // "linha:maqId" → true/false/null

  for (let i = 0; i < tarefas.length; i += CHUNK) {
    const bloco = tarefas.slice(i, i + CHUNK);
    await Promise.all(bloco.map(async ({ linha, maquinaId }) => {
      const chave = `${linha}:${maquinaId}`;
      try {
        const res = await fetch(
          `${BASE_URL}/checklist?maquinaId=${maquinaId}&semana=${encodeURIComponent(semana)}`
        );
        if (!res.ok) { resultados[chave] = false; return; }
        const data = await res.json();
        // Considera feito se existe id E tem pelo menos 1 resultado
        let temDados = false;
        if (data && data.id) {
          let arr = data.resultados;
          if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { arr = []; } }
          temDados = Array.isArray(arr) && arr.length > 0;
        }
        resultados[chave] = temDados ? 'done' : (data && data.id ? 'empty' : false);
      } catch {
        resultados[chave] = null; // erro de rede
      }
    }));
  }

  renderDashboard(semana, resultados);
}

/* ── Render ── */
function renderDashboard(semana, resultados) {
  const main = document.getElementById('main-content');
  main.innerHTML = '';

  let totalDone = 0, totalMissing = 0;

  for (const linha of Object.keys(sistemaChecklists)) {
    const maquinas = Object.keys(sistemaChecklists[linha]);
    const linhaResults = maquinas.map(m => resultados[`${linha}:${m}`]);
    const done    = linhaResults.filter(r => r === 'done').length;
    const missing = maquinas.length - done;
    totalDone    += done;
    totalMissing += missing;

    const section = document.createElement('div');
    section.className = 'linha-section';
    section.dataset.linha = linha;

    // Header com resumo da linha
    const pct = Math.round((done / maquinas.length) * 100);
    section.innerHTML = `
      <div class="linha-header" onclick="toggleLinha(this.parentElement)">
        <span class="linha-name">${linha}</span>
        <div class="linha-pills">
          <span class="pill done">✔ ${done}</span>
          <span class="pill missing">✗ ${missing}</span>
        </div>
        <div style="width:60px;margin-left:8px">
          <div class="progress-wrap"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:10px;color:#aaa;text-align:right;margin-top:2px">${pct}%</div>
        </div>
        <span class="collapse-arrow">▼</span>
      </div>
      <div class="machine-grid"></div>
    `;

    const grid = section.querySelector('.machine-grid');

    for (const maqId of maquinas) {
      const estado = resultados[`${linha}:${maqId}`];
      const isDone = estado === 'done';
      const isErr  = estado === null;

      const card = document.createElement('div');
      card.className = `machine-card ${isDone ? 'done' : isErr ? 'loading' : 'missing'}`;

      const urlVer  = `checklist.html?linha=${encodeURIComponent(linha)}&maquina=${maqId}&semana=${encodeURIComponent(semana)}`;

      card.innerHTML = `
        <span class="status-icon">${isDone ? '✅' : isErr ? '⚠️' : '❌'}</span>
        <div class="machine-num">#${maqId}</div>
        <div class="machine-status">${isDone ? 'Realizado' : isErr ? 'Sem resposta' : 'Em falta'}</div>
        <div class="machine-actions">
          <a class="btn-card ${isDone ? 'btn-ver' : 'btn-criar'}" href="${urlVer}" target="_blank">
            ${isDone ? 'Ver' : 'Preencher'}
          </a>
        </div>
      `;
      grid.appendChild(card);
    }

    main.appendChild(section);
  }

  // Summary bar
  const total = totalDone + totalMissing;
  const pctGeral = total ? Math.round((totalDone / total) * 100) : 0;
  document.getElementById('cnt-done').textContent    = totalDone;
  document.getElementById('cnt-missing').textContent = totalMissing;
  document.getElementById('pct-done').textContent    = `${pctGeral}%`;
  document.getElementById('progress-fill').style.width = `${pctGeral}%`;
  document.getElementById('summary-bar').style.check = 'flex';
}

/* ── Collapse/expand linha ── */
function toggleLinha(section) {
  section.classList.toggle('collapsed');
}