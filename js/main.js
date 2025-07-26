// js/main.js

// Import utility functions from utils.js
import { playSound, showToast } from './utils.js';

// --- Global State & Helpers (moved from index.html) ---
const pageLoadTime = new Date();
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let lastMouseX = mouse.x;
let lastMouseY = mouse.y;

// --- Theme & Animation Management (will be split further) ---
let activeAnimationId; // Tracks the current animation frame ID

// Placeholder for animation functions (will be imported later)
let initStarfield;
let animateAurora;
let initBubbles;
let animateDay;
let initCursorTrail;
let animateCursorTrail;
let updateCursorTrailColor;

// Function to apply the current theme
const applyTheme = (theme) => {
    if (activeAnimationId) {
        cancelAnimationFrame(activeAnimationId);
    }
    document.body.classList.remove('light-theme', 'matrix-theme');

    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (typeof initBubbles === 'function') {
            initBubbles();
            animateDay();
        }
    } else if (theme === 'matrix') {
        document.body.classList.add('matrix-theme');
        // activateKonami(true); // Konami logic will be imported later
    }
    else { // Dark theme
        if (typeof initStarfield === 'function') {
            initStarfield();
            animateAurora();
        }
    }
    localStorage.setItem('theme', theme);
    if (typeof updateCursorTrailColor === 'function') {
        updateCursorTrailColor();
    }
};

// Function to toggle the theme
const toggleTheme = () => {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    playSound(newTheme === 'light' ? 'C5' : 'G4', 'triangle');
};

// --- Modals Logic (will be split further) ---
const openModal = (modalId) => {
    const modal = document.getElementById(`${modalId}-modal`);
    if (!modal) return;
    modal.classList.add('active');
    playSound('C4', 'triangle');
    // Specific modal initializations (will be handled by their own modules later)
    if(modalId === 'contact') {
        const cliInput = document.getElementById('cli-input');
        if (cliInput) cliInput.focus();
    }
    if (modalId === 'projects') {
        // renderProjects(); // Will be called from projects module
    }
    if (modalId === 'chatbot') {
        // chatbot.init(); // Will be called from chatbot module
    }
    if (modalId === 'generative-art') {
        // renderGenerativeArt(); // Will be called from generativeArt module
    }
    // Close drawer if open
    if (typeof closeDrawer === 'function') { // Check if closeDrawer is available
        closeDrawer();
    }
};

const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('active');
    playSound('C3', 'triangle', '16n');
};

// --- Navigation Drawer Logic (will be split further) ---
let populateDrawerLinks; // Placeholder for drawer function
let closeDrawer; // Placeholder for drawer function

// --- CLI Logic (will be split further) ---
let cli; // Placeholder for cli object

// --- Chatbot Logic (will be split further) ---
let chatbot; // Placeholder for chatbot object

// --- Project Rendering Logic (will be split further) ---
let renderProjects; // Placeholder for renderProjects

// --- Generative Art Logic (will be split further) ---
let renderGenerativeArt; // Placeholder for renderGenerativeArt

// --- Konami Code Logic (will be split further) ---
let activateKonami; // Placeholder for activateKonami

// --- Status Widget Update Functions (will be split further) ---
let updateTime;
let updateWeather;
let updateGitHubStats;
let updateNowPlaying;


