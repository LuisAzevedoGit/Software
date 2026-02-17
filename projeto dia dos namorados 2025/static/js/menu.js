// Corações flutuantes
const container = document.getElementById('hearts-container');

function createHeart() {
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.classList.add('heart');
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${Math.random() * 20 + 20}px`;
    heart.style.animationDuration = `${Math.random() * 3 + 3}s`;
    container.appendChild(heart);

    setTimeout(() => heart.remove(), 5000); // Remove o coração após 5 segundos
}

setInterval(createHeart, 500); // Cria um novo coração a cada 500ms