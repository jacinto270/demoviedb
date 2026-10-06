/* ==========================================================================
   ARCHIVOS DE NEVERMORE - LÓGICA DE LA APLICACIÓN (ESPAÑOL POR DEFECTO)
   Motor de Búsqueda, Traducción Automática, Bóvedas Addams & Cosa
   ========================================================================== */

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let folders = JSON.parse(localStorage.getItem('nevermore_addams_vaults')) || {
    '⚰️ Cripta de Favoritas': [],
    '🥀 Invernadero de Morticia': [],
    '🧪 Experimentos de Miércoles': [],
    '🖐️ Secretos de Cosa': []
};

let currentSearchResults = [];
let isSoundEnabled = localStorage.getItem('nevermore_sound_enabled') !== 'false';
let audioCtx = null;

// Diccionario de Mapeo de Búsquedas en Español -> Nombres Oficiales de la API TVmaze
const spanishQueryMap = {
    'miercoles': 'Wednesday',
    'miércoles': 'Wednesday',
    'miercoles addams': 'Wednesday',
    'miércoles addams': 'Wednesday',
    'la familia addams': 'The Addams Family',
    'familia addams': 'The Addams Family',
    'los locos addams': 'The Addams Family',
    'cosas extrañas': 'Stranger Things',
    'juego de tronos': 'Game of Thrones',
    'la casa del dragon': 'House of the Dragon',
    'la casa del dragón': 'House of the Dragon',
    'el juego del calamar': 'Squid Game',
    'ataque a los titanes': 'Attack on Titan',
    'ataque de los titanes': 'Attack on Titan',
    'entrevista con el vampiro': 'Interview with the Vampire',
    'expediente x': 'The X-Files',
    'archivos x': 'The X-Files',
    'terror americano': 'American Horror Story',
    'historias de terror': 'American Horror Story',
    'el señor de los anillos': 'The Lord of the Rings',
    'el senor de los anillos': 'The Lord of the Rings',
    'peaky blinders': 'Peaky Blinders',
    'las escalofriantes aventuras de sabrina': 'Chilling Adventures of Sabrina',
    'el cuento de la criada': 'The Handmaid\'s Tale'
};

// Diccionario de Traducción de Géneros
const genreTranslations = {
    'Action': 'Acción',
    'Adventure': 'Aventura',
    'Animation': 'Animación',
    'Anime': 'Anime',
    'Children': 'Infantil',
    'Comedy': 'Comedia',
    'Crime': 'Crimen',
    'DIY': 'Bricolaje',
    'Drama': 'Drama',
    'Espionage': 'Espionaje',
    'Family': 'Familiar',
    'Fantasy': 'Fantasía',
    'Food': 'Gastronomía',
    'History': 'Historia',
    'Horror': 'Terror',
    'Legal': 'Legal',
    'Medical': 'Médico',
    'Music': 'Música',
    'Mystery': 'Misterio',
    'Nature': 'Naturaleza',
    'Romance': 'Romance',
    'Science-Fiction': 'Ciencia Ficción',
    'Sci-Fi': 'Ciencia Ficción',
    'Sports': 'Deportes',
    'Supernatural': 'Sobrenatural',
    'Suspense': 'Suspenso',
    'Thriller': 'Suspenso',
    'Travel': 'Viajes',
    'War': 'Bélico',
    'Western': 'Western'
};

// Diccionario de Traducción de Estados de Series
const statusTranslations = {
    'Running': 'En emisión',
    'Ended': 'Finalizada',
    'To Be Determined': 'Por determinar',
    'In Development': 'En desarrollo',
    'Pilot': 'Episodio Piloto',
    'Canceled': 'Cancelada'
};

// Diccionario de Idiomas
const languageTranslations = {
    'English': 'Inglés',
    'Spanish': 'Español',
    'French': 'Francés',
    'German': 'Alemán',
    'Japanese': 'Japonés',
    'Korean': 'Coreano',
    'Italian': 'Italiano',
    'Portuguese': 'Portugués',
    'Russian': 'Ruso',
    'Swedish': 'Sueco',
    'Danish': 'Danés',
    'Norwegian': 'Noruego'
};

