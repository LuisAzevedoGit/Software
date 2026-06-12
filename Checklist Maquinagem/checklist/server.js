const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "tesco2025!",
  database: "maquinagem",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // CORREÇÃO: forçar timezone do MySQL para não converter datas
  timezone: "+00:00"
});

// -----------------------
// ROTAS
// -----------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "menu.html"));
});

app.get("/menu", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "menu.html"));
});

// -----------------------
// HELPER: formatar data sem conversão de timezone
// Garante que "2026-06-19" é guardado como "2026-06-19" e não "2026-06-18"
// -----------------------
function formatarData(dataString) {
  if (!dataString) return null;
  // Se já vier no formato YYYY-MM-DD, usar diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
    return dataString;
  }
  // Se vier com hora (ex: ISO string), extrair apenas a data
  return dataString.substring(0, 10);
}

// -----------------------
// Verificar checklist existente (por semana ou data)
// -----------------------
app.get("/checklist", (req, res) => {
  const { maquinaId, semana, data } = req.query;

  if (data) {
    const dataFormatada = formatarData(data);
    const sql = `
      SELECT * FROM checklist
      WHERE maquinaID = ? AND DATE(data) = ?
      LIMIT 1
    `;
    db.query(sql, [maquinaId, dataFormatada], (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao consultar checklist" });
      }

      if (rows.length > 0) {
        const resultado = rows[0];
        if (typeof resultado.resultados === "string") {
          resultado.resultados = JSON.parse(resultado.resultados || "[]");
        }
        if (typeof resultado.validacao_resultados === "string") {
          resultado.validacao_resultados = JSON.parse(resultado.validacao_resultados || "[]");
        }
        // Normalizar a data para YYYY-MM-DD antes de enviar
        if (resultado.data) {
          resultado.data = formatarData(resultado.data.toString());
        }
        res.json(resultado);
      } else {
        res.json(null);
      }
    });

  } else if (semana) {
    const sql = `
      SELECT * FROM checklist
      WHERE maquinaID = ? AND semana = ?
      LIMIT 1
    `;
    db.query(sql, [maquinaId, semana], (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao consultar checklist" });
      }

      if (rows.length > 0) {
        const resultado = rows[0];
        if (typeof resultado.resultados === "string") {
          resultado.resultados = JSON.parse(resultado.resultados || "[]");
        }
        if (typeof resultado.validacao_resultados === "string") {
          resultado.validacao_resultados = JSON.parse(resultado.validacao_resultados || "[]");
        }
        res.json(resultado);
      } else {
        res.json(null);
      }
    });

  } else {
    res.status(400).json({ erro: "Forneça 'data' ou 'semana'" });
  }
});

