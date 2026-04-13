


var canvas = document.getElementById('canvas');
var context = canvas.getContext("2d");
var paint = false;
var clickX = [];
var clickY = [];
var clickDrag = [];


// Variável global para armazenar o registro encontrado
let registroAtual = null;

function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
}

function redraw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = 3;

    for (var i = 0; i < clickX.length; i++) {
        context.beginPath();
        if (clickDrag[i] && i) {
            context.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            context.moveTo(clickX[i] - 1, clickY[i]);
        }
        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();
    }
}

function limparCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    clickX = [];
    clickY = [];
    clickDrag = [];
}

// Eventos de Mouse
canvas.addEventListener("mousedown", function (e) {
    paint = true;
    addClick(e.offsetX, e.offsetY);
    redraw();
});

canvas.addEventListener("mousemove", function (e) {
    if (paint) {
        addClick(e.offsetX, e.offsetY, true);
        redraw();
    }
});

canvas.addEventListener("mouseup", function () {
    paint = false;
});

canvas.addEventListener("mouseleave", function () {
    paint = false;
});

// Eventos Touch para dispositivos móveis
canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    paint = true;
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    addClick(touch.clientX - rect.left, touch.clientY - rect.top);
    redraw();
});

canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    if (paint) {
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        addClick(touch.clientX - rect.left, touch.clientY - rect.top, true);
        redraw();
    }
});

canvas.addEventListener("touchend", function () {
    paint = false;
});




// Função para salvar a assinatura
function salvarAssinatura() {
    
    if (!registroAtual) {
        alert("Erro: Nenhum registro selecionado!");
        return;
    }

    const assinatura = canvas.toDataURL("image/png"); // Converte a assinatura em base64

    const registro = {
        id: registroAtual.id, // Agora usa o id do registro encontrado
        assinatura: assinatura
    };

    console.log("id do registro atualizado: ", registroAtual.id);

    fetch("http://192.168.100.28:3001/atualizar-assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro)
    })
    .then(response => response.json())
    .then(data => {
        alert("✅ Assinatura adicionada com sucesso!");
        
        console.log("🔄 Atualização:", data);

        // Exibe uma mensagem pop-up para o usuário
        const pop = document.createElement("div");
        pop.innerText = "✍️ Assinatura salva!";
        pop.style.position = "fixed";
        pop.style.bottom = "20px";
        pop.style.right = "20px";
        pop.style.background = "#4caf50";
        pop.style.color = "white";
        pop.style.padding = "10px 20px";
        pop.style.borderRadius = "8px";
        pop.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        pop.style.zIndex = 9999;
        document.body.appendChild(pop);

        setTimeout(() => {
            document.body.removeChild(pop);
            window.location.href = "menu.html"; // Redireciona após popup desaparecer
        }, 400);
    })
    .catch(error => {
        console.error("❌ Erro ao atualizar assinatura:", error);
        alert("Erro ao salvar assinatura!");
    });
}