// Sinopsis célebres precargadas en español para respuesta inmediata sin esperas
const preloadedSpanishSummaries = {
    'Wednesday': 'Miércoles Addams es una perspicaz estudiante en la Academia Nevermore donde intenta dominar sus emergentes poderes psíquicos, frustrar una monstruosa ola de asesinatos que aterroriza a la ciudad local y resolver el misterio sobrenatural que involucró a sus padres hace veinticinco años.',
    'The Addams Family': 'Las macabras y divertidas vivencias de la aristocrática familia Addams, un clan que se deleita en lo siniestro y lo gótico sin percatarse de que el resto de la sociedad los considera extravagantes y aterradores.',
    'Dark': 'La misteriosa desaparición de dos niños en una pequeña localidad alemana desentierra secretos familiares, viajes temporales y una intrincada conspiración que conecta a cuatro familias a lo largo de tres generaciones.',
    'Penny Dreadful': 'En los rincones más oscuros del Londres victoriano, el explorador Sir Malcolm Murray, el pistolero Ethan Chandler y la clarividente Vanessa Ives unen sus fuerzas para hacer frente a amenazas sobrenaturales salidas de los clásicos del terror gótico.',
    'Stranger Things': 'Tras la repentina desaparición de un niño en Hawkins, un grupo de amigos desvela una serie de experimentos ultrasecretos del gobierno, aterradoras fuerzas sobrenaturales y una niña dotada de extraños poderes telequinéticos.',
    'American Horror Story': 'Serie antológica de terror donde cada temporada sumerge al espectador en un escenario macabro diferente: desde casas embrujadas y manicomios victorianos hasta aquelarres de brujas y circos de fenómenos.',
    'Interview with the Vampire': 'Una cautivadora historia de amor, sangre y las consecuencias de la inmortalidad protagonizada por los vampiros Louis de Pointe du Lac, Lestat de Lioncourt y Claudia en el Nueva Orleans de inicios del siglo XX.',
    'Castlevania': 'Inspirada en el legendario videojuego, sigue al último miembro sobreviviente del caído clan Belmont en su lucha para salvar a Europa del Este de la extinción a manos de un enfurecido Conde Drácula.'
};

// Caché en memoria para sinopsis traducidas
const translationCache = {};

// Citas célebres de Miércoles Addams (en español)
const wednesdayQuotes = [
    "\"Actúo como si no me importara si la gente me odia. En el fondo... lo disfruto secretamente.\"",
    "\"Las emociones son una debilidad biológica que he aprendido a reprimir con gran éxito.\"",
    "\"Uso el negro porque refleja el color de mi alma. Y porque no me gusta que me confundan con un arcoíris.\"",
    "\"No creo en el cielo ni en el infierno, pero creo firmemente en una venganza implacable.\"",
    "\"Para que conste: no tengo ningún interés en participar en actividades tribales de adolescentes.\"",
    "\"Amo el olor a lluvia ácida y las viejas criptas familiares al anochecer.\"",
    "\"Si te metes con mi familia... aprenderás lo que significa una pesadilla sin despertar.\"",
    "\"Enterrar vivos los problemas suele ser la solución más práctica y elegante.\""
];

let currentQuoteIndex = 0;

// Frases interactivas de Cosa (The Thing) en español
const thingMessages = [
    "🖐️ ¡Snap! ¡Snap! Cosa tamborilea sus dedos con impaciencia...",
    "🖐️ Cosa te advierte: ¡Cuidado con lo que guardas en esta cripta!",
    "🖐️ Cosa te entrega una rosa negra recién decapitada por Morticia.",
    "🖐️ Cosa revisa las costuras de su muñeca y asiente satisfecho.",
    "🖐️ ¡Cosa dice: Miércoles te está buscando para practicar tiro con ballesta!",
    "🖐️ Cosa te hace la señal clásica Addams de aprobación. ¡Magnífica serie!",
    "🖐️ ¡Cosa correteó sigilosamente y organizó tus favoritos en las sombras!"
];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    updateSoundUI();
    renderFolders();
    scheduleThingCycle();
    startQuoteAutoCycle();

    // Búsqueda inicial por defecto con "Miércoles" (Wednesday)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = 'Miércoles';
        searchShow();
    }
});

