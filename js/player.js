import { applyGradientToPlayer, extractDominantColors } from './ui.js';
import { Storage } from './storage.js';
import { History } from './history.js';

const audioPlayer = document.getElementById('audioplayer');
let playBtn = null;
let pauseBtn = null;
let progressBar = null;
let progressContainer = null;
let currentTimeDisplay = null;
let totalTimeDisplay = null;
let isSeeking = false;
let currentSong = null;

function formatTime(time) {
    const minutes = Math.floor(time / 60) || 0;
    const seconds = Math.floor(time % 60) || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function initPlayer() {
    playBtn = document.getElementById('playBtn');
    pauseBtn = document.getElementById('pauseBtn');
    progressBar = document.getElementById('progress__bar');
    progressContainer = document.querySelector('.player__control__progress');
    currentTimeDisplay = document.getElementById('current__time');
    totalTimeDisplay = document.getElementById('total__time');

    if (!audioPlayer) return;

    // Carrega preferências salvas
    const prefs = Storage.getPreferences();
    if (prefs.volume !== undefined) {
        audioPlayer.volume = prefs.volume;
        const volumeControl = document.getElementById('volumeControl');
        if (volumeControl) volumeControl.value = prefs.volume;
    }

    // Tratamento de erros de áudio
    audioPlayer.addEventListener('error', (e) => {
        console.error('Erro no player de áudio:', e);
        showError('Erro ao reproduzir áudio. Verifique se o arquivo está disponível.');
        if (playBtn) playBtn.style.display = 'inline';
        if (pauseBtn) pauseBtn.style.display = 'none';
    });

    audioPlayer.addEventListener('loadstart', () => {
        // Mostra loading
        if (currentTimeDisplay) currentTimeDisplay.textContent = 'Carregando...';
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const currentTime = audioPlayer.currentTime || 0;
        const duration = audioPlayer.duration || 0;

        const progressPercent = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;
        if (progressBar) progressBar.style.width = `${progressPercent}%`;

        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
        if (progressContainer) {
            progressContainer.setAttribute('aria-valuenow', Math.floor(currentTime));
            progressContainer.setAttribute('aria-valuemax', Math.floor(duration) || 0);
        }
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        const duration = audioPlayer.duration || 0;
        if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(isFinite(duration) ? duration : 0);
        if (progressContainer) progressContainer.setAttribute('aria-valuemax', Math.floor(duration) || 0);
    });

    // Seek by click
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const seekTime = (clickX / width) * (audioPlayer.duration || 0);
            audioPlayer.currentTime = seekTime;
        });

        // Drag to seek
        progressContainer.addEventListener('mousedown', (e) => {
            isSeeking = true;
            document.body.classList.add('seeking');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isSeeking) return;
            const rect = progressContainer.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(rect.width, x));
            const seekTime = (x / rect.width) * (audioPlayer.duration || 0);
            audioPlayer.currentTime = seekTime;
        });

        window.addEventListener('mouseup', () => {
            if (isSeeking) {
                isSeeking = false;
                document.body.classList.remove('seeking');
            }
        });

        // Touch support
        progressContainer.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });
        progressContainer.addEventListener('touchmove', (e) => {
            if (!isSeeking) return;
            const touch = e.touches[0];
            const rect = progressContainer.getBoundingClientRect();
            let x = touch.clientX - rect.left;
            x = Math.max(0, Math.min(rect.width, x));
            const seekTime = (x / rect.width) * (audioPlayer.duration || 0);
            audioPlayer.currentTime = seekTime;
        }, { passive: true });
        progressContainer.addEventListener('touchend', () => { isSeeking = false; }, { passive: true });
    }

    // Play/Pause
    if (pauseBtn) {
        pauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (playBtn) playBtn.style.display = 'inline';
            pauseBtn.style.display = 'none';
            audioPlayer.pause();
            return false;
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            playBtn.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'inline';
            audioPlayer.play();
            return false;
        });
    }

    // ended -> next
    audioPlayer.addEventListener('ended', () => {
        const currentItem = document.querySelector('.songRow.active') || document.querySelector('.main__col.active');
        if (!currentItem) return;
        const nextItem = currentItem.nextElementSibling;
        if (nextItem) nextItem.click();
    });
}

