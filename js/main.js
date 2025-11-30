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

    // Sidebar / search toggles (compatibilidade com comportamento original)
    const toggleSearchBtn = document.getElementById('toggleSearchBarBtn');
    const searchBar = document.getElementById('search__bar');
    const sidebarSearch = document.getElementById('toggleSearchBarBtn');
    const sidebarMenuSelected = document.getElementById('sidebarMenuSelected');
    const sidebarLibrary = document.getElementById('sidebarLibrary');
    const library = document.getElementById('library');
    const mainWraper = document.getElementById('mainWraper');

    if (toggleSearchBtn && searchBar) {
        toggleSearchBtn.addEventListener('click', () => {
            searchBar.classList.toggle('active');
            sidebarSearch.classList.toggle('active');
            sidebarLibrary.classList.remove('active');
            sidebarMenuSelected.classList.add('active');
        });
    }

    if (sidebarMenuSelected) {
        sidebarMenuSelected.addEventListener('click', () => {
            searchBar.classList.remove('active');
            sidebarSearch.classList.remove('active');
            sidebarLibrary.classList.remove('active');
            sidebarMenuSelected.classList.remove('active');

            if (library) library.style.display = 'none';
            if (mainWraper) mainWraper.style.display = 'block';
        });
    }

    if (sidebarLibrary) {
        sidebarLibrary.addEventListener('click', () => {
            sidebarMenuSelected.classList.add('active');
            searchBar.classList.remove('active');
            sidebarSearch.classList.remove('active');
            sidebarLibrary.classList.add('active');

            if (library) library.style.display = 'block';
            if (mainWraper) mainWraper.style.display = 'none';
        });
    }

    // Update volume and aria value when changed
    const vol = document.getElementById('volumeControl');
    const audioPlayer = document.getElementById('audioplayer');
    if (vol && audioPlayer) {
        vol.addEventListener('input', () => {
            // Aplicar volume ao áudio
            audioPlayer.volume = Number(vol.value);
            // Atualizar aria para acessibilidade
            vol.setAttribute('aria-valuenow', vol.value);
        });
    }
});
