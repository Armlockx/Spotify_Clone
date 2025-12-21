import { supabase } from './supabaseClient.js';

const Auth = {
    currentUser: null,
    ready: false,
    onUpdateCallbacks: [],

    async init() {
        this.attachSidebarButton();

        // Verificar sessão existente
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await this.handleSession(session);
        }

        // Listener para mudanças de autenticação
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await this.handleSession(session);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.updateButton();
                this.notifyUpdate(null);
            }
        });

        this.createTopBarButton();
        this.ready = true;
    },

    createTopBarButton() {
        if (document.getElementById('authBtn')) return;

        const authBtn = document.createElement('button');
        authBtn.id = 'authBtn';
        authBtn.className = 'auth-profile-btn';
        authBtn.setAttribute('aria-label', 'Minha Conta');
        authBtn.setAttribute('role', 'button');
        authBtn.setAttribute('type', 'button');

        authBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showAuthModal();
        });

        // Adiciona ao header-right (ao lado do botão de upload e toggle de tema)
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.appendChild(authBtn);
        } else {
            document.body.appendChild(authBtn);
        }
        this.updateButton();
    },

    attachSidebarButton() {
        // Não adiciona mais na sidebar, será criado no topo
    },

    async handleSession(session) {
        if (!session || !session.user) {
            this.currentUser = null;
            this.updateButton();
            return;
        }

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        this.currentUser = {
            ...session.user,
            profile: profile || null
        };

        this.updateButton();
        this.notifyUpdate(this.currentUser);
    },

    updateButton() {
        const authBtn = document.getElementById('authBtn');
        if (!authBtn) return;

        if (this.currentUser) {
            const avatarUrl = this.currentUser.profile?.avatar_url || null;
            
            if (avatarUrl) {
                authBtn.innerHTML = `<img src="${avatarUrl}" alt="Perfil" class="profile-avatar">`;
                authBtn.classList.add('has-avatar');
            } else {
                const username = this.currentUser.profile?.username || this.currentUser.email?.split('@')[0] || 'U';
                const initials = username.substring(0, 2).toUpperCase();
                authBtn.innerHTML = `<span class="profile-initials">${initials}</span>`;
                authBtn.classList.remove('has-avatar');
            }
            authBtn.title = 'Minha Conta';
        } else {
            authBtn.innerHTML = '<i class="fas fa-user"></i>';
            authBtn.classList.remove('has-avatar');
            authBtn.title = 'Entrar ou Registrar';
        }
    },

    onUpdate(callback) {
        if (typeof callback === 'function') {
            this.onUpdateCallbacks.push(callback);
            // Se já há usuário, chama imediatamente
            if (this.currentUser) {
                callback(this.currentUser);
            }
        }
    },

    notifyUpdate(user) {
        this.onUpdateCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Erro ao notificar atualização de auth:', error);
            }
        });
    },

    getCurrentUser() {
        return this.currentUser;
    },

    showAuthModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal modal-overlay';
        
        // Se o usuário estiver logado, mostra modal de conta
        if (this.currentUser) {
            const profile = this.currentUser.profile || {};
            const avatarUrl = profile.avatar_url || null;
            const username = profile.username || this.currentUser.email?.split('@')[0] || 'Usuário';
            const email = this.currentUser.email || '';
            
            modal.innerHTML = `
                <div class="modal-content auth-modal-content account-modal">
                    <div class="modal-header">
                        <h3>Minha Conta</h3>
                        <button class="modal-close-btn" id="authClose" aria-label="Fechar">&times;</button>
                    </div>
                    <div class="account-info">
                        <div class="account-avatar">
                            ${avatarUrl 
                                ? `<img src="${avatarUrl}" alt="${username}" class="account-avatar-img">`
                                : `<div class="account-avatar-placeholder">${username.substring(0, 2).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="account-details">
                            <h4 class="account-username">${username}</h4>
                            <p class="account-email">${email}</p>
                        </div>
                    </div>
                    <div class="account-actions">
                        <button class="btn-logout">Sair</button>
                    </div>
                </div>
            `;
        } else {
            // Se não estiver logado, mostra modal de login/registro
            modal.innerHTML = `
                <div class="modal-content auth-modal-content">
                    <div class="modal-header">
                        <h3>Entrar</h3>
                        <button class="modal-close-btn" id="authClose" aria-label="Fechar">&times;</button>
                    </div>
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Entrar</button>
                        <button class="auth-tab" data-tab="register">Registrar</button>
                    </div>
                    <form id="loginForm" class="auth-form" data-tab="login">
                        <div class="form-group">
                            <label for="authEmail">Email</label>
                            <input id="authEmail" type="email" required>
                        </div>
                        <div class="form-group">
                            <label for="authPassword">Senha</label>
                            <input id="authPassword" type="password" required>
                        </div>
                        <div class="auth-error" id="loginError" style="display: none;"></div>
                        <button type="submit" class="btn-submit">Entrar</button>
                    </form>
                    <form id="registerForm" class="auth-form" data-tab="register" style="display:none;">
                        <div class="form-group">
                            <label for="authEmailRegister">Email</label>
                            <input id="authEmailRegister" type="email" required>
                        </div>
                        <div class="form-group">
                            <label for="authUsernameRegister">Nome de usuário (3-30 caracteres)</label>
                            <input id="authUsernameRegister" type="text" required pattern="[a-zA-Z0-9_-]{3,30}" title="3-30 caracteres, apenas letras, números, _ e -">
                            <small>Apenas letras, números, _ e -</small>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Senha</label>
                            <input id="registerPassword" type="password" placeholder="Mínimo 8 caracteres" required autocomplete="new-password" minlength="8">
                        </div>
                        <div class="form-group">
                            <label for="registerPasswordConfirm">Confirmar Senha</label>
                            <input type="password" id="registerPasswordConfirm" placeholder="Digite a senha novamente" required autocomplete="new-password" minlength="8">
                        </div>
                        <div class="form-group">
                            <label for="registerAvatar" style="color: var(--text-secondary); font-size: 14px;">Imagem de perfil (opcional)</label>
                            <input type="file" id="registerAvatar" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp">
                            <small>Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)</small>
                        </div>
                        <div class="auth-error" id="registerError" style="display: none;"></div>
                        <button type="submit" class="btn-submit">Registrar</button>
                    </form>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        this.attachAuthModalEvents(modal);
    },

    attachAuthModalEvents(modal) {
        const closeBtn = modal.querySelector('#authClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Se o usuário estiver logado, apenas anexa eventos do botão de logout
        if (this.currentUser) {
            const logoutBtn = modal.querySelector('.btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout();
                    modal.remove();
                });
            }
            return; // Não precisa anexar eventos de login/registro
        }

        // Se não estiver logado, anexa eventos dos formulários de login/registro
        // Tabs
        const tabs = modal.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchAuthTab(modal, tabName);
            });
        });

        // Login form
        const loginForm = modal.querySelector('#loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = loginForm.querySelector('#authEmail').value.trim();
                const password = loginForm.querySelector('#authPassword').value.trim();
                await this.signIn(email, password);
            });
        }

        // Register form
        const registerForm = modal.querySelector('#registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = registerForm.querySelector('#authEmailRegister').value.trim();
                const username = registerForm.querySelector('#authUsernameRegister').value.trim();
                const password = registerForm.querySelector('#registerPassword').value.trim();
                const confirmPassword = registerForm.querySelector('#registerPasswordConfirm').value.trim();
                const avatarFile = registerForm.querySelector('#registerAvatar').files[0];
                await this.signUp(email, username, password, confirmPassword, avatarFile);
            });
        }
    },

    switchAuthTab(modal, tabName) {
        const tabs = modal.querySelectorAll('.auth-tab');
        const forms = modal.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        forms.forEach(form => {
            form.style.display = form.dataset.tab === tabName ? 'block' : 'none';
        });
    },

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    async signIn(email, password) {
        this.showAuthError('login', '');

        if (!this.validateEmail(email)) {
            this.showAuthError('login', 'Por favor, digite um email válido.');
            return false;
        }

        if (!password) {
            this.showAuthError('login', 'Por favor, digite sua senha.');
            return false;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                let errorMessage = 'Erro ao fazer login.';
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Email ou senha incorretos.';
                } else if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
                    errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada e spam.';
                } else if (error.message.includes('signup_disabled')) {
                    errorMessage = 'Cadastros estão desabilitados no momento.';
                } else {
                    errorMessage = 'Erro: ' + error.message;
                }
                this.showAuthError('login', errorMessage);
                return false;
            }

            if (!data.user) {
                this.showAuthError('login', 'Erro ao fazer login. Tente novamente.');
                return false;
            }

            this.showAuthSuccess('login', 'Login realizado com sucesso!');
            document.querySelector('.auth-modal')?.remove();
            return true;
        } catch (error) {
            console.error('Erro inesperado no login:', error);
            this.showAuthError('login', 'Erro inesperado. Tente novamente.');
            return false;
        }
    },

    async signUp(email, username, password, confirmPassword, avatarFile) {
        this.showAuthError('register', '');

        // Validações
        if (!this.validateEmail(email)) {
            this.showAuthError('register', 'Por favor, digite um email válido.');
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
        const trimmedUsername = username ? username.trim() : '';
        if (!trimmedUsername || trimmedUsername.length < 3) {
            this.showAuthError('register', 'O nome de usuário deve ter no mínimo 3 caracteres!');
            return;
        }
        if (trimmedUsername.length > 30) {
            this.showAuthError('register', 'O nome de usuário deve ter no máximo 30 caracteres!');
            return;
        }
        if (!usernameRegex.test(trimmedUsername)) {
            this.showAuthError('register', 'O nome de usuário só pode conter letras, números, _ e -');
            return;
        }

        if (password.length < 8) {
            this.showAuthError('register', 'A senha deve ter no mínimo 8 caracteres!');
            return;
        }

        if (password !== confirmPassword) {
            this.showAuthError('register', 'As senhas não coincidem!');
            return;
        }

        let avatarUrl = null;
        if (avatarFile) {
            const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
            const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (avatarFile.size > MAX_AVATAR_SIZE) {
                this.showAuthError('register', 'A imagem de perfil é muito grande (máximo 5MB).');
                return;
            }
            if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
                this.showAuthError('register', 'Tipo de imagem não suportado.');
                return;
            }
        }

        // Criar usuário no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: trimmedUsername
                },
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            this.showAuthError('register', 'Erro: ' + error.message);
            return;
        }

        if (!data.user) {
            this.showAuthError('register', 'Erro ao criar usuário');
            return;
        }

        // Upload do avatar se existir
        if (avatarFile) {
            try {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${data.user.id}-${Date.now()}.${fileExt}`;
                const filePath = `Avatars/${fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from('v-p-player')
                    .upload(filePath, avatarFile);
                if (uploadError) {
                    console.error('Erro ao fazer upload do avatar:', uploadError);
                } else {
                    const { data: urlData } = supabase.storage.from('v-p-player').getPublicUrl(filePath);
                    avatarUrl = urlData.publicUrl;
                }
            } catch (avatarError) {
                console.error('Erro ao processar avatar:', avatarError);
            }
        }

        // Criar perfil via RPC
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_profile', {
                user_id: data.user.id,
                user_username: trimmedUsername,
                user_avatar_url: avatarUrl,
                user_email: email
            });

            if (rpcError) {
                console.warn('Erro ao criar perfil via RPC:', rpcError);
                this.showAuthError('register', 'Registro realizado! Verifique seu email para confirmar a conta. Nota: Houve um problema ao criar o perfil, mas você pode fazer login.');
            } else {
                this.showAuthSuccess('register', 'Registro realizado! Verifique seu email para confirmar a conta.');
            }
        } catch (rpcException) {
            console.error('Exceção ao tentar criar perfil via RPC:', rpcException);
            this.showAuthError('register', 'Registro realizado! Verifique seu email para confirmar a conta. Nota: Houve um problema ao criar o perfil, mas você pode fazer login.');
        }
    },

    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error);
            return false;
        }
        this.currentUser = null;
        this.updateButton();
        this.notifyUpdate(null);
        return true;
    },

    showAuthError(formType, message) {
        const errorEl = document.getElementById(`${formType}Error`);
        if (errorEl) {
            if (message) {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
            } else {
                errorEl.style.display = 'none';
            }
        }
    },

    showAuthSuccess(formType, message) {
        const errorEl = document.getElementById(`${formType}Error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.color = '#1DB954';
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }
};

export { Auth };

