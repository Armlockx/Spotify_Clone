import player from './player.js';
import { loadSongs, getAllSongs, displaySongs, displayLibrarySongs } from './data.js';
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
    if (volumeControl) {
        setRangeBackground(volumeControl);
        volumeControl.addEventListener('input', () => {
            setRangeBackground(volumeControl);
            const audioPlayer = document.getElementById('audioplayer');
            if (audioPlayer) {
                const vol = Number(volumeControl.value);
                audioPlayer.volume = vol;
                volumeControl.setAttribute('aria-valuenow', vol);
                Storage.updatePreference('volume', vol);
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
    const sidebarMenuSelected = document.getElementById('sidebarMenuSelected');
    const sidebarLibrary = document.getElementById('sidebarLibrary');
    const searchBar = document.getElementById('search__bar');
    const mainWraper = document.getElementById('mainWraper');
    const library = document.getElementById('library');

    // Validação
    if (!sidebarMenuSelected || !sidebarLibrary) {
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
        sidebarMenuSelected.classList.remove('active');
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
                sidebarMenuSelected.classList.add('active');
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
                    displayFavorites();
                }
                break;

            case 'historico':
                if (sidebarHistory) sidebarHistory.classList.add('active');
                if (historyLibrary) {
                    historyLibrary.classList.add('active');
                    displayHistory();
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
    sidebarMenuSelected.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('inicio');
    });

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
function displayFavorites() {
    const allSongs = getAllSongs();
    const favorites = Favorites.getFavoriteSongs(allSongs);
    const container = document.getElementById('favoritesLibrary');
    if (container) {
        displaySongsInLibrary(container, favorites);
    }
}

function displayHistory() {
    const container = document.getElementById('historyLibrary');
    if (container) {
        History.displayHistorySongs(container, (song) => {
            playSongNew(song);
        });
    }
}

function displaySongsInLibrary(container, songs) {
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

    songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'songRow';
        const duration = song.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
        
        div.innerHTML = `
            <img src="${song.cover}" alt="${song.name}">
            <h3>${song.name}</h3>
            <p>${song.artist}</p>
            <p>${minutes}:${seconds}</p>
        `;

        div.addEventListener('click', () => {
            playSongNew(song);
        });

        container.appendChild(div);
    });
}

function performSearch(query) {
    if (!query || query.trim() === '') {
        loadSongs();
        return;
    }

    const allSongs = getAllSongs();
    const filtered = allSongs.filter(song => {
        const searchTerm = query.toLowerCase();
        return song.name.toLowerCase().includes(searchTerm) ||
               song.artist.toLowerCase().includes(searchTerm);
    });

    displaySongs(filtered);
    displayLibrarySongs(filtered);
}