// -----------------------
// Criar checklist vazio
// -----------------------
app.post("/checklist", (req, res) => {
  const { linha, maquinaId, semana, data, resultados, validacao_resultados } = req.body;

  // CORREÇÃO: usar a data como string direta, sem conversão
  const dataFormatada = formatarData(data);

  const sql = `
    INSERT INTO checklist (linha, maquinaID, semana, data, resultados, validacao_resultados)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      linha,
      maquinaId,
      semana || null,
      dataFormatada || null,
      JSON.stringify(resultados || []),
      JSON.stringify(validacao_resultados || [])
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao criar checklist" });
      }

      db.query("SELECT * FROM checklist WHERE id = ?", [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ erro: "Erro ao buscar checklist criado" });

        const resultado = rows[0];
        if (typeof resultado.resultados === "string") {
          resultado.resultados = JSON.parse(resultado.resultados || "[]");
        }
        if (typeof resultado.validacao_resultados === "string") {
          resultado.validacao_resultados = JSON.parse(resultado.validacao_resultados || "[]");
        }
        // Normalizar data
        if (resultado.data) {
          resultado.data = formatarData(resultado.data.toString());
        }
        res.json(resultado);
      });
    }
  );
});

// -----------------------
// Atualizar checklist
// -----------------------
app.put("/checklist/:maquinaId", (req, res) => {
  const maquinaId = req.params.maquinaId;
  const { semana, data, resultados } = req.body;

  console.log("📥 PUT /checklist");
  console.log("➡️ maquinaId:", maquinaId);
  console.log("➡️ data:", data);
  console.log("➡️ resultados recebidos:", JSON.stringify(resultados, null, 2));

  if (!Array.isArray(resultados)) {
    return res.status(400).json({ erro: "Resultados deve ser um array" });
  }

  let sqlSelect, params;
  if (data) {
    const dataFormatada = formatarData(data);
    sqlSelect = `SELECT * FROM checklist WHERE maquinaID = ? AND DATE(data) = ? LIMIT 1`;
    params = [maquinaId, dataFormatada];
  } else if (semana) {
    sqlSelect = `SELECT * FROM checklist WHERE maquinaID = ? AND semana = ? LIMIT 1`;
    params = [maquinaId, semana];
  } else {
    return res.status(400).json({ erro: "Forneça 'data' ou 'semana'" });
  }

  db.query(sqlSelect, params, (err, rows) => {
    if (err) {
      console.error("❌ ERRO SELECT:", err);
      return res.status(500).json({ erro: "Erro ao consultar checklist" });
    }

    if (rows.length === 0) {
      console.error("❌ Checklist não encontrado");
      return res.status(404).json({ erro: "Checklist não encontrado" });
    }

    const checklistAtual = rows[0];

    let resultadosAtuais = [];
    if (Array.isArray(checklistAtual.resultados)) {
      resultadosAtuais = checklistAtual.resultados;
    } else if (typeof checklistAtual.resultados === "string") {
      try {
        resultadosAtuais = JSON.parse(checklistAtual.resultados || "[]");
      } catch (e) {
        resultadosAtuais = [];
      }
    }

    // Atualizar ou adicionar resultados
    const mapa = {};

    resultadosAtuais.forEach(r => {
      mapa[r.key] = r;
    });

    resultados.forEach(r => {
      mapa[r.key] = r;
    });

    resultadosAtuais = Object.values(mapa);

    const sqlUpdate = `UPDATE checklist SET resultados = ? WHERE id = ?`;

    db.query(sqlUpdate, [JSON.stringify(resultadosAtuais), checklistAtual.id], (err2) => {
      if (err2) {
        console.error("❌ ERRO UPDATE:", err2);
        return res.status(500).json({ erro: "Erro ao atualizar checklist" });
      }

      console.log("✅ Checklist atualizada com sucesso");
      res.json({ sucesso: true, id: checklistAtual.id });
    });
  });
});

// -----------------------
// Obter execuções do mês
// -----------------------
app.get("/execucoes-mes", (req, res) => {
  const { maquinaId, mes, ano } = req.query;

  if (!maquinaId || !mes || !ano) {
    return res.status(400).json({ erro: "Forneça maquinaId, mes e ano" });
  }

  const sql = `
    SELECT DATE(data) as data
    FROM checklist
    WHERE maquinaID = ?
      AND MONTH(data) = ?
      AND YEAR(data) = ?
      AND resultados IS NOT NULL AND resultados != '[]'
  `;

  db.query(sql, [maquinaId, mes, ano], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao consultar execuções" });
    }
    res.json(rows);
  });
});

// -----------------------
// Obter execuções da semana
// -----------------------
app.get("/execucoes-semana", (req, res) => {
  const { maquinaId, semana } = req.query;

  if (!maquinaId || !semana) {
    return res.status(400).json({ erro: "Forneça maquinaId e semana" });
  }

  const sql = `
    SELECT DATE(data) as data, COUNT(*) as qtd
    FROM checklist
    WHERE maquinaID = ? AND WEEK(data) = WEEK(STR_TO_DATE(?, '%Y-W%u'))
    GROUP BY DATE(data)
  `;

  db.query(sql, [maquinaId, semana], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao consultar execuções" });
    }
    res.json(rows);
  });
});

// -----------------------
// Listar checklists com filtros
// -----------------------
app.get("/checklists", (req, res) => {
  const { semana, data, linha, maquinaId, mes, ano } = req.query;

  let sql = `
    SELECT id, linha, maquinaID, semana, DATE(data) as data, resultados, created_at, updated_at
    FROM checklist
    WHERE 1=1
  `;

  const params = [];

  if (semana) { sql += " AND semana = ?"; params.push(semana); }
  if (data) { sql += " AND DATE(data) = ?"; params.push(formatarData(data)); }
  if (linha) { sql += " AND linha = ?"; params.push(linha); }
  if (maquinaId) { sql += " AND maquinaID = ?"; params.push(maquinaId); }
  if (mes && ano) { sql += " AND MONTH(data) = ? AND YEAR(data) = ?"; params.push(mes, ano); }

  sql += " ORDER BY data DESC LIMIT 100";

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao consultar checklists" });
    }

    rows.forEach(r => {
      if (typeof r.resultados === "string") {
        try { r.resultados = JSON.parse(r.resultados || "[]"); } catch { r.resultados = []; }
      }
    });

    res.json(rows);
  });
});

// -----------------------
// Obter linhas de produção
// -----------------------
app.get("/linhas", (req, res) => {
  const sql = "SELECT id, codigo, nome, descricao FROM linhas ORDER BY codigo";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao consultar linhas" });
    }
    res.json(rows);
  });
});

// -----------------------
// Obter máquinas de uma linha
// -----------------------
app.get("/maquinas/:linha", (req, res) => {
  const linha = req.params.linha.toUpperCase();

  const sql = `
    SELECT m.id, m.numero, m.nome
    FROM maquinas m
    JOIN linhas l ON m.linha_id = l.id
    WHERE l.codigo = ?
    ORDER BY m.numero
  `;

  db.query(sql, [linha], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao consultar máquinas" });
    }
    res.json(rows);
  });
});

// -----------------------
// Health check
// -----------------------
app.get("/health", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      return res.status(500).json({ status: "erro", mensagem: err.message });
    }
    res.json({ status: "ok", mensagem: "Servidor e base de dados OK" });
  });
});

// -----------------------
// Iniciar servidor
// -----------------------
const PORT = 3002;
const HOST = "192.168.100.28";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}/menu`);
  console.log(`📊 Base de dados: maquinagem`);
  console.log(`👤 Utilizador: root`);
});