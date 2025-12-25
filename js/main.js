import player from './player.js';
import { loadSongs, getAllSongs, displaySongs, displayLibrarySongs, verifyFields } from './data.js';
import { setRangeBackground } from './ui.js';
import { Theme } from './theme.js';
import { Keyboard } from './keyboard.js';
import { Favorites } from './favorites.js';
import { History } from './history.js';
import { Filters } from './filters.js';
import { Upload } from './upload.js';
import { Waveform } from './waveform.js';
import { Storage } from './storage.js';
import { Playlists } from './playlists.js';
import { playSongNew } from './player.js';
import { Delete } from './delete.js';
import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa tema primeiro
    Theme.init();

    // Inicializa player (event listeners, etc.)
    player.initPlayer();

    // Inicializa visual do range de volume
    const volumeControl = document.getElementById('volumeControl');
    const volumeIcon = document.getElementById('volumeIcon');
    const audioPlayer = document.getElementById('audioplayer');
    
    if (volumeControl && volumeIcon) {
        
        // Função para atualizar a barra visual do volume
        const updateVolumeProgress = (volume) => {
            const percent = (volume * 100).toFixed(0);
            volumeControl.style.setProperty('--volume-percent', `${percent}%`);
        };
        
        // Função para atualizar ícone de volume com 4 níveis
        const updateVolumeIcon = (volume, isMuted = false) => {
            if (!volumeIcon) return;
            
            let iconClass = 'fas volume-icon';
            
            if (isMuted || volume === 0) {
                // Nível 0: Mutado - mostrar X (fa-volume-mute)
                iconClass += ' fa-volume-mute';
            } else if (volume <= 0.33) {
                // Nível 1: 1-33% - mostrar 1 risco (fa-volume-off)
                iconClass += ' fa-volume-off';
            } else if (volume <= 0.66) {
                // Nível 2: 34-66% - mostrar 2 riscos (fa-volume-down)
                iconClass += ' fa-volume-down';
            } else {
                // Nível 3: 67-100% - mostrar 3 riscos (fa-volume-up)
                iconClass += ' fa-volume-up';
            }
            
            volumeIcon.className = iconClass;
        };
        
        // Função para atualizar tudo
        const updateVolumeDisplay = (volume, isMuted = false) => {
            updateVolumeProgress(isMuted ? 0 : volume);
            updateVolumeIcon(volume, isMuted);
            if (audioPlayer) {
                volumeControl.setAttribute('aria-valuenow', Math.round(volume * 100));
            }
        };
        
        // Atualiza ao mudar volume com o slider
        volumeControl.addEventListener('input', () => {
            if (audioPlayer) {
                const vol = Number(volumeControl.value);
                audioPlayer.muted = false; // Desmuta se estava mutado
                audioPlayer.volume = vol;
                Storage.updatePreference('volume', vol);
                updateVolumeDisplay(vol, false);
            }
        });
        
        // Scroll do mouse para ajustar volume
        volumeControl.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (!audioPlayer) return;
            
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            const currentVol = audioPlayer.muted ? 0 : audioPlayer.volume;
            let newVol = Math.max(0, Math.min(1, currentVol + delta));
            
            audioPlayer.muted = false;
            audioPlayer.volume = newVol;
            volumeControl.value = newVol;
            Storage.updatePreference('volume', newVol);
            updateVolumeDisplay(newVol, false);
        }, { passive: false });
        
        // Atualiza quando volume muda externamente (teclado, etc)
        if (audioPlayer) {
            audioPlayer.addEventListener('volumechange', () => {
                const vol = audioPlayer.volume;
                const muted = audioPlayer.muted;
                volumeControl.value = vol;
                updateVolumeDisplay(vol, muted);
            });
            
            // Inicializa valores
            const initialVol = audioPlayer.volume !== undefined ? audioPlayer.volume : (Number(volumeControl.value) || 1);
            const initialMuted = audioPlayer.muted || false;
            updateVolumeDisplay(initialVol, initialMuted);
        } else {
            // Inicializa a barra visual mesmo se não houver audioPlayer ainda
            const initialVol = Number(volumeControl.value) || 1;
            updateVolumeProgress(initialVol);
            updateVolumeIcon(initialVol, false);
        }
        
        // Clique no ícone para mutar/desmutar
        volumeIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!audioPlayer) return;
            
            const wasMuted = audioPlayer.muted;
            const currentVolume = audioPlayer.volume || Number(volumeControl.value) || 1;
            
            // Toggle mute
            audioPlayer.muted = !wasMuted;
            
            // Se estava mutado e vai desmutar, restaura o volume anterior
            if (wasMuted) {
                const savedVol = Number(volumeControl.value) || currentVolume || 1;
                audioPlayer.volume = savedVol;
                volumeControl.value = savedVol;
                Storage.updatePreference('volume', savedVol);
                // Atualiza display com volume restaurado e não mutado
                updateVolumeDisplay(savedVol, false);
            } else {
                // Se vai mutar, mantém o valor do slider mas zera a barra visual
                // Salva o volume atual antes de mutar
                volumeControl.value = currentVolume;
                updateVolumeDisplay(currentVolume, true);
            }
        });
    }

    // Inicializa sistemas
    Keyboard.init();
    Filters.init();
    Upload.init();
    Waveform.init();

    // Carrega músicas e inicializa módulos dependentes após autenticação
    Auth.init().then(() => {
        loadSongs();
        Playlists.init();
        Favorites.init();
        History.init();
        Delete.init();
    });

    // ===== NOVO SISTEMA DE NAVEGAÇÃO DO SIDEBAR =====
    initializeSidebarNavigation();

    // Restaura última música se disponível
    const lastSong = Storage.getCurrentSong();
    if (lastSong && lastSong.file) {
        // Opcional: auto-play da última música (comentado para não ser intrusivo)
        // player.playSongNew(lastSong);
    }
});

