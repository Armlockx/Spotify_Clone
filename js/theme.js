// Sistema de temas Dark/Light
import { Storage } from './storage.js';

export const Theme = {
    init() {
        const prefs = Storage.getPreferences();
        this.setTheme(prefs.theme || 'dark');
        this.createThemeToggle();
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.updatePreference('theme', theme);
        this.updateThemeToggle(theme);
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

