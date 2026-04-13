const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const moment = require("moment");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "." + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage });

const jwt = require("jsonwebtoken");
const JWT_SECRET = "Tesco Componentes para Automoveis ";

const app = express();
app.use(cors());
app.use(bodyParser.json());
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
    const { maquina, id } = req.query;

    let sql = "SELECT * FROM registros WHERE 1=1";
    const params = [];

    if (maquina) {
        sql += " AND maquina = ?";
        params.push(maquina);
    }

    if (id) {
        sql += " AND id = ?";
        params.push(id);
    }

    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar registos:", err);
            return res.status(500).json({ erro: "Erro ao buscar registos" });
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

    try {
      anexosAtuais = JSON.parse(results[0].anexos || "[]");
    } catch (e) {
      console.warn("Erro ao fazer parse dos anexos atuais:", results[0].anexos);
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
app.get("/ver_ordens",  (req, res) => {
   

  const filtroConcluido = req.query.concluido;

  let sql = `
    SELECT 
      id, checklist_id, nome_maquina, descricao,
      reparacoes_json, criado_em, concluido
    FROM ordens
  `;

  const valores = [];

  if (filtroConcluido === "true") {
    sql += " WHERE concluido = 1";
  } else if (filtroConcluido === "false") {
     sql += " WHERE concluido = 0 OR concluido IS NULL";
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
  const { ordemId, reparacaoId } = req.body;

  if (!ordemId || !reparacaoId) {
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
    const reparacao = reparacoes.find(r => r.id === reparacaoId.toString());

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




// Iniciar o servidor
const PORT = 3001;
const HOST = '192.168.100.28';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}/menu`);
});

