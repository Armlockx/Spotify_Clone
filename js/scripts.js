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
    const duration = audioPlayer.duration || 0;

    // Proteção contra duration NaN/Infinity/0
    const progressPercent = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;
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
    const duration = audioPlayer.duration || 0;
    totalTimeDisplay.textContent = formatTime(isFinite(duration) ? duration : 0);
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

/*
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
*/

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
if (volumeControl) {
        volumeControl.addEventListener('input', () => {
                // value is string, audio.volume expects number between 0 and 1
                audioPlayer.volume = Number(volumeControl.value);
        });

        // visual progress for the range input
        function setBackgroundSize(rangeInput) {
            rangeInput.style.setProperty("--background-size", `${getBackgroundSize(rangeInput)}%`);
        }

        // Aplica fundo ao slide de volume
        setBackgroundSize(volumeControl);

        volumeControl.addEventListener("input", () => setBackgroundSize(volumeControl));

        function getBackgroundSize(input) {
            const min = +input.min || 0;
            const max = +input.max || 100;
            const value = +input.value;

            const size = (value - min) / (max - min) * 100;

            return size;
        }
}

function isLightColor(rgb) {
    if (!rgb || typeof rgb !== 'string') return false;
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return false;
    const [r, g, b] = matches.map(Number);

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    const threshold = 0.5;

    return luminance > threshold;
}

// Função para extrair as cores dominantes com ColorThief
function extractDominantColors(imgElement) {
    const colorThief = new ColorThief();
    const colors = colorThief.getPalette(imgElement, 2); // Extrai 2 cores dominantes
    return colors.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
}

// Função para aplicar o gradiente no player
function applyGradientToPlayer(colors) {
    const player = document.querySelector('.player');
    const songTitle = document.querySelector('.song__title');

    // Testa se a cor é escura ou clara para aplicar o contrário da cor do título
    if (isLightColor(colors[1])) {
        player.style.background = `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`;
        songTitle.style.color = colors[1];
    } 
    else if (isLightColor(colors[0]) && songTitle !== null){
        player.style.background = `linear-gradient(45deg, ${colors[1]}, ${colors[0]})`;
        songTitle.style.color = colors[0];
    }
    console.log(colors, 'Color1: ', isLightColor(colors[0]), 'Color2: ', isLightColor(colors[1]));
}

// Quando a imagem da música é carregada, extrai as cores e aplica o gradiente
const imgElement = document.querySelector('.player__artist img');
if (imgElement) {
    if (imgElement.complete && imgElement.naturalWidth !== 0) {
        try {
            const colors = extractDominantColors(imgElement);
            applyGradientToPlayer(colors);
        } catch (e) {
            // ColorThief pode falhar em imagens cross-origin
            console.warn('Não foi possível extrair paleta da imagem inicial:', e);
        }
    } else {
        imgElement.addEventListener('load', () => {
            try {
                const colors = extractDominantColors(imgElement);
                applyGradientToPlayer(colors);
            } catch (e) {
                console.warn('Não foi possível extrair paleta da imagem ao carregar:', e);
            }
        });
    }
}

// Atualiza o gradiente ao mudar de música
// Atualiza o gradiente quando itens estáticos são clicados (se existirem)
document.querySelectorAll('.main__col').forEach(item => {
    item.addEventListener('click', event => {
        const imgSrc = item.getAttribute('data-image');
        const imgEl = document.querySelector('.player__artist img');
        if (!imgSrc || !imgEl) return;

        // Atualiza a imagem do artista
        imgEl.src = imgSrc;

        // Quando a nova imagem é carregada, extrai as cores e aplica o gradiente
        imgEl.addEventListener('load', () => {
            try {
                const colors = extractDominantColors(imgEl);
                applyGradientToPlayer(colors);
            } catch (e) {
                console.warn('Erro ao extrair paleta:', e);
            }
        }, { once: true });
    });
});



// --- Carregar músicas do JSON ----
// Carrega músicas
async function loadSongs() {
    try {
        const response = await fetch('musicas.json');
        const songs = await response.json();
        displaySongs(songs);
        //displayNewLibrary(songs);
        displayLibrarySongs(songs);
    } catch(error) {
        console.error('Erro ao carregar: ', error);
    }
}

// Verifica campos inválidos e substitui por valores padrão
function verifyFields(song) {
    if (!song.name || song.name.trim() === '') {
        song.name = 'Nome não disponível';
    }
    if (!song.artist || song.artist.trim() === '') {
        song.artist = 'Artista desconhecido';
    }
    if (!song.cover || song.cover.trim() === '') {
        song.cover = 'img/notFound.png';
    }
    if (!song.file || song.file.trim() === '') {
        song.file = '#';
    }
    return song;
}

// Mostra resultados
function displaySongs(songs) {
    const container = document.querySelector('.main__row');

    songs.forEach(song => {
        song = verifyFields(song);

        const divSong = document.createElement('div');
        divSong.classList.add("main__col");
            divSong.innerHTML = `
            <img src="${song.cover}" alt="${song.name}">
            <h3>${song.name}<br/></h3><p>${song.artist}</p>
        `;
        
        if (song.file !== '#') {
            divSong.addEventListener('click', () => {
                document.querySelectorAll('.main__col').forEach(i => i.classList.remove('active'));
                divSong.classList.add('active');
                playSongNew(song);
            });
        } else {
            divSong.style.opacity = '0.6';
            divSong.title = 'Arquivo de áudio não disponível';
        }

        container.appendChild(divSong);
    });
}