// --- Main Initialization Function ---
async function initializePage() {
    // Ensure all external scripts are loaded before proceeding with their functions
    // This is a temporary measure; proper module imports will handle this better.
    await Promise.all([
        document.fonts.ready, // Wait for fonts to load
        new Promise(resolve => { if (typeof feather !== 'undefined') resolve(); else { const s = document.createElement('script'); s.src = 'https://unpkg.com/feather-icons'; s.onload = resolve; document.head.appendChild(s); } }),
        new Promise(resolve => { if (typeof Tone !== 'undefined') resolve(); else { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js'; s.onload = resolve; document.head.appendChild(s); } })
    ]);
    feather.replace(); // Ensure icons are rendered after loading

    // Import modules dynamically after initial setup (for now)
    // In a real build system, these would be static imports at the top.
    // Note: The paths here are relative to main.js
    const { initStarfield: _initStarfield, animateAurora: _animateAurora } = await import('./animations/aurora.js').catch(e => { console.error("Failed to load aurora.js", e); return {}; });
    const { initBubbles: _initBubbles, animateDay: _animateDay } = await import('./animations/bubbles.js').catch(e => { console.error("Failed to load bubbles.js", e); return {}; });
    const { initCursorTrail: _initCursorTrail, animateCursorTrail: _animateCursorTrail, updateCursorTrailColor: _updateCursorTrailColor } = await import('./animations/cursorTrail.js').catch(e => { console.error("Failed to load cursorTrail.js", e); return {}; });
    const { populateDrawerLinks: _populateDrawerLinks, closeDrawer: _closeDrawer } = await import('./ui/drawer.js').catch(e => { console.error("Failed to load drawer.js", e); return {}; });
    const { cli: _cli } = await import('./features/cli.js').catch(e => { console.error("Failed to load cli.js", e); return {}; });
    const { chatbot: _chatbot } = await import('./features/chatbot.js').catch(e => { console.error("Failed to load chatbot.js", e); return {}; });
    const { renderProjects: _renderProjects } = await import('./features/projects.js').catch(e => { console.error("Failed to load projects.js", e); return {}; });
    const { renderGenerativeArt: _renderGenerativeArt } = await import('./features/generativeArt.js').catch(e => { console.error("Failed to load generativeArt.js", e); return {}; });
    const { activateKonami: _activateKonami } = await import('./animations/konami.js').catch(e => { console.error("Failed to load konami.js", e); return {}; });
    const { updateTime: _updateTime, updateWeather: _updateWeather, updateGitHubStats: _updateGitHubStats } = await import('./widgets/timeWeatherGithub.js').catch(e => { console.error("Failed to load timeWeatherGithub.js", e); return {}; });
    const { updateNowPlaying: _updateNowPlaying } = await import('./widgets/nowPlaying.js').catch(e => { console.error("Failed to load nowPlaying.js", e); return {}; });
    
    // Assign imported functions/objects to global placeholders
    initStarfield = _initStarfield;
    animateAurora = _animateAurora;
    initBubbles = _initBubbles;
    animateDay = _animateDay;
    initCursorTrail = _initCursorTrail;
    animateCursorTrail = _animateCursorTrail;
    updateCursorTrailColor = _updateCursorTrailColor;
    populateDrawerLinks = _populateDrawerLinks;
    closeDrawer = _closeDrawer;
    cli = _cli;
    chatbot = _chatbot;
    renderProjects = _renderProjects;
    renderGenerativeArt = _renderGenerativeArt;
    activateKonami = _activateKonami;
    updateTime = _updateTime;
    updateWeather = _updateWeather;
    updateGitHubStats = _updateGitHubStats;
    updateNowPlaying = _updateNowPlaying;


    // Call initial setup functions
    resizeAllCanvases();
    applyTheme(localStorage.getItem('theme') || 'dark');
    updateTime();
    updateWeather();
    updateGitHubStats();
    updateNowPlaying();
    
    // Personalized Greeting Logic
    const greetingEl = document.getElementById('greeting');
    const lastVisitTimestamp = localStorage.getItem('lastVisitTimestamp');
    const currentTime = Date.now();

    if (lastVisitTimestamp) {
        const promptForAI = `The user is returning to the website. Their last visit was ${new Date(parseInt(lastVisitTimestamp)).toLocaleString()}. Generate a very short, friendly, and creative welcome back message (1-2 sentences). You are Judson's AI assistant.`;
        
        try {
            const response = await fetch('/.netlify/functions/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptForAI }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.response) {
                    greetingEl.textContent = data.response;
                }
            } else {
                console.error("Failed to get AI greeting:", await response.text());
            }
        } catch (e) {
            console.error("Error calling AI for greeting:", e);
        }
    }
    localStorage.setItem('lastVisitTimestamp', currentTime.toString());

    cli.showWelcome(); 
    setInterval(updateTime, 60000);
    setInterval(updateWeather, 30 * 60 * 1000);
    setInterval(updateGitHubStats, 60 * 60 * 1000);
    setInterval(updateNowPlaying, 15 * 1000);
    
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('A5', 'sine', '32n'));
    });

    initCursorTrail();
    animateCursorTrail();
    updateCursorTrailColor();
}

// --- Event Listeners (Global) ---
window.addEventListener("resize", () => {
    resizeAllCanvases();
    applyTheme(localStorage.getItem('theme') || 'dark');
    updateCursorTrailColor();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouseVelocityX = e.clientX - lastMouseX;
    mouseVelocityY = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

// --- Modal Close Listeners (General) ---
document.querySelectorAll('.close-modal').forEach(el => {
    el.addEventListener('click', () => closeModal(el.closest('.modal-overlay')));
});
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) closeModal(el);
    });
});

// --- Command Palette Global Shortcut ---
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (typeof openCommandPalette === 'function') { // Check if function is available
            openCommandPalette();
        }
    }
});

// --- Custom Context Menu Logic (will be split further) ---
let customContextMenu; // Placeholder for context menu element
let openCommandPalette; // Placeholder for command palette function

// Initialize Custom Context Menu
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!customContextMenu) customContextMenu = document.getElementById('custom-context-menu'); // Ensure element is selected
    if (customContextMenu) {
        customContextMenu.style.top = `${e.clientY}px`;
        customContextMenu.style.left = `${e.clientX}px`;
        customContextMenu.style.display = 'flex';
        feather.replace();
    }
});

document.addEventListener('click', (e) => {
    if (customContextMenu && customContextMenu.style.display === 'flex' && !customContextMenu.contains(e.target)) {
        customContextMenu.style.display = 'none';
    }
});

if (customContextMenu) {
    customContextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            switch (action) {
                case 'toggleTheme':
                    toggleTheme();
                    break;
                case 'openCli':
                    openModal('contact');
                    break;
                case 'copyUrl':
                    const dummy = document.createElement('textarea');
                    document.body.appendChild(dummy);
                    dummy.value = window.location.href;
                    dummy.select();
                    document.execCommand('copy');
                    document.body.removeChild(dummy);
                    showToast('Page URL copied!');
                    break;
                default:
                    console.log(`Context menu action: ${action}`);
            }
            customContextMenu.style.display = 'none';
        });
    });
}


// --- Initial Page Load Event ---
document.addEventListener('DOMContentLoaded', initializePage);
