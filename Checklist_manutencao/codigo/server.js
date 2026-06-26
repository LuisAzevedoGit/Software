const express = require("express");
const app = express(); // 🔥 PRIMEIRO criar app

const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const moment = require("moment");
const multer = require("multer");

// 🔥 DEPOIS configurar
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
  cb(null, file.originalname);
}
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

const jwt = require("jsonwebtoken");
const JWT_SECRET = "Tesco Componentes para Automoveis ";

app.use(cors());
//app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));


const { autenticarToken } = require("./token");

// Conectar ao MySQL
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "tesco2025!",
    database: "manutencao",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Página inicial - login
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


// Login (simples - validação direta)
 app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password_hash = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error("❌ Erro ao consultar usuários:", err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro no servidor." });
        }

        if (results.length > 0) {
            const user = results[0];

            // Criar token com ID e permissão
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    nivel_admin: user.nivel_admin
                },
                JWT_SECRET,
                { expiresIn: "2h" } // expira em 2 horas
            );

            res.json({
                sucesso: true,
                token: token
            });
        } else {
            res.status(401).json({ sucesso: false, mensagem: "Credenciais inválidas." });
        }
    });
});


// Rota principal - menu
app.get("/menu", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "menu.html"));
});

app.use(express.static(path.join(__dirname, "public")));


