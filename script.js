/**
 * DevGames - Sopa de Letras & El Ahorcado (Software Edition)
 * Engine & Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Sound Engine (Web Audio API) ---
  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play failed:', e);
      }
    }

    playSelect() {
      this.playTone(440, 'sine', 0.05, 0.05);
    }

    playFound() {
      if (!this.enabled) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.18, 0.12);
        }, idx * 60);
      });
    }

    playHint() {
      this.playTone(880, 'sine', 0.2, 0.08);
      setTimeout(() => this.playTone(1174.66, 'sine', 0.3, 0.08), 100);
    }

    playVictory() {
      if (!this.enabled) return;
      const melody = [
        { f: 523.25, d: 150 }, { f: 659.25, d: 150 }, { f: 783.99, d: 150 },
        { f: 1046.50, d: 350 }, { f: 880, d: 150 }, { f: 1046.50, d: 500 }
      ];
      let delay = 0;
      melody.forEach(note => {
        setTimeout(() => {
          this.playTone(note.f, 'triangle', note.d / 1000, 0.15);
        }, delay);
        delay += note.d;
      });
    }

    playDefeat() {
      if (!this.enabled) return;
      const notes = [400, 350, 300, 250];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sawtooth', 0.15, 0.1);
        }, idx * 120);
      });
    }
  }

  const soundFx = new SoundEffects();

  // --- Word Databases ---
  const SOPA_WORD_DATABASE = [
    'ALGORITMO', 'VARIABLE', 'FUNCION', 'SERVIDOR', 'INTERFAZ',
    'DATOS', 'ENTORNO', 'COMPILADOR', 'DESPLIEGUE', 'SINTAXIS',
    'LOGICA', 'BUCLE', 'RECURSION', 'MATRIZ', 'EXCEPCION',
    'HERENCIA', 'OBJETO', 'CLASE', 'MODULO', 'PUERTO',
    'PROGRAMA', 'SISTEMA', 'CODIGO', 'PRUEBA', 'PUNTERO',
    'EVENTO', 'ESTADO', 'PROMESA', 'ASINCRONO', 'RED',
    'TECLADO', 'PANTALLA', 'DISEÑO', 'ARREGLO', 'CADENA',
    'ENTERO', 'ARCHIVO', 'CLAVE', 'MEMORIA', 'METODO'
  ];

  const AHORCADO_WORDS = [
    { word: 'ALGORITMO', related: 'Secuencia de pasos', hint: 'Conjunto de pasos finitos para resolver un problema.' },
    { word: 'VARIABLE', related: 'Almacén de datos', hint: 'Espacio reservado en memoria para almacenar un dato.' },
    { word: 'FUNCION', related: 'Bloque de código', hint: 'Bloque de código ejecutable diseñado para realizar una tarea.' },
    { word: 'SERVIDOR', related: 'Lógica central', hint: 'Capa lógica y base de datos donde se procesa la información.' },
    { word: 'INTERFAZ', related: 'Parte visual', hint: 'Superficie de contacto interactiva y visual para el usuario.' },
    { word: 'DATOS', related: 'Información', hint: 'Sistema estructurado para almacenar y consultar información.' },
    { word: 'ENTORNO', related: 'Herramientas', hint: 'Conjunto de herramientas con estructura y librerías reutilizables.' },
    { word: 'COMPILADOR', related: 'Traductor de código', hint: 'Programa que traduce código fuente a código de máquina.' },
    { word: 'DESPLIEGUE', related: 'Publicación', hint: 'Proceso de enviar o publicar código a un entorno de producción.' },
    { word: 'SINTAXIS', related: 'Gramática de código', hint: 'Reglas gramaticales que definen la estructura de la programación.' },
    { word: 'RECURSION', related: 'Función cíclica', hint: 'Técnica donde una función se invoca a sí misma.' },
    { word: 'EXCEPCION', related: 'Error manejable', hint: 'Evento anómalo o error producido durante la ejecución.' },
    { word: 'HERENCIA', related: 'Reutilización', hint: 'Mecanismo en donde una clase deriva propiedades de otra.' },
    { word: 'OBJETO', related: 'Instancia', hint: 'Instancia concreta creada a partir de una clase.' },
    { word: 'CLASE', related: 'Molde', hint: 'Molde o plantilla para instanciar objetos.' },
    { word: 'PUERTO', related: 'Punto de conexión', hint: 'Punto final lógico de comunicación en redes de computadoras.' },
    { word: 'PROGRAMA', related: 'Aplicación', hint: 'Conjunto de instrucciones que la computadora puede ejecutar.' },
    { word: 'SISTEMA', related: 'Conjunto', hint: 'Conjunto de componentes que interactúan para un fin común.' },
    { word: 'CODIGO', related: 'Instrucciones', hint: 'Texto escrito en un lenguaje de programación.' },
    { word: 'PRUEBA', related: 'Verificación', hint: 'Proceso para evaluar si un software funciona correctamente.' },
    { word: 'PROMESA', related: 'Asincronía', hint: 'Objeto que representa una operación asíncrona pendiente.' },
    { word: 'ASINCRONO', related: 'No simultáneo', hint: 'Operación que no bloquea la ejecución principal.' },
    { word: 'RED', related: 'Conectividad', hint: 'Conjunto de computadoras conectadas entre sí.' },
    { word: 'TECLADO', related: 'Periférico', hint: 'Dispositivo principal para introducir texto en la computadora.' },
    { word: 'PANTALLA', related: 'Monitor', hint: 'Dispositivo de salida que muestra información visual.' },
    { word: 'ARCHIVO', related: 'Documento', hint: 'Conjunto de datos almacenados en un medio digital.' },
    { word: 'CLAVE', related: 'Seguridad', hint: 'Credencial usada para autenticación en sistemas.' },
    { word: 'MEMORIA', related: 'Almacenamiento RAM', hint: 'Componente donde se almacenan temporalmente datos y procesos.' }
  ];

  // Colors for discovered words in Sopa
  const HIGHLIGHT_COLORS = [
    'rgba(99, 102, 241, 0.85)',   // Indigo
    'rgba(6, 182, 212, 0.85)',    // Cyan
    'rgba(139, 92, 246, 0.85)',   // Purple
    'rgba(236, 72, 153, 0.85)',   // Pink
    'rgba(16, 185, 129, 0.85)',   // Emerald
    'rgba(245, 158, 11, 0.85)',   // Amber
    'rgba(59, 130, 246, 0.85)'    // Blue
  ];

  // Difficulty Configurations
  const SOPA_CONFIG = {
    easy: { size: 10, wordCount: 8, dirs: [[0,1], [1,0]] },
    medium: { size: 12, wordCount: 10, dirs: [[0,1], [1,0], [1,1], [-1,1]] },
    hard: { size: 15, wordCount: 14, dirs: [[0,1], [1,0], [1,1], [-1,1], [0,-1], [-1,0], [-1,-1], [1,-1]] },
    timed: { size: 12, wordCount: 12, dirs: [[0,1], [1,0], [1,1], [-1,1], [0,-1], [-1,0]], timed: true, timeLimit: 300 }
  };

  const AHORCADO_CONFIG = {
    easy: { maxMistakes: 8, timed: false },
    medium: { maxMistakes: 6, timed: false },
    hard: { maxMistakes: 4, timed: false },
    timed: { maxMistakes: 6, timed: true, timeLimit: 300 }
  };

  // State Variables
  let activeGameMode = 'sopa'; // 'sopa' or 'ahorcado'
  let currentDifficulty = 'medium';
  let isGameOver = false;

  // Shared Stats & Controls
  let hintsRemaining = 3;
  let hintsUsedCount = 0;
  let timerInterval = null;
  let secondsElapsed = 0;
  let isTimerRunning = false;

  // --- Sopa de Letras State ---
  let gridSize = 12;
  let targetWords = [];
  let foundWords = new Set();
  let gridMatrix = [];
  let wordPlacements = {};
  let isSelecting = false;
  let startCell = null;
  let currentCell = null;
  let selectedCells = [];

  // --- El Ahorcado State ---
  let currentAhorcadoWord = '';
  let currentAhorcadoHint = '';
  let currentAhorcadoRelated = '';
  let guessedLetters = new Set();
  let mistakesCount = 0;
  let maxMistakesAllowed = 6;
  let streakCount = 0;

  // DOM Elements
  const tabSopa = document.getElementById('tab-sopa');
  const tabAhorcado = document.getElementById('tab-ahorcado');
  const sopaView = document.getElementById('sopa-view');
  const ahorcadoView = document.getElementById('ahorcado-view');
  const headerSubtitle = document.getElementById('header-subtitle');
  const statLabel2 = document.getElementById('stat-label-2');
  const statIcon2 = document.getElementById('stat-icon-2');

  const gridContainer = document.getElementById('grid-container');
  const boardWrapper = document.getElementById('board-wrapper');
  const selectionCanvas = document.getElementById('selection-canvas');
  const wordListContainer = document.getElementById('word-list');
  const difficultySelect = document.getElementById('difficulty-select');
  const newGameBtn = document.getElementById('new-game-btn');
  const hintBtn = document.getElementById('hint-btn');
  const hintBadge = document.getElementById('hint-badge');
  const timerDisplay = document.getElementById('timer-display');
  const foundDisplay = document.getElementById('found-display');
  const bestTimeDisplay = document.getElementById('best-time-display');
  const progressPercent = document.getElementById('words-progress-percent');
  const progressBarFill = document.getElementById('words-progress-bar');
  const soundBtn = document.getElementById('sound-btn');
  const themeBtn = document.getElementById('theme-btn');

  // Ahorcado Elements
  const wordSlotsContainer = document.getElementById('word-slots-container');
  const virtualKeyboard = document.getElementById('virtual-keyboard');
  const ahorcadoHintText = document.getElementById('ahorcado-hint-text');
  const ahorcadoRelatedWord = document.getElementById('ahorcado-related-word');
  const ahorcadoStreak = document.getElementById('ahorcado-streak');

  // Victory Modal Elements
  const victoryModal = document.getElementById('victory-modal');
  const modalRestartBtn = document.getElementById('modal-restart-btn');
  const finalTimeDisplay = document.getElementById('final-time');
  const finalDiffDisplay = document.getElementById('final-difficulty');
  const finalHintsDisplay = document.getElementById('final-hints');

  // --- Game Mode Switcher ---
  function switchGameMode(mode) {
    if (activeGameMode === mode) return;
    activeGameMode = mode;

    if (mode === 'sopa') {
      tabSopa.classList.add('active');
      tabAhorcado.classList.remove('active');
      sopaView.classList.remove('hidden');
      ahorcadoView.classList.add('hidden');
      headerSubtitle.innerHTML = 'Sopa de Letras &bull; Software Edition';
      statLabel2.textContent = 'Encontradas';
      statIcon2.className = 'fa-solid fa-square-check stat-icon';

      difficultySelect.innerHTML = `
        <option value="easy">Fácil (10x10)</option>
        <option value="medium" selected>Medio (12x12)</option>
        <option value="hard">Difícil (15x15)</option>
        <option value="timed">Contra el Reloj ⏱️ (5 min)</option>
      `;
    } else {
      tabAhorcado.classList.add('active');
      tabSopa.classList.remove('active');
      ahorcadoView.classList.remove('hidden');
      sopaView.classList.add('hidden');
      headerSubtitle.innerHTML = 'El Ahorcado &bull; Software Edition';
      statLabel2.textContent = 'Errores';
      statIcon2.className = 'fa-solid fa-skull-crossbones stat-icon';

      difficultySelect.innerHTML = `
        <option value="easy">Fácil (8 Intentos)</option>
        <option value="medium" selected>Medio (6 Intentos)</option>
        <option value="hard">Difícil (4 Intentos)</option>
        <option value="timed">Contra el Reloj ⏱️ (5 min)</option>
      `;
    }

    initGame();
  }

  // --- Core Initializer ---
  function initGame() {
    currentDifficulty = difficultySelect.value;
    stopTimer();
    secondsElapsed = 0;
    hintsRemaining = 3;
    hintsUsedCount = 0;
    isGameOver = false;
    isTimerRunning = false;
    updateHintUI();

    const isTimed = (activeGameMode === 'sopa' ? SOPA_CONFIG[currentDifficulty]?.timed : AHORCADO_CONFIG[currentDifficulty]?.timed);
    const timeLimit = (activeGameMode === 'sopa' ? SOPA_CONFIG[currentDifficulty]?.timeLimit : AHORCADO_CONFIG[currentDifficulty]?.timeLimit) || 300;

    timerDisplay.classList.remove('warning');
    if (isTimed) {
      timerDisplay.textContent = formatTime(timeLimit);
    } else {
      timerDisplay.textContent = '00:00';
    }

    loadBestTime();

    if (activeGameMode === 'sopa') {
      initSopaGame();
    } else {
      initAhorcadoGame();
    }
  }

  // --- SOPA DE LETRAS ENGINE ---
  function initSopaGame() {
    const config = SOPA_CONFIG[currentDifficulty] || SOPA_CONFIG.medium;
    gridSize = config.size;

    foundWords.clear();
    targetWords = selectRandomWords(config.wordCount);
    generateGrid(config.dirs);

    renderGrid();
    renderWordList();
    updateProgressUI();
    clearSelectionLine();
  }

  function selectRandomWords(count) {
    const shuffled = [...SOPA_WORD_DATABASE].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function generateGrid(allowedDirections) {
    gridMatrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    wordPlacements = {};

    targetWords.forEach(word => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 200) {
        attempts++;
        const dir = allowedDirections[Math.floor(Math.random() * allowedDirections.length)];
        const dr = dir[0];
        const dc = dir[1];

        let startR = Math.floor(Math.random() * gridSize);
        let startC = Math.floor(Math.random() * gridSize);

        let endR = startR + dr * (word.length - 1);
        let endC = startC + dc * (word.length - 1);

        if (endR >= 0 && endR < gridSize && endC >= 0 && endC < gridSize) {
          let fits = true;
          let coords = [];

          for (let i = 0; i < word.length; i++) {
            let r = startR + dr * i;
            let c = startC + dc * i;
            let existingChar = gridMatrix[r][c];

            if (existingChar !== '' && existingChar !== word[i]) {
              fits = false;
              break;
            }
            coords.push({ r, c });
          }

          if (fits) {
            coords.forEach((coord, i) => {
              gridMatrix[coord.r][coord.c] = word[i];
            });
            wordPlacements[word] = coords;
            placed = true;
          }
        }
      }
    });

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (gridMatrix[r][c] === '') {
          gridMatrix[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
  }

  function renderGrid() {
    gridContainer.innerHTML = '';
    gridContainer.className = `grid-container size-${gridSize}`;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.textContent = gridMatrix[r][c];
        gridContainer.appendChild(cell);
      }
    }
  }

  function renderWordList() {
    wordListContainer.innerHTML = '';
    targetWords.sort().forEach(word => {
      const pill = document.createElement('div');
      pill.className = 'word-pill';
      pill.dataset.word = word;
      pill.innerHTML = `<i class="fa-regular fa-square"></i> <span>${word}</span>`;
      wordListContainer.appendChild(pill);
    });
  }

  function updateProgressUI() {
    const total = targetWords.length;
    const found = foundWords.size;
    foundDisplay.textContent = `${found} / ${total}`;

    const percent = Math.round((found / total) * 100);
    progressPercent.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
  }

  function getCellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (el && el.classList.contains('grid-cell')) {
      return {
        r: parseInt(el.dataset.r, 10),
        c: parseInt(el.dataset.c, 10),
        element: el
      };
    }
    return null;
  }

  function startSelection(cell) {
    if (!cell || isGameOver || activeGameMode !== 'sopa') return;
    soundFx.init();
    if (!isTimerRunning) startTimer();

    isSelecting = true;
    startCell = cell;
    currentCell = cell;
    highlightSelection();
  }

  function updateSelection(cell) {
    if (!isSelecting || !startCell || !cell || activeGameMode !== 'sopa') return;
    
    if (currentCell.r !== cell.r || currentCell.c !== cell.c) {
      currentCell = cell;
      soundFx.playSelect();
      highlightSelection();
    }
  }

  function endSelection() {
    if (!isSelecting || activeGameMode !== 'sopa') return;
    isSelecting = false;

    if (selectedCells.length > 0) {
      checkSelectedWord();
    }

    clearSelectionHighlight();
    clearSelectionLine();
    startCell = null;
    currentCell = null;
  }

  function getLineCells(start, end) {
    const cells = [];
    const dr = end.r - start.r;
    const dc = end.c - start.c;

    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    if (absDr === 0 || absDc === 0 || absDr === absDc) {
      const stepR = dr === 0 ? 0 : dr / absDr;
      const stepC = dc === 0 ? 0 : dc / absDc;
      const steps = Math.max(absDr, absDc);

      for (let i = 0; i <= steps; i++) {
        const r = start.r + stepR * i;
        const c = start.c + stepC * i;
        cells.push({ r, c });
      }
    } else {
      cells.push({ r: start.r, c: start.c });
    }

    return cells;
  }

  function highlightSelection() {
    clearSelectionHighlight();
    if (!startCell || !currentCell) return;

    selectedCells = getLineCells(startCell, currentCell);

    selectedCells.forEach(coord => {
      const cellEl = gridContainer.querySelector(`.grid-cell[data-r="${coord.r}"][data-c="${coord.c}"]`);
      if (cellEl) cellEl.classList.add('selected');
    });

    drawSelectionLine();
  }

  function clearSelectionHighlight() {
    const selectedEls = gridContainer.querySelectorAll('.grid-cell.selected');
    selectedEls.forEach(el => el.classList.remove('selected'));
  }

  function drawSelectionLine() {
    if (selectedCells.length < 2) {
      clearSelectionLine();
      return;
    }

    const firstEl = gridContainer.querySelector(`.grid-cell[data-r="${selectedCells[0].r}"][data-c="${selectedCells[0].c}"]`);
    const lastEl = gridContainer.querySelector(`.grid-cell[data-r="${selectedCells[selectedCells.length - 1].r}"][data-c="${selectedCells[selectedCells.length - 1].c}"]`);

    if (!firstEl || !lastEl) return;

    const wrapperRect = boardWrapper.getBoundingClientRect();
    const firstRect = firstEl.getBoundingClientRect();
    const lastRect = lastEl.getBoundingClientRect();

    const x1 = firstRect.left + firstRect.width / 2 - wrapperRect.left;
    const y1 = firstRect.top + firstRect.height / 2 - wrapperRect.top;
    const x2 = lastRect.left + lastRect.width / 2 - wrapperRect.left;
    const y2 = lastRect.top + lastRect.height / 2 - wrapperRect.top;

    selectionCanvas.setAttribute('width', wrapperRect.width);
    selectionCanvas.setAttribute('height', wrapperRect.height);

    selectionCanvas.innerHTML = `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="drag-line" />
    `;
  }

  function clearSelectionLine() {
    selectionCanvas.innerHTML = '';
  }

  function checkSelectedWord() {
    let formedWord = selectedCells.map(coord => gridMatrix[coord.r][coord.c]).join('');
    let reversedWord = formedWord.split('').reverse().join('');

    let matchedWord = null;

    if (targetWords.includes(formedWord) && !foundWords.has(formedWord)) {
      matchedWord = formedWord;
    } else if (targetWords.includes(reversedWord) && !foundWords.has(reversedWord)) {
      matchedWord = reversedWord;
    }

    if (matchedWord) {
      foundWords.add(matchedWord);
      soundFx.playFound();

      const colorIndex = (foundWords.size - 1) % HIGHLIGHT_COLORS.length;
      const highlightBg = HIGHLIGHT_COLORS[colorIndex];

      selectedCells.forEach(coord => {
        const cellEl = gridContainer.querySelector(`.grid-cell[data-r="${coord.r}"][data-c="${coord.c}"]`);
        if (cellEl) {
          cellEl.classList.add('found');
          cellEl.style.backgroundColor = highlightBg;
        }
      });

      const pill = wordListContainer.querySelector(`.word-pill[data-word="${matchedWord}"]`);
      if (pill) {
        pill.classList.add('found');
        pill.querySelector('i').className = 'fa-solid fa-square-check';
      }

      updateProgressUI();

      if (foundWords.size === targetWords.length) {
        handleVictory();
      }
    }
  }

  // --- EL AHORCADO ENGINE ---
  function initAhorcadoGame() {
    const config = AHORCADO_CONFIG[currentDifficulty] || AHORCADO_CONFIG.medium;
    maxMistakesAllowed = config.maxMistakes;
    mistakesCount = 0;
    guessedLetters.clear();

    const item = AHORCADO_WORDS[Math.floor(Math.random() * AHORCADO_WORDS.length)];
    currentAhorcadoWord = item.word;
    currentAhorcadoHint = item.hint;
    currentAhorcadoRelated = item.related;

    ahorcadoRelatedWord.textContent = currentAhorcadoRelated;
    ahorcadoHintText.textContent = "Haz clic en 'Pista' para revelar la pista de este término.";
    foundDisplay.textContent = `0 / ${maxMistakesAllowed}`;
    ahorcadoStreak.textContent = `Racha: ${streakCount}`;

    renderWordSlots();
    renderVirtualKeyboard();
    resetHangmanSVG();
  }

  function renderWordSlots() {
    wordSlotsContainer.innerHTML = '';
    for (let char of currentAhorcadoWord) {
      const slot = document.createElement('div');
      slot.className = 'letter-slot';
      slot.dataset.char = char;
      slot.textContent = guessedLetters.has(char) ? char : '';
      if (guessedLetters.has(char)) {
        slot.classList.add('revealed');
      }
      wordSlotsContainer.appendChild(slot);
    }
  }

  function renderVirtualKeyboard() {
    virtualKeyboard.innerHTML = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    alphabet.forEach(letter => {
      const keyBtn = document.createElement('button');
      keyBtn.className = 'key-btn';
      keyBtn.textContent = letter;
      keyBtn.dataset.letter = letter;

      if (guessedLetters.has(letter)) {
        keyBtn.disabled = true;
        if (currentAhorcadoWord.includes(letter)) {
          keyBtn.classList.add('correct');
        } else {
          keyBtn.classList.add('wrong');
        }
      }

      keyBtn.addEventListener('click', () => guessLetter(letter));
      virtualKeyboard.appendChild(keyBtn);
    });
  }

  function resetHangmanSVG() {
    const svgParts = document.querySelectorAll('.hg-part.body-part, #hg-face-dead');
    svgParts.forEach(part => {
      part.classList.remove('visible-part');
      part.classList.add('hidden-part');
    });
  }

  function updateHangmanSVG() {
    const partSelectors = ['.head', '.torso', '.arm-left', '.arm-right', '.leg-left', '.leg-right'];
    const totalParts = partSelectors.length;
    const countToShow = Math.min(totalParts, Math.ceil((mistakesCount / maxMistakesAllowed) * totalParts));

    for (let i = 0; i < totalParts; i++) {
      const el = document.querySelector(`.hg-part${partSelectors[i]}`);
      if (el) {
        if (i < countToShow) {
          el.classList.remove('hidden-part');
          el.classList.add('visible-part');
        } else {
          el.classList.remove('visible-part');
          el.classList.add('hidden-part');
        }
      }
    }

    if (mistakesCount >= maxMistakesAllowed) {
      const faceDead = document.getElementById('hg-face-dead');
      if (faceDead) {
        faceDead.classList.remove('hidden-part');
        faceDead.classList.add('visible-part');
      }
    }
  }

  function guessLetter(letter) {
    if (isGameOver || guessedLetters.has(letter) || activeGameMode !== 'ahorcado') return;
    soundFx.init();
    if (!isTimerRunning) startTimer();

    guessedLetters.add(letter);

    if (currentAhorcadoWord.includes(letter)) {
      soundFx.playSelect();
      renderWordSlots();
      renderVirtualKeyboard();

      const isWordComplete = currentAhorcadoWord.split('').every(ch => guessedLetters.has(ch));
      if (isWordComplete) {
        streakCount++;
        ahorcadoStreak.textContent = `Racha: ${streakCount}`;
        handleVictory();
      }
    } else {
      mistakesCount++;
      foundDisplay.textContent = `${mistakesCount} / ${maxMistakesAllowed}`;
      soundFx.playTone(180, 'sawtooth', 0.15, 0.1);
      updateHangmanSVG();
      renderVirtualKeyboard();

      if (mistakesCount >= maxMistakesAllowed) {
        streakCount = 0;
        ahorcadoStreak.textContent = `Racha: 0`;
        for (let char of currentAhorcadoWord) {
          guessedLetters.add(char);
        }
        renderWordSlots();
        handleAhorcadoLoss();
      }
    }
  }

  // --- HINT SYSTEM ---
  function giveHint() {
    if (hintsRemaining <= 0 || isGameOver) return;

    if (activeGameMode === 'sopa') {
      giveSopaHint();
    } else {
      giveAhorcadoHint();
    }
  }

  function giveSopaHint() {
    const unfound = targetWords.filter(w => !foundWords.has(w));
    if (unfound.length === 0) return;

    const randomWord = unfound[Math.floor(Math.random() * unfound.length)];
    const coords = wordPlacements[randomWord];

    if (coords && coords.length > 0) {
      const firstCoord = coords[0];
      const cellEl = gridContainer.querySelector(`.grid-cell[data-r="${firstCoord.r}"][data-c="${firstCoord.c}"]`);

      if (cellEl) {
        soundFx.playHint();
        cellEl.classList.add('hint-pulse');

        setTimeout(() => {
          cellEl.classList.remove('hint-pulse');
        }, 2500);

        hintsRemaining--;
        hintsUsedCount++;
        updateHintUI();
      }
    }
  }

  function giveAhorcadoHint() {
    soundFx.playHint();
    ahorcadoHintText.textContent = currentAhorcadoHint;

    const unrevealed = currentAhorcadoWord.split('').filter(ch => !guessedLetters.has(ch));
    if (unrevealed.length > 0) {
      const hintLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      guessLetter(hintLetter);
    }

    hintsRemaining--;
    hintsUsedCount++;
    updateHintUI();
  }

  function updateHintUI() {
    hintBadge.textContent = hintsRemaining;
    if (hintsRemaining <= 0) {
      hintBtn.disabled = true;
      hintBtn.style.opacity = '0.5';
    } else {
      hintBtn.disabled = false;
      hintBtn.style.opacity = '1';
    }
  }

  // --- TIMER CONTROLS ---
  function startTimer() {
    if (isTimerRunning || isGameOver) return;
    isTimerRunning = true;
    const isTimed = (activeGameMode === 'sopa' ? SOPA_CONFIG[currentDifficulty]?.timed : AHORCADO_CONFIG[currentDifficulty]?.timed);
    const timeLimit = (activeGameMode === 'sopa' ? SOPA_CONFIG[currentDifficulty]?.timeLimit : AHORCADO_CONFIG[currentDifficulty]?.timeLimit) || 300;

    timerInterval = setInterval(() => {
      secondsElapsed++;
      if (isTimed) {
        const timeRemaining = timeLimit - secondsElapsed;
        if (timeRemaining <= 30) {
          timerDisplay.classList.add('warning');
        } else {
          timerDisplay.classList.remove('warning');
        }

        if (timeRemaining <= 0) {
          timerDisplay.textContent = '00:00';
          handleTimeOutLoss();
        } else {
          timerDisplay.textContent = formatTime(timeRemaining);
        }
      } else {
        timerDisplay.textContent = formatTime(secondsElapsed);
      }
    }, 1000);
  }

  function stopTimer() {
    isTimerRunning = false;
    if (timerInterval) clearInterval(timerInterval);
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- HIGH SCORES / RECORDS ---
  function loadBestTime() {
    const saved = localStorage.getItem(`devgames_best_${activeGameMode}_${currentDifficulty}`);
    if (saved) {
      bestTimeDisplay.textContent = formatTime(parseInt(saved, 10));
    } else {
      bestTimeDisplay.textContent = '--:--';
    }
  }

  function checkAndUpdateBestTime(timeInSec) {
    const saved = localStorage.getItem(`devgames_best_${activeGameMode}_${currentDifficulty}`);
    if (!saved || timeInSec < parseInt(saved, 10)) {
      localStorage.setItem(`devgames_best_${activeGameMode}_${currentDifficulty}`, timeInSec);
      bestTimeDisplay.textContent = formatTime(timeInSec);
    }
  }

  // --- VICTORY & LOSS HANDLERS ---
  function handleVictory() {
    stopTimer();
    isGameOver = true;
    soundFx.playVictory();
    checkAndUpdateBestTime(secondsElapsed);

    const modalBadge = victoryModal.querySelector('.trophy-badge');
    modalBadge.innerHTML = '<i class="fa-solid fa-trophy"></i>';
    modalBadge.style.background = 'linear-gradient(135deg, var(--accent-amber), #fbbf24)';
    modalBadge.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.5)';

    const diffMap = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', timed: 'Contra Reloj' };
    victoryModal.querySelector('.modal-header h2').textContent = '¡Excelente Trabajo!';
    
    if (activeGameMode === 'sopa') {
      victoryModal.querySelector('.modal-header p').textContent = 'Has encontrado todas las palabras del código.';
    } else {
      victoryModal.querySelector('.modal-header p').textContent = `¡Has adivinado la palabra "${currentAhorcadoWord}" con éxito!`;
    }

    finalTimeDisplay.textContent = formatTime(secondsElapsed);
    finalDiffDisplay.textContent = diffMap[currentDifficulty] || 'Medio';
    finalHintsDisplay.textContent = hintsUsedCount;

    modalRestartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Jugar Otra Vez';
    victoryModal.classList.remove('hidden');
    startConfetti();
  }

  function handleTimeOutLoss() {
    stopTimer();
    isGameOver = true;
    soundFx.playDefeat();

    const modalBadge = victoryModal.querySelector('.trophy-badge');
    modalBadge.innerHTML = '<i class="fa-solid fa-hourglass-end"></i>';
    modalBadge.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
    modalBadge.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.5)';

    const diffMap = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', timed: 'Contra Reloj' };
    victoryModal.querySelector('.modal-header h2').textContent = '¡Tiempo Agotado!';
    victoryModal.querySelector('.modal-header p').textContent = 'Se han acabado los 5 minutos. ¡Inténtalo de nuevo!';

    finalTimeDisplay.textContent = '05:00';
    finalDiffDisplay.textContent = diffMap[currentDifficulty] || 'Contra Reloj';
    finalHintsDisplay.textContent = hintsUsedCount;

    modalRestartBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reintentar';
    victoryModal.classList.remove('hidden');
  }

  function handleAhorcadoLoss() {
    stopTimer();
    isGameOver = true;
    soundFx.playDefeat();

    const modalBadge = victoryModal.querySelector('.trophy-badge');
    modalBadge.innerHTML = '<i class="fa-solid fa-skull"></i>';
    modalBadge.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
    modalBadge.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.5)';

    const diffMap = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', timed: 'Contra Reloj' };
    victoryModal.querySelector('.modal-header h2').textContent = '¡El Ahorcado ha caído!';
    victoryModal.querySelector('.modal-header p').textContent = `La palabra secreta era "${currentAhorcadoWord}". ¡Inténtalo de nuevo!`;

    finalTimeDisplay.textContent = formatTime(secondsElapsed);
    finalDiffDisplay.textContent = diffMap[currentDifficulty] || 'Medio';
    finalHintsDisplay.textContent = hintsUsedCount;

    modalRestartBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reintentar';
    victoryModal.classList.remove('hidden');
  }

  // --- CONFETTI ANIMATION ---
  function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = victoryModal.querySelector('.modal-card').clientWidth;
    canvas.height = victoryModal.querySelector('.modal-card').clientHeight;

    const particles = [];
    const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 3,
        d: Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0
      });
    }

    let animationFrame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 1 + p.r / 2) / 2;
        p.x += Math.sin(p.d);
        p.tilt = Math.sin(p.tiltAngle) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      if (!victoryModal.classList.contains('hidden')) {
        animationFrame = requestAnimationFrame(draw);
      }
    }
    draw();
  }

  // --- EVENT LISTENERS ---
  tabSopa.addEventListener('click', () => switchGameMode('sopa'));
  tabAhorcado.addEventListener('click', () => switchGameMode('ahorcado'));

  // Mouse Drag Selection (Sopa)
  gridContainer.addEventListener('mousedown', (e) => {
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) startSelection(cell);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) updateSelection(cell);
  });

  window.addEventListener('mouseup', () => {
    if (isSelecting) endSelection();
  });

  // Touch Drag Selection (Mobile Sopa)
  gridContainer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (cell) {
      e.preventDefault();
      startSelection(cell);
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!isSelecting) return;
    const touch = e.touches[0];
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (cell) {
      e.preventDefault();
      updateSelection(cell);
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    if (isSelecting) endSelection();
  });

  // Physical Keyboard Listener (Ahorcado)
  window.addEventListener('keydown', (e) => {
    if (activeGameMode === 'ahorcado' && !isGameOver) {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        guessLetter(key);
      }
    }
  });

  // Controls Event Listeners
  difficultySelect.addEventListener('change', () => initGame());
  newGameBtn.addEventListener('click', () => initGame());
  hintBtn.addEventListener('click', () => giveHint());

  modalRestartBtn.addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    initGame();
  });

  // Sound Toggle Button
  soundBtn.addEventListener('click', () => {
    soundFx.enabled = !soundFx.enabled;
    const icon = soundBtn.querySelector('i');
    if (soundFx.enabled) {
      icon.className = 'fa-solid fa-volume-high';
      soundBtn.title = 'Desactivar Sonido';
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      soundBtn.title = 'Activar Sonido';
    }
  });

  // Theme Toggle Button
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const icon = themeBtn.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
      icon.className = 'fa-solid fa-sun';
      themeBtn.title = 'Cambiar a Modo Oscuro';
    } else {
      icon.className = 'fa-solid fa-moon';
      themeBtn.title = 'Cambiar a Modo Claro';
    }
  });

  // Resize Listener for SVG Drag Line
  window.addEventListener('resize', () => {
    if (isSelecting && activeGameMode === 'sopa') highlightSelection();
  });

  // Initialize Game on Load
  initGame();
});