export function playSong(file) {
    if (!audioPlayer) return;
    audioPlayer.src = file;
    audioPlayer.load();
    audioPlayer.play();
    if (playBtn) playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline';
}

export function playSongNew(song) {
    if (!audioPlayer) return;
    
    currentSong = song;
    Storage.saveCurrentSong(song);
    History.add(song);
    
    // Atualiza link do Spotify
    updateSpotifyLink(song);
    
    const playerArtist = document.querySelector('.player__artist');
    
    // Para o áudio atual
    audioPlayer.pause();
    audioPlayer.src = '';
    
    // Tratamento de erro para arquivo não encontrado
    const errorHandler = function handleError(e) {
        console.error('Erro no player:', e);
        showError(`Não foi possível carregar: ${song.name}`);
        audioPlayer.removeEventListener('error', errorHandler);
    };
    
    audioPlayer.addEventListener('error', errorHandler, { once: true });
    
    // Carrega novo arquivo
    audioPlayer.src = song.file;
    audioPlayer.load();
    
    // Tenta reproduzir
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error('Erro ao reproduzir:', error);
            // Se for erro de autoplay, tenta novamente após interação do usuário
            if (error.name === 'NotAllowedError') {
                showError('Clique no botão play para iniciar a reprodução.');
            } else {
                // Tenta novamente após um pequeno delay
                setTimeout(() => {
                    audioPlayer.play().catch(err => {
                        showError('Erro ao iniciar reprodução. Verifique se o arquivo está disponível.');
                    });
                }, 100);
            }
        });
    }

    if (playerArtist) {
        playerArtist.innerHTML = `\n            <img src="${song.cover}" alt="${song.name}" loading="lazy">\n            <h3 class="song__title">${song.name}<br /><span>${song.artist}</span></h3>\n        `;

        const imgPlayer = playerArtist.querySelector('img');
        if (imgPlayer) {
            imgPlayer.addEventListener('load', () => {
                try {
                    const colors = extractDominantColors(imgPlayer);
                    applyGradientToPlayer(colors);
                } catch (e) {
                    console.warn('Erro ao extrair paleta:', e);
                }
            }, { once: true });
            
            imgPlayer.addEventListener('error', () => {
                // Fallback para imagem quebrada
                imgPlayer.src = 'img/notFound.png';
            });
        }
    }

    if (playBtn) playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline';
}

export function getCurrentSong() {
    return currentSong;
}

function updateSpotifyLink(song) {
    const spotifyLink = document.getElementById('spotifyLink');
    if (!spotifyLink) return;

    // Se a música tem um spotifyId, usa o link direto para a faixa no formato intl-pt
    if (song.spotifyId) {
        // Formato: https://open.spotify.com/intl-pt/track/{spotifyId}
        // Se houver parâmetro si, adiciona: ?si={si}
        let url = `https://open.spotify.com/intl-pt/track/${song.spotifyId}`;
        if (song.spotifySi) {
            url += `?si=${song.spotifySi}`;
        }
        spotifyLink.href = url;
        spotifyLink.title = `Abrir "${song.name}" no Spotify`;
    } else {
        // Fallback: busca por nome e artista
        const songName = encodeURIComponent(song.name);
        const artistName = encodeURIComponent(song.artist);
        spotifyLink.href = `https://open.spotify.com/intl-pt/search/${songName}%20${artistName}`;
        spotifyLink.title = `Buscar "${song.name}" no Spotify`;
    }
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

export default {
    initPlayer,
    playSong,
    playSongNew
};