// ➡️ Salvar checklist no banco
app.post("/saveChecklist", upload.array("anexos"), (req, res) => {

  const { maquina, nome, data_registro, acoes, relatorio, assinatura } = req.body;

  // ficheiros recebidos
  const ficheiros = req.files;

  // guardar só nomes dos ficheiros
 const nomesFicheiros = req.files.map(f => f.filename);

  const sql = `
    INSERT INTO registros (maquina, nome, data_registro, acoes, relatorio, assinatura, anexos)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    maquina,
    nome,
    data_registro,
    acoes,
    relatorio,
    assinatura || null,
    JSON.stringify(nomesFicheiros)
  ];

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error("❌ Erro ao salvar dados:", err);
      return res.status(500).json({ erro: "Erro ao salvar dados" });
    }

    res.json({ mensagem: "Dados salvos com sucesso!", id: result.insertId });
  });
});

// ➡️ Buscar todos os registros
// ➡️ Buscar registros (com filtro opcional por máquina)
app.get("/ver-registos", (req, res) => {

    const { maquina, id, linha } = req.query;

    let sql = "SELECT * FROM registros WHERE 1=1";
    const params = [];

    // filtro máquina exata
    if (maquina) {
        sql += " AND maquina = ?";
        params.push(maquina);
    }

    // filtro id
    if (id) {
        sql += " AND id = ?";
        params.push(id);
    }

    // 🔥 filtro linha por texto
    if (linha) {
        sql += " AND nome LIKE ?";
        params.push(`%${linha}%`);
    }

    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, results) => {

        if (err) {
            console.error("❌ Erro ao buscar registos:", err);
            return res.status(500).json({
                erro: "Erro ao buscar registos"
            });
        }

        res.json(results);
    });
});

// ➡️ Pesquisar por ID ou Data
app.get("/pesquisar", (req, res) => {
    const { id, data } = req.query;
    let sql = "SELECT id, nome, maquina, data_registro, acoes, relatorio, assinatura, anexos FROM registros WHERE 1=1";
    const valores = [];

    if (id) {
        sql += " AND id = ?";
        valores.push(id);
    }
    if (data) {
        sql += " AND DATE(data_registro) = ?";
        valores.push(data);
    }

    db.query(sql, valores, (err, results) => {
        if (err) {
            console.error("❌ Erro ao pesquisar:", err);
            return res.status(500).json({ erro: "Erro na pesquisa" });
        }

        const registros = results.map(row => {
            let checklist;
        
            try {
                // Se for string JSON válida, faz parse
                checklist = typeof row.acoes === "string" ? JSON.parse(row.acoes) : row.acoes;
            } catch (e) {
                console.error("❌ Erro ao fazer parse de 'acoes':", row.acoes);
                checklist = null; // ou [], se preferires
            }

            return {
                ...row,
                checklist
            };
        });

        res.json(registros);
    });
});
// ➡️ Atualizar assinatura separadamente
app.post("/atualizar-assinatura", (req, res) => {
    const { id, assinatura } = req.body;

    if (!id || !assinatura) {
        return res.status(400).json({ erro: "ID e assinatura são obrigatórios." });
    }

    const sql = "UPDATE registros SET assinatura = ? WHERE id = ?";
    db.query(sql, [assinatura, id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao atualizar assinatura:", err);
            return res.status(500).json({ erro: "Erro ao atualizar assinatura." });
        }

        //console.log(`🖊️ Assinatura atualizada para o ID ${id}`);
        res.json({ mensagem: "Assinatura atualizada com sucesso!" });
    });
});

app.put("/atualizar-checklist/:id", upload.array("anexos"), (req, res) => {
  const id = req.params.id;

  const { acoes, relatorio } = req.body;

  // 📥 novos ficheiros enviados
  const novosFicheiros = req.files ? req.files.map(f => f.filename) : [];

  // ❌ ficheiros a remover
  let remover = [];
  try {
    remover = JSON.parse(req.body.remover || "[]");
  } catch (e) {
    console.warn("Erro ao fazer parse de 'remover':", req.body.remover);
  }

  // 🔎 1. buscar anexos atuais da BD
  const sqlSelect = "SELECT anexos FROM registros WHERE id = ?";

  db.query(sqlSelect, [id], (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar anexos atuais:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados" });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Checklist não encontrada" });
    }

let anexosAtuais = [];

const raw = results[0].anexos;

if (!raw || raw === "null") {
  anexosAtuais = [];
} else if (typeof raw === "string") {
  try {
    anexosAtuais = JSON.parse(raw);
    if (!Array.isArray(anexosAtuais)) anexosAtuais = [];
  } catch (e) {
    console.warn("Erro ao fazer parse:", raw);
    anexosAtuais = [];
  }
} else if (Array.isArray(raw)) {
  anexosAtuais = raw;
} else {
  anexosAtuais = [];
}

    // 🧹 2. remover os que o user apagou
    anexosAtuais = anexosAtuais.filter(nome => !remover.includes(nome));

    // ➕ 3. adicionar novos
    const anexosFinais = [...anexosAtuais, ...novosFicheiros];

    // 💾 4. atualizar na BD
    const sqlUpdate = `
      UPDATE registros 
      SET acoes = ?, relatorio = ?, anexos = ?
      WHERE id = ?
    `;

    db.query(
      sqlUpdate,
      [
        acoes, // já vem em JSON string do frontend
        relatorio,
        JSON.stringify(anexosFinais),
        id
      ],
      (err2) => {
        if (err2) {
          console.error("❌ Erro ao atualizar checklist:", err2);
          return res.status(500).json({ erro: "Erro ao atualizar checklist" });
        }

        res.json({
          sucesso: true,
          anexos: anexosFinais
        });
      }
    );
  });
});


app.post('/ordem', (req, res) => {
  
  const { checklist_id, nome_maquina, descricao, reparacoes_json } = req.body;



  //console.log("🛠️ Body recebido:", req.body);
  if (!checklist_id || !nome_maquina || !descricao || !reparacoes_json) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  }

  const sql = `
    INSERT INTO ordens (checklist_id, nome_maquina, descricao, reparacoes_json)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [checklist_id, nome_maquina, descricao, JSON.stringify(reparacoes_json)],
    (err, result) => {
      if (err) {
        console.error("Erro ao inserir ordem:", err);
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      return res.status(200).json({ id: result.insertId });
    }
  );
});


app.get("/ver_ordens_por_checklist/:checklistId", (req, res) => {
  const checklistId = req.params.checklistId;
 
  const sql = `
    SELECT id, checklist_id, nome_maquina, descricao, criado_em, concluido
    FROM ordens
    WHERE checklist_id = ?
    ORDER BY criado_em DESC
    LIMIT 1
  `;
 
  db.query(sql, [checklistId], (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar ordem por checklist:", err);
      return res.status(500).json({ erro: "Erro no servidor." });
    }
 
    res.json(results); // array vazio [] se não existir, ou [{ id, ... }] se existir
  });
});

