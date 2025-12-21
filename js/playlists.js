// Sistema de playlists personalizadas
import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { supabase } from './supabaseClient.js';
import { playSongNew } from './player.js';
import { getAllSongs } from './data.js';

export const Playlists = {
    playlists: [],
    activePlaylist: null,

    init() {
        this.createPlaylistUI();
        Auth.onUpdate(user => {
            if (user) {
                this.loadPlaylists(user.id);
            } else {
                this.loadLocalPlaylists();
            }
        });
    },

    async loadPlaylists(userId) {
        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao carregar playlists do Supabase:', error);
            this.loadLocalPlaylists();
            return;
        }
        this.playlists = data || [];
        this.renderPlaylists();
    },

    loadLocalPlaylists() {
        this.playlists = Storage.getPlaylists();
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

    async showCreatePlaylistDialog() {
        const user = Auth.getCurrentUser();
        if (!user) {
            this.showNotification('Você precisa estar logado para criar playlists.');
            return;
        }
        const name = prompt('Nome da playlist:');
        if (name && name.trim()) {
            const { data, error } = await supabase
                .from('playlists')
                .insert({ name: name.trim(), user_id: user.id })
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar playlist no Supabase:', error);
                this.showNotification('Erro ao criar playlist.');
                return;
            }
            this.playlists.push(data);
            this.renderPlaylists();
            this.showNotification(`Playlist "${name}" criada!`);
        }
    },

    renderPlaylists() {
        const container = document.querySelector('.sidebar__playlists');
        if (!container) return;

        const customPlaylists = container.querySelectorAll('.playlist-custom');
        customPlaylists.forEach(p => p.remove());

        this.playlists.forEach(playlist => {
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
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Deseja deletar a playlist "${playlist.name}"?`)) {
                    const user = Auth.getCurrentUser();
                    if (user) {
                        const { error } = await supabase
                            .from('playlists')
                            .delete()
                            .eq('id', playlist.id)
                            .eq('user_id', user.id);
                        if (error) {
                            console.error('Erro ao deletar playlist:', error);
                            this.showNotification('Erro ao deletar playlist.');
                            return;
                        }
                        this.playlists = this.playlists.filter(p => p.id !== playlist.id);
                    } else {
                        Storage.deletePlaylist(playlist.id);
                    }
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

    async showPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        const user = Auth.getCurrentUser();
        if (user) {
            const { data: playlistSongs, error } = await supabase
                .from('playlist_songs')
                .select('song_id')
                .eq('playlist_id', playlistId)
                .order('created_at', { ascending: true });

            if (!error && playlistSongs) {
                const songIds = playlistSongs.map(ps => ps.song_id);
                if (songIds.length > 0) {
                    const { data: songsData } = await supabase
                        .from('songs')
                        .select('*')
                        .in('id', songIds);
                    playlist.songs = songsData || [];
                } else {
                    playlist.songs = [];
                }
            }
        } else {
            playlist.songs = playlist.songs || [];
        }

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

    async renderPlaylistSongs(playlistId, songs) {
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
                <button class="remove-from-playlist-btn" data-playlist-id="${playlistId}" data-song-id="${song.id}" aria-label="Remover da playlist">
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
                this.removeFromPlaylist(playlistId, song.id);
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

    async addToPlaylist(playlistId, song) {
        const user = Auth.getCurrentUser();
        if (!user) {
            this.showNotification('Você precisa estar logado para adicionar músicas a playlists.');
            return;
        }

        const { data: existingEntry, error: selectError } = await supabase
            .from('playlist_songs')
            .select('*')
            .eq('playlist_id', playlistId)
            .eq('song_id', song.id)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Erro ao verificar música na playlist:', selectError);
            this.showNotification('Erro ao adicionar música à playlist.');
            return;
        }

        if (existingEntry) {
            this.showNotification('Música já está na playlist');
            return;
        }

        const { error: insertError } = await supabase
            .from('playlist_songs')
            .insert({ playlist_id: playlistId, song_id: song.id });

        if (insertError) {
            console.error('Erro ao adicionar música à playlist:', insertError);
            this.showNotification('Erro ao adicionar música à playlist.');
            return;
        }

        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            if (!playlist.songs) playlist.songs = [];
            playlist.songs.push(song);
            this.renderPlaylistSongs(playlistId, playlist.songs);
        }
        this.showNotification('Música adicionada à playlist');
    },

    async removeFromPlaylist(playlistId, songId) {
        const user = Auth.getCurrentUser();
        if (!user) {
            this.showNotification('Você precisa estar logado para remover músicas de playlists.');
            return;
        }

        const { error: deleteError } = await supabase
            .from('playlist_songs')
            .delete()
            .eq('playlist_id', playlistId)
            .eq('song_id', songId);

        if (deleteError) {
            console.error('Erro ao remover música da playlist:', deleteError);
            this.showNotification('Erro ao remover música da playlist.');
            return;
        }

        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            playlist.songs = playlist.songs.filter(s => s.id !== songId);
            this.renderPlaylistSongs(playlistId, playlist.songs);
        }
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

