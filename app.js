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
// 2. SISTEMA DE AUDIO GÓTICO: MELODÍA DE LOS ADDAMS Y EFECTOS TENEBROSOS
// ==========================================================================

// --- ESTADO DEL REPRODUCTOR DE LA MELODÍA ---
let isMelodyPlaying = false;
let isMelodyLooping = true;
let currentInstrument = 'harpsichord'; // 'harpsichord', 'organ', 'musicbox'
let melodyVolume = 0.7;
let melodyTimeouts = [];
let melodyLoopTimeoutId = null;

// Frecuencias exactas de afinación de notas musicales (Temperamento Igual)
const NOTE_FREQS = {
    'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50
};

// Partitura de la Melodía Oficial de la Familia Addams (Vic Mizzy - 1964)
// Definida por beats a tempo 136 BPM con sincronía de notas, bajos y chasquidos (¡Snap! ¡Snap!)
const addamsMelodyScore = [
    // Intro de chasquidos clásicos:
    { beat: 0.0, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 0.5, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 2.0, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 2.5, snap: true, lyric: '🫰 ¡Snap!' },

    // Motivo 1: Da-da-da-dum (snap snap)
    { beat: 4.0, note: 'C4', dur: 0.42, bass: 'C3', lyric: '♪ Da-da-da-dum...' },
    { beat: 4.5, note: 'D4', dur: 0.42 },
    { beat: 5.0, note: 'E4', dur: 0.42 },
    { beat: 5.5, note: 'F4', dur: 0.85, bass: 'C3' },
    { beat: 6.75, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 7.25, snap: true, lyric: '🫰 ¡Snap!' },

    // Motivo 2: Da-da-da-dum (snap snap)
    { beat: 8.0, note: 'D4', dur: 0.42, bass: 'G2', lyric: '♪ Da-da-da-dum...' },
    { beat: 8.5, note: 'E4', dur: 0.42 },
    { beat: 9.0, note: 'F#4', dur: 0.42 },
    { beat: 9.5, note: 'G4', dur: 0.85, bass: 'G2' },
    { beat: 10.75, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 11.25, snap: true, lyric: '🫰 ¡Snap!' },

    // Motivo 3 y 4: Da-da-da-dum, Da-da-da-dum
    { beat: 12.0, note: 'D4', dur: 0.42, bass: 'G2', lyric: '♪ Da-da-da-dum!' },
    { beat: 12.5, note: 'E4', dur: 0.42 },
    { beat: 13.0, note: 'F#4', dur: 0.42 },
    { beat: 13.5, note: 'G4', dur: 0.65, bass: 'G2' },

    { beat: 14.25, note: 'D4', dur: 0.42, lyric: '♪ Da-da-da-dum!' },
    { beat: 14.75, note: 'E4', dur: 0.42 },
    { beat: 15.25, note: 'F#4', dur: 0.42 },
    { beat: 15.75, note: 'G4', dur: 0.65, bass: 'G2' },

    // Motivo 5: Da-da-da-dum (snap snap)
    { beat: 16.5, note: 'C4', dur: 0.42, bass: 'C3', lyric: '♪ Da-da-da-dum...' },
    { beat: 17.0, note: 'D4', dur: 0.42 },
    { beat: 17.5, note: 'E4', dur: 0.42 },
    { beat: 18.0, note: 'F4', dur: 0.85, bass: 'C3' },
    { beat: 19.25, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 19.75, snap: true, lyric: '🫰 ¡Snap!' },

    // Estrofa: "They're creepy and they're kooky..."
    { beat: 21.0, note: 'G4', dur: 0.4, bass: 'C3', lyric: '🖤 They\'re creepy and they\'re kooky...' },
    { beat: 21.5, note: 'G4', dur: 0.4 },
    { beat: 22.0, note: 'G4', dur: 0.4 },
    { beat: 22.5, note: 'G4', dur: 0.4 },
    { beat: 23.0, note: 'E4', dur: 0.4 },
    { beat: 23.5, note: 'G4', dur: 0.85, bass: 'C3' },

    // "Mysterious and spooky..."
    { beat: 25.0, note: 'A4', dur: 0.4, bass: 'D3', lyric: '🥀 Mysterious and spooky...' },
    { beat: 25.5, note: 'A4', dur: 0.4 },
    { beat: 26.0, note: 'A4', dur: 0.4 },
    { beat: 26.5, note: 'A4', dur: 0.4 },
    { beat: 27.0, note: 'F#4', dur: 0.4 },
    { beat: 27.5, note: 'A4', dur: 0.85, bass: 'D3' },

    // "They're altogether ooky..."
    { beat: 29.0, note: 'B4', dur: 0.4, bass: 'G3', lyric: '🕷️ They\'re altogether ooky...' },
    { beat: 29.5, note: 'B4', dur: 0.4 },
    { beat: 30.0, note: 'B4', dur: 0.4 },
    { beat: 30.5, note: 'B4', dur: 0.4 },
    { beat: 31.0, note: 'G4', dur: 0.4 },
    { beat: 31.5, note: 'B4', dur: 0.85, bass: 'G3' },

    // "The Addams Family..."
    { beat: 33.0, note: 'C5', dur: 0.75, bass: 'C3', lyric: '🏰 The Addams Family! 🫰' },
    { beat: 33.8, note: 'B4', dur: 0.4 },
    { beat: 34.3, note: 'A4', dur: 0.4 },
    { beat: 34.8, note: 'G4', dur: 0.4 },
    { beat: 35.3, note: 'F4', dur: 0.4 },
    { beat: 35.8, note: 'D4', dur: 0.65 },
    { beat: 36.6, note: 'C4', dur: 1.1, bass: 'C3' },

    // Chasquidos finales:
    { beat: 38.0, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 38.5, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 40.0, snap: true, lyric: '🫰 ¡Snap!' },
    { beat: 40.5, snap: true, lyric: '🫰 ¡Snap!' }
];

