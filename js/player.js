import { applyGradientToPlayer, extractDominantColors } from './ui.js';

const audioPlayer = document.getElementById('audioplayer');
let playBtn = null;
let pauseBtn = null;
let progressBar = null;
let progressContainer = null;
let currentTimeDisplay = null;
let totalTimeDisplay = null;
let isSeeking = false;

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
    const playerArtist = document.querySelector('.player__artist');
    audioPlayer.src = song.file;
    audioPlayer.play();

    if (playerArtist) {
        playerArtist.innerHTML = `\n            <img src="${song.cover}" alt="${song.name}">\n            <h3 class="song__title">${song.name}<br /><span>${song.artist}</span></h3>\n        `;

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
        }
    }

    if (playBtn) playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline';
}

export default {
    initPlayer,
    playSong,
    playSongNew
};
