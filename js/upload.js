// Sistema de upload de arquivos de áudio
import { Storage } from './storage.js';
import { playSongNew } from './player.js';
import { loadSongs } from './data.js';
import { supabase } from './supabaseClient.js';

export const Upload = {
    init() {
        this.createUploadButton();
    },

    createUploadButton() {
        const sidebar = document.querySelector('.sidebar__menu');
        if (!sidebar) return;

        // Verifica se já existe
        if (document.getElementById('uploadBtn')) return;

        const uploadBtn = document.createElement('a');
        uploadBtn.id = 'uploadBtn';
        uploadBtn.href = '#';
        uploadBtn.className = 'sidebar__upload';
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Enviar Música';
        uploadBtn.setAttribute('aria-label', 'Enviar arquivo de áudio');
        uploadBtn.setAttribute('role', 'button');

        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUploadModal();
        });
        
        const library = document.getElementById('sidebarLibrary');
        if (library && library.parentNode) {
            library.parentNode.insertBefore(uploadBtn, library);
        } else {
            sidebar.appendChild(uploadBtn);
        }
    },

    showUploadModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'uploadModal';
        modal.innerHTML = `
            <div class="modal-content upload-modal">
                <div class="modal-header">
                    <h3>Enviar Música</h3>
                    <button class="modal-close-btn" aria-label="Fechar">&times;</button>
                </div>
                <div class="upload-form">
                    <div class="form-group">
                        <label for="uploadAudioFile">Arquivo de Áudio *</label>
                        <input type="file" id="uploadAudioFile" accept="audio/*" required>
                        <small>Formatos aceitos: MP3, WAV, OGG, etc.</small>
                    </div>
                    <div class="form-group">
                        <label for="uploadSongName">Nome da Música *</label>
                        <input type="text" id="uploadSongName" placeholder="Digite o nome da música" required>
                    </div>
                    <div class="form-group">
                        <label for="uploadArtist">Artista *</label>
                        <input type="text" id="uploadArtist" placeholder="Digite o nome do artista" required>
                    </div>
                    <div class="form-group">
                        <label for="uploadCover">Capa do Álbum</label>
                        <input type="file" id="uploadCover" accept="image/*">
                        <small>Opcional: Se não selecionar, será usada uma capa padrão</small>
                        <div class="cover-preview" id="coverPreview" style="display: none;">
                            <img id="coverPreviewImg" alt="Preview da capa">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancelar</button>
                        <button type="button" class="btn-submit" id="submitUpload">Enviar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Preview da capa
        const coverInput = modal.querySelector('#uploadCover');
        const coverPreview = modal.querySelector('#coverPreview');
        const coverPreviewImg = modal.querySelector('#coverPreviewImg');

        coverInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    coverPreviewImg.src = event.target.result;
                    coverPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                coverPreview.style.display = 'none';
            }
        });

        // Auto-preenche nome e artista do arquivo
        const audioInput = modal.querySelector('#uploadAudioFile');
        const nameInput = modal.querySelector('#uploadSongName');
        const artistInput = modal.querySelector('#uploadArtist');

        audioInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && !nameInput.value && !artistInput.value) {
                const fileName = file.name.replace(/\.[^/.]+$/, '');
                if (fileName.includes(' - ')) {
                    const parts = fileName.split(' - ');
                    artistInput.value = parts[0].trim();
                    nameInput.value = parts.slice(1).join(' - ').trim();
                } else {
                    nameInput.value = fileName;
                }
            }
        });

        // Botão de submit
        const submitBtn = modal.querySelector('#submitUpload');
        submitBtn.addEventListener('click', () => {
            this.handleUploadFromModal(modal);
        });

        // Botão cancelar
        const cancelBtn = modal.querySelector('.btn-cancel');
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Fechar modal
        const closeBtn = modal.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    async handleUploadFromModal(modal) {
        const audioFile = modal.querySelector('#uploadAudioFile').files[0];
        const songName = modal.querySelector('#uploadSongName').value.trim();
        const artist = modal.querySelector('#uploadArtist').value.trim();
        const coverFile = modal.querySelector('#uploadCover').files[0];

        // Validações
        if (!audioFile) {
            this.showError('Por favor, selecione um arquivo de áudio');
            return;
        }

        if (!songName) {
            this.showError('Por favor, digite o nome da música');
            return;
        }

        if (!artist) {
            this.showError('Por favor, digite o nome do artista');
            return;
        }

        try {
            const duration = await this.getAudioDuration(audioFile);
            const trackUrl = await this.uploadFile('tracks', audioFile);
            const coverUrl = coverFile
                ? await this.uploadFile('covers', coverFile)
                : 'img/notFound.png';

            const session = await supabase.auth.getSession();
            const userId = session?.data?.session?.user?.id || null;

            const { data, error } = await supabase
                .from('songs')
                .insert({
                    name: songName,
                    artist,
                    cover: coverUrl,
                    file: trackUrl,
                    duration: Math.floor(duration),
                    uploaded: true,
                    file_name: audioFile.name,
                    user_id: userId
                })
                .select()
                .single();

            if (error) throw error;

            // Update local storage for immediate display (fallback/cache)
            const uploadedSongs = Storage.getUploadedSongs();
            uploadedSongs.push(data);
            Storage.saveUploadedSongs(uploadedSongs);

            this.showSuccess('Música adicionada com sucesso!');
            modal.remove();
            loadSongs();
        } catch (error) {
            console.error('Erro ao processar upload:', error);
            this.showError(`Erro ao processar: ${error.message}`);
        }
    },

    async getAudioDuration(file) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.src = URL.createObjectURL(file);
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(audio.src);
                resolve(audio.duration || 0);
            }, { once: true });
            audio.addEventListener('error', () => {
                URL.revokeObjectURL(audio.src);
                reject(new Error('Não foi possível ler o áudio'));
            }, { once: true });
        });
    },

    async uploadFile(bucket, file) {
        const session = await supabase.auth.getSession();
        const userId = session?.data?.session?.user?.id;
        
        const filePath = userId 
            ? `${bucket}/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            : `${bucket}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const {
            data: { publicUrl }
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        return publicUrl;
    },

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

