// Sistema para deletar músicas enviadas
import { Storage } from './storage.js';
import { loadSongs } from './data.js';
import { Auth } from './auth.js';
import { supabase } from './supabaseClient.js';

export const Delete = {
    init() {
        // Atualizar botões quando o estado de autenticação mudar
        Auth.onUpdate(async (user) => {
            await this.updateDeleteButtons();
        });
    },

    async updateDeleteButtons() {
        // Atualizar botões de delete em todas as músicas visíveis
        const isAdmin = await this.isAdmin();
        const allSongElements = document.querySelectorAll('.main__col, .songRow');
        
        // Se não é admin, apenas remover botões existentes
        if (!isAdmin) {
            allSongElements.forEach((songElement) => {
                const existingDeleteBtn = songElement.querySelector('.delete-btn');
                if (existingDeleteBtn) {
                    existingDeleteBtn.remove();
                }
            });
            return;
        }
        
        // Se é admin, verificar quais músicas precisam de botão
        const songsNeedingButtons = [];
        allSongElements.forEach((songElement) => {
            const existingDeleteBtn = songElement.querySelector('.delete-btn');
            const isUploaded = songElement.dataset.uploaded === 'true';
            
            if (isUploaded && !existingDeleteBtn) {
                // Esta música precisa de um botão, mas precisamos recarregar para criar
                songsNeedingButtons.push(songElement.dataset.songId);
            }
        });
        
        // Se há músicas que precisam de botões, recarregar
        if (songsNeedingButtons.length > 0) {
            const { loadSongs } = await import('./data.js');
            await loadSongs();
        }
    },

    async isAdmin() {
        const user = Auth.getCurrentUser();
        if (!user) return false;
        
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();
            
            if (error) {
                console.warn('Erro ao verificar se é admin:', error);
                return false;
            }
            
            return profile?.is_admin === true;
        } catch (error) {
            console.warn('Erro ao verificar se é admin:', error);
            return false;
        }
    },

    async deleteUploadedSong(songId) {
        const user = Auth.getCurrentUser();
        if (!user) {
            this.showNotification('Você precisa estar logado para deletar músicas.', 'error');
            return false;
        }

        // Verificar se é admin
        const adminCheck = await this.isAdmin();
        if (!adminCheck) {
            this.showNotification('Apenas administradores podem deletar músicas.', 'error');
            return false;
        }

        try {
            // Buscar informações da música antes de deletar
            const { data: song, error: fetchError } = await supabase
                .from('songs')
                .select('file, cover, user_id')
                .eq('id', songId)
                .single();

            if (fetchError) {
                console.error('Erro ao buscar música:', fetchError);
                this.showNotification('Erro ao buscar informações da música.', 'error');
                return false;
            }

            // Deletar do banco de dados (RLS vai garantir que só admin pode deletar)
            const { error: deleteError } = await supabase
                .from('songs')
                .delete()
                .eq('id', songId);

            if (deleteError) {
                console.error('Erro ao deletar música:', deleteError);
                this.showNotification('Erro ao deletar música. Você tem permissão?', 'error');
                return false;
            }

            // Tentar deletar arquivos do storage se existirem
            if (song.file && song.file.includes('supabase.co/storage')) {
                try {
                    // Extrair o caminho do arquivo da URL (sem o nome do bucket)
                    const filePath = this.extractStoragePath(song.file, 'tracks');
                    if (filePath) {
                        const { error: removeError } = await supabase.storage.from('tracks').remove([filePath]);
                        if (removeError) {
                            console.warn('Erro ao deletar arquivo de áudio do storage:', removeError);
                        }
                    }
                } catch (storageError) {
                    console.warn('Erro ao deletar arquivo de áudio do storage:', storageError);
                    // Não bloquear a exclusão se houver erro no storage
                }
            }

            if (song.cover && song.cover.includes('supabase.co/storage') && song.cover !== 'img/notFound.png' && !song.cover.startsWith('img/')) {
                try {
                    const coverPath = this.extractStoragePath(song.cover, 'covers');
                    if (coverPath) {
                        const { error: removeError } = await supabase.storage.from('covers').remove([coverPath]);
                        if (removeError) {
                            console.warn('Erro ao deletar capa do storage:', removeError);
                        }
                    }
                } catch (storageError) {
                    console.warn('Erro ao deletar capa do storage:', storageError);
                    // Não bloquear a exclusão se houver erro no storage
                }
            }

            // Atualizar localStorage (fallback)
            const uploadedSongs = Storage.getUploadedSongs();
            const filtered = uploadedSongs.filter(song => song.id !== songId);
            Storage.saveUploadedSongs(filtered);
            
            // Recarrega as músicas
            await loadSongs();
            
            this.showNotification('Música deletada com sucesso', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao deletar música:', error);
            this.showNotification('Erro ao deletar música: ' + error.message, 'error');
            return false;
        }
    },

    extractStoragePath(url, bucket) {
        // Extrai o caminho do arquivo de uma URL do Supabase Storage
        // Formato: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        // Retorna apenas o path dentro do bucket, sem incluir o nome do bucket
        try {
            const urlObj = new URL(url);
            // O pathname geralmente é /storage/v1/object/public/[bucket]/[path]
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.findIndex(part => part === bucket);
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                // Pegar tudo depois do bucket (caminho relativo dentro do bucket)
                const filePath = pathParts.slice(bucketIndex + 1).join('/');
                return filePath;
            }
            return null;
        } catch (e) {
            console.warn('Erro ao extrair caminho do storage:', e);
            return null;
        }
    },

    async createDeleteButton(song, container) {
        // Verificar se é admin antes de mostrar o botão
        const isAdmin = await this.isAdmin();
        if (!isAdmin) return null;

        // Só mostra botão de deletar para músicas enviadas
        if (!song.uploaded) return null;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('aria-label', 'Deletar música');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Deletar música (Admin)';

        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            if (confirm(`Deseja realmente deletar "${song.name}"?\n\nEsta ação não pode ser desfeita.`)) {
                await this.deleteUploadedSong(song.id);
            }
        });

        return deleteBtn;
    },

    showNotification(message, type = 'success') {
        // Remover toasts anteriores para evitar acúmulo
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 100);
        });

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, type === 'error' ? 4000 : 3000);
    }
};

