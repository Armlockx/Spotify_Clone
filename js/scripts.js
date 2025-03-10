var audioPlayer = document.getElementById('audioplayer');
        var loaded = false;

        var playBtn = document.getElementById('playBtn');
        var pauseBtn = document.getElementById('pauseBtn');

        const progressBar = document.getElementById('progress__bar');
        const currentTimeDisplay = document.getElementById('current__time');
        const totalTimeDisplay = document.getElementById('total__time');

        // Atualiza a barra de progresso e o tempo atual
        audioPlayer.addEventListener('timeupdate', () => {
            const currentTime = audioPlayer.currentTime;
            const duration = audioPlayer.duration;

            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;

            currentTimeDisplay.textContent = formatTime(currentTime);
        });

        // Formata o tempo em minutos e segundos
        function formatTime(time) {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        // Atualiza o tempo total quando o áudio é carregado
        audioPlayer.addEventListener('loadedmetadata', () => {
            totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
        });

        // Permite clicar na barra de progresso para buscar um ponto específico
        const progressContainer = document.querySelector('.player__control__progress');
        progressContainer.addEventListener('click', (e) => {
            const clickX = e.offsetX;
            const width = progressContainer.clientWidth;
            const seekTime = (clickX / width) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        });

        // Botão de pausar
        pauseBtn.addEventListener('click', (e) => {
            e.preventDefault();

            playBtn.style.display = "inline";
            pauseBtn.style.display = "none";
            audioPlayer.pause();

            return false;
        });

        // Botão de play
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();

            playBtn.style.display = "none";
            pauseBtn.style.display = "inline";
            audioPlayer.play();

            return false;
        });

        // Função para tocar uma nova música
        const playSong = (file) => {
            // Define a nova fonte de áudio
            audioPlayer.src = file;

            // Recarrega o áudio
            audioPlayer.load();

            // Toca a nova música
            audioPlayer.play();

            // Atualiza os botões de play/pause
            playBtn.style.display = "none";
            pauseBtn.style.display = "inline";
        };

        // Adiciona um evento de clique a cada item da lista de músicas
        document.querySelectorAll('.main__col').forEach(item => {
            item.addEventListener('click', event => {
                document.querySelectorAll('.main__col').forEach(i => i.classList.remove('active'));

                item.classList.add('active');

                let image = item.getAttribute('data-image');
                let artist = item.getAttribute('data-artist');
                let music = item.getAttribute('data-song');
                let file = item.getAttribute('data-file');

                let playerArtistComponent = document.getElementsByClassName('player__artist');

                // Atualiza a imagem e o nome do artista/música
                playerArtistComponent[0].innerHTML = `
                    <img src="${image}" />
                    <h3>${music}<br/><span>${artist}</span></h3>
                `;

                // Toca a nova música
                playSong(file);
            });
        });

        // Toca a próxima música
        audioPlayer.addEventListener('ended', () => {
            const currentItem = document.querySelector('.main__col.active');
            const nextItem = currentItem.nextElementSibling;

            if (nextItem) {
                nextItem.click();
            }
        });

        // Slide de volume
        const volumeControl = document.getElementById('volumeControl');
        volumeControl.addEventListener('input', () => {
            audioPlayer.volume = volumeControl.value;
        });

        const input = document.querySelector("input");

function setBackgroundSize(input) {
  input.style.setProperty("--background-size", `${getBackgroundSize(input)}%`);
}

setBackgroundSize(input);

input.addEventListener("input", () => setBackgroundSize(input));

function getBackgroundSize(input) {
  const min = +input.min || 0;
  const max = +input.max || 100;
  const value = +input.value;

  const size = (value - min) / (max - min) * 100;

  return size;
}


// Função para aplicar o gradiente no player
function applyGradientToPlayer(colors) {
    const player = document.querySelector('.player');
    player.style.background = `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`;
}

// Função para extrair as cores dominantes da imagem
function extractDominantColors(imgElement, numColors = 2) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Define o tamanho do canvas com base na imagem
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;

    // Desenha a imagem no canvas
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    // Obtém os dados de pixels da imagem
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Agrupa os pixels por cor e conta a frequência de cada cor
    const colorCounts = {};
    for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const color = `${r},${g},${b}`;

        if (!colorCounts[color]) {
            colorCounts[color] = 0;
        }
        colorCounts[color]++;
    }

    // Ordena as cores pela frequência e seleciona as mais dominantes
    const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
    const dominantColors = sortedColors.slice(0, numColors).map(color => `rgb(${color})`);

    return dominantColors;
}

// Quando a imagem da música é carregada, extrai as cores e aplica o gradiente
const imgElement = document.querySelector('.player__artist img');
if (imgElement.complete) {
    const colors = extractDominantColors(imgElement);
    applyGradientToPlayer(colors);
} else {
    imgElement.addEventListener('load', () => {
        const colors = extractDominantColors(imgElement);
        applyGradientToPlayer(colors);
    });
}

// Atualiza o gradiente ao mudar de música
document.querySelectorAll('.main__col').forEach(item => {
    item.addEventListener('click', event => {
        const imgSrc = item.getAttribute('data-image');
        const imgElement = document.querySelector('.player__artist img');

        // Atualiza a imagem do artista
        imgElement.src = imgSrc;

        // Quando a nova imagem é carregada, extrai as cores e aplica o gradiente
        imgElement.addEventListener('load', () => {
            const colors = extractDominantColors(imgElement);
            applyGradientToPlayer(colors);
        });
    });
});