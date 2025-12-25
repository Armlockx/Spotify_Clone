// Sistema de temas Dark/Light
import { Storage } from './storage.js';

export const Theme = {
    init() {
        const prefs = Storage.getPreferences();
        const initialTheme = prefs.theme || 'dark';
        document.documentElement.setAttribute('data-theme', initialTheme);
        Storage.updatePreference('theme', initialTheme);
        this.updateThemeToggle(initialTheme);
        this.createThemeToggle();
        // Atualiza iframe do Spotify após um pequeno delay para garantir que está carregado
        setTimeout(() => {
            this.updateSpotifyIframeTheme(initialTheme);
        }, 100);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.updatePreference('theme', theme);
        this.updateThemeToggle(theme);
        this.updateSpotifyIframeTheme(theme);
    },
    
    updateSpotifyIframeTheme(theme) {
        const iframe = document.getElementById('spotifyPlaylistIframe');
        if (!iframe) return;
        
        // Spotify iframe theme: 0 = light, 1 = dark
        const spotifyTheme = theme === 'dark' ? '1' : '0';
        const currentSrc = iframe.src;
        
        // Atualiza o parâmetro theme na URL
        const newSrc = currentSrc.replace(/[?&]theme=\d+/, '') + 
                      (currentSrc.includes('?') ? '&' : '?') + 
                      `theme=${spotifyTheme}`;
        
        if (currentSrc !== newSrc) {
            iframe.src = newSrc;
        }
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    createThemeToggle() {
        // Verifica se já existe
        if (document.getElementById('themeToggle')) return;

        const toggle = document.createElement('button');
        toggle.id = 'themeToggle';
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Alternar tema');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('type', 'button');

        // Cria container para os ícones
        toggle.innerHTML = `
            <i class="fas fa-moon theme-icon"></i>
            <i class="fas fa-sun theme-icon"></i>
        `;

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTheme();
        });

        // Adiciona ao header-right
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.appendChild(toggle);
        } else {
            document.body.appendChild(toggle);
        }

        this.updateThemeToggle(document.documentElement.getAttribute('data-theme') || 'dark');
    },

    updateThemeToggle(theme) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        // Remove classes anteriores
        toggle.classList.remove('dark', 'light');
        
        // Adiciona classe baseada no tema
        if (theme === 'dark') {
            toggle.classList.add('dark');
        } else {
            toggle.classList.add('light');
        }
    }
};

