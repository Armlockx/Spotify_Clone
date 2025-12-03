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

        const sidebar = document.querySelector('.sidebar__menu');
        if (!sidebar) return;

        const toggle = document.createElement('a');
        toggle.id = 'themeToggle';
        toggle.href = '#';
        toggle.className = 'sidebar__theme';
        toggle.innerHTML = '<i class="fas fa-moon"></i> <span>Tema</span>';
        toggle.setAttribute('aria-label', 'Alternar tema');
        toggle.setAttribute('role', 'button');

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });

        // Adiciona após o item de Biblioteca
        const library = document.getElementById('sidebarLibrary');
        if (library && library.parentNode) {
            library.parentNode.insertBefore(toggle, library.nextSibling);
        } else {
            sidebar.appendChild(toggle);
        }

        this.updateThemeToggle(document.documentElement.getAttribute('data-theme') || 'dark');
    },

    updateThemeToggle(theme) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
};

