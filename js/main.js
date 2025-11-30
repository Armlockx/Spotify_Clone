import player from './player.js';
import { loadSongs } from './data.js';
import { setRangeBackground } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa player (event listeners, etc.)
    player.initPlayer();

    // Inicializa visual do range de volume
    const volumeControl = document.getElementById('volumeControl');
    if (volumeControl) {
        setRangeBackground(volumeControl);
        volumeControl.addEventListener('input', () => setRangeBackground(volumeControl));
    }

    // Carrega músicas
    loadSongs();

    // ===== NOVO SISTEMA DE NAVEGAÇÃO DO SIDEBAR =====
    initializeSidebarNavigation();

    // Update volume and aria value when changed
    const vol = document.getElementById('volumeControl');
    const audioPlayer = document.getElementById('audioplayer');
    if (vol && audioPlayer) {
        vol.addEventListener('input', () => {
            audioPlayer.volume = Number(vol.value);
            vol.setAttribute('aria-valuenow', vol.value);
        });
    }
});

/**
 * Sistema de navegação do sidebar
 * Gerencia: Início, Buscar, Biblioteca
 */
function initializeSidebarNavigation() {
    // Elementos do DOM
    const sidebarMenuSelected = document.getElementById('sidebarMenuSelected');
    const toggleSearchBarBtn = document.getElementById('toggleSearchBarBtn');
    const sidebarLibrary = document.getElementById('sidebarLibrary');
    const searchBar = document.getElementById('search__bar');
    const mainWraper = document.getElementById('mainWraper');
    const library = document.getElementById('library');

    // Validação
    if (!sidebarMenuSelected || !toggleSearchBarBtn || !sidebarLibrary) {
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

    /**
     * Função para limpar todos os estados
     */
    function clearAllStates() {
        sidebarMenuSelected.classList.remove('active');
        toggleSearchBarBtn.classList.remove('active');
        sidebarLibrary.classList.remove('active');
        searchBar.classList.remove('active');
        library.classList.remove('active');
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
                toggleSearchBarBtn.classList.add('active');
                searchBar.classList.add('active');
                if (mainWraper) mainWraper.classList.remove('hidden');
                break;

            case 'biblioteca':
                sidebarLibrary.classList.add('active');
                library.classList.add('active');
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
    }

    // Event Listeners
    sidebarMenuSelected.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('inicio');
    });

    toggleSearchBarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Se já está em buscar, apenas toggle a barra
        if (menuState.currentPage === 'buscar') {
            searchBar.classList.toggle('active');
        } else {
            navigateTo('buscar');
        }
    });

    sidebarLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        // Se já está em biblioteca, apenas manter (ou pode fazer toggle se preferir)
        // Por agora, apenas navega normalmente (a verificação de redundância evita reset)
        navigateTo('biblioteca');
    });

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
}
