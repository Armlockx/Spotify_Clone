// Visualização de áudio em tempo real (waveform)
const audioPlayer = document.getElementById('audioplayer');

export const Waveform = {
    canvas: null,
    ctx: null,
    analyser: null,
    dataArray: null,
    animationFrame: null,
    isActive: false,

    init() {
        this.createWaveformCanvas();
        this.setupAudioContext();
    },

    createWaveformCanvas() {
        const playerControl = document.querySelector('.player__control');
        if (!playerControl) return;

        // Verifica se já existe
        if (document.getElementById('waveformCanvas')) return;

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'waveform-container';
        canvasContainer.innerHTML = '<canvas id="waveformCanvas"></canvas>';

        const progressContainer = document.querySelector('.player__control__progress');
        if (progressContainer && progressContainer.parentNode) {
            progressContainer.parentNode.insertBefore(canvasContainer, progressContainer);
        }

        this.canvas = document.getElementById('waveformCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth || 600;
            this.canvas.height = 80;
        }
    },

    setupAudioContext() {
        if (!audioPlayer) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('AudioContext não suportado');
                return;
            }

            const audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(audioPlayer);
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            this.analyser.connect(audioContext.destination);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Inicia visualização quando áudio começa a tocar
            audioPlayer.addEventListener('play', () => {
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                this.start();
            });

            audioPlayer.addEventListener('pause', () => {
                this.stop();
            });

            audioPlayer.addEventListener('ended', () => {
                this.stop();
            });
        } catch (error) {
            console.warn('Erro ao configurar AudioContext:', error);
        }
    },

    start() {
        if (this.isActive || !this.canvas || !this.ctx || !this.analyser) return;
        this.isActive = true;
        this.animate();
    },

    stop() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        // Limpa o canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    animate() {
        if (!this.isActive || !this.analyser || !this.ctx || !this.canvas) return;

        this.animationFrame = requestAnimationFrame(() => this.animate());

        this.analyser.getByteFrequencyData(this.dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;
        const barWidth = width / this.dataArray.length;

        this.ctx.clearRect(0, 0, width, height);

        // Cor baseada no tema
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, isDark ? '#1DB954' : '#1ed760');
        gradient.addColorStop(1, isDark ? '#1ed760' : '#1DB954');

        this.ctx.fillStyle = gradient;

        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.8;
            const x = i * barWidth;
            const y = height - barHeight;

            // Desenha barra arredondada
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
    },

    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }
};