const MELODY_TOTAL_BEATS = 42.0;
const MELODY_TEMPO_BPM = 136;
const BEAT_SECONDS = 60 / MELODY_TEMPO_BPM; // ~0.4411s por beat

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
    if (!isSoundEnabled) {
        stopAddamsMelody();
    } else {
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

// --------------------------------------------------------------------------
// REPRODUCTOR Y SINTETIZADOR DE LA MELODÍA DE LOS ADDAMS
// --------------------------------------------------------------------------

function toggleAddamsMelody() {
    if (!isSoundEnabled) {
        isSoundEnabled = true;
        localStorage.setItem('nevermore_sound_enabled', true);
        updateSoundUI();
    }
    if (isMelodyPlaying) {
        stopAddamsMelody();
    } else {
        startAddamsMelody();
    }
}

function startAddamsMelody() {
    const ctx = getAudioContext();
    stopAddamsMelody(); // Limpiar timers previos
    isMelodyPlaying = true;
    updateMelodyUIState(true);

    showThingBubble("🎶 ¡Cosa se emociona! La melodía de la familia llena los salones de Nevermore.");

    const startTime = ctx.currentTime + 0.08;
    scheduleMelodyIteration(startTime);
}

function scheduleMelodyIteration(startTime) {
    if (!isMelodyPlaying || !isSoundEnabled) return;
    const ctx = getAudioContext();

    addamsMelodyScore.forEach(evt => {
        const evtTime = startTime + (evt.beat * BEAT_SECONDS);

        // 1. Tocar chasquido si está presente
        if (evt.snap) {
            playSnapSoundAtTime(evtTime);
        }

        // 2. Tocar nota melódica
        if (evt.note && NOTE_FREQS[evt.note]) {
            playInstrumentNote(NOTE_FREQS[evt.note], evtTime, evt.dur * BEAT_SECONDS, currentInstrument, 0.55);
        }

        // 3. Tocar nota de bajo (contrabajo / pizzicato)
        if (evt.bass && NOTE_FREQS[evt.bass]) {
            playBassNote(NOTE_FREQS[evt.bass], evtTime, (evt.dur || 0.6) * BEAT_SECONDS, 0.45);
        }

        // 4. Sincronizar subtítulo / lírica en pantalla
        if (evt.lyric) {
            const delayMs = Math.max(0, (evtTime - ctx.currentTime) * 1000);
            const tId = setTimeout(() => {
                if (isMelodyPlaying) {
                    updateMelodyLyric(evt.lyric, evt.snap);
                }
            }, delayMs);
            melodyTimeouts.push(tId);
        }
    });

    // Duración total de la estrofa
    const loopDurationSec = MELODY_TOTAL_BEATS * BEAT_SECONDS;

    if (isMelodyLooping) {
        const loopDelayMs = Math.max(0, (startTime + loopDurationSec - ctx.currentTime) * 1000);
        melodyLoopTimeoutId = setTimeout(() => {
            if (isMelodyPlaying) {
                scheduleMelodyIteration(ctx.currentTime + 0.05);
            }
        }, loopDelayMs);
    } else {
        const endDelayMs = Math.max(0, (startTime + loopDurationSec - ctx.currentTime) * 1000);
        const tId = setTimeout(() => {
            stopAddamsMelody();
        }, endDelayMs);
        melodyTimeouts.push(tId);
    }
}

function stopAddamsMelody() {
    isMelodyPlaying = false;
    melodyTimeouts.forEach(id => clearTimeout(id));
    melodyTimeouts = [];
    if (melodyLoopTimeoutId) {
        clearTimeout(melodyLoopTimeoutId);
        melodyLoopTimeoutId = null;
    }
    updateMelodyUIState(false);
    updateMelodyLyric('Pulsa "Tocar Melodía" para escuchar la música de los Addams...', false);
}

function updateMelodyUIState(playing) {
    const playBtn = document.getElementById('btnMelodyPlay');
    const tbBtn = document.getElementById('toolbarMelodyBtn');
    const playIcon = document.getElementById('playIcon');
    const playText = document.getElementById('playText');
    const tbText = document.getElementById('tbMelodyText');
    const eq = document.getElementById('melodyEqualizer');
    const disc = document.getElementById('pulseDisc');

    if (playing) {
        if (playBtn) playBtn.classList.add('playing');
        if (tbBtn) tbBtn.classList.add('playing');
        if (playIcon) playIcon.textContent = '⏸️';
        if (playText) playText.textContent = 'Pausar Melodía';
        if (tbText) tbText.textContent = 'Pausar Melodía';
        if (eq) eq.classList.add('active');
        if (disc) disc.classList.add('spinning');
    } else {
        if (playBtn) playBtn.classList.remove('playing');
        if (tbBtn) tbBtn.classList.remove('playing');
        if (playIcon) playIcon.textContent = '▶️';
        if (playText) playText.textContent = 'Tocar Melodía';
        if (tbText) tbText.textContent = 'Melodía Addams';
        if (eq) eq.classList.remove('active');
        if (disc) disc.classList.remove('spinning');
    }
}

function updateMelodyLyric(text, isSnap) {
    const pill = document.getElementById('melodyLyricDisplay');
    const lyricText = document.getElementById('lyricText');
    const lyricIcon = document.getElementById('lyricIcon');
    if (!pill || !lyricText) return;

    lyricText.textContent = text;
    if (lyricIcon) {
        lyricIcon.textContent = isSnap ? '🫰' : '🎶';
    }

    if (isSnap) {
        pill.classList.add('snap-highlight');
        setTimeout(() => {
            pill.classList.remove('snap-highlight');
        }, 280);
    }
}

function toggleMelodyLoop() {
    isMelodyLooping = !isMelodyLooping;
    const btn = document.getElementById('btnLoopToggle');
    if (btn) {
        if (isMelodyLooping) {
            btn.classList.add('active');
            btn.title = 'Repetición continua activada';
        } else {
            btn.classList.remove('active');
            btn.title = 'Repetición continua desactivada (se detendrá al final)';
        }
    }
}

function changeInstrument(instrumentName) {
    currentInstrument = instrumentName;
    const select = document.getElementById('instrumentSelect');
    if (select) select.value = instrumentName;
    
    // Si la melodía no suena, dar una pequeña nota de muestra al usuario
    if (!isMelodyPlaying && isSoundEnabled) {
        const ctx = getAudioContext();
        playInstrumentNote(NOTE_FREQS['C4'], ctx.currentTime, 0.45, currentInstrument, 0.6);
    }
}

function changeMelodyVolume(newVol) {
    melodyVolume = parseFloat(newVol);
    const icon = document.getElementById('melodyVolIcon');
    if (icon) {
        icon.textContent = melodyVolume === 0 ? '🔇' : (melodyVolume < 0.4 ? '🔉' : '🔊');
    }
}

// --------------------------------------------------------------------------
// SINTETIZADOR INSTRUMENTAL POLIFÓNICO CON WEB AUDIO API
// --------------------------------------------------------------------------

function playInstrumentNote(freq, startTime, duration, type = currentInstrument, gainLevel = 0.5) {
    if (!isSoundEnabled || melodyVolume <= 0) return;
    try {
        const ctx = getAudioContext();
        const now = startTime;

        if (type === 'harpsichord') {
            // Clavicémbalo clásico barroco (estilo Vic Mizzy 1964):
            // Dos ondas sierra desfasadas + filtro peaking brillante
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            osc1.frequency.setValueAtTime(freq, now);
            osc2.frequency.setValueAtTime(freq * 1.002, now);

            filter.type = 'peaking';
            filter.frequency.setValueAtTime(2200, now);
            filter.Q.setValueAtTime(2.4, now);
            filter.gain.setValueAtTime(7, now);

            const vol = gainLevel * melodyVolume;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.004);
            gain.gain.exponentialRampToValueAtTime(vol * 0.35, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.12, duration));

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + duration + 0.08);
            osc2.stop(now + duration + 0.08);

        } else if (type === 'organ') {
            // Órgano gótico de tubos catedralicios
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            osc3.type = 'sine';
            osc1.frequency.setValueAtTime(freq, now);
            osc2.frequency.setValueAtTime(freq * 2, now);
            osc3.frequency.setValueAtTime(freq * 3, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);

            const vol = gainLevel * melodyVolume * 0.45;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.035);
            gain.gain.setValueAtTime(vol * 0.9, now + duration * 0.8);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.12);

            osc1.connect(filter);
            osc2.connect(filter);
            osc3.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc3.start(now);
            osc1.stop(now + duration + 0.15);
            osc2.stop(now + duration + 0.15);
            osc3.stop(now + duration + 0.15);

        } else if (type === 'musicbox') {
            // Caja musical tenebrosa (campanas mecánicas oscuras)
            const osc = ctx.createOscillator();
            const overtone = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            overtone.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            overtone.frequency.setValueAtTime(freq * 4.01, now);

            const vol = gainLevel * melodyVolume * 0.55;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.005);
            gain.gain.exponentialRampToValueAtTime(vol * 0.12, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.3, duration + 0.4));

            osc.connect(gain);
            overtone.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            overtone.start(now);
            osc.stop(now + duration + 0.45);
            overtone.stop(now + duration + 0.45);
        }
    } catch (e) {
        console.warn(e);
    }
}