app.get("/ver_ordens",  (req, res) => {
   
const filtroConcluido = req.query.concluido;
const maquina = req.query.maquina;

let sql = `
  SELECT 
    id, checklist_id, nome_maquina, descricao,
    reparacoes_json, criado_em, concluido
  FROM ordens
  WHERE 1=1
`;

const valores = [];

// filtro concluído
if (filtroConcluido === "true") {
  sql += " AND concluido = 1";
} else if (filtroConcluido === "false") {
  sql += " AND (concluido = 0 OR concluido IS NULL)";
}

// filtro máquina
if (maquina) {
  sql += " AND nome_maquina LIKE ?";
  valores.push(`%${maquina}%`);
}

sql += " ORDER BY criado_em DESC";

  db.query(sql, valores, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar ordens:", err);
      return res.status(500).json({ erro: "Erro ao buscar ordens" });
    }

    const ordensFormatadas = results.map(ordem => {
      let reparacoes = [];

      if (typeof ordem.reparacoes_json === "string") {
        try {
          reparacoes = JSON.parse(ordem.reparacoes_json);
        } catch (e) {
          console.error(`Erro ao parsear JSON da ordem ${ordem.id}`, e);
        }
      } else if (typeof ordem.reparacoes_json === "object" && ordem.reparacoes_json !== null) {
        reparacoes = ordem.reparacoes_json;
      }

      return {
        id: ordem.id,
        checklist_id: ordem.checklist_id,
        nome_maquina: ordem.nome_maquina,
        descricao: ordem.descricao,
        reparacoes: reparacoes,
        criado_em: ordem.criado_em,
        concluido: ordem.concluido
      };
    });

    res.json(ordensFormatadas);
  });
});

app.delete("/eliminar-checklist/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM registros WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao eliminar:", err);
      return res.status(500).json({ erro: "Erro ao eliminar checklist" });
    }

    res.json({ mensagem: "Checklist eliminada com sucesso" });
  });
});


app.get("/ver_ordens/:id", (req, res) => {
  const ordemId = req.params.id;

  const sql = `
    SELECT 
      id,checklist_id,nome_maquina, descricao, reparacoes_json,criado_em, concluido FROM ordens WHERE id = ?
  `;

  db.query(sql, [ordemId], (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar ordem:", err);
      return res.status(500).json({ erro: "Erro no servidor." });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Ordem não encontrada." });
    }

    let reparacoes = [];

    const raw = results[0].reparacoes_json;

    if (typeof raw === "string") {
      try {
        reparacoes = JSON.parse(raw);
      } catch (e) {
        console.warn("Erro ao parsear JSON das reparações (string)", e);
      }
    } else if (typeof raw === "object" && raw !== null) {
      reparacoes = raw; // já é um objeto
    } else {
      reparacoes = [];
    }

    const ordem = {
      id: results[0].id,
      checklist_id: results[0].checklist_id,
      nome_maquina: results[0].nome_maquina,
      descricao: results[0].descricao,
      criado_em: results[0].criado_em,
      reparacoes: reparacoes,
      concluido: results[0].concluido
    };

    res.json(ordem);
  });
});


