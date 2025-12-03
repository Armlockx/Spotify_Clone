// Sistema de histórico de reprodução
import { Storage } from './storage.js';

export const History = {
    init() {
        // Será inicializado junto com o player
    },

    add(song) {
        Storage.addToHistory(song);
        this.updateHistoryDisplay();
    },

    get() {
        return Storage.getHistory();
    },

    clear() {
        Storage.saveHistory([]);
        this.updateHistoryDisplay();
    },

    updateHistoryDisplay() {
        // Atualiza a exibição do histórico se houver uma seção dedicada
        const historySection = document.getElementById('historySection');
        if (historySection) {
            const history = this.get();
            // Renderizar histórico
        }
    },

    displayHistorySongs(container, onSongClick) {
        const history = this.get().reverse(); // Mais recentes primeiro
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Nenhuma música no histórico</p>';
            return;
        }

        history.forEach(song => {
            const div = document.createElement('div');
            div.className = 'songRow historyRow';
            div.innerHTML = `
                <img src="${song.cover}" alt="${song.name}">
                <h3>${song.name}</h3>
                <p>${song.artist}</p>
                <p>${this.formatTime(song.timestamp)}</p>
            `;
            div.addEventListener('click', () => onSongClick(song));
            container.appendChild(div);
        });
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}min atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;
        return date.toLocaleDateString('pt-BR');
    }
};