function playBassNote(freq, startTime, duration = 0.35, volume = 0.45) {
    if (!isSoundEnabled || melodyVolume <= 0) return;
    try {
        const ctx = getAudioContext();
        const now = startTime;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);

        const vol = volume * melodyVolume;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    } catch (e) {
        console.warn(e);
    }
}

// Chasquido Addams sincronizado a un tiempo concreto
function playSnapSoundAtTime(targetTime) {
    if (!isSoundEnabled || melodyVolume <= 0) return;
    try {
        const ctx = getAudioContext();
        const bufferSize = Math.floor(ctx.sampleRate * 0.045);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.007));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2500, targetTime);
        filter.Q.setValueAtTime(3.8, targetTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.9 * melodyVolume, targetTime);
        gain.gain.exponentialRampToValueAtTime(0.001, targetTime + 0.055);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(targetTime);
    } catch (e) {
        console.warn(e);
    }
}

// Chasquido doble manual característico Addams ("Snap! Snap!")
function playSnapSound() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        playSnapSoundAtTime(now);
        playSnapSoundAtTime(now + 0.22);
    } catch (e) {
        console.warn('Audio no disponible:', e);
    }
}

// Tono grave de violonchelo gótico para búsquedas
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

// --------------------------------------------------------------------------
// BÓVEDA DE EFECTOS TENEBROSOS (SINTETIZADOS CON WEB AUDIO API)
// --------------------------------------------------------------------------

