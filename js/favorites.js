// Sistema de favoritos
import { Storage } from './storage.js';

export const Favorites = {
    init() {
        // Será chamado após carregar músicas
    },

    toggleFavorite(song) {
        const songId = this.getSongId(song);
        const isFav = Storage.isFavorite(songId);

        if (isFav) {
            Storage.removeFavorite(songId);
        } else {
            Storage.addFavorite(songId);
        }

        this.updateFavoriteButtons();
        return !isFav;
    },

    isFavorite(song) {
        const songId = this.getSongId(song);
        return Storage.isFavorite(songId);
    },

    getSongId(song) {
        return song.id || `${song.name}-${song.artist}`;
    },

    createFavoriteButton(song, container) {
        const button = document.createElement('button');
        button.className = 'favorite-btn';
        button.setAttribute('aria-label', 'Favoritar música');
        button.innerHTML = '<i class="far fa-heart"></i>';

        const isFav = this.isFavorite(song);
        if (isFav) {
            button.classList.add('active');
            button.querySelector('i').className = 'fas fa-heart';
        }

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isNowFavorite = this.toggleFavorite(song);
            button.classList.toggle('active', isNowFavorite);
            button.querySelector('i').className = isNowFavorite ? 'fas fa-heart' : 'far fa-heart';
            
            // Mostrar notificação
            this.showNotification(isNowFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        });

        return button;
    },

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            // Atualiza visualmente se necessário
        });
    },

    showNotification(message) {
        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    getFavoriteSongs(allSongs) {
        const favoriteIds = Storage.getFavorites();
        return allSongs.filter(song => {
            const songId = this.getSongId(song);
            return favoriteIds.includes(songId);
        });
    }
};

