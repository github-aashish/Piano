class Piano {
    constructor() {
        this.keys = document.querySelectorAll('.key');
        this.recordButton = document.getElementById('recordButton');
        this.stopButton = document.getElementById('stopButton');
        this.playButton = document.getElementById('playButton');
        this.saveButton = document.getElementById('saveButton');
        this.loadButton = document.getElementById('loadButton');
        this.decreaseOctaveBtn = document.getElementById('decreaseOctave');
        this.increaseOctaveBtn = document.getElementById('increaseOctave');
        this.currentOctaveSpan = document.getElementById('currentOctave');
        
        this.isRecording = false;
        this.recording = [];
        this.startTime = null;
        this.currentOctave = 4;
        this.baseOctave = 1; // Starting octave for key mappings
        
        this.keyMap = {
            // Lower Octave (Z-M)
            'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3',
            'b': 'G3', 'n': 'A3', 'm': 'B3',
            // Middle Octave (A-K)
            'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4',
            'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5',
            // Upper Octave (Shift + A-K)
            'A': 'C5', 'S': 'D5', 'D': 'E5', 'F': 'F5',
            'G': 'G5', 'H': 'A5', 'J': 'B5',
            // Black Keys - Lower Octave
            'q': 'Db3', 'w': 'Eb3', 'r': 'Gb3',
            't': 'Ab3', 'y': 'Bb3',
            // Black Keys - Middle Octave
            'u': 'Db4', 'i': 'Eb4', 'o': 'Gb4',
            'p': 'Ab4', '[': 'Bb4',
            // Black Keys - Upper Octave (Shift + QWRTY)
            'Q': 'Db5', 'W': 'Eb5', 'R': 'Gb5',
            'T': 'Ab5', 'Y': 'Bb5'
        };

        this.init();
    }

    init() {
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = new Map();
        this.loadSounds();

        // Event listeners
        this.setupEventListeners();
    }

    async loadSounds() {
        // Load all available notes from A0 to C8
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const accidentals = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
        
        // Load A0 to G1 (special cases)
        await this.loadSound('A0');
        await this.loadSound('B0');
        await this.loadSound('Bb0');
        
        // Load octaves 1-7 and special cases
        for (let octave = 1; octave <= 7; octave++) {
            for (let note of notes) {
                await this.loadSound(`${note}${octave}`);
            }
            for (let note of accidentals) {
                await this.loadSound(`${note}${octave}`);
            }
        }
        
        // Load C8 (last note)
        await this.loadSound('C8');
        await this.loadSound('Db8');
    }

    changeOctave(delta) {
        const newOctave = this.currentOctave + delta;
        if (newOctave >= 0 && newOctave <= 7) {
            this.currentOctave = newOctave;
            this.currentOctaveSpan.textContent = this.currentOctave;
            this.updateKeyBindings();
        }
    }

    updateKeyBindings() {
        // Update the key mappings based on current octave
        this.keyMap = this.generateKeyMap(this.currentOctave);
    }

    generateKeyMap(octave) {
        return {
            // White keys - bottom row
            'z': `C${octave}`, 'x': `D${octave}`, 'c': `E${octave}`, 
            'v': `F${octave}`, 'b': `G${octave}`, 'n': `A${octave}`, 
            'm': `B${octave}`,
            // White keys - top row
            'a': `C${octave+1}`, 's': `D${octave+1}`, 'd': `E${octave+1}`, 
            'f': `F${octave+1}`, 'g': `G${octave+1}`, 'h': `A${octave+1}`, 
            'j': `B${octave+1}`, 'k': `C${octave+2}`,
            
            // Black keys - bottom row
            'q': `Db${octave}`, 'w': `Eb${octave}`, 
            'r': `Gb${octave}`, 't': `Ab${octave}`, 
            'y': `Bb${octave}`,
            
            // Black keys - top row
            'u': `Db${octave+1}`, 'i': `Eb${octave+1}`, 
            'o': `Gb${octave+1}`, 'p': `Ab${octave+1}`, 
            '[': `Bb${octave+1}`,

            // Shift combinations for additional octaves
            'Z': `C${octave-1}`, 'X': `D${octave-1}`, 'C': `E${octave-1}`,
            'V': `F${octave-1}`, 'B': `G${octave-1}`, 'N': `A${octave-1}`,
            'M': `B${octave-1}`,

            'A': `C${octave+2}`, 'S': `D${octave+2}`, 'D': `E${octave+2}`,
            'F': `F${octave+2}`, 'G': `G${octave+2}`, 'H': `A${octave+2}`,
            'J': `B${octave+2}`
        };
    }
    }

    async loadSound(note) {
        try {
            const response = await fetch(`piano-mp3/${note}.mp3`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.buffers.set(note, audioBuffer);
        } catch (error) {
            console.error(`Error loading sound ${note}:`, error);
        }
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Touch/Click events
        this.keys.forEach(key => {
            key.addEventListener('mousedown', () => this.playNote(key.dataset.note));
            key.addEventListener('mouseup', () => this.stopNote(key.dataset.note));
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.playNote(key.dataset.note);
            });
            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopNote(key.dataset.note);
            });
        });

        // Recording controls
        this.recordButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        this.playButton.addEventListener('click', () => this.playRecording());
        this.saveButton.addEventListener('click', () => this.saveRecording());
        this.loadButton.addEventListener('click', () => this.loadRecording());

        // Octave controls
        this.decreaseOctaveBtn.addEventListener('click', () => this.changeOctave(-1));
        this.increaseOctaveBtn.addEventListener('click', () => this.changeOctave(1));
    }

    handleKeyDown(e) {
        if (e.repeat) return;
        const note = this.keyMap[e.key.toLowerCase()];
        if (note) {
            this.playNote(note);
        }
    }

    handleKeyUp(e) {
        const note = this.keyMap[e.key.toLowerCase()];
        if (note) {
            this.stopNote(note);
        }
    }

    playNote(note) {
        const key = Array.from(this.keys).find(k => k.dataset.note === note);
        if (!key || !this.buffers.has(note)) return;

        // Add visual feedback
        key.classList.add('active', 'pressed');
        setTimeout(() => key.classList.remove('pressed'), 100);

        // Play the sound
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers.get(note);
        source.connect(this.audioContext.destination);
        source.start(0);

        // Record if recording is active
        if (this.isRecording) {
            const time = Date.now() - this.startTime;
            this.recording.push({
                note,
                time,
                duration: source.buffer.duration
            });
        }
    }

    stopNote(note) {
        const key = Array.from(this.keys).find(k => k.dataset.note === note);
        if (key) {
            key.classList.remove('active');
        }
    }

    startRecording() {
        this.isRecording = true;
        this.recording = [];
        this.startTime = Date.now();
        this.recordButton.disabled = true;
        this.stopButton.disabled = false;
        this.playButton.disabled = true;
        this.recordButton.classList.add('recording');
    }

    stopRecording() {
        this.isRecording = false;
        this.recordButton.disabled = false;
        this.stopButton.disabled = true;
        this.playButton.disabled = false;
        this.recordButton.classList.remove('recording');
    }

    async playRecording() {
        if (this.recording.length === 0) return;

        this.recordButton.disabled = true;
        this.stopButton.disabled = true;
        this.playButton.disabled = true;

        for (const note of this.recording) {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.playNote(note.note);
                    resolve();
                }, note.time);
            });
        }

        // Wait for the last note to finish
        await new Promise(resolve => {
            setTimeout(() => {
                this.recordButton.disabled = false;
                this.playButton.disabled = false;
                resolve();
            }, this.recording[this.recording.length - 1].duration * 1000);
        });
    }
}

// Initialize the piano when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const piano = new Piano();
});
