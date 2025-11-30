import { playSongNew } from './player.js';

export async function loadSongs() {
    try {
        const response = await fetch('musicas.json');
        const songs = await response.json();
        console.log('Músicas carregadas:', songs.length);
        displaySongs(songs);
        displayLibrarySongs(songs);
    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
    }
}

export function verifyFields(song) {
    if (!song.name || song.name.trim() === '') song.name = 'Nome não disponível';
    if (!song.artist || song.artist.trim() === '') song.artist = 'Artista desconhecido';
    if (!song.cover || song.cover.trim() === '') song.cover = 'img/notFound.png';
    if (!song.file || song.file.trim() === '') song.file = '#';
    return song;
}

export function displaySongs(songs) {
    const container = document.querySelector('.main__row');
    if (!container) return;

    // Limpar músicas antigas
    container.querySelectorAll('.main__col').forEach(el => el.remove());

    songs.forEach(song => {
        song = verifyFields(song);

        const divSong = document.createElement('div');
        divSong.classList.add('main__col');
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

export function displayLibrarySongs(songs) {
    const library = document.getElementById('library');
    if (!library) {
        console.error('Elemento #library não encontrado');
        return;
    }

    console.log('Renderizando biblioteca com', songs.length, 'músicas');

    // Limpar músicas antigas (mantendo header)
    const oldSongs = library.querySelectorAll('.songRow');
    oldSongs.forEach(song => song.remove());

    songs.forEach(song => {
        song = verifyFields(song);

        const divSong = document.createElement('div');
        divSong.classList.add('songRow');
        const duration = song.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');

        divSong.innerHTML = `
            <img src="${song.cover}" alt="${song.name}">
            <h3>${song.name}</h3>
            <p>${song.artist}</p>
            <p>${minutes}:${seconds}</p>
        `;

        if (song.file !== '#') {
            divSong.addEventListener('click', () => {
                document.querySelectorAll('.songRow').forEach(i => i.classList.remove('active'));
                divSong.classList.add('active');
                playSongNew(song);
            });
        } else {
            divSong.style.opacity = '0.6';
            divSong.title = 'Arquivo de áudio não disponível';
        }

        library.appendChild(divSong);
    });
}

export function formatSongDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