app.put("/concluir_tarefa", (req, res) => {
  console.log("BODY RECEBIDO:", req.body); // 👈 ADICIONA ISTO
  const { ordemId, reparacaoId } = req.body;

 if (ordemId == null || reparacaoId == null){
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  // Passo 1: Buscar a ordem
  const selectSql = "SELECT reparacoes_json FROM ordens WHERE id = ?";

  db.query(selectSql, [ordemId], (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar ordem:", err);
      return res.status(500).json({ erro: "Erro no servidor." });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Ordem não encontrada." });
    }

    let reparacoes = results[0].reparacoes_json;

if (typeof reparacoes === "string") {
  try {
    reparacoes = JSON.parse(reparacoes);
  } catch (e) {
    console.error("❌ Erro ao parsear JSON:", e);
    return res.status(500).json({ erro: "JSON inválido." });
  }
} else if (!Array.isArray(reparacoes)) {
  console.error("❌ Formato inesperado de reparações.");
  return res.status(500).json({ erro: "Formato inesperado de dados." });
}


    // Passo 2: Atualizar o estado da reparação
    const reparacao = reparacoes.find(r => String(r.id) === String(reparacaoId));

    if (!reparacao) {
      return res.status(404).json({ erro: "Reparação não encontrada." });
    }

    reparacao.estado = "✅";

    // Passo 3: Atualizar na base de dados
    const novoJson = JSON.stringify(reparacoes);
    const updateSql = "UPDATE ordens SET reparacoes_json = ? WHERE id = ?";

    db.query(updateSql, [novoJson, ordemId], (updateErr) => {
      if (updateErr) {
        console.error("❌ Erro ao atualizar ordem:", updateErr);
        return res.status(500).json({ erro: "Erro ao atualizar estado." });
      }

      res.status(200).json({ mensagem: "Reparação atualizada com sucesso." });
    });
  });
});

app.put("/atualizar_concluido/:id", (req, res) => {
  const ordemId = req.params.id;
  const { concluido } = req.body;

  const sql = "UPDATE ordens SET concluido = ? WHERE id = ?";
  db.query(sql, [concluido ? 1 : 0, ordemId], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar concluído:", err);
      return res.status(500).json({ erro: "Erro ao atualizar concluído" });
    }
    res.json({ sucesso: true });
  });
});

app.post("/executar-sql", autenticarToken, (req, res) => {
  if (req.user.nivel_admin !== 3) {
        return res.status(403).json({ erro: "Acesso negado. Admin apenas." });
    }
  const { comando } = req.body;

  // Validações simples (importante!)
  if (!comando || typeof comando !== "string") {
    return res.status(400).json({ erro: "Comando inválido." });
  }

  db.query(comando, (err, results) => {
    if (err) {
      console.error("Erro ao executar SQL:", err);
      return res.status(500).json({ erro: err.message });
    }

    res.json({ resultado: results });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Erro multer:", err);
    return res.status(400).json({ erro: err.message });
  } else if (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ erro: err.message });
  }
  next();
});


app.put("/editar_reparacao", upload.any(), (req, res) => {

  const ordemId = req.body.ordemId;

  let reparacoes = JSON.parse(req.body.reparacoes);
  let remover = JSON.parse(req.body.remover || "{}");

  const ficheirosPorIndex = {};

  // agrupar ficheiros por reparação
  req.files.forEach(file => {
    const match = file.fieldname.match(/anexos_(\d+)/);

    if (match) {
      const i = match[1];

      if (!ficheirosPorIndex[i]) ficheirosPorIndex[i] = [];
      ficheirosPorIndex[i].push(file.filename);
    }
  });

  // atualizar anexos dentro do JSON
  reparacoes.forEach((r, i) => {

    let anexos = r.anexos || [];

    if (remover[i]) {
      anexos = anexos.filter(a => !remover[i].includes(a));
    }

    if (ficheirosPorIndex[i]) {
      anexos = [...anexos, ...ficheirosPorIndex[i]];
    }

    r.anexos = anexos;
  });

  // guardar como JSON (perfeito 👇)
  db.query(
    "UPDATE ordens SET reparacoes_json = ? WHERE id = ?",
    [JSON.stringify(reparacoes), ordemId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao guardar" });
      }

      res.json({ sucesso: true });
    }
  );
});