/**
 * Sistema de navegação do sidebar
 * Gerencia: Início, Buscar, Biblioteca
 */
function initializeSidebarNavigation() {
    // Elementos do DOM
    const sidebarLibrary = document.getElementById('sidebarLibrary');
    const searchBar = document.getElementById('search__bar');
    const mainWraper = document.getElementById('mainWraper');
    const library = document.getElementById('library');

    // Validação
    if (!sidebarLibrary) {
        console.error('Elementos do menu não encontrados');
        return;
    }

    const sidebarEl = document.querySelector('.sidebar');

    /**
     * Estado global do navegador
     */
    const menuState = {
        currentPage: 'inicio', // 'inicio', 'buscar', 'biblioteca'
    };

    const favoritesLibrary = document.getElementById('favoritesLibrary');
    const historyLibrary = document.getElementById('historyLibrary');

    /**
     * Função para limpar todos os estados
     */
    function clearAllStates() {
        const headerHomeBtn = document.getElementById('headerHomeBtn');
        if (headerHomeBtn) headerHomeBtn.classList.remove('active');
        sidebarLibrary.classList.remove('active');
        if (sidebarFavorites) sidebarFavorites.classList.remove('active');
        if (sidebarHistory) sidebarHistory.classList.remove('active');
        library.classList.remove('active');
        if (favoritesLibrary) favoritesLibrary.classList.remove('active');
        if (historyLibrary) historyLibrary.classList.remove('active');
        if (mainWraper) mainWraper.classList.add('hidden');
    }

    /**
     * Função para navegar para uma página
     */
    function navigateTo(page) {
        if (menuState.currentPage === page) {
            return; // Evita redundância - sai sem fazer nada
        }

        clearAllStates();
        menuState.currentPage = page;

        switch (page) {
            case 'inicio':
                const headerHomeBtn = document.getElementById('headerHomeBtn');
                if (headerHomeBtn) headerHomeBtn.classList.add('active');
                if (mainWraper) mainWraper.classList.remove('hidden');
                break;

            case 'buscar':
                // Barra de busca sempre visível no topo
                if (mainWraper) mainWraper.classList.remove('hidden');
                // Foca na busca
                const searchInput = document.getElementById('search_input');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
                break;

            case 'biblioteca':
                sidebarLibrary.classList.add('active');
                library.classList.add('active');
                break;

            case 'favoritos':
                if (sidebarFavorites) sidebarFavorites.classList.add('active');
                if (favoritesLibrary) {
                    favoritesLibrary.classList.add('active');
                    displayFavorites().catch(err => {
                        console.error('Erro ao exibir favoritos:', err);
                    });
                }
                break;

            case 'historico':
                if (sidebarHistory) sidebarHistory.classList.add('active');
                if (historyLibrary) {
                    historyLibrary.classList.add('active');
                    displayHistory().catch(err => {
                        console.error('Erro ao exibir histórico:', err);
                    });
                }
                break;
        }

        // Quando Início ou Biblioteca estiverem ativos, suprimir hover em outros itens
        if (sidebarEl) {
            if (page === 'inicio' || page === 'biblioteca') {
                sidebarEl.classList.add('suppress-hover');
            } else {
                sidebarEl.classList.remove('suppress-hover');
            }
        }
        
        // Se for buscar, apenas foca na busca (já está sempre visível)
        if (page === 'buscar') {
            const searchInput = document.getElementById('search_input');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }

    // Event Listeners
    // Botão home no header
    const headerHomeBtn = document.getElementById('headerHomeBtn');
    if (headerHomeBtn) {
        headerHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('inicio');
        });
    }

    sidebarLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('biblioteca');
    });

    // Barra de busca sempre visível no topo
    searchBar.classList.add('active');
    
    // Focus na busca quando clicar em qualquer lugar da barra
    searchBar.addEventListener('click', () => {
        const input = searchBar.querySelector('input');
        if (input) input.focus();
    });

    // Favoritos
    const sidebarFavorites = document.getElementById('sidebarFavorites');
    if (sidebarFavorites) {
        sidebarFavorites.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('favoritos');
        });
    }

    // Histórico
    const sidebarHistory = document.getElementById('sidebarHistory');
    if (sidebarHistory) {
        sidebarHistory.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('historico');
        });
    }

    // Keyboard navigation (Arrow Up/Down, Home, End)
    if (sidebarEl) {
        sidebarEl.addEventListener('keydown', (e) => {
            const focusableSelector = 'a, button, [tabindex]:not([tabindex="-1"])';
            const items = Array.from(sidebarEl.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null);
            if (!items.length) return;
            const idx = items.indexOf(document.activeElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = items[(idx + 1) % items.length] || items[0];
                next.focus();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = items[(idx - 1 + items.length) % items.length] || items[items.length - 1];
                prev.focus();
            }
            if (e.key === 'Home') {
                e.preventDefault();
                items[0].focus();
            }
            if (e.key === 'End') {
                e.preventDefault();
                items[items.length - 1].focus();
            }
        });
    }

    // Inicializa na página "Início"
    navigateTo('inicio');

    // Busca em tempo real
    const searchInput = document.getElementById('search_input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
    }
}

