// Sistema de playlists personalizadas
import { Storage } from './storage.js';
import { playSongNew } from './player.js';
import { getAllSongs } from './data.js';

export const Playlists = {
    init() {
        this.createPlaylistUI();
        this.renderPlaylists();
    },

    createPlaylistUI() {
        // Adiciona event listener ao botão de criar playlist
        const createBtn = document.querySelector('.sidebar__menu__item');
        if (createBtn && createBtn.textContent.includes('Criar Playlist')) {
            // Remove listeners antigos se houver
            const newBtn = createBtn.cloneNode(true);
            createBtn.parentNode.replaceChild(newBtn, createBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showCreatePlaylistDialog();
            });
        }
    },

    showCreatePlaylistDialog() {
        const name = prompt('Nome da playlist:');
        if (name && name.trim()) {
            const playlist = Storage.createPlaylist(name.trim());
            this.renderPlaylists();
            this.showNotification(`Playlist "${name}" criada!`);
        }
    },

    renderPlaylists() {
        const playlists = Storage.getPlaylists();
        const container = document.querySelector('.sidebar__playlists');
        if (!container) return;

        // Limpa playlists antigas (exceto as estáticas)
        const customPlaylists = container.querySelectorAll('.playlist-custom');
        customPlaylists.forEach(p => p.remove());

        playlists.forEach(playlist => {
            const item = document.createElement('div');
            item.className = 'sidebar__playlists__item playlist-custom';
            item.innerHTML = `
                <img src="${this.getPlaylistCover(playlist)}" alt="${playlist.name}">
                <a href="#" data-playlist-id="${playlist.id}">${playlist.name}</a>
                <button class="playlist-delete-btn" data-playlist-id="${playlist.id}" aria-label="Deletar playlist">
                    <i class="fas fa-times"></i>
                </button>
            `;

            const link = item.querySelector('a');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPlaylist(playlist.id);
            });

            const deleteBtn = item.querySelector('.playlist-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Deseja deletar a playlist "${playlist.name}"?`)) {
                    Storage.deletePlaylist(playlist.id);
                    this.renderPlaylists();
                    this.showNotification('Playlist deletada');
                }
            });

            container.appendChild(item);
        });
    },

    getPlaylistCover(playlist) {
        if (playlist.songs && playlist.songs.length > 0) {
            const firstSong = playlist.songs[0];
            return firstSong.cover || 'img/notFound.png';
        }
        return 'img/notFound.png';
    },

    showPlaylist(playlistId) {
        const playlists = Storage.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        // Cria seção de playlist na biblioteca
        const library = document.getElementById('library');
        if (!library) return;

        // Limpa conteúdo anterior
        const oldContent = library.querySelector('.playlist-content');
        if (oldContent) oldContent.remove();

        const content = document.createElement('div');
        content.className = 'playlist-content';
        content.innerHTML = `
            <div class="playlist-header">
                <h2>${playlist.name}</h2>
                <button class="add-songs-btn" data-playlist-id="${playlistId}">Adicionar Músicas</button>
            </div>
            <div class="playlist-songs" id="playlistSongs-${playlistId}"></div>
        `;

        library.appendChild(content);

        // Renderiza músicas da playlist
        this.renderPlaylistSongs(playlistId, playlist.songs || []);

        // Botão de adicionar músicas
        const addBtn = content.querySelector('.add-songs-btn');
        addBtn.addEventListener('click', () => {
            this.showAddSongsDialog(playlistId);
        });
    },

    renderPlaylistSongs(playlistId, songs) {
        const container = document.getElementById(`playlistSongs-${playlistId}`);
        if (!container) return;

        container.innerHTML = '';

        if (songs.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">Playlist vazia</p>';
            return;
        }

        songs.forEach((song, index) => {
            const div = document.createElement('div');
            div.className = 'songRow';
            div.innerHTML = `
                <img src="${song.cover}" alt="${song.name}">
                <h3>${song.name}</h3>
                <p>${song.artist}</p>
                <button class="remove-from-playlist-btn" data-playlist-id="${playlistId}" data-index="${index}" aria-label="Remover da playlist">
                    <i class="fas fa-times"></i>
                </button>
            `;

            div.addEventListener('click', (e) => {
                if (e.target.closest('.remove-from-playlist-btn')) return;
                playSongNew(song);
            });

            const removeBtn = div.querySelector('.remove-from-playlist-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromPlaylist(playlistId, index);
            });

            container.appendChild(div);
        });
    },

    showAddSongsDialog(playlistId) {
        const allSongs = getAllSongs();
        if (allSongs.length === 0) {
            this.showNotification('Nenhuma música disponível');
            return;
        }

        // Cria modal simples
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Adicionar Músicas</h3>
                <div class="modal-songs-list">
                    ${allSongs.map(song => `
                        <div class="modal-song-item">
                            <img src="${song.cover}" alt="${song.name}">
                            <div>
                                <strong>${song.name}</strong>
                                <p>${song.artist}</p>
                            </div>
                            <button class="add-to-playlist-btn" data-song-id="${song.id || `${song.name}-${song.artist}`}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="modal-close-btn">Fechar</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelectorAll('.add-to-playlist-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const songId = btn.getAttribute('data-song-id');
                const song = allSongs.find(s => (s.id || `${s.name}-${s.artist}`) === songId);
                if (song) {
                    this.addToPlaylist(playlistId, song);
                }
            });
        });

        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    addToPlaylist(playlistId, song) {
        const playlists = Storage.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        // Verifica se já está na playlist
        const songId = song.id || `${song.name}-${song.artist}`;
        const exists = playlist.songs.some(s => (s.id || `${s.name}-${s.artist}`) === songId);
        
        if (exists) {
            this.showNotification('Música já está na playlist');
            return;
        }

        playlist.songs.push(song);
        Storage.updatePlaylist(playlistId, { songs: playlist.songs });
        
        // Atualiza visualização
        this.renderPlaylistSongs(playlistId, playlist.songs);
        this.showNotification('Música adicionada à playlist');
    },

    removeFromPlaylist(playlistId, index) {
        const playlists = Storage.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        playlist.songs.splice(index, 1);
        Storage.updatePlaylist(playlistId, { songs: playlist.songs });
        
        this.renderPlaylistSongs(playlistId, playlist.songs);
        this.showNotification('Música removida da playlist');
    },

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