// ==========================================================================
// 1. TRADUCCIÓN AUTOMÁTICA AL ESPAÑOL
// ==========================================================================

function translateGenre(genre) {
    return genreTranslations[genre] || genre;
}

function translateStatus(status) {
    return statusTranslations[status] || status || 'Desconocido';
}

function translateLanguage(lang) {
    return languageTranslations[lang] || lang || 'Español';
}

// Traductor de sinopsis al español con soporte para timeout y caché
async function getSpanishSummary(showName, englishSummary) {
    // 1. Revisar si tenemos sinopsis artesanal precargada
    if (preloadedSpanishSummaries[showName]) {
        return preloadedSpanishSummaries[showName];
    }

    if (!englishSummary) {
        return 'Sin descripción disponible en los registros oscuros.';
    }

    const cleanEnglish = englishSummary.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanEnglish) {
        return 'Sin descripción disponible.';
    }

    // 2. Revisar caché en memoria
    if (translationCache[cleanEnglish]) {
        return translationCache[cleanEnglish];
    }

    // 3. Traducir fragmento mediante servicio público con AbortController (máx 2.5s)
    try {
        const snippet = cleanEnglish.substring(0, 480);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(snippet)}&langpair=en|es`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
            let translated = data.responseData.translatedText.trim();
            // Filtrar mensajes de error o cuotas
            if (!translated.toLowerCase().includes('quota') && !translated.toLowerCase().includes('mymemory')) {
                translationCache[cleanEnglish] = translated;
                return translated;
            }
        }
    } catch (e) {
        // En caso de corte de red o timeout, continuar
    }

    // Si falló el traductor, devolver texto original limpio
    return cleanEnglish;
}

// ==========================================================================
// 2. SISTEMA DE AUDIO GÓTICO CON WEB AUDIO API
// ==========================================================================

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function toggleSoundEffect() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('nevermore_sound_enabled', isSoundEnabled);
    updateSoundUI();
    if (isSoundEnabled) {
        playSnapSound();
    }
}

function updateSoundUI() {
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');
    if (icon && text) {
        icon.textContent = isSoundEnabled ? '🔊' : '🔇';
        text.textContent = isSoundEnabled ? 'Audio Activo' : 'Silencio';
    }
}

// Chasquido doble característico Addams ("Snap! Snap!")
function playSnapSound() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        
        function singleSnap(timeOffset) {
            const now = ctx.currentTime + timeOffset;
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2400, now);
            filter.Q.setValueAtTime(3.5, now);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start(now);
        }

        singleSnap(0.0);
        singleSnap(0.24);
    } catch (e) {
        console.warn('Audio no disponible:', e);
    }
}

// Tono grave de violonchelo gótico
function playCelloTone() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(108, now + 1.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);
        filter.frequency.linearRampToValueAtTime(220, now + 1.2);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
    } catch (e) {
        console.warn(e);
    }
}

// Trueno oscuro al provocar el susto
function playThunderSound() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const dur = 2.0;

        const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.linearRampToValueAtTime(60, now + dur);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    } catch (e) {
        console.warn(e);
    }
}

// ==========================================================================
// 3. CITAS DE MIÉRCOLES & EFECTO CHASQUIDO
// ==========================================================================

function cycleQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % wednesdayQuotes.length;
    const quoteEl = document.getElementById('wednesdayQuote');
    if (!quoteEl) return;

    quoteEl.style.opacity = '0';
    setTimeout(() => {
        quoteEl.textContent = wednesdayQuotes[currentQuoteIndex];
        quoteEl.style.opacity = '1';
    }, 250);
}

function startQuoteAutoCycle() {
    setInterval(() => {
        cycleQuote();
    }, 18000);
}

function triggerAddamsSnap() {
    playSnapSound();

    const ripple = document.createElement('div');
    ripple.className = 'snap-ripple';
    document.body.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 800);

    const thing = document.getElementById('thing-container');
    if (thing) {
        thing.classList.add('appear');
        showThingBubble("¡Snap! ¡Snap! 🫰 Cosa responde al compás de la familia.");
    }
}

// ==========================================================================
// 4. BÚSQUEDA INTELIGENTE EN ESPAÑOL CON TVMAZE
// ==========================================================================

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        searchShow();
    }
}

function quickSearch(apiQuery, displayName) {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = displayName || apiQuery;
        executeSearchQuery(apiQuery);
    }
}

async function searchShow() {
    const input = document.getElementById('searchInput');
    const userQuery = input ? input.value.trim() : '';
    if (!userQuery) return;

    // Traducir consulta en español si existe en el diccionario
    const normalized = userQuery.toLowerCase();
    const queryToFetch = spanishQueryMap[normalized] || userQuery;

    await executeSearchQuery(queryToFetch, userQuery);
}

async function executeSearchQuery(apiQuery, displayLabel) {
    playCelloTone();

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; background: rgba(14,10,22,0.7); border-radius: 14px; border: 1px solid rgba(142,68,173,0.3);">
            <div style="font-size: 2.5rem; margin-bottom: 12px; animation: spinGothic 2s infinite linear;">🔮</div>
            <p style="font-family: var(--font-subheading); color: #d8b4fe; letter-spacing: 1.5px; font-size: 1.05rem;">
                Conjurando los archivos secretos de Nevermore...
            </p>
            <p style="color: #64748b; font-size: 0.85rem; margin-top: 6px;">Buscando expedientes para "${escapeHtml(displayLabel || apiQuery)}"</p>
        </div>
    `;

    try {
        let response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(apiQuery)}`);
        let data = await response.json();

        // Si la búsqueda no arroja resultados y era una consulta directa, reintentar con búsqueda general
        if ((!data || data.length === 0) && displayLabel && displayLabel !== apiQuery) {
            response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(displayLabel)}`);
            data = await response.json();
        }

        if (!data || data.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 50px 20px; background: rgba(14,10,22,0.7); border-radius: 14px; border: 1px dashed rgba(142,68,173,0.4);">
                    <div style="font-size: 3rem; margin-bottom: 10px;">⚰️</div>
                    <h3 style="font-family: var(--font-subheading); color: #f1f5f9; font-size: 1.3rem; margin-bottom: 6px;">No se encontraron vestigios</h3>
                    <p style="color: #94a3b8; font-size: 0.95rem;">El oráculo no halla ninguna serie bajo ese nombre. Prueba con otra invocación oscura.</p>
                </div>
            `;
            return;
        }

        currentSearchResults = data;
        resultsContainer.innerHTML = `
            <div class="results-header-info">
                <span>Resultados hallados en el oráculo: <span class="results-count">${data.length}</span></span>
                <span style="font-size: 0.8rem; color: #a855f7;">• Academia Nevermore •</span>
            </div>
        `;

        // Renderizar hasta 8 resultados principales con detalles y sinopsis en español
        const limitedList = data.slice(0, 8);
        for (const item of limitedList) {
            const show = item.show;
            const details = await fetchShowDetails(show.id);
            const spanishSummary = await getSpanishSummary(show.name, show.summary);
            renderShowCard(show, details, spanishSummary);
        }

    } catch (error) {
        console.error('Error al consultar TVmaze:', error);
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: rgba(30,10,18,0.7); border-radius: 14px; border: 1px solid rgba(244,63,94,0.4);">
                <p style="color: #f43f5e; font-family: var(--font-subheading); font-size: 1.1rem;">
                    ☠️ Error al conectar con el oráculo de TVmaze.
                </p>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 6px;">Comprueba tu conexión o vuelve a invocar más tarde.</p>
            </div>
        `;
    }
}