// Funções auxiliares
async function displayFavorites() {
    const { Auth } = await import('./auth.js');
    const user = Auth.getCurrentUser();
    const container = document.getElementById('favoritesLibrary');
    
    if (!user) {
        // Usuário não logado - mostrar mensagem
        if (container) {
            const oldSongs = container.querySelectorAll('.songRow');
            oldSongs.forEach(s => s.remove());
            const oldMessages = container.querySelectorAll('p[style*="text-align: center"]');
            oldMessages.forEach(m => m.remove());
            
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'color: var(--text-secondary); padding: 20px; text-align: center;';
            emptyMsg.textContent = 'Faça login para ver seus favoritos';
            container.appendChild(emptyMsg);
        }
        return;
    }

    const allSongs = getAllSongs();
    const favorites = await Favorites.getFavoriteSongs(allSongs);
    if (container) {
        // Garantir que favorites é um array
        const favoritesArray = Array.isArray(favorites) ? favorites : [];
        await displaySongsInLibrary(container, favoritesArray);
        // Atualizar botões de favorito após renderizar (todos devem estar ativos)
        await Favorites.updateFavoriteButtons();
    }
}

async function displayHistory() {
    const { Auth } = await import('./auth.js');
    const user = Auth.getCurrentUser();
    const container = document.getElementById('historyLibrary');
    
    if (!user) {
        // Usuário não logado - mostrar mensagem
        if (container) {
            const oldSongs = container.querySelectorAll('.songRow, .historyRow');
            oldSongs.forEach(s => s.remove());
            const oldMessages = container.querySelectorAll('p[style*="text-align: center"]');
            oldMessages.forEach(m => m.remove());
            
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'color: var(--text-secondary); padding: 20px; text-align: center;';
            emptyMsg.textContent = 'Faça login para ver seu histórico';
            container.appendChild(emptyMsg);
        }
        return;
    }
    
    if (container) {
        await History.displayHistorySongs(container, (song) => {
            playSongNew(song);
        });
    }
}

