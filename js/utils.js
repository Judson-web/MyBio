// js/utils.js

// Function to play sound effects using Tone.js
export const playSound = (note, type = 'sine', duration = '8n') => {
    // Ensure Tone.js is loaded before attempting to play sound
    if (typeof Tone === 'undefined') {
        console.warn("Tone.js is not loaded. Cannot play sound.");
        return;
    }

    // Attempt to resume AudioContext if it's suspended (common on mobile/tab switches)
    if (Tone.context.state !== 'running' && Tone.context.state !== 'closed') {
        Tone.context.resume().then(() => {
            console.log("AudioContext resumed successfully.");
            const synth = new Tone.Synth({
                oscillator: { type },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
            }).toDestination();
            synth.triggerAttackRelease(note, duration);
        }).catch(e => console.error("Failed to resume AudioContext:", e));
    } else if (Tone.context.state === 'running') {
        // If AudioContext is already running, just play the sound
        const synth = new Tone.Synth({
            oscillator: { type },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        synth.triggerAttackRelease(note, duration);
    }
};

// Function to display toast notifications
export const showToast = (message) => {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        // Hide the toast after 3 seconds
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

// Helper functions for showing/hiding elements by toggling 'display: none'
// These are not currently used in main.js but are good utilities to have here.
export const hide = (element) => {
    if (element) {
        element.style.display = 'none';
    }
};

export const show = (element, displayType = 'block') => {
    if (element) {
        element.style.display = displayType;
    }
};
