const completionMessage = document.getElementById('js--completion-message'); // Certifique-se de que esse ID existe no HTML
const scContainer = document.getElementById('js--sc--container');
const nextButton = document.getElementById('js--next-button');
const images = [
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/luis bus-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/emplastro-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/triz weird-min.png' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/elefante-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/no grau luis-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/goat triz-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/soninho luis-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/csmeme-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/shape luis-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/banana-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/kitty-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/thug triz-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/images/surprise.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/shreek-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/boss-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/mad triz-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/bicep-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/triz mini-min.jpg' },
  { forward: 'static/images/good_luck.png', background: 'static/scratch images/final-min.jpg' }
];
nextButton.disabled = true; // Desabilita o botão "Próxima Imagem
let currentImageIndex = 0;

function loadScratchCard(index) {
  scContainer.innerHTML = '';

  const { forward, background } = images[index];

  const sc = new ScratchCard('#js--sc--container', {
    scratchType: SCRATCH_TYPE.CIRCLE,
    containerWidth: scContainer.offsetWidth,
    containerHeight: 300,
    imageForwardSrc: forward,
    imageBackgroundSrc: background,
    clearZoneRadius: 20,
    nPoints: 50,
    pointSize: 4,
  });

  sc.init().then(() => {
    sc.canvas.addEventListener('scratch.move', () => {
      let percent = sc.getPercent().toFixed(0);
      if (percent >= 50) {
        // Considera raspado ao atingir 90% ou mais
        nextButton.disabled = false; // Habilita o botão "Próxima Imagem"
      }else{
        nextButton.disabled = true; // Desabilita o botão "Próxima Imagem
      }
    });
  }).catch((error) => {
    alert(error.message);
  });
}

// Inicializa a primeira imagem
loadScratchCard(currentImageIndex);

// Botão para carregar a próxima imagem
nextButton.addEventListener('click', () => {
  if (currentImageIndex < images.length - 1) {
    currentImageIndex++; // Incrementa o índice
    
    loadScratchCard(currentImageIndex); // Carrega o próximo par de imagens
  } else {
    // Quando todas as imagens forem raspadas
    completionMessage.style.display = 'block'; // Torna a mensagem visível
    completionMessage.textContent = "Completaste todas as surpresas.";
  }
});

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