// Obtener datos detallados de temporadas y episodios
async function fetchShowDetails(showId) {
    try {
        const res = await fetch(`https://api.tvmaze.com/shows/${showId}?embed[]=seasons&embed[]=episodes`);
        const data = await res.json();
        const seasonsCount = data._embedded ? data._embedded.seasons.length : '?';
        const episodesCount = data._embedded ? data._embedded.episodes.length : '?';
        return { 
            seasonsCount, 
            episodesCount, 
            rating: data.rating ? data.rating.average : null,
            premiered: data.premiered ? data.premiered.substring(0, 4) : '—',
            genres: (data.genres || []).map(translateGenre),
            network: data.network ? data.network.name : (data.webChannel ? data.webChannel.name : 'Desconocida'),
            status: translateStatus(data.status),
            language: translateLanguage(data.language),
            officialSite: data.officialSite,
            rawSummary: data.summary,
            fullData: data
        };
    } catch (e) {
        return { 
            seasonsCount: '?', 
            episodesCount: '?', 
            rating: null, 
            premiered: '—', 
            genres: ['Misterio'], 
            network: 'Desconocida', 
            status: 'Desconocido',
            language: 'Español',
            officialSite: null, 
            rawSummary: '',
            fullData: null 
        };
    }
}

// Renderizado de tarjeta de serie en español
function renderShowCard(show, details, spanishSummary) {
    const resultsContainer = document.getElementById('resultsContainer');

    const posterImg = show.image && show.image.medium 
        ? show.image.medium 
        : 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80';

    const ratingDisplay = details.rating ? `💀 ${details.rating}` : '💀 Sin Nota';

    const genreBadges = (details.genres && details.genres.length > 0)
        ? details.genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')
        : '<span class="genre-tag">Misterio Gótico</span>';

    const card = document.createElement('div');
    card.className = 'show-card';

    // Generar opciones de carpetas/bóvedas
    const folderOptions = Object.keys(folders)
        .map(f => `<option value="${f}">${f}</option>`)
        .join('');

    card.innerHTML = `
        <div class="poster-container">
            <img src="${posterImg}" class="show-poster" alt="${escapeHtml(show.name)}" loading="lazy">
            <div class="poster-rating-badge">${ratingDisplay}</div>
        </div>

        <div class="show-details">
            <div class="show-title-row">
                <h3 class="show-title">${escapeHtml(show.name)}</h3>
                <span class="show-year-badge">${details.premiered}</span>
            </div>

            <div class="genre-tags">
                ${genreBadges}
            </div>

            <div class="show-stats">
                <span class="stat-badge">📑 Temporadas: ${details.seasonsCount}</span>
                <span class="stat-badge">🎬 Capítulos: ${details.episodesCount}</span>
                <span class="stat-badge">📺 ${escapeHtml(details.network)}</span>
            </div>

            <p class="show-summary">${escapeHtml(spanishSummary)}</p>

            <div class="actions-row">
                <select class="folder-select" id="select-folder-${show.id}">
                    ${folderOptions}
                </select>
                <button class="btn-save" onclick="saveToShowFolder(${show.id}, '${escapeQuotes(show.name)}')">
                    <span>🗝️</span> Guardar en Bóveda
                </button>
                <button class="btn-inspect" onclick="openShowModal(${show.id})">
                    <span>📜</span> Examinar
                </button>
            </div>
        </div>
    `;

    resultsContainer.appendChild(card);
}