function highlightSoundButton(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.add('playing');
    setTimeout(() => {
        btn.classList.remove('playing');
    }, 2800);
}

// 1. AULLIDO DE LOBO REALISTA 🐺
function playWolfHowl() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        highlightSoundButton('btnWolf');
        showThingBubble("🐺 ¡Auuuuu! Cosa escucha un aullido de lobo solitario en los bosques de Nevermore...");

        // Oscilador de cuerdas vocales
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';

        // Filtro formante de garganta y hocico ("Awoooo...")
        const throatFilter = ctx.createBiquadFilter();
        throatFilter.type = 'bandpass';
        throatFilter.Q.setValueAtTime(4.5, now);

        const nasalFilter = ctx.createBiquadFilter();
        nasalFilter.type = 'bandpass';
        nasalFilter.frequency.setValueAtTime(1150, now);
        nasalFilter.Q.setValueAtTime(3.0, now);

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2200, now);

        // LFO de vibrato natural al alcanzar el pico
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(4.3, now);
        lfoGain.gain.setValueAtTime(0, now);
        lfoGain.gain.setValueAtTime(0, now + 0.6);
        lfoGain.gain.linearRampToValueAtTime(17, now + 1.2);
        lfoGain.gain.setValueAtTime(17, now + 2.4);
        lfoGain.gain.linearRampToValueAtTime(0, now + 3.2);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // Curva de tono del aullido: sube majestuosamente y desciende en la distancia
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(495, now + 0.85);
        osc.frequency.setValueAtTime(495, now + 2.2);
        osc.frequency.exponentialRampToValueAtTime(175, now + 4.2);

        // Modulación de formantes (apertura y cierre de fauces)
        throatFilter.frequency.setValueAtTime(380, now);
        throatFilter.frequency.linearRampToValueAtTime(660, now + 0.85);
        throatFilter.frequency.setValueAtTime(660, now + 2.2);
        throatFilter.frequency.linearRampToValueAtTime(310, now + 4.2);

        // Envolvente de volumen
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 0.7);
        gain.gain.setValueAtTime(0.75, now + 2.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

        // Eco en el cañón (reverberación distante)
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.28, now);
        const delayFeedback = ctx.createGain();
        delayFeedback.gain.setValueAtTime(0.35, now);
        const delayFilter = ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.setValueAtTime(1200, now);

        // Capa de viento nocturno
        const windBufSize = ctx.sampleRate * 4.5;
        const windBuf = ctx.createBuffer(1, windBufSize, ctx.sampleRate);
        const windData = windBuf.getChannelData(0);
        for (let i = 0; i < windBufSize; i++) {
            windData[i] = (Math.random() * 2 - 1) * 0.18;
        }
        const windNoise = ctx.createBufferSource();
        windNoise.buffer = windBuf;
        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(360, now);
        windFilter.Q.setValueAtTime(2.5, now);
        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.001, now);
        windGain.gain.linearRampToValueAtTime(0.18, now + 1.2);
        windGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

        windNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ctx.destination);

        osc.connect(throatFilter);
        osc.connect(nasalFilter);
        throatFilter.connect(lowpass);
        nasalFilter.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(ctx.destination);

        gain.connect(delay);
        delay.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delay);
        delayFilter.connect(ctx.destination);

        osc.start(now);
        lfo.start(now);
        windNoise.start(now);

        osc.stop(now + 4.6);
        lfo.stop(now + 4.6);
        windNoise.stop(now + 4.6);
    } catch (e) {
        console.warn(e);
    }
}

