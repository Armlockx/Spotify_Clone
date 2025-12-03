// Sistema de filtros e ordenação
export const Filters = {
    currentFilter: null,
    currentSort: 'name',
    currentGenre: null,

    init() {
        this.createFilterUI();
    },

    createFilterUI() {
        const library = document.getElementById('library');
        if (!library) return;

        // Verifica se já existe
        if (document.getElementById('filterControls')) return;

        const controls = document.createElement('div');
        controls.id = 'filterControls';
        controls.className = 'filter-controls';
        controls.innerHTML = `
            <div class="filter-group">
                <label>Ordenar por:</label>
                <select id="sortSelect" aria-label="Ordenar músicas">
                    <option value="name">Nome</option>
                    <option value="artist">Artista</option>
                    <option value="duration">Duração</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Filtrar por artista:</label>
                <select id="artistFilter" aria-label="Filtrar por artista">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Filtrar por gênero:</label>
                <select id="genreFilter" aria-label="Filtrar por gênero">
                    <option value="">Todos</option>
                </select>
            </div>
            <button id="clearFilters" class="clear-filters-btn">Limpar filtros</button>
        `;

        const header = library.querySelector('h2');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(controls, header.nextSibling);
        }

        this.attachFilterEvents();
    },

    attachFilterEvents() {
        const sortSelect = document.getElementById('sortSelect');
        const artistFilter = document.getElementById('artistFilter');
        const genreFilter = document.getElementById('genreFilter');
        const clearBtn = document.getElementById('clearFilters');

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFilters();
            });
        }

        if (artistFilter) {
            artistFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value || null;
                this.applyFilters();
            });
        }

        if (genreFilter) {
            genreFilter.addEventListener('change', (e) => {
                this.currentGenre = e.target.value || null;
                this.applyFilters();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    },

    populateFilterOptions(songs) {
        const artistFilter = document.getElementById('artistFilter');
        const genreFilter = document.getElementById('genreFilter');

        if (artistFilter) {
            const artists = [...new Set(songs.map(s => s.artist).filter(Boolean))].sort();
            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist;
                option.textContent = artist;
                artistFilter.appendChild(option);
            });
        }

        if (genreFilter) {
            const genres = [...new Set(songs.map(s => s.genre).filter(Boolean))].sort();
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreFilter.appendChild(option);
            });
        }
    },

    sortSongs(songs, sortBy) {
        const sorted = [...songs];
        
        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
                break;
            case 'artist':
                sorted.sort((a, b) => a.artist.localeCompare(b.artist, 'pt-BR'));
                break;
            case 'duration':
                sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
                break;
        }
        
        return sorted;
    },

    filterSongs(songs, artistFilter, genreFilter) {
        return songs.filter(song => {
            if (artistFilter && song.artist !== artistFilter) return false;
            if (genreFilter && song.genre !== genreFilter) return false;
            return true;
        });
    },

    applyFilters() {
        // Dispara evento customizado para que data.js possa reagir
        const event = new CustomEvent('filtersChanged', {
            detail: {
                sort: this.currentSort,
                artist: this.currentFilter,
                genre: this.currentGenre
            }
        });
        document.dispatchEvent(event);
    },

    clearFilters() {
        this.currentFilter = null;
        this.currentGenre = null;
        this.currentSort = 'name';

        const sortSelect = document.getElementById('sortSelect');
        const artistFilter = document.getElementById('artistFilter');
        const genreFilter = document.getElementById('genreFilter');

        if (sortSelect) sortSelect.value = 'name';
        if (artistFilter) artistFilter.value = '';
        if (genreFilter) genreFilter.value = '';

        this.applyFilters();
    },

    getFilteredAndSortedSongs(songs) {
        let filtered = this.filterSongs(songs, this.currentFilter, this.currentGenre);
        return this.sortSongs(filtered, this.currentSort);
    }
};

