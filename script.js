/**
 * Judson AI Chatbot
 * A complete refactor of the original portfolio into a dedicated chatbot application.
 *
 * @version 3.0.0 - With Tool-Calling Support
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

    const showToast = (message) => {
        if (!DOMElements.toast) return;
        DOMElements.toast.textContent = message;
        DOMElements.toast.classList.add('show');
        setTimeout(() => DOMElements.toast.classList.remove('show'), 3000);
    };

    const toggleTheme = () => {
        state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(state.currentTheme);
    };

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
            DOMElements.chatbotSendBtn?.addEventListener('click', () => this.processUserMessage());
            DOMElements.chatbotInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !state.isThinking) {
                    e.preventDefault();
                    this.processUserMessage();
                }
            });

            // Restore chat history
            this.loadHistory();
        },

        loadHistory() {
            const savedHistory = localStorage.getItem('judson_ai_history');
            if(savedHistory) {
                try {
                    const parsedHistory = JSON.parse(savedHistory);
                    if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                        state.chatHistory = parsedHistory;
                        this.startChatSession();
                        state.chatHistory.forEach(msg => {
                            if (msg.role === 'user' && msg.parts[0].text) {
                                this.addMessageToDOM('user', msg.parts[0].text, false);
                            } else if (msg.role === 'model' && msg.parts[0].text) {
                                this.addMessageToDOM('model', msg.parts[0].text, false);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse chat history from localStorage", e);
                    localStorage.removeItem('judson_ai_history');
                }
            }
        },

        startChatSession() {
            DOMElements.welcomeScreen?.classList.add('hidden');
            DOMElements.chatInterface?.classList.remove('hidden');
            DOMElements.chatbotInput?.focus();
        },

        startChatWithPrompt(promptText) {
            this.startChatSession();
            DOMElements.chatbotInput.value = promptText;
            this.processUserMessage();
        },

        clearChat() {
            state.chatHistory = [];
            localStorage.removeItem('judson_ai_history');
            DOMElements.chatDisplay.innerHTML = '';
            this.addMessageToDOM('model', 'Chat history cleared. How can I help you now?');
            showToast('Chat cleared!');
        },

        showThinking(show) {
            state.isThinking = show;
            DOMElements.thinkingIndicator?.classList.toggle('hidden', !show);
            if (DOMElements.chatbotInput) DOMElements.chatbotInput.disabled = show;
            if (DOMElements.chatbotSendBtn) DOMElements.chatbotSendBtn.disabled = show;
        },

        addMessageToDOM(sender, text, animate = true) {
            const messageDiv = document.createElement('div');
            const senderClass = sender === 'model' ? 'ai' : sender;
            messageDiv.className = `chat-message ${senderClass}`;
            messageDiv.innerHTML = senderClass === 'ai' ? marked.parse(text) : text;
            if (!animate) messageDiv.style.animation = 'none';
            DOMElements.chatDisplay.appendChild(messageDiv);
            DOMElements.chatDisplay.scrollTop = DOMElements.chatDisplay.scrollHeight;
        },

        async processUserMessage() {
            const userMessage = DOMElements.chatbotInput.value.trim();
            if (!userMessage || state.isThinking) return;

            this.addMessageToDOM('user', userMessage);
            state.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            DOMElements.chatbotInput.value = '';
            this.showThinking(true);

            await this.getAIResponse();
        },

        async getAIResponse() {
            try {
                const response = await fetch('/.netlify/functions/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: state.chatHistory }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `API error: ${response.status}`);
                }
                const data = await response.json();
                const aiResponseObject = data.response;

                // Add the raw model response to history for context
                state.chatHistory.push(aiResponseObject);

                const part = aiResponseObject.parts[0];

                if (part.functionCall) {
                    // AI wants to use a tool
                    await this.handleFunctionCall(part.functionCall);
                } else if (part.text) {
                    // AI responded with text
                    this.addMessageToDOM('model', part.text);
                    this.showThinking(false);
                } else {
                    throw new Error("Invalid response format from AI.");
                }

            } catch (error) {
                console.error("Chatbot AI error:", error);
                this.addMessageToDOM('model', `Sorry, an error occurred: ${error.message}`);
                this.showThinking(false);
            } finally {
                DOMElements.chatbotInput.focus();
                localStorage.setItem('judson_ai_history', JSON.stringify(state.chatHistory));
            }
        },

        async handleFunctionCall(functionCall) {
            this.addMessageToDOM('ai', `*Using tool: \`${functionCall.name}\`...*`);

            try {
                const toolResponse = await fetch('/.netlify/functions/chatbot-tools', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toolName: functionCall.name,
                        args: functionCall.args
                    }),
                });

                if (!toolResponse.ok) throw new Error("Tool execution failed.");

                const toolResult = await toolResponse.json();

                // Add the tool's result to the history
                state.chatHistory.push({
                    role: "tool",
                    parts: [{
                        functionResponse: {
                            name: functionCall.name,
                            response: toolResult
                        }
                    }]
                });

                // Call the AI again with the tool's result to get a final text response
                await this.getAIResponse();

            } catch (error) {
                console.error("Tool execution error:", error);
                this.addMessageToDOM('model', `Error using tool: ${error.message}`);
                this.showThinking(false);
            }
        }
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
            if (!this.cursorTrailCtx) return;
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

    function updateCursorTrailColor() {
        if (animation.trailColor) {
            animation.trailColor = state.currentTheme === 'light'
                ? 'rgba(0, 123, 255, 0.5)'
                : 'rgba(56, 231, 255, 0.5)';
        }
    }

    // --- INITIALIZATION ---
    applyTheme(state.currentTheme);
    chatbot.init();
    animation.init();
});