// 2. VOCES FANTASMALES Y LAMENTOS ESPECTRALES 👻
function playGhostVoices() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        highlightSoundButton('btnGhost');
        showThingBubble("👻 ¡Uuuuuh! Espíritus errantes susurran sus secretos por los pasillos oscuros...");

        // Acorde disminuido espectral microtonal (A3, C4, Eb4, A4)
        const pitches = [220, 261.63, 311.13, 440];
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.65, now + 1.4);
        masterGain.gain.setValueAtTime(0.6, now + 3.2);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

        // Filtros formantes vocálicos ("Oooo-uuu-aaaa")
        const f1 = ctx.createBiquadFilter();
        f1.type = 'bandpass';
        f1.frequency.setValueAtTime(320, now);
        f1.frequency.linearRampToValueAtTime(450, now + 2.5);
        f1.frequency.linearRampToValueAtTime(280, now + 5.2);
        f1.Q.setValueAtTime(5.0, now);

        const f2 = ctx.createBiquadFilter();
        f2.type = 'bandpass';
        f2.frequency.setValueAtTime(780, now);
        f2.frequency.linearRampToValueAtTime(920, now + 2.5);
        f2.frequency.linearRampToValueAtTime(720, now + 5.2);
        f2.Q.setValueAtTime(6.0, now);

        const f3 = ctx.createBiquadFilter();
        f3.type = 'bandpass';
        f3.frequency.setValueAtTime(2400, now);
        f3.Q.setValueAtTime(4.0, now);

        const voiceGroupGain = ctx.createGain();
        voiceGroupGain.gain.setValueAtTime(0.4, now);

        pitches.forEach((baseFreq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';

            // Deriva microtonal lenta (inestabilidad de espectro)
            const drift = ctx.createOscillator();
            const driftGain = ctx.createGain();
            drift.frequency.setValueAtTime(0.6 + idx * 0.3, now);
            driftGain.gain.setValueAtTime(9 + idx * 4, now);
            drift.connect(osc.frequency);

            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.linearRampToValueAtTime(baseFreq * 1.07, now + 2.5);
            osc.frequency.linearRampToValueAtTime(baseFreq * 0.95, now + 5.2);

            osc.connect(f1);
            osc.connect(f2);
            osc.connect(f3);

            osc.start(now);
            drift.start(now);
            osc.stop(now + 5.6);
            drift.stop(now + 5.6);
        });

        // Susurro fantasmal (ruido blanco filtrado)
        const whisperBufSize = ctx.sampleRate * 5.2;
        const whisperBuf = ctx.createBuffer(1, whisperBufSize, ctx.sampleRate);
        const whisperData = whisperBuf.getChannelData(0);
        for (let i = 0; i < whisperBufSize; i++) {
            whisperData[i] = (Math.random() * 2 - 1) * 0.16;
        }
        const whisperSource = ctx.createBufferSource();
        whisperSource.buffer = whisperBuf;
        const whisperFilter = ctx.createBiquadFilter();
        whisperFilter.type = 'bandpass';
        whisperFilter.frequency.setValueAtTime(1400, now);
        whisperFilter.frequency.linearRampToValueAtTime(1800, now + 2.5);
        whisperFilter.frequency.linearRampToValueAtTime(1100, now + 5.2);
        whisperFilter.Q.setValueAtTime(3.0, now);

        const whisperGain = ctx.createGain();
        whisperGain.gain.setValueAtTime(0.001, now);
        whisperGain.gain.linearRampToValueAtTime(0.3, now + 1.2);
        whisperGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.4);

        whisperSource.connect(whisperFilter);
        whisperFilter.connect(whisperGain);
        whisperGain.connect(masterGain);

        f1.connect(voiceGroupGain);
        f2.connect(voiceGroupGain);
        f3.connect(voiceGroupGain);
        voiceGroupGain.connect(masterGain);

        // Movimiento estéreo de las apariciones
        if (ctx.createStereoPanner) {
            const panner = ctx.createStereoPanner();
            panner.pan.setValueAtTime(-0.5, now);
            panner.pan.linearRampToValueAtTime(0.5, now + 2.7);
            panner.pan.linearRampToValueAtTime(-0.2, now + 5.4);
            masterGain.connect(panner);
            panner.connect(ctx.destination);
        } else {
            masterGain.connect(ctx.destination);
        }

        // Eco en la cripta
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.35, now);
        const delayFb = ctx.createGain();
        delayFb.gain.setValueAtTime(0.42, now);
        masterGain.connect(delay);
        delay.connect(delayFb);
        delayFb.connect(delay);
        delay.connect(ctx.destination);

        whisperSource.start(now);
        whisperSource.stop(now + 5.6);
    } catch (e) {
        console.warn(e);
    }
}

