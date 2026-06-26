// assinar.js — usa Signature Pad (Szymon Nowak)
// https://github.com/szimek/signature_pad

let registroAtual = null;
let signaturePad = null;

// ------------------ INIT SIGNATURE PAD ------------------
function initPad() {
    const canvas = document.getElementById("canvas");

    // Ajustar resolução para ecrãs de alta densidade (retina/mobile)
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width  = canvas.offsetWidth  * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        if (signaturePad) signaturePad.clear();
    }

    signaturePad = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 3,
        penColor: "#1a3a5c",
        backgroundColor: "rgb(255,255,255)"
    });

    // Esconder hint ao começar a assinar
    const hint = document.getElementById("canvas-hint");
    canvas.addEventListener("pointerdown", () => { if (hint) hint.style.display = "none"; });


    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
}

// ------------------ LIMPAR ------------------
function limparCanvas() {
    if (signaturePad) signaturePad.clear();
}

// ------------------ GUARDAR ------------------
function salvarAssinatura() {
    if (!registroAtual) {
        alert("Erro: Nenhum registo selecionado!");
        return;
    }

    if (signaturePad.isEmpty()) {
        alert("Por favor assina antes de guardar.");
        return;
    }

    const assinatura = signaturePad.toDataURL("image/png");

    fetch("/atualizar-assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registroAtual.id, assinatura })
    })
    .then(res => res.json())
    .then(() => {
        mostrarPopup("✍️ Assinatura guardada!");
        setTimeout(() => window.location.href = "menu.html", 1400);
    })
    .catch(err => {
        console.error(err);
        alert("Erro ao guardar assinatura.");
    });
}

// ------------------ POPUP ------------------
function mostrarPopup(msg) {
    const pop = document.createElement("div");
    pop.innerText = msg;
    Object.assign(pop.style, {
        position:"fixed", bottom:"24px", right:"24px",
        background:"#1e6b3c", color:"#fff",
        padding:"12px 22px", borderRadius:"8px",
        boxShadow:"0 2px 8px rgba(0,0,0,.25)",
        fontSize:"14px", fontWeight:"600", zIndex:"9999"
    });
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);
}

// ------------------ CARREGAR REGISTO ------------------
function carregarRegisto(id) {
    fetch(`/pesquisar?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (!data || !data.length) {
                alert("Registo não encontrado.");
                return;
            }
            registroAtual = data[0];

            // Mostrar info
            const info = document.getElementById("registo-info");
            if (info) {
                info.innerHTML = `
                    <div class="sign-info-box">
                        <span><strong>ID:</strong> ${registroAtual.id}</span>
                        <span><strong>Máquina:</strong> ${registroAtual.nome || registroAtual.maquina || "—"}</span>
                        <span><strong>Data:</strong> ${registroAtual.data_registro ? new Date(registroAtual.data_registro).toLocaleDateString("pt-PT") : "—"}</span>
                    </div>`;
            }

            // Mostrar área de assinatura
            document.getElementById("assinatura-container").style.display = "block";
            initPad();
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao carregar registo.");
        });
}

// ------------------ PESQUISA MANUAL ------------------
function pesquisar() {
    const id   = document.getElementById("id")?.value;
    const data = document.getElementById("data")?.value;

    if (!id && !data) {
        alert("Introduz um ID ou uma data.");
        return;
    }

    if (id) {
        carregarRegisto(id);
    } else {
        fetch(`/pesquisar?data=${data}`)
            .then(res => res.json())
            .then(data => {
                if (!data || !data.length) {
                    alert("Sem registos para essa data.");
                    return;
                }
                // Se vier mais do que um, mostra lista para escolher
                if (data.length === 1) {
                    registroAtual = data[0];
                    carregarRegisto(registroAtual.id);
                } else {
                    mostrarListaResultados(data);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Erro na pesquisa.");
            });
    }
}

// ------------------ LISTA RESULTADOS (pesquisa por data) ------------------
function mostrarListaResultados(lista) {
    const div = document.getElementById("resultados");
    if (!div) return;

    div.innerHTML = `
        <p style="font-size:13px;color:#666;margin-bottom:8px">Seleciona o registo que queres assinar:</p>
        <table class="sign-result-table">
            <thead><tr><th>ID</th><th>Máquina</th><th>Data</th><th></th></tr></thead>
            <tbody>
                ${lista.map(r => `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.nome || r.maquina || "—"}</td>
                        <td>${r.data_registro ? new Date(r.data_registro).toLocaleDateString("pt-PT") : "—"}</td>
                        <td><button class="btn-padrao" onclick="carregarRegisto(${r.id})">Selecionar</button></td>
                    </tr>`).join("")}
            </tbody>
        </table>`;
}

// ------------------ AUTO-CARREGAR SE VIER COM ?id= ------------------
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        const inputId = document.getElementById("id");
        if (inputId) inputId.value = id;
        carregarRegisto(id);
    }
});