function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================================================
// 5. GESTIÓN DE BÓVEDAS (CARPETAS ADDAMS)
// ==========================================================================

function handleFolderKeyPress(e) {
    if (e.key === 'Enter') {
        createFolder();
    }
}

function createFolder() {
    const input = document.getElementById('newFolderInput');
    const folderName = input ? input.value.trim() : '';

    if (!folderName) return;

    if (!folders[folderName]) {
        folders[folderName] = [];
        saveFoldersToStorage();
        renderFolders();
        playSnapSound();
        refreshCardSelectors();
    } else {
        alert(`La bóveda "${folderName}" ya existe en el mausoleo.`);
    }

    if (input) input.value = '';
}

function saveToShowFolder(showId, showName) {
    const select = document.getElementById(`select-folder-${showId}`);
    if (!select) return;
    const selectedFolder = select.value;

    if (!folders[selectedFolder]) {
        folders[selectedFolder] = [];
    }

    if (!folders[selectedFolder].includes(showName)) {
        folders[selectedFolder].push(showName);
        saveFoldersToStorage();
        renderFolders();
        playSnapSound();
        showThingBubble(`🖐️ ¡Guardado! "${showName}" ahora descansa en "${selectedFolder}".`);
    } else {
        alert(`La serie "${showName}" ya reposa en esa bóveda.`);
    }
}