app.get("/agenda_reparacoes", (req, res) => {

  const sql = `
    SELECT
      id,
      nome_maquina,
      reparacoes_json
    FROM ordens
  `;

  db.query(sql, (err, results) => {

    if (err) {

      console.error(err);

      return res.status(500).json({
        erro: "Erro ao carregar agenda"
      });
    }

   const dias =
  parseInt(req.query.dias) || 31;

const hoje = new Date();

const dataLimite = new Date();

dataLimite.setDate(
  hoje.getDate() + dias
);

    let agenda = [];

    results.forEach(ordem => {

      let reparacoes = [];

      try {

        reparacoes =
          typeof ordem.reparacoes_json === "string"
            ? JSON.parse(ordem.reparacoes_json)
            : ordem.reparacoes_json;

      } catch {

        reparacoes = [];
      }

      reparacoes.forEach(r => {

        if (!r.data) return;

        const dataReparacao = new Date(r.data);

        const atrasado =
          dataReparacao < hoje &&
          r.estado !== "✅";

        const dentroPeriodo =
  dataReparacao >= hoje &&
  dataReparacao <= dataLimite;

        // mostrar:
        // atrasadas OU próximas 7 dias
       if (atrasado || dentroPeriodo) {

          agenda.push({

            ordemId: ordem.id,

            reparacaoId: r.id,

            maquina: ordem.nome_maquina,

            grupo: r.grupo,

            descricao: r.descricao,

            data: r.data,

            responsaveis: r.responsaveis,

            estado: r.estado || "pendente",

            atrasado
          });
        }
      });
    });

    // ordenar por data
    agenda.sort((a, b) =>
      new Date(a.data) - new Date(b.data)
    );

    res.json(agenda);
  });
});

app.delete("/eliminar-ordem/:id", (req, res) => {

  const id = req.params.id;

  const sql = "DELETE FROM ordens WHERE id = ?";

  db.query(sql, [id], (err, result) => {

    if (err) {

      console.error("Erro ao eliminar ordem:", err);

      return res.status(500).json({
        erro: "Erro ao eliminar ordem"
      });
    }

    res.json({
      mensagem: "Ordem eliminada com sucesso"
    });
  });
});


app.get("/dashboard/resumo", (req, res) => {

  const queries = {

    ordensAbertas: `
      SELECT COUNT(*) AS total
      FROM ordens
      WHERE concluido = 0 OR concluido IS NULL
    `,

    checklistsMes: `
      SELECT COUNT(*) AS total
      FROM registros
      WHERE MONTH(data_registro) = MONTH(CURRENT_DATE())
      AND YEAR(data_registro) = YEAR(CURRENT_DATE())
    `
  };

  Promise.all([

    new Promise((resolve, reject) => {
      db.query(queries.ordensAbertas, (err, r) => {
        if (err) reject(err);
        else resolve(r[0].total);
      });
    }),

    new Promise((resolve, reject) => {
      db.query(queries.checklistsMes, (err, r) => {
        if (err) reject(err);
        else resolve(r[0].total);
      });
    })

  ])
  .then(([ordensAbertas, checklistsMes]) => {

    res.json({
      ordensAbertas,
      checklistsMes
    });

  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ erro:"Erro dashboard" });
  });

});



app.get("/dashboard/reparacoes-atrasadas", (req, res) => {

  db.query(`
    SELECT id, nome_maquina, reparacoes_json
    FROM ordens
  `, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro" });
    }

    const atrasadas = [];

    // 🔥 hoje sem horas
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    results.forEach(ordem => {

      let reparacoes = [];

      try {
        reparacoes =
          typeof ordem.reparacoes_json === "string"
            ? JSON.parse(ordem.reparacoes_json)
            : ordem.reparacoes_json || [];
      }
      catch {
        reparacoes = [];
      }

      reparacoes.forEach(r => {

        if (!r.data) return;

        // 🔥 ignorar concluídas
        const concluida =
          r.estado === "✅" ||
          r.status === "Concluído";

        if (concluida) return;

        const dataPrevista = new Date(r.data);
        dataPrevista.setHours(0,0,0,0);

        if (dataPrevista < hoje) {

          atrasadas.push({

            ordemId: ordem.id,

            maquina: ordem.nome_maquina,

            descricao: r.descricao || "-",


            data: r.data,

            responsavel:
              r.responsaveis || "-"
          });
        }

      });

    });

    res.json({
      total: atrasadas.length,
      lista: atrasadas
    });

  });

});

