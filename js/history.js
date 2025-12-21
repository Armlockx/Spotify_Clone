// Sistema de histórico de reprodução
import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { supabase } from './supabaseClient.js';
import { playSongNew } from './player.js';

export const History = {
    init() {
        Auth.onUpdate(user => {
            if (user) {
                this.loadServerHistory(user.id);
            } else {
                this.updateHistoryDisplay();
            }
        });
    },

    async add(song) {
        const user = Auth.getCurrentUser();
        const songId = song.id;
        if (user) {
            await supabase.from('history').upsert({
                user_id: user.id,
                song_id: songId,
                played_at: new Date().toISOString()
            }, { onConflict: 'user_id,song_id' });
            this.loadServerHistory(user.id);
        } else {
            Storage.addToHistory(song);
            this.updateHistoryDisplay();
        }
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

    async displayHistorySongs(container, onSongClick) {
        const user = Auth.getCurrentUser();
        const history = user ? await this.getRemoteForDisplay(user.id) : this.get();
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

    async loadServerHistory(userId) {
        const { data, error } = await supabase
            .from('history')
            .select('song_id, played_at')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(100);
        if (error) {
            console.error('Erro ao carregar histórico remoto:', error);
            return;
        }

        const songIds = data.map(row => row.song_id);
        if (!songIds.length) return;

        const { data: songsData } = await supabase
            .from('songs')
            .select('*')
            .in('id', songIds);

        const songMap = new Map(songsData.map(song => [song.id, song]));
        const historyRecords = data.map(row => {
            const song = songMap.get(row.song_id);
            if (!song) return null;
            return { ...song, timestamp: row.played_at };
        }).filter(Boolean);

        Storage.saveHistory(historyRecords);
        this.updateHistoryDisplay();
    },

    async getRemoteForDisplay(userId) {
        const { data, error } = await supabase
            .from('history')
            .select('song_id, played_at')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(100);
        if (error) {
            console.error('Erro ao carregar histórico remoto:', error);
            return this.get().reverse();
        }

        const songIds = data.map(row => row.song_id);
        if (!songIds.length) return this.get().reverse();

        const { data: songsData } = await supabase
            .from('songs')
            .select('*')
            .in('id', songIds);

        const songMap = new Map(songsData.map(song => [song.id, song]));
        return data.map(row => {
            const song = songMap.get(row.song_id);
            if (!song) return null;
            return { ...song, timestamp: row.played_at };
        }).filter(Boolean);
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