function removeShowFromFolder(folderName, showName) {
    if (folders[folderName]) {
        folders[folderName] = folders[folderName].filter(item => item !== showName);
        saveFoldersToStorage();
        renderFolders();
    }
}

function saveFoldersToStorage() {
    localStorage.setItem('nevermore_addams_vaults', JSON.stringify(folders));
}

function renderFolders() {
    const container = document.getElementById('foldersContainer');
    if (!container) return;
    container.innerHTML = '';

    for (const [folderName, shows] of Object.entries(folders)) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-item';

        const showsList = shows.map(s => `
            <div class="saved-show">
                <span class="saved-show-title" title="${escapeHtml(s)}">${escapeHtml(s)}</span>
                <button class="delete-btn" onclick="removeShowFromFolder('${escapeQuotes(folderName)}', '${escapeQuotes(s)}')" title="Desterrar de la bóveda">✕</button>
            </div>
        `).join('');

        folderDiv.innerHTML = `
            <div class="folder-header">
                <span>${escapeHtml(folderName)}</span>
                <span class="folder-badge">${shows.length} ${shows.length === 1 ? 'serie' : 'series'}</span>
            </div>
            <div>
                ${showsList || '<p class="empty-folder-msg">Bóveda vacía... aguarda oscuros títulos.</p>'}
            </div>
        `;

        container.appendChild(folderDiv);
    }
}

function refreshCardSelectors() {
    const folderOptions = Object.keys(folders)
        .map(f => `<option value="${f}">${f}</option>`)
        .join('');

    const selects = document.querySelectorAll('.folder-select');
    selects.forEach(select => {
        const prevVal = select.value;
        select.innerHTML = folderOptions;
        if (folders[prevVal]) {
            select.value = prevVal;
        }
    });
}

// ==========================================================================
// 6. COSA (THE THING) - INTERACCIÓN HIPERREALISTA
// ==========================================================================

function scheduleThingCycle() {
    setInterval(() => {
        const thing = document.getElementById('thing-container');
        if (thing && !thing.classList.contains('appear')) {
            thing.classList.add('appear');
            const randomMsg = thingMessages[Math.floor(Math.random() * thingMessages.length)];
            showThingBubble(randomMsg);

            setTimeout(() => {
                if (thing) thing.classList.remove('appear');
                hideThingBubble();
            }, 5500);
        }
    }, 16000);
}

function summonThingDirectly() {
    playSnapSound();
    const thing = document.getElementById('thing-container');
    if (thing) {
        thing.classList.add('appear');
        showThingBubble("🖐️ ¡Has tocado la campana! Cosa acude a tu llamada.");
        setTimeout(() => {
            thing.classList.remove('appear');
            hideThingBubble();
        }, 5000);
    }
}

function thingClick() {
    playSnapSound();
    const randomMsg = thingMessages[Math.floor(Math.random() * thingMessages.length)];
    showThingBubble(randomMsg);
}

function showThingBubble(text) {
    const bubble = document.getElementById('thingBubble');
    if (bubble) {
        bubble.textContent = text;
        bubble.classList.add('visible');
    }
}

function hideThingBubble() {
    const bubble = document.getElementById('thingBubble');
    if (bubble) {
        bubble.classList.remove('visible');
    }
}

// ==========================================================================
// 7. SUSTO CON ARÁCNIDO REALISTA
// ==========================================================================