app.get("/dashboard/maquinas-pendentes", (req, res) => {

  db.query(`
    SELECT nome_maquina, reparacoes_json
    FROM ordens
  `, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        erro: "Erro dashboard"
      });
    }

    const maquinas = {};

    results.forEach(ordem => {

      let reparacoes = [];

      try {

        reparacoes =
          typeof ordem.reparacoes_json === "string"
            ? JSON.parse(ordem.reparacoes_json)
            : ordem.reparacoes_json || [];

      } catch {
        reparacoes = [];
      }

      reparacoes.forEach(r => {

        // ignorar concluídas
        const concluida =
          r.estado === "✅" ||
          r.status === "Concluído";

        if (concluida) return;

        const maquina =
          ordem.nome_maquina || "Sem máquina";

        maquinas[maquina] =
          (maquinas[maquina] || 0) + 1;

      });

    });

    // converter para array
    const top5 = Object.entries(maquinas)

      .map(([maquina, total]) => ({
        maquina,
        total
      }))

      .sort((a, b) => b.total - a.total)

      .slice(0, 5);

    res.json(top5);

  });

});

app.get("/dashboard/reparacoes-urgentes", (req, res) => {

  const sql = `
    SELECT nome_maquina, reparacoes_json
    FROM ordens
    WHERE concluido = 0 OR concluido IS NULL
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        erro: "Erro ao buscar reparações urgentes"
      });
    }

    let urgentes = [];

    results.forEach(ordem => {

      let reparacoes = [];

      try {

        reparacoes =
          typeof ordem.reparacoes_json === "string"
            ? JSON.parse(ordem.reparacoes_json)
            : ordem.reparacoes_json || [];

      } catch {
        reparacoes = [];
      }

      reparacoes.forEach(r => {

        const status =
          (r.status || "").toLowerCase();

        const estado =
          (r.estado || "").toLowerCase();

        const urgente =
          status.includes("reparação urgente");

        const concluida =
          estado === "✅" ||
          estado.includes("conclu");

        if (urgente && !concluida) {

          urgentes.push({

            maquina: ordem.nome_maquina,

            descricao: r.descricao || "-",

            responsavel:
              r.responsaveis || "-",

            data: r.data || "-"

          });
        }

      });

    });

    res.json({
      urgentes: urgentes.length,
      lista: urgentes
    });

  });

});




// ---------------- DASHBOARD - URGENTES POR MÁQUINA ----------------
app.get("/dashboard/urgentes-por-maquina", (req, res) => {

  const sql = `
    SELECT nome_maquina, reparacoes_json
    FROM ordens
    WHERE concluido = 0 OR concluido IS NULL
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }

    const contador = {};

    results.forEach(ordem => {

      let reparacoes = [];

      try {
        reparacoes =
          typeof ordem.reparacoes_json === "string"
            ? JSON.parse(ordem.reparacoes_json)
            : ordem.reparacoes_json || [];
      } catch {
        reparacoes = [];
      }

      reparacoes.forEach(r => {

        const status =
          (r.status || "").toLowerCase();

        const estado =
          (r.estado || "").toLowerCase();

        const urgente =
          status.includes("reparação urgente");

        const concluida =
          estado === "✅" ||
          estado.includes("conclu");

        if (urgente && !concluida) {

          contador[ordem.nome_maquina] =
            (contador[ordem.nome_maquina] || 0) + 1;
        }

      });

    });

    const resultado =
      Object.entries(contador)
        .map(([maquina, total]) => ({
          maquina,
          total
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    res.json(resultado);

  });

});