async function displaySongsInLibrary(container, songs) {
    // Garantir que songs é um array
    if (!Array.isArray(songs)) {
        console.error('displaySongsInLibrary: songs não é um array', songs);
        songs = [];
    }

    // Remove apenas as músicas, mantendo o header
    const oldSongs = container.querySelectorAll('.songRow');
    oldSongs.forEach(s => s.remove());
    
    // Remove mensagens anteriores
    const oldMessages = container.querySelectorAll('p[style*="text-align: center"]');
    oldMessages.forEach(m => m.remove());

    if (songs.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'color: var(--text-secondary); padding: 20px; text-align: center;';
        emptyMsg.textContent = 'Nenhuma música encontrada';
        container.appendChild(emptyMsg);
        return;
    }

    // Criar todos os elementos de uma vez para melhor performance
    const songElements = await Promise.all(songs.map(async (song) => {
        song = verifyFields(song);
        
        const div = document.createElement('div');
        div.className = 'songRow';
        div.dataset.songId = song.id; // Adiciona ID para facilitar busca
        if (song.uploaded) {
            div.dataset.uploaded = 'true'; // Marca como música enviada
        }
        
        const duration = song.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
        
        // Adiciona botão de favorito
        const favoriteBtn = Favorites.createFavoriteButton(song, div);
        
        // Adiciona botão de deletar se for música enviada (async)
        const deleteBtn = await Delete.createDeleteButton(song, div);
        
        div.innerHTML = `
            <img src="${song.cover}" alt="${song.name}" loading="lazy">
            <h3>${song.name}</h3>
            <p class="songArtist">${song.artist}</p>
            <p class="songDuration">${minutes}:${seconds}</p>
        `;
        
        // Adiciona botões
        div.appendChild(favoriteBtn);
        if (deleteBtn) div.appendChild(deleteBtn);

        if (song.file !== '#') {
            div.addEventListener('click', (e) => {
                // Não dispara se clicar nos botões
                if (e.target.closest('.favorite-btn') || e.target.closest('.delete-btn')) return;
                
                document.querySelectorAll('.songRow').forEach(i => i.classList.remove('active'));
                div.classList.add('active');
                playSongNew(song);
                History.add(song);
            });
        } else {
            div.style.opacity = '0.6';
            div.title = 'Arquivo de áudio não disponível';
        }

        return div;
    }));

    // Adicionar todos os elementos ao container
    songElements.forEach(div => container.appendChild(div));
}

async function performSearch(query) {
    if (!query || query.trim() === '') {
        await loadSongs();
        return;
    }

    const allSongs = getAllSongs();
    const filtered = allSongs.filter(song => {
        const searchTerm = query.toLowerCase();
        return song.name.toLowerCase().includes(searchTerm) ||
               song.artist.toLowerCase().includes(searchTerm);
    });

    await displaySongs(filtered);
    await displayLibrarySongs(filtered);
}