function triggerSpiderSustain() {
    playThunderSound();

    const spider = document.createElement('div');
    spider.className = 'spider-entity';
    spider.innerHTML = `
        <div class="spider-silk"></div>
        <div class="spider-body">🕷️</div>
    `;

    const randomX = Math.floor(Math.random() * (window.innerWidth - 100)) + 40;
    spider.style.left = `${randomX}px`;

    document.body.appendChild(spider);

    setTimeout(() => {
        const randomDrop = Math.floor(Math.random() * 220) + 180;
        spider.style.top = `${randomDrop}px`;
    }, 40);

    setTimeout(() => {
        spider.style.top = '-260px';
        setTimeout(() => {
            spider.remove();
        }, 900);
    }, 2800);
}

// ==========================================================================
// 8. MODAL DE INSPECCIÓN GÓTICA ("EL ARCHIVO NEGRO")
// ==========================================================================

async function openShowModal(showId) {
    const modal = document.getElementById('showModal');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <p style="font-family: var(--font-subheading); color: #d8b4fe;">Desenterrando el expediente confidencial...</p>
        </div>
    `;
    modal.classList.add('open');

    try {
        const res = await fetch(`https://api.tvmaze.com/shows/${showId}?embed[]=seasons&embed[]=cast`);
        const show = await res.json();

        const posterImg = show.image && show.image.original 
            ? show.image.original 
            : (show.image ? show.image.medium : 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80');

        const seasons = show._embedded && show._embedded.seasons ? show._embedded.seasons.length : '?';
        const castList = show._embedded && show._embedded.cast 
            ? show._embedded.cast.slice(0, 5).map(c => c.person.name).join(', ') 
            : 'Elenco no revelado';

        const spanishSummary = await getSpanishSummary(show.name, show.summary);
        const genresTranslated = (show.genres && show.genres.length > 0)
            ? show.genres.map(translateGenre).join(', ')
            : 'Misterio Gótico';

        const ratingStr = show.rating && show.rating.average ? `${show.rating.average} / 10` : 'Sin calificación';
        const statusStr = translateStatus(show.status);
        const langStr = translateLanguage(show.language);

        content.innerHTML = `
            <div class="modal-content-grid">
                <div>
                    <img src="${posterImg}" alt="${escapeHtml(show.name)}" class="modal-poster">
                </div>
                <div class="modal-details">
                    <h2>${escapeHtml(show.name)}</h2>
                    <p style="font-family: var(--font-typewriter); color: #a855f7; font-size: 0.9rem;">
                        ${genresTranslated} • ${show.premiered ? show.premiered.substring(0, 4) : 'Año desconocido'}
                    </p>

                    <div class="modal-synopsis">
                        <p>${escapeHtml(spanishSummary)}</p>
                    </div>

                    <div class="modal-meta-grid">
                        <div class="modal-meta-item">
                            <small>Calificación</small>
                            <span>💀 ${ratingStr}</span>
                        </div>
                        <div class="modal-meta-item">
                            <small>Temporadas</small>
                            <span>📑 ${seasons}</span>
                        </div>
                        <div class="modal-meta-item">
                            <small>Estado</small>
                            <span>${escapeHtml(statusStr)}</span>
                        </div>
                        <div class="modal-meta-item">
                            <small>Idioma</small>
                            <span>${escapeHtml(langStr)}</span>
                        </div>
                    </div>

                    <div style="margin-top: 15px; font-size: 0.85rem; color: #94a3b8;">
                        <strong style="color: #cbd5e1;">Elenco principal:</strong> ${escapeHtml(castList)}
                    </div>

                    ${show.officialSite ? `
                        <div style="margin-top: 18px;">
                            <a href="${show.officialSite}" target="_blank" rel="noopener noreferrer" 
                               style="color: #c084fc; font-family: var(--font-subheading); text-decoration: underline; font-size: 0.88rem;">
                                Visitar Sitio Oficial Externo ↗
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<p style="color: #f43f5e; text-align: center;">Error al recuperar los secretos de esta serie.</p>`;
    }
}

function closeModal() {
    const modal = document.getElementById('showModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function handleModalBackdropClick(e) {
    if (e.target.id === 'showModal') {
        closeModal();
    }
}