// ---------------- DASHBOARD - PENDENTES POR RESPONSÁVEL ----------------
app.get("/dashboard/pendentes-por-responsavel", (req, res) => {

  const sql = `
    SELECT reparacoes_json
    FROM ordens
    WHERE concluido = 0 OR concluido IS NULL
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }

    const contador = {};

    results.forEach(ordem => {

      let reparacoes = [];

      try {
        reparacoes =
          typeof ordem.reparacoes_json === "string"
            ? JSON.parse(ordem.reparacoes_json)
            : ordem.reparacoes_json || [];
      } catch {
        reparacoes = [];
      }

      reparacoes.forEach(r => {

        const estado =
          (r.estado || "").toLowerCase();

        const concluida =
          estado === "✅" ||
          estado.includes("conclu");

        if (!concluida) {

          const responsavel =
            r.responsaveis || "Sem responsável";

          contador[responsavel] =
            (contador[responsavel] || 0) + 1;
        }

      });

    });

    const resultado =
      Object.entries(contador)
        .map(([responsavel, total]) => ({
          responsavel,
          total
        }))
        .sort((a, b) => b.total - a.total);

    res.json(resultado);

  });

});


//vacudest rotas
// ============================================================
// VACUDEST – Rotas para adicionar ao teu server.js existente
// Adiciona estas rotas antes do app.listen(...)
// ============================================================

// ➡️ Guardar registo Vacudest
app.post("/vacudest/save", (req, res) => {
  const {
    responsavel,
    maquina,
    modelo,
    mes_ano,
    data_registo,
    verificacoes,   // JSON array com os 6 itens
    observacoes
  } = req.body;

  const sql = `
    INSERT INTO vacudest_registos
      (responsavel, maquina, modelo, mes_ano, data_registo, verificacoes, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    responsavel,
    maquina,
    modelo,
    mes_ano,
    data_registo,
    JSON.stringify(verificacoes),
    observacoes || null
  ], (err, result) => {
    if (err) {
      console.error("❌ Erro ao guardar registo Vacudest:", err);
      return res.status(500).json({ erro: "Erro ao guardar registo" });
    }
    res.json({ sucesso: true, id: result.insertId });
  });
});

// ➡️ Listar registos Vacudest (com filtros opcionais)
app.get("/vacudest/registos", (req, res) => {
  const { mes_ano, data_inicio, data_fim } = req.query;

  let sql = "SELECT * FROM vacudest_registos WHERE 1=1";
  const params = [];

  if (mes_ano) {
    sql += " AND mes_ano = ?";
    params.push(mes_ano);
  }
  if (data_inicio) {
    sql += " AND data_registo >= ?";
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += " AND data_registo <= ?";
    params.push(data_fim);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar registos Vacudest:", err);
      return res.status(500).json({ erro: "Erro ao buscar registos" });
    }

    const registos = results.map(r => ({
      ...r,
      verificacoes: typeof r.verificacoes === "string"
        ? JSON.parse(r.verificacoes)
        : r.verificacoes
    }));

    res.json(registos);
  });
});

// ➡️ Eliminar registo Vacudest
app.delete("/vacudest/registos/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM vacudest_registos WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("❌ Erro ao eliminar:", err);
      return res.status(500).json({ erro: "Erro ao eliminar" });
    }
    res.json({ sucesso: true });
  });
});


// ➡️ Atualizar registo Vacudest (edição)
app.put("/vacudest/registos/:id", (req, res) => {
  const id = req.params.id;
  const {
    responsavel,
    maquina,
    modelo,
    mes_ano,
    verificacoes,
    observacoes
  } = req.body;
 
  const sql = `
    UPDATE vacudest_registos
    SET responsavel = ?, maquina = ?, modelo = ?, mes_ano = ?,
        verificacoes = ?, observacoes = ?
    WHERE id = ?
  `;
 
  db.query(sql, [
    responsavel,
    maquina,
    modelo,
    mes_ano,
    JSON.stringify(verificacoes),
    observacoes || null,
    id
  ], (err, result) => {
    if (err) {
      console.error("❌ Erro ao atualizar registo Vacudest:", err);
      return res.status(500).json({ erro: "Erro ao atualizar registo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Registo não encontrado" });
    }
    res.json({ sucesso: true });
  });
});


