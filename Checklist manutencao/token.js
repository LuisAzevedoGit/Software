const jwt = require("jsonwebtoken");
const JWT_SECRET = "Tesco Componentes para Automoveis ";

function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.status(401).json({ erro: "Token ausente." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ erro: "Token inválido." });

        req.user = user; // coloca os dados do token na request
        next();
    });
}

module.exports = { autenticarToken };
