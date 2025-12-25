import { playSongNew } from './player.js';
import { Storage } from './storage.js';
import { Favorites } from './favorites.js';
import { Filters } from './filters.js';
import { History } from './history.js';
import { Delete } from './delete.js';
import { supabase } from './supabaseClient.js';

let allSongs = [];
let filterListenerAttached = false;

export async function loadSongs() {
    // Mostrar loading
    showLoading();
    
    try {
        // Fetch songs from Supabase only
        const { data: supabaseSongs, error } = await supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao carregar músicas do Supabase:', error);
            throw error;
        }

        // Usa apenas músicas do Supabase
        allSongs = supabaseSongs || [];
        
        console.log('Músicas carregadas:', allSongs.length);
        
        Filters.populateFilterOptions(allSongs);
        const filteredSongs = Filters.getFilteredAndSortedSongs(allSongs);
        await displaySongs(filteredSongs);
        await displayLibrarySongs(filteredSongs);

        // Atualiza botões de favorito após renderizar (busca todos de uma vez)
        Favorites.updateFavoriteButtons();

        if (!filterListenerAttached) {
            document.addEventListener('filtersChanged', applyFilters);
            filterListenerAttached = true;
        }
    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
        showError('Erro ao carregar músicas. Por favor, recarregue a página.');
    } finally {
        // Esconder loading
        hideLoading();
    }
}

export function getAllSongs() {
    return allSongs;
}

export function verifyFields(song) {
    if (!song.name || song.name.trim() === '') song.name = 'Nome não disponível';
    if (!song.artist || song.artist.trim() === '') song.artist = 'Artista desconhecido';
    if (!song.cover || song.cover.trim() === '') song.cover = 'img/notFound.png';
    if (!song.file || song.file.trim() === '') song.file = '#';
    return song;
}

export async function displaySongs(songs) {
    const container = document.querySelector('.main__row');
    if (!container) return;

    // Limpar músicas antigas
    container.querySelectorAll('.main__col').forEach(el => el.remove());

    if (songs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Nenhuma música encontrada</p>';
        return;
    }

    // Criar todos os elementos de uma vez para melhor performance
    const songElements = await Promise.all(songs.map(async (song) => {
        song = verifyFields(song);

        const divSong = document.createElement('div');
        divSong.classList.add('main__col');
        divSong.dataset.songId = song.id; // Adiciona ID para facilitar busca
        if (song.uploaded) {
            divSong.dataset.uploaded = 'true'; // Marca como música enviada
        }
        
        // Adiciona botão de favorito
        const favoriteBtn = Favorites.createFavoriteButton(song, divSong);
        
        // Adiciona botão de deletar se for música enviada (async)
        const deleteBtn = await Delete.createDeleteButton(song, divSong);
        
        divSong.innerHTML = `
            <img src="${song.cover}" alt="${song.name}" loading="lazy">
            <h3>${song.name}<br/></h3><p>${song.artist}</p>
        `;
        
        // Adiciona botões ao container
        divSong.appendChild(favoriteBtn);
        if (deleteBtn) divSong.appendChild(deleteBtn);

        if (song.file !== '#') {
            divSong.addEventListener('click', (e) => {
                // Não dispara se clicar nos botões
                if (e.target.closest('.favorite-btn') || e.target.closest('.delete-btn')) return;
                
                document.querySelectorAll('.main__col').forEach(i => i.classList.remove('active'));
                divSong.classList.add('active');
                playSongNew(song);
                History.add(song);
            });
        } else {
            divSong.style.opacity = '0.6';
            divSong.title = 'Arquivo de áudio não disponível';
        }

        return divSong;
    }));

    // Adicionar todos os elementos ao container
    songElements.forEach(divSong => container.appendChild(divSong));
}

export async function displayLibrarySongs(songs) {
    const library = document.getElementById('library');
    if (!library) {
        console.error('Elemento #library não encontrado');
        return;
    }

    console.log('Renderizando biblioteca com', songs.length, 'músicas');

    // Limpar músicas antigas (mantendo header)
    const oldSongs = library.querySelectorAll('.songRow');
    oldSongs.forEach(song => song.remove());

    // Criar todos os elementos de uma vez para melhor performance
    const songElements = await Promise.all(songs.map(async (song) => {
        song = verifyFields(song);

        const divSong = document.createElement('div');
        divSong.classList.add('songRow');
        divSong.dataset.songId = song.id; // Adiciona ID para facilitar busca
        if (song.uploaded) {
            divSong.dataset.uploaded = 'true'; // Marca como música enviada
        }

        // duration value (may be 0 if not known)
        const duration = song.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');

        // Adiciona botão de favorito
        const favoriteBtn = Favorites.createFavoriteButton(song, divSong);
        
        // Adiciona botão de deletar se for música enviada (async)
        const deleteBtn = await Delete.createDeleteButton(song, divSong);
        
        divSong.innerHTML = `
            <img src="${song.cover}" alt="${song.name}" loading="lazy">
            <h3>${song.name}</h3>
            <p class="songArtist">${song.artist}</p>
            <p class="songDuration">${minutes}:${seconds}</p>
        `;
        
        // Adiciona botões
        divSong.appendChild(favoriteBtn);
        if (deleteBtn) divSong.appendChild(deleteBtn);

        if (song.file !== '#') {
            divSong.addEventListener('click', (e) => {
                // Não dispara se clicar nos botões
                if (e.target.closest('.favorite-btn') || e.target.closest('.delete-btn')) return;
                
                document.querySelectorAll('.songRow').forEach(i => i.classList.remove('active'));
                divSong.classList.add('active');
                playSongNew(song);
                History.add(song);
            });
            // If duration is zero, try to load metadata to get real duration
            const durationEl = divSong.querySelector('.songDuration');
            if (durationEl && (!song.duration || song.duration === 0)) {
                try {
                    const audio = new Audio();
                    audio.preload = 'metadata';
                    audio.src = song.file;
                    audio.addEventListener('loadedmetadata', () => {
                        const d = Math.floor(audio.duration);
                        song.duration = d;
                        durationEl.textContent = formatSongDuration(d);
                        // release resource
                        audio.src = '';
                    }, { once: true });
                    audio.addEventListener('error', () => {
                        // keep 0:00 on error
                        audio.src = '';
                    }, { once: true });
                } catch (err) {
                    // ignore metadata errors
                    console.warn('Não foi possível carregar metadata de:', song.file, err);
                }
            }
        } else {
            divSong.style.opacity = '0.6';
            divSong.title = 'Arquivo de áudio não disponível';
        }

        return divSong;
    }));

    // Adicionar todos os elementos ao container
    songElements.forEach(divSong => library.appendChild(divSong));
}

export function formatSongDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function applyFilters() {
    const filtered = Filters.getFilteredAndSortedSongs(allSongs);
    await displaySongs(filtered);
    await displayLibrarySongs(filtered);
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

function showLoading() {
    let loader = document.getElementById('songsLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'songsLoader';
        loader.className = 'songs-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <p class="loader-text">Carregando músicas...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.classList.add('active');
}

function hideLoading() {
    const loader = document.getElementById('songsLoader');
    if (loader) {
        loader.classList.remove('active');
        // Remover após animação
        setTimeout(() => {
            if (loader && !loader.classList.contains('active')) {
                loader.remove();
            }
        }, 300);
    }
}