// 3. TRUENO OSCURO DE MEDIANOCHE ⚡
function playThunderSoundWithHighlight() {
    highlightSoundButton('btnThunder');
    showThingBubble("⚡ ¡Rrrrumble! Un rayo rasga el cielo nocturno sobre el cementerio...");
    playThunderSound();
}

function playThunderSound() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const dur = 2.4;

        const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.linearRampToValueAtTime(55, now + dur);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.9, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    } catch (e) {
        console.warn(e);
    }
}

// 4. PUERTA DE CRIPTA CHIRRIANTE 🚪
function playCreakyDoor() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        highlightSoundButton('btnDoor');
        showThingBubble("🚪 ¡Chirriiido! Una pesada puerta de hierro forjado se abre lentamente...");

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';

        const lfoJitter = ctx.createOscillator();
        const lfoJitterGain = ctx.createGain();
        lfoJitter.frequency.setValueAtTime(32, now);
        lfoJitterGain.gain.setValueAtTime(35, now);
        lfoJitter.connect(lfoJitterGain);
        lfoJitterGain.connect(osc.frequency);

        osc.frequency.setValueAtTime(75, now);
        osc.frequency.linearRampToValueAtTime(140, now + 1.2);
        osc.frequency.linearRampToValueAtTime(80, now + 2.6);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(12.0, now);
        filter.frequency.setValueAtTime(750, now);
        filter.frequency.linearRampToValueAtTime(1650, now + 1.3);
        filter.frequency.linearRampToValueAtTime(820, now + 2.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.7, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.75, now + 1.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        lfoJitter.start(now);
        osc.stop(now + 2.8);
        lfoJitter.stop(now + 2.8);
    } catch (e) {
        console.warn(e);
    }
}

