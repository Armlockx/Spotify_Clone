// Sistema de atalhos de teclado
import player from './player.js';

const audioPlayer = document.getElementById('audioplayer');

export const Keyboard = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Ignora se estiver digitando em um input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Espaço: Play/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            }

            // Setas: Próxima/Anterior
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.playNext();
            }

            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.playPrevious();
            }

            // Ctrl+F ou Cmd+F: Buscar
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.focusSearch();
            }

            // M: Mutar/Desmutar
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                this.toggleMute();
            }

            // Setas cima/baixo: Navegar na lista (sem Ctrl) ou Volume (com Ctrl)
            if (e.code === 'ArrowUp') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.adjustVolume(0.1);
                } else {
                    // Navegação na lista - move para item anterior
                    e.preventDefault();
                    this.navigateList(-1);
                }
            }

            if (e.code === 'ArrowDown') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.adjustVolume(-0.1);
                } else {
                    // Navegação na lista - move para próximo item
                    e.preventDefault();
                    this.navigateList(1);
                }
            }
        });
    },

    togglePlayPause() {
        if (!audioPlayer) return;
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (audioPlayer.paused) {
            audioPlayer.play();
            if (playBtn) playBtn.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'inline';
        } else {
            audioPlayer.pause();
            if (playBtn) playBtn.style.display = 'inline';
            if (pauseBtn) pauseBtn.style.display = 'none';
        }
    },

    playNext() {
        const currentItem = document.querySelector('.songRow.active') || document.querySelector('.main__col.active');
        if (!currentItem) return;
        const nextItem = currentItem.nextElementSibling;
        if (nextItem) nextItem.click();
    },

    playPrevious() {
        const currentItem = document.querySelector('.songRow.active') || document.querySelector('.main__col.active');
        if (!currentItem) return;
        const previousItem = currentItem.previousElementSibling;
        if (previousItem) previousItem.click();
    },

    focusSearch() {
        const searchInput = document.getElementById('search_input');
        const searchBar = document.getElementById('search__bar');
        if (searchInput && searchBar) {
            searchBar.classList.add('active');
            searchInput.focus();
        }
    },

    toggleMute() {
        if (!audioPlayer) return;
        const volumeControl = document.getElementById('volumeControl');
        if (!volumeControl) return;

        if (audioPlayer.muted) {
            audioPlayer.muted = false;
            volumeControl.value = audioPlayer.volume;
        } else {
            audioPlayer.muted = true;
        }
    },

    adjustVolume(delta) {
        if (!audioPlayer) return;
        const volumeControl = document.getElementById('volumeControl');
        if (!volumeControl) return;

        const newVolume = Math.max(0, Math.min(1, audioPlayer.volume + delta));
        audioPlayer.volume = newVolume;
        volumeControl.value = newVolume;
        
        // Atualiza visual do range
        if (volumeControl.dispatchEvent) {
            volumeControl.dispatchEvent(new Event('input'));
        }
    },

    navigateList(direction) {
        // Encontra todas as músicas visíveis
        const allSongs = document.querySelectorAll('.songRow:not([style*="display: none"]), .main__col:not([style*="display: none"])');
        if (allSongs.length === 0) return;

        // Encontra a música atual
        let currentIndex = -1;
        allSongs.forEach((song, index) => {
            if (song.classList.contains('active')) {
                currentIndex = index;
            }
        });

        if (currentIndex === -1) {
            // Se nenhuma está ativa, seleciona a primeira
            if (allSongs[0]) allSongs[0].click();
            return;
        }

        // Calcula próximo índice
        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < allSongs.length) {
            allSongs[nextIndex].click();
            // Scroll para o elemento
            allSongs[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
};

