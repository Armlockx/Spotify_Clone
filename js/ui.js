// UI helpers: color extraction and gradient application
export function isLightColor(rgb) {
    if (!rgb || typeof rgb !== 'string') return false;
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return false;
    const [r, g, b] = matches.map(Number);

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.5;
}

export function extractDominantColors(imgElement) {
    // ColorThief is a global lib loaded in index.html
    if (typeof ColorThief === 'undefined') throw new Error('ColorThief não disponível');
    
    // Verifica se a imagem está completa e tem dimensões válidas
    if (!imgElement.complete || imgElement.naturalWidth === 0) {
        throw new Error('Imagem não está carregada completamente');
    }
    
    // Verifica se a imagem tem crossorigin configurado para evitar CORS errors
    if (imgElement.crossOrigin === null && imgElement.src && !imgElement.src.startsWith('data:') && !imgElement.src.startsWith(window.location.origin)) {
        // Se a imagem é de outro domínio e não tem crossorigin, pode causar erro
        console.warn('Imagem pode ter problemas de CORS:', imgElement.src);
    }
    
    try {
        const colorThief = new ColorThief();
        const colors = colorThief.getPalette(imgElement, 2);
        return colors.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    } catch (e) {
        // Se falhar por CORS, retorna cores padrão
        if (e.message && (e.message.includes('tainted') || e.message.includes('cross-origin'))) {
            console.warn('Não foi possível extrair cores devido a CORS, usando cores padrão');
            return ['rgb(30, 30, 30)', 'rgb(50, 50, 50)']; // Cores padrão escuras
        }
        throw e;
    }
}

export function applyGradientToPlayer(colors) {
    const player = document.querySelector('.player');
    const songTitle = document.querySelector('.song__title');
    if (!player || !Array.isArray(colors) || colors.length < 2) return;

    try {
        if (isLightColor(colors[1])) {
            player.style.background = `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`;
            if (songTitle) songTitle.style.color = colors[1];
        } else if (isLightColor(colors[0]) && songTitle !== null) {
            player.style.background = `linear-gradient(45deg, ${colors[1]}, ${colors[0]})`;
            if (songTitle) songTitle.style.color = colors[0];
        }
    } catch (e) {
        console.warn('applyGradientToPlayer erro:', e);
    }
}

// Volume range visual helper
export function setRangeBackground(rangeInput) {
    if (!rangeInput) return;
    const min = +rangeInput.min || 0;
    const max = +rangeInput.max || 1;
    const value = +rangeInput.value;
    const size = ((value - min) / (max - min)) * 100;
    rangeInput.style.setProperty('--background-size', `${size}%`);
}