// 5. ÓRGANO FÚNEBRE DE CATEDRAL 🎹
function playPhantomOrgan() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        highlightSoundButton('btnOrgan');
        showThingBubble("🎹 Un acorde fúnebre resuena en las altas bóvedas del castillo...");

        const chord = [73.42, 146.83, 174.61, 220.00, 415.30];
        chord.forEach(freq => {
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            const vib = ctx.createOscillator();
            const vibGain = ctx.createGain();
            vib.frequency.setValueAtTime(5.8, now);
            vibGain.gain.setValueAtTime(freq * 0.012, now);
            vib.connect(vibGain);
            vibGain.connect(osc.frequency);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1600, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.35, now + 0.12);
            gain.gain.setValueAtTime(0.3, now + 2.2);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            vib.start(now);
            osc.stop(now + 3.9);
            vib.stop(now + 3.9);
        });
    } catch (e) {
        console.warn(e);
    }
}

// 6. ENJAMBRE DE MURCIÉLAGOS EN VUELO 🦇
function playBatsFlutter() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        highlightSoundButton('btnBats');
        showThingBubble("🦇 ¡Fshhhh! Cientos de murciélagos alzan el vuelo desde la torre...");

        const dur = 2.4;
        const bufSize = ctx.sampleRate * dur;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(1400, now + dur);
        filter.Q.setValueAtTime(2.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.65, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        // Chillidos de ecolocalización
        for (let j = 0; j < 6; j++) {
            const chirpTime = now + 0.2 + j * 0.35 + Math.random() * 0.1;
            const chirp = ctx.createOscillator();
            const chirpGain = ctx.createGain();
            chirp.frequency.setValueAtTime(5500 + Math.random() * 1500, chirpTime);
            chirp.frequency.exponentialRampToValueAtTime(2800, chirpTime + 0.04);
            chirpGain.gain.setValueAtTime(0.12, chirpTime);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, chirpTime + 0.05);
            chirp.connect(chirpGain);
            chirpGain.connect(ctx.destination);
            chirp.start(chirpTime);
            chirp.stop(chirpTime + 0.06);
        }

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
    } catch (e) {
        console.warn(e);
    }
}

// 7. RISA SINIESTRA DE BRUJA / GHOUL 🪓
function playEvilLaugh() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        highlightSoundButton('btnLaugh');
        showThingBubble("🪓 ¡Muahahahaha! Una carcajada macabra hiela la sangre en las criptas...");

        const laughPitches = [380, 360, 340, 315, 290, 260, 220];
        laughPitches.forEach((pitch, i) => {
            const t = now + i * 0.22;
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(pitch, t);
            osc.frequency.exponentialRampToValueAtTime(pitch * 0.75, t + 0.16);

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(650, t);
            filter.Q.setValueAtTime(4.0, t);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.65 - i * 0.04, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.2);
        });
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
    highlightSoundButton('btnSnap');

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
