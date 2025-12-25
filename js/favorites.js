// Sistema de favoritos
import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { supabase } from './supabaseClient.js';

export const Favorites = {
    init() {
        Auth.onUpdate(user => {
            if (user) {
                this.loadFavorites(user.id);
            } else {
                this.updateFavoriteButtons();
            }
        });
    },

    async toggleFavorite(song) {
        const user = Auth.getCurrentUser();
        const songId = song.id;
        if (!user) {
            // Usuário não logado - mostrar mensagem e abrir modal de login
            this.showNotification('Você precisa estar logado para favoritar músicas. Faça login para continuar.', 'error');
            // Importar Auth dinamicamente para evitar dependência circular
            const { Auth } = await import('./auth.js');
            Auth.showAuthModal();
            return false;
        }

        const { data: existingFav, error: selectError } = await supabase
            .from('favorites')
            .select('user_id, song_id')
            .eq('user_id', user.id)
            .eq('song_id', songId)
            .limit(1);

        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Erro ao verificar favorito:', selectError);
            this.showNotification('Erro ao processar favorito.', 'error');
            return false;
        }

        if (existingFav && existingFav.length > 0) {
            const { error: deleteError } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('song_id', songId);

            if (deleteError) {
                console.error('Erro ao remover favorito:', deleteError);
                this.showNotification('Erro ao remover dos favoritos.', 'error');
                return false;
            }
            this.showNotification('Removido dos favoritos', 'success');
            this.updateFavoriteButtons();
            return false;
        } else {
            const { error: insertError } = await supabase
                .from('favorites')
                .insert({ user_id: user.id, song_id: songId });

            if (insertError) {
                console.error('Erro ao adicionar favorito:', insertError);
                this.showNotification('Erro ao adicionar aos favoritos.', 'error');
                return false;
            }
            this.showNotification('Adicionado aos favoritos', 'success');
            this.updateFavoriteButtons();
            return true;
        }
    },

    async isFavorite(song) {
        const user = Auth.getCurrentUser();
        const songId = song.id;
        if (!user) {
            return Storage.isFavorite(songId);
        }
        if (!songId) {
            return false;
        }
        // Não seleciona coluna específica, apenas verifica se existe registro
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('song_id', songId)
            .limit(1);
        
        // Se houver erro (exceto quando não encontra), retorna false
        if (error) {
            // PGRST116 = no rows returned (não é erro, apenas não encontrou)
            if (error.code !== 'PGRST116') {
                console.warn('Erro ao verificar favorito:', error);
            }
            return false;
        }
        
        // Retorna true se houver dados
        return data && data.length > 0;
    },

    getSongId(song) {
        return song.id || `${song.name}-${song.artist}`;
    },

    createFavoriteButton(song, container) {
        const button = document.createElement('button');
        button.className = 'favorite-btn';
        button.setAttribute('aria-label', 'Favoritar música');
        button.innerHTML = '<i class="far fa-heart"></i>';

        // Não verifica favorito aqui para evitar múltiplas requisições
        // Será atualizado depois pelo updateFavoriteButtons()

        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const wasFavorite = await this.isFavorite(song);
            const isNowFavorite = await this.toggleFavorite(song);
            
            // Só atualiza o botão se o toggle foi bem-sucedido (usuário logado)
            const user = Auth.getCurrentUser();
            if (user) {
                button.classList.toggle('active', isNowFavorite);
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = isNowFavorite ? 'fas fa-heart' : 'far fa-heart';
                }
                
                // Se estava favoritado e agora não está mais, remover da lista se estiver na página de favoritos
                if (wasFavorite && !isNowFavorite) {
                    const favoritesLibrary = document.getElementById('favoritesLibrary');
                    if (favoritesLibrary && favoritesLibrary.classList.contains('active')) {
                        // Remove o elemento da lista
                        const songRow = container.closest('.songRow');
                        if (songRow) {
                            songRow.remove();
                            
                            // Se não há mais músicas, mostrar mensagem
                            const remainingSongs = favoritesLibrary.querySelectorAll('.songRow');
                            if (remainingSongs.length === 0) {
                                const emptyMsg = document.createElement('p');
                                emptyMsg.style.cssText = 'color: var(--text-secondary); padding: 20px; text-align: center;';
                                emptyMsg.textContent = 'Nenhuma música favoritada';
                                favoritesLibrary.appendChild(emptyMsg);
                            }
                        }
                    }
                }
            }
        });

        return button;
    },

    async updateFavoriteButtons() {
        const user = Auth.getCurrentUser();
        if (!user) {
            // Se não há usuário, apenas atualiza visualmente baseado no localStorage
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                const container = btn.closest('.main__col, .songRow');
                const songId = container?.dataset?.songId;
                if (songId) {
                    const isFav = Storage.isFavorite(songId);
                    btn.classList.toggle('active', isFav);
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
                    }
                }
            });
            return;
        }

        // Busca todos os favoritos de uma vez para evitar múltiplas requisições
        const { data: favorites, error } = await supabase
            .from('favorites')
            .select('song_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Erro ao carregar favoritos:', error);
            return;
        }

        const favoriteIds = new Set(favorites.map(fav => String(fav.song_id)));

        // Atualiza botões baseado nos favoritos carregados
        document.querySelectorAll('.main__col, .songRow').forEach(el => {
            const songId = el.dataset.songId;
            if (!songId) return;

            const isFav = favoriteIds.has(String(songId));
            const button = el.querySelector('.favorite-btn');
            if (button) {
                button.classList.toggle('active', isFav);
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
                }
            }
        });
    },

    showNotification(message, type = 'info') {
        // Remover toasts anteriores para evitar acúmulo
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 100);
        });

        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    async getFavoriteSongs(allSongs) {
        const user = Auth.getCurrentUser();
        if (!user) {
            // Se não estiver logado, retorna array vazio
            return [];
        }

        if (!allSongs || !Array.isArray(allSongs)) {
            console.warn('getFavoriteSongs: allSongs não é um array válido');
            return [];
        }

        const { data, error } = await supabase
            .from('favorites')
            .select('song_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Erro ao carregar favoritos do Supabase:', error);
            return [];
        }
        
        if (!data || !Array.isArray(data)) {
            return [];
        }
        
        const favoriteIds = data.map(fav => String(fav.song_id));
        return allSongs.filter(song => song && song.id && favoriteIds.includes(String(song.id)));
    },

    async loadFavorites(userId) {
        const favoritesLibrary = document.getElementById('favoritesLibrary');
        if (favoritesLibrary && favoritesLibrary.classList.contains('active')) {
            const { displayFavorites } = await import('./main.js');
            displayFavorites();
        }
        this.updateFavoriteButtons();
    }
};

