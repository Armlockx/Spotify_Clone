// Sistema para deletar músicas enviadas
import { Storage } from './storage.js';
import { loadSongs } from './data.js';

export const Delete = {
    init() {
        // Será chamado quando necessário
    },

    deleteUploadedSong(songId) {
        const uploadedSongs = Storage.getUploadedSongs();
        const filtered = uploadedSongs.filter(song => song.id !== songId);
        Storage.saveUploadedSongs(filtered);
        
        // Recarrega as músicas
        loadSongs();
        
        return true;
    },

    createDeleteButton(song, container) {
        // Só mostra botão de deletar para músicas enviadas
        if (!song.uploaded) return null;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('aria-label', 'Deletar música');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Deletar música enviada';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (confirm(`Deseja realmente deletar "${song.name}"?`)) {
                this.deleteUploadedSong(song.id);
                this.showNotification('Música deletada com sucesso');
            }
        });

        return deleteBtn;
    },

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

