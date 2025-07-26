/**
 * Judson AI Chatbot
 * A complete refactor of the original portfolio into a dedicated chatbot application.
 *
 * @version 2.0.1
 * @author Judson Saji
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather Icons
    feather.replace();

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // --- DOM ELEMENT SELECTORS ---
    const DOMElements = {
        welcomeScreen: document.getElementById('welcome-screen'),
        chatInterface: document.getElementById('chat-interface'),
        suggestedPrompts: document.getElementById('suggested-prompts'),
        startChatBtn: document.getElementById('start-chat-btn'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        clearChatBtn: document.getElementById('clear-chat-btn'),
        chatDisplay: document.getElementById('chat-display'),
        thinkingIndicator: document.getElementById('thinking-indicator'),
        chatbotInput: document.getElementById('chatbot-input'),
        chatbotSendBtn: document.getElementById('chatbot-send-btn'),
        auroraCanvas: document.getElementById('aurora-canvas'),
        cursorTrailCanvas: document.getElementById('cursor-trail-canvas'),
        toast: document.getElementById('toast'),
    };

    // --- STATE MANAGEMENT ---
    const state = {
        chatHistory: [],
        isThinking: false,
        currentTheme: localStorage.getItem('theme') || 'dark',
    };

    // --- HELPER & UTILITY FUNCTIONS ---

    /**
     * Shows a short-lived notification message.
     * @param {string} message The message to display.
     */
    const showToast = (message) => {
        if (!DOMElements.toast) return;
        DOMElements.toast.textContent = message;
        DOMElements.toast.classList.add('show');
        setTimeout(() => DOMElements.toast.classList.remove('show'), 3000);
    };

    /**
     * Switches the application between 'dark' and 'light' themes.
     */
    const toggleTheme = () => {
        state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(state.currentTheme);
    };

    /**
     * Applies a specified theme to the document body.
     * @param {string} theme The theme to apply ('dark' or 'light').
     */
    const applyTheme = (theme) => {
        document.body.classList.toggle('light-theme', theme === 'light');
        localStorage.setItem('theme', theme);
        const themeIcon = theme === 'light' ? 'moon' : 'sun';
        if (DOMElements.themeToggleBtn) {
            DOMElements.themeToggleBtn.innerHTML = `<i data-feather="${themeIcon}"></i>`;
            feather.replace();
        }
        updateCursorTrailColor();
    };

    // --- CHATBOT CORE LOGIC ---

    const chatbot = {
        /**
         * Initializes the chatbot, setting up event listeners and the initial state.
         */
        init() {
            // Event Listeners
            DOMElements.startChatBtn?.addEventListener('click', () => this.startChatSession());
            DOMElements.suggestedPrompts?.addEventListener('click', (e) => {
                if (e.target.classList.contains('prompt-btn')) {
                    this.startChatWithPrompt(e.target.textContent.replace(/"/g, ''));
                }
            });
            DOMElements.themeToggleBtn?.addEventListener('click', toggleTheme);
            DOMElements.clearChatBtn?.addEventListener('click', () => this.clearChat());
            DOMElements.chatbotSendBtn?.addEventListener('click', () => this.sendMessage());
            DOMElements.chatbotInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !state.isThinking) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Restore chat history from localStorage if it exists
            const savedHistory = localStorage.getItem('judson_ai_history');
            if(savedHistory) {
                state.chatHistory = JSON.parse(savedHistory);
                if(state.chatHistory.length > 0) {
                    this.startChatSession();
                    state.chatHistory.forEach(msg => this.addMessageToDOM(msg.role, msg.parts[0].text, false));
                }
            }
        },

        /**
         * Transitions from the welcome screen to the main chat interface.
         */
        startChatSession() {
            DOMElements.welcomeScreen?.classList.add('hidden');
            DOMElements.chatInterface?.classList.remove('hidden');
            DOMElements.chatbotInput?.focus();
        },

        /**
         * Starts a chat session with a predefined prompt.
         * @param {string} promptText The text of the suggested prompt.
         */
        startChatWithPrompt(promptText) {
            this.startChatSession();
            DOMElements.chatbotInput.value = promptText;
            this.sendMessage();
        },

        /**
         * Clears the chat history and resets the display.
         */
        clearChat() {
            state.chatHistory = [];
            localStorage.removeItem('judson_ai_history');
            DOMElements.chatDisplay.innerHTML = '';
            this.addMessageToDOM('ai', 'Chat history cleared. How can I help you now?');
            showToast('Chat cleared!');
        },

        /**
         * Toggles the visibility of the "AI is thinking" indicator.
         * @param {boolean} show Whether to show or hide the indicator.
         */
        showThinking(show) {
            state.isThinking = show;
            DOMElements.thinkingIndicator?.classList.toggle('hidden', !show);
            if (DOMElements.chatbotInput) DOMElements.chatbotInput.disabled = show;
            if (DOMElements.chatbotSendBtn) DOMElements.chatbotSendBtn.disabled = show;
        },

        /**
         * Adds a message to the chat display.
         * @param {string} sender 'user' or 'ai'.
         * @param {string} text The message content.
         * @param {boolean} [animate=true] Whether to animate the message appearance.
         */
        addMessageToDOM(sender, text, animate = true) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}`;
            // Use marked to parse markdown for AI responses
            messageDiv.innerHTML = sender === 'ai' ? marked.parse(text) : text;
            if (!animate) messageDiv.style.animation = 'none';
            DOMElements.chatDisplay.appendChild(messageDiv);
            DOMElements.chatDisplay.scrollTop = DOMElements.chatDisplay.scrollHeight;
        },

        /**
         * Sends the user's message to the AI and processes the response.
         */
        async sendMessage() {
            const userMessage = DOMElements.chatbotInput.value.trim();
            if (!userMessage || state.isThinking) return;

            this.addMessageToDOM('user', userMessage);
            state.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            DOMElements.chatbotInput.value = '';
            this.showThinking(true);

            try {
                // NOTE: Assumes a Netlify function at this endpoint
                const response = await fetch('/.netlify/functions/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userMessage, history: state.chatHistory }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `API error: ${response.status}`);
                }
                const data = await response.json();

                if (data && data.response) {
                    // *** BUG FIX STARTS HERE ***
                    // The error "marked(): input parameter is of type [object Object]" means
                    // data.response is not a string. We must safely extract the text.
                    let responseText = "Sorry, I couldn't process the response format."; // Default error message
                    
                    if (typeof data.response === 'string') {
                        // If the response is already a string, use it directly.
                        responseText = data.response;
                    } else {
                        // Fallback for any other unexpected format.
                        console.error("Unrecognized AI response format:", data.response);
                    }

                    this.addMessageToDOM('ai', responseText);
                    state.chatHistory.push({ role: "model", parts: [{ text: responseText }] });
                    // *** BUG FIX ENDS HERE ***

                } else {
                    throw new Error("Received an empty response from the AI.");
                }
            } catch (error) {
                console.error("Chatbot AI error:", error);
                this.addMessageToDOM('ai', `Sorry, an error occurred: ${error.message}`);
            } finally {
                this.showThinking(false);
                DOMElements.chatbotInput.focus();
                // Save history after each interaction
                localStorage.setItem('judson_ai_history', JSON.stringify(state.chatHistory));
            }
        },
    };

    // --- ANIMATION & VISUAL EFFECTS ---

    const animation = {
        stars: [],
        auroraCtx: DOMElements.auroraCanvas.getContext('2d'),
        cursorTrailCtx: DOMElements.cursorTrailCanvas.getContext('2d'),
        trailParticles: [],
        trailColor: 'rgba(56, 231, 255, 0.5)',

        init() {
            this.resizeAllCanvases();
            this.initStarfield();
            this.animate();
            this.animateCursorTrail();
            window.addEventListener('resize', () => {
                this.resizeAllCanvases();
                this.initStarfield();
            });
            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
        },

        resizeAllCanvases() {
            DOMElements.auroraCanvas.width = window.innerWidth;
            DOMElements.auroraCanvas.height = window.innerHeight;
            DOMElements.cursorTrailCanvas.width = window.innerWidth;
            DOMElements.cursorTrailCanvas.height = window.innerHeight;
        },

        initStarfield() {
            this.stars = [];
            const starCount = window.innerWidth < 768 ? 100 : 300;
            for (let i = 0; i < starCount; i++) {
                this.stars.push({
                    x: Math.random() * DOMElements.auroraCanvas.width,
                    y: Math.random() * DOMElements.auroraCanvas.height,
                    radius: Math.random() * 1.5,
                    vx: (Math.random() - 0.5) / 4,
                    vy: (Math.random() - 0.5) / 4,
                    alpha: Math.random() * 0.5 + 0.5
                });
            }
        },

        animateStarfield() {
            this.auroraCtx.clearRect(0, 0, this.auroraCtx.canvas.width, this.auroraCtx.canvas.height);
            this.auroraCtx.fillStyle = 'white';
            this.stars.forEach(star => {
                this.auroraCtx.globalAlpha = star.alpha;
                this.auroraCtx.beginPath();
                this.auroraCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                this.auroraCtx.fill();
                star.x += star.vx;
                star.y += star.vy;
                if (star.x < 0 || star.x > this.auroraCtx.canvas.width) star.vx = -star.vx;
                if (star.y < 0 || star.y > this.auroraCtx.canvas.height) star.vy = -star.vy;
            });
        },

        animateCursorTrail() {
            this.cursorTrailCtx.clearRect(0, 0, this.cursorTrailCtx.canvas.width, this.cursorTrailCtx.canvas.height);
            this.trailParticles.push({ x: mouse.x, y: mouse.y, alpha: 1 });
            if (this.trailParticles.length > 50) this.trailParticles.shift();

            this.trailParticles.forEach((p, i) => {
                p.alpha -= 0.05;
                if (p.alpha <= 0) {
                    this.trailParticles.splice(i, 1);
                } else {
                    this.cursorTrailCtx.globalAlpha = p.alpha;
                    this.cursorTrailCtx.fillStyle = this.trailColor;
                    this.cursorTrailCtx.beginPath();
                    this.cursorTrailCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    this.cursorTrailCtx.fill();
                }
            });
            requestAnimationFrame(() => this.animateCursorTrail());
        },

        animate() {
            this.animateStarfield();
            requestAnimationFrame(() => this.animate());
        }
    };

    /**
     * Updates the cursor trail color based on the current theme.
     */
    function updateCursorTrailColor() {
        animation.trailColor = state.currentTheme === 'light'
            ? 'rgba(0, 123, 255, 0.5)'
            : 'rgba(56, 231, 255, 0.5)';
    }

    // --- INITIALIZATION ---
    applyTheme(state.currentTheme);
    chatbot.init();
    animation.init();
});