// ============================================================
// SQL para criar a tabela (executar uma vez na tua BD)
// ============================================================
/*
CREATE TABLE IF NOT EXISTS vacudest_registos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  responsavel   VARCHAR(100),
  maquina       VARCHAR(100),
  modelo        VARCHAR(50),
  mes_ano       VARCHAR(7),          -- ex: "2026-05"
  data_registo  DATE,
  verificacoes  JSON,
  observacoes   TEXT,
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/


app.post("/sta2/save", (req, res) => {
  const {
    responsavel,
    maquina,
    mes_ano,
    verificacoes,
    observacoes
  } = req.body;

  const sql = `
    INSERT INTO sta2_registos
    (
      responsavel,
      maquina,
      mes_ano,
      verificacoes,
      observacoes
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      responsavel,
      maquina,
      mes_ano,
      JSON.stringify(verificacoes),
      observacoes
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao guardar"
        });
      }

      res.json({
        sucesso: true,
        id: result.insertId
      });
    }
  );
});


app.get("/sta2/registos", (req, res) => {

  let sql = `
    SELECT *
    FROM sta2_registos
    WHERE 1=1
  `;

  const valores = [];

  if (req.query.mes_ano) {
    sql += " AND mes_ano = ?";
    valores.push(req.query.mes_ano);
  }

  if (req.query.maquina) {
    sql += " AND maquina = ?";
    valores.push(req.query.maquina);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, valores, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }

    rows.forEach(r => {
      try {
        r.verificacoes = JSON.parse(r.verificacoes || "[]");
      } catch {
        r.verificacoes = [];
      }
    });

    res.json(rows);
  });
});


app.put("/sta2/registos/:id", (req, res) => {

  const { id } = req.params;

  const {
    responsavel,
    maquina,
    mes_ano,
    verificacoes,
    observacoes
  } = req.body;

  const sql = `
    UPDATE sta2_registos
    SET
      responsavel=?,
      maquina=?,
      mes_ano=?,
      verificacoes=?,
      observacoes=?
    WHERE id=?
  `;

  db.query(
    sql,
    [
      responsavel,
      maquina,
      mes_ano,
      JSON.stringify(verificacoes),
      observacoes,
      id
    ],
    err => {

      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao atualizar"
        });
      }

      res.json({
        sucesso: true
      });
    }
  );
});

app.put("/atualizar_comentario_ordem/:ordemId", (req, res) => {
  const { ordemId } = req.params;
  const { reparacaoId, comentario } = req.body;

  if (!ordemId || reparacaoId == null) {
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  db.query("SELECT reparacoes_json FROM ordens WHERE id = ?", [ordemId], (err, rows) => {
    if (err) {
      console.error("❌ Erro ao buscar ordem:", err);
      return res.status(500).json({ erro: "Erro no servidor." });
    }

    if (!rows.length) {
      return res.status(404).json({ erro: "Ordem não encontrada." });
    }

    // ← protege se o driver MySQL já fez o parse automaticamente
    let reparacoes = rows[0].reparacoes_json;
    if (typeof reparacoes === "string") {
      try {
        reparacoes = JSON.parse(reparacoes);
      } catch (e) {
        console.error("❌ JSON inválido:", e);
        return res.status(500).json({ erro: "JSON inválido." });
      }
    }

    if (!Array.isArray(reparacoes)) {
      return res.status(500).json({ erro: "Formato inesperado de reparações." });
    }

    // String(id) dos dois lados porque alguns ids são number, outros string
    const rep = reparacoes.find(r => String(r.id) === String(reparacaoId));
    if (!rep) {
      return res.status(404).json({ erro: `Reparação ${reparacaoId} não encontrada.` });
    }

    rep.comentario = comentario;

    db.query(
      "UPDATE ordens SET reparacoes_json = ? WHERE id = ?",
      [JSON.stringify(reparacoes), ordemId],
      (err2) => {
        if (err2) {
          console.error("❌ Erro ao atualizar:", err2);
          return res.status(500).json({ erro: err2.message });
        }
        res.json({ sucesso: true });
      }
    );
  });
});

app.delete("/sta2/registos/:id", (req, res) => {

  db.query(
    "DELETE FROM sta2_registos WHERE id = ?",
    [req.params.id],
    err => {

      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao eliminar"
        });
      }

      res.json({
        sucesso: true
      });
    }
  );
});




// Iniciar o servidor
const PORT = 3001;
const HOST = '192.168.100.28';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}/menu`);
});