function playSongNew(song) {
    const audioPlayer = document.getElementById('audioplayer');
    const playerArtist = document.querySelector('.player__artist');

    audioPlayer.src = song.file;
    audioPlayer.play();

    playerArtist.innerHTML = `
            <img src="${song.cover}" alt="${song.name}">
            <h3 class="song__title">${song.name}<br /><span>${song.artist}</span></h3>
        `;

    const imgPlayer = playerArtist.querySelector('img');
    imgPlayer.addEventListener('load', () => {
        const colors = extractDominantColors(imgPlayer);
        applyGradientToPlayer(colors);
    });

    playBtn.style.display = "none";
    pauseBtn.style.display = "inline";
}


document.addEventListener('DOMContentLoaded', () => {
    // Já está sendo carregado pelo js/main.js
    // loadSongs já foi chamado pelo módulo
});



const toggleSearchBtn = document.getElementById("toggleSearchBarBtn");
const searchBar = document.getElementById("search__bar");
const sidebarSearch = document.getElementById("toggleSearchBarBtn");
const sidebarMenuSelected = document.getElementById("sidebarMenuSelected");
const sidebarLibrary = document.getElementById("sidebarLibrary");
const library = document.getElementById("library");


const mainWraper = document.getElementById("mainWraper");


toggleSearchBtn.addEventListener('click', () => {
    searchBar.classList.toggle('active');
    sidebarSearch.classList.toggle('active');
    sidebarLibrary.classList.remove('active');
    sidebarMenuSelected.classList.add('active');
});

sidebarMenuSelected.addEventListener('click', () => {
    searchBar.classList.remove('active');
    sidebarSearch.classList.remove('active');
    sidebarLibrary.classList.remove('active');
    sidebarMenuSelected.classList.remove('active');

    library.style.display = 'none';
    mainWraper.style.display = 'block';
});

sidebarLibrary.addEventListener('click', () => {
    sidebarMenuSelected.classList.add('active');
    searchBar.classList.remove('active');
    sidebarSearch.classList.remove('active');
    sidebarLibrary.classList.add('active');

    library.style.display = 'block';
    mainWraper.style.display = 'none';
});

/*  LIBRARY     */

/*
async function displayNewLibrary(songs) {
    const library = document.querySelector('.library');

    songs.forEach(song => {
        song = verifyFields(song);

        try {
            const audio = new Audio(song);

            await new Promise((resolve, reject) => {
                audio.addEventListener('loadedmetadata', () => {
                    resolve();
                });
                audio.addEventListener('error', (error) => {
                    reject(error);
                });
            });

            const totalSeconds = audio.duration;
            const formatedDuration = formatSongDuration(totalSeconds);

            const divSong = document.createElement('div');
            divSong.classList.add('songRow');
            divSong.innerHTML = `
            <img src="${song.cover}" alt="${song.name}">
            <h3>${song.name}<br/></h3><p>${song.artist}</p>
                <p>${formatedDuration}</p>
        `;

        library.appendChild(divSong);

        } catch (error) {
            console.error(`Erro ao carregar ${song}:`, error);

        }
    });
}
*/

function displayLibrarySongs(songs) {
    const library = document.querySelector('.library');

    songs.forEach(song => {
        song = verifyFields(song);
        // Cria elemento de audio apenas para obter metadata; trata erros
        if (song.file && song.file !== '#') {
            const audio = new Audio();
            audio.src = song.file;

            const appendRow = (durationSeconds) => {
                const formatedDuration = formatSongDuration(durationSeconds || 0);

                const divSong = document.createElement('div');
                divSong.classList.add("songRow");
                divSong.innerHTML = `
                    <img src="${song.cover}" alt="${song.name}">
                    <h3>${song.name}<br/></h3><p>${song.artist}</p>
                    <p>${formatedDuration}</p>
                `;

                divSong.addEventListener('click', () => {
                    document.querySelectorAll('.songRow').forEach(i => i.classList.remove('active'));
                    divSong.classList.add('active');
                    playSongNew(song);
                });

                library.appendChild(divSong);
            };

            audio.addEventListener('loadedmetadata', () => {
                appendRow(audio.duration);
            }, { once: true });

            audio.addEventListener('error', () => {
                console.warn('Erro ao carregar metadata do áudio:', song.file);
                appendRow(0);
            }, { once: true });
        } else {
            // Arquivo não disponível: adiciona linha sem duração e com estilo 'title' para tooltip
            const divSong = document.createElement('div');
            divSong.classList.add("songRow");
            divSong.title = 'Arquivo de áudio não disponível';
            divSong.innerHTML = `
                <img src="${song.cover}" alt="${song.name}">
                <h3>${song.name}<br/></h3><p>${song.artist}</p>
                <p>--:--</p>
            `;
            divSong.style.opacity = '0.6';
            library.appendChild(divSong);
        }
    });
}

function formatSongDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Avança para a próxima faixa (aplicável tanto para grid quanto para biblioteca)
function playNextTrack() {
    const currentItem = document.querySelector('.songRow.active') || document.querySelector('.main__col.active');
    if (!currentItem) return;
    const nextItem = currentItem.nextElementSibling;
    if (nextItem) nextItem.click();
}

// Volta para a faixa anterior
function playPreviousTrack() {
    const currentItem = document.querySelector('.songRow.active') || document.querySelector('.main__col.active');
    if (!currentItem) return;
    const previousItem = currentItem.previousElementSibling;
    if (previousItem) previousItem.click();
}

// Garante apenas um listener para 'ended'
audioPlayer.removeEventListener('ended', playNextTrack);
audioPlayer.addEventListener('ended', playNextTrack);

// Botões de voltar e próxima
const backwardBtn = document.querySelector('.player__control__buttons a:nth-child(1)');
const forwardBtn = document.querySelector('.player__control__buttons a:nth-child(4)');

if (backwardBtn) {
    backwardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        playPreviousTrack();
        return false;
    });
}

if (forwardBtn) {
    forwardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        playNextTrack();
        return false;
    });
}