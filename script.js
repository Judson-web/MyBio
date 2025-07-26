/**
 * Judson AI - Chatbot with Original Header & About Modal
 * @version 5.0.0
 * @author Judson Saji
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL SETUP ---
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    feather.replace();

    // --- MODAL & NAVIGATION LOGIC ---
    const openModal = (modalId) => {
        const modal = document.getElementById(`${modalId}-modal`);
        if (modal) modal.classList.add('active');
        closeDrawer(); // Close mobile nav if open
    };

    const closeModal = (modal) => {
        if (modal) modal.classList.remove('active');
    };

    document.querySelectorAll('[data-modal]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(el.getAttribute('data-modal'));
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el) closeModal(el);
        });
        el.querySelector('.close-modal')?.addEventListener('click', () => closeModal(el));
    });

    // Mobile Drawer
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainNavDrawer = document.getElementById('main-nav-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');

    const openDrawer = () => {
        mainNavDrawer?.classList.add('active');
        drawerBackdrop?.classList.add('active');
    };
    const closeDrawer = () => {
        mainNavDrawer?.classList.remove('active');
        drawerBackdrop?.classList.remove('active');
    };
    hamburgerBtn?.addEventListener('click', openDrawer);
    drawerBackdrop?.addEventListener('click', closeDrawer);
    drawerCloseBtn?.addEventListener('click', closeDrawer);

    // --- CHATBOT CORE LOGIC ---
    const chatbot = {
        DOMElements: {},
        state: { chatHistory: [], isThinking: false },

        init() {
            this.DOMElements = {
                welcomeScreen: document.getElementById('welcome-screen'),
                chatInterface: document.getElementById('chat-interface'),
                startChatBtn: document.getElementById('start-chat-btn'),
                chatDisplay: document.getElementById('chat-display'),
                thinkingIndicator: document.getElementById('thinking-indicator'),
                chatbotInput: document.getElementById('chatbot-input'),
                chatbotSendBtn: document.getElementById('chatbot-send-btn'),
            };

            this.DOMElements.startChatBtn?.addEventListener('click', () => this.startChatSession());
            this.DOMElements.chatbotSendBtn?.addEventListener('click', () => this.processUserMessage());
            this.DOMElements.chatbotInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !this.state.isThinking) {
                    e.preventDefault();
                    this.processUserMessage();
                }
            });
            
            // Add initial greeting to chat history but don't display yet
            if(this.state.chatHistory.length === 0) {
                 this.state.chatHistory.push({ role: 'model', parts: [{text: "Hello! I am Judson's AI assistant. How can I help you today?"}] });
            }
        },

        startChatSession() {
            this.DOMElements.welcomeScreen?.classList.add('hidden');
            this.DOMElements.chatInterface?.classList.remove('hidden');
            this.DOMElements.chatbotInput?.focus();
            // Display the initial greeting now
            this.DOMElements.chatDisplay.innerHTML = '';
            this.addMessageToDOM('model', this.state.chatHistory[0].parts[0].text);
        },
        
        showThinking(show) {
            this.state.isThinking = show;
            this.DOMElements.thinkingIndicator?.classList.toggle('hidden', !show);
            if (this.DOMElements.chatbotInput) this.DOMElements.chatbotInput.disabled = show;
            if (this.DOMElements.chatbotSendBtn) this.DOMElements.chatbotSendBtn.disabled = show;
        },

        addMessageToDOM(sender, text) {
            const messageDiv = document.createElement('div');
            const senderClass = sender === 'model' ? 'ai' : sender;
            messageDiv.className = `chat-message ${senderClass}`;
            messageDiv.innerHTML = senderClass === 'ai' ? marked.parse(text) : text;
            this.DOMElements.chatDisplay.appendChild(messageDiv);
            this.DOMElements.chatDisplay.scrollTop = this.DOMElements.chatDisplay.scrollHeight;
        },

        async processUserMessage() {
            const userMessage = this.DOMElements.chatbotInput.value.trim();
            if (!userMessage || this.state.isThinking) return;

            this.addMessageToDOM('user', userMessage);
            this.state.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            this.DOMElements.chatbotInput.value = '';
            this.showThinking(true);
            await this.getAIResponse();
        },

        async getAIResponse() {
            try {
                const response = await fetch('/.netlify/functions/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: this.state.chatHistory }),
                });
                if (!response.ok) throw new Error((await response.json()).message);

                const data = await response.json();
                const aiResponseObject = data.response;
                this.state.chatHistory.push(aiResponseObject);

                const part = aiResponseObject.parts[0];
                if (part.functionCall) {
                    await this.handleFunctionCall(part.functionCall);
                } else if (part.text) {
                    this.addMessageToDOM('model', part.text);
                    this.showThinking(false);
                } else { throw new Error("Invalid AI response format."); }

            } catch (error) {
                this.addMessageToDOM('model', `Error: ${error.message}`);
                this.showThinking(false);
            }
        },
        
        async handleFunctionCall(functionCall) {
            this.addMessageToDOM('tool', `*Using tool: \`${functionCall.name}\`...*`);
            try {
                const toolResponse = await fetch('/.netlify/functions/chatbot-tools', {
                    method: 'POST',
                    body: JSON.stringify({ toolName: functionCall.name, args: functionCall.args }),
                });
                if (!toolResponse.ok) throw new Error("Tool execution failed.");
                const toolResult = await toolResponse.json();
                this.state.chatHistory.push({
                    role: "tool",
                    parts: [{ functionResponse: { name: functionCall.name, response: toolResult } }]
                });
                await this.getAIResponse();
            } catch (error) {
                this.addMessageToDOM('model', `Tool error: ${error.message}`);
                this.showThinking(false);
            }
        }
    };

    // --- ANIMATION & VISUAL EFFECTS ---
    const animation = {
        cursorTrailCanvas: document.getElementById('cursor-trail-canvas'),
        cursorTrailCtx: null,
        trailParticles: [],
        init() {
            if (this.cursorTrailCanvas) this.cursorTrailCtx = this.cursorTrailCanvas.getContext('2d');
            this.resizeCanvases();
            this.animateCursorTrail();
            window.addEventListener('resize', () => this.resizeCanvases());
            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
        },
        resizeCanvases() {
            const canvases = document.querySelectorAll('.background-canvas, #cursor-trail-canvas');
            canvases.forEach(c => {
                if (c) {
                    c.width = window.innerWidth;
                    c.height = window.innerHeight;
                }
            });
        },
        animateCursorTrail() {
            if (!this.cursorTrailCtx) return;
            this.cursorTrailCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            this.trailParticles.push({ x: mouse.x, y: mouse.y, alpha: 1 });
            if (this.trailParticles.length > 50) this.trailParticles.shift();
            this.trailParticles.forEach((p, i) => {
                p.alpha -= 0.05;
                if (p.alpha <= 0) this.trailParticles.splice(i, 1);
                else {
                    this.cursorTrailCtx.globalAlpha = p.alpha;
                    this.cursorTrailCtx.fillStyle = 'rgba(56, 231, 255, 0.5)';
                    this.cursorTrailCtx.beginPath();
                    this.cursorTrailCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    this.cursorTrailCtx.fill();
                }
            });
            requestAnimationFrame(() => this.animateCursorTrail());
        }
    };

    // --- PAGE INITIALIZATION ---
    chatbot.init();
    animation.init();
});
