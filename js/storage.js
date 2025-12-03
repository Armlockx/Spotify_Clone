// Sistema de persistência com localStorage
export const Storage = {
    // Chaves de armazenamento
    KEYS: {
        PREFERENCES: 'spotify_preferences',
        FAVORITES: 'spotify_favorites',
        HISTORY: 'spotify_history',
        PLAYLISTS: 'spotify_playlists',
        SONGS: 'spotify_uploaded_songs',
        CURRENT_SONG: 'spotify_current_song'
    },

    // Preferências do usuário
    getPreferences() {
        try {
            const prefs = localStorage.getItem(this.KEYS.PREFERENCES);
            return prefs ? JSON.parse(prefs) : {
                volume: 1,
                theme: 'dark',
                lastSong: null
            };
        } catch (e) {
            console.error('Erro ao carregar preferências:', e);
            return { volume: 1, theme: 'dark', lastSong: null };
        }
    },

    savePreferences(prefs) {
        try {
            localStorage.setItem(this.KEYS.PREFERENCES, JSON.stringify(prefs));
        } catch (e) {
            console.error('Erro ao salvar preferências:', e);
        }
    },

    updatePreference(key, value) {
        const prefs = this.getPreferences();
        prefs[key] = value;
        this.savePreferences(prefs);
    },

    // Favoritos
    getFavorites() {
        try {
            const favs = localStorage.getItem(this.KEYS.FAVORITES);
            return favs ? JSON.parse(favs) : [];
        } catch (e) {
            console.error('Erro ao carregar favoritos:', e);
            return [];
        }
    },

    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
        } catch (e) {
            console.error('Erro ao salvar favoritos:', e);
        }
    },

    addFavorite(songId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(songId)) {
            favorites.push(songId);
            this.saveFavorites(favorites);
        }
    },

    removeFavorite(songId) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(id => id !== songId);
        this.saveFavorites(filtered);
    },

    isFavorite(songId) {
        return this.getFavorites().includes(songId);
    },

    // Histórico de reprodução
    getHistory() {
        try {
            const history = localStorage.getItem(this.KEYS.HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
            return [];
        }
    },

    saveHistory(history) {
        try {
            // Limitar histórico a 100 itens
            const limited = history.slice(-100);
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(limited));
        } catch (e) {
            console.error('Erro ao salvar histórico:', e);
        }
    },

    addToHistory(song) {
        const history = this.getHistory();
        // Remove duplicatas recentes
        const filtered = history.filter(s => s.id !== song.id);
        filtered.push({
            id: song.id || `${song.name}-${song.artist}`,
            name: song.name,
            artist: song.artist,
            cover: song.cover,
            file: song.file,
            timestamp: Date.now()
        });
        this.saveHistory(filtered);
    },

    // Playlists
    getPlaylists() {
        try {
            const playlists = localStorage.getItem(this.KEYS.PLAYLISTS);
            return playlists ? JSON.parse(playlists) : [];
        } catch (e) {
            console.error('Erro ao carregar playlists:', e);
            return [];
        }
    },

    savePlaylists(playlists) {
        try {
            localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify(playlists));
        } catch (e) {
            console.error('Erro ao salvar playlists:', e);
        }
    },

    createPlaylist(name, songs = []) {
        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: Date.now().toString(),
            name,
            songs,
            createdAt: Date.now()
        };
        playlists.push(newPlaylist);
        this.savePlaylists(playlists);
        return newPlaylist;
    },

    updatePlaylist(playlistId, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);
        if (index !== -1) {
            playlists[index] = { ...playlists[index], ...updates };
            this.savePlaylists(playlists);
            return playlists[index];
        }
        return null;
    },

    deletePlaylist(playlistId) {
        const playlists = this.getPlaylists();
        const filtered = playlists.filter(p => p.id !== playlistId);
        this.savePlaylists(filtered);
    },

    // Músicas enviadas
    getUploadedSongs() {
        try {
            const songs = localStorage.getItem(this.KEYS.SONGS);
            return songs ? JSON.parse(songs) : [];
        } catch (e) {
            console.error('Erro ao carregar músicas enviadas:', e);
            return [];
        }
    },

    saveUploadedSongs(songs) {
        try {
            localStorage.setItem(this.KEYS.SONGS, JSON.stringify(songs));
        } catch (e) {
            console.error('Erro ao salvar músicas enviadas:', e);
        }
    },

    addUploadedSong(song) {
        const songs = this.getUploadedSongs();
        songs.push(song);
        this.saveUploadedSongs(songs);
    },

    // Música atual
    getCurrentSong() {
        try {
            const song = localStorage.getItem(this.KEYS.CURRENT_SONG);
            return song ? JSON.parse(song) : null;
        } catch (e) {
            return null;
        }
    },

    saveCurrentSong(song) {
        try {
            if (song) {
                localStorage.setItem(this.KEYS.CURRENT_SONG, JSON.stringify(song));
            } else {
                localStorage.removeItem(this.KEYS.CURRENT_SONG);
            }
        } catch (e) {
            console.error('Erro ao salvar música atual:', e);
        }
    }
};

