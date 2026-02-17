const slides = document.querySelectorAll(".slides img");
const container = document.getElementById('hearts-container');
let slideIndex = 0;
let intervalId = null;

document.addEventListener("DOMContentLoaded", initializeSlider);

function initializeSlider(){
    if(slides.length > 0){
        slides[slideIndex].classList.add("displaySlide");
        intervalId = setInterval(nextSlide, 5000);
    }
}

function showSlide(index){
    if(index >= slides.length){
        slideIndex = 0;
    }
    else if(index < 0){
        slideIndex = slides.length - 1;
    }

    slides.forEach(slide => {
        slide.classList.remove("displaySlide");
    });
    slides[slideIndex].classList.add("displaySlide");
}

function prevSlide(){
    clearInterval(intervalId);
    slideIndex--;
    showSlide(slideIndex);
}

function nextSlide(){
    slideIndex++;
    showSlide(slideIndex);
}


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

// Música de fundo que continua
const music = document.getElementById('background-music');

// Pause e retome a música ao trocar de página
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        music.pause();
    } else {
        music.play();
    }
});