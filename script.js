/**
 * Judson AI - Chatbot with History & Glassmorphism
 * @version 7.0.0
 * @author Judson Saji
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL SETUP ---
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    feather.replace();

    // --- CHATBOT & HISTORY CORE LOGIC ---
    const chatbot = {
        DOMElements: {},
        state: { conversations: {}, currentConversationId: null, isThinking: false },

        init() {
            this.DOMElements = {
                welcomeScreen: document.getElementById('welcome-screen'),
                chatInterface: document.getElementById('chat-interface'),
                startChatBtn: document.getElementById('start-chat-btn'),
                chatDisplay: document.getElementById('chat-display'),
                chatTitle: document.getElementById('chat-title'),
                thinkingIndicator: document.getElementById('thinking-indicator'),
                chatbotInput: document.getElementById('chatbot-input'),
                chatbotSendBtn: document.getElementById('chatbot-send-btn'),
                historyPanel: document.getElementById('history-panel'),
                historyList: document.getElementById('history-list'),
                newChatBtn: document.getElementById('new-chat-btn'),
                clearChatBtn: document.getElementById('clear-chat-btn'),
                historyToggleBtn: document.getElementById('history-toggle-btn'),
            };
            this.loadConversations();
            this.renderHistoryList();
            this.bindEvents();
        },

        bindEvents() {
            this.DOMElements.startChatBtn?.addEventListener('click', () => this.startNewConversation());
            this.DOMElements.newChatBtn?.addEventListener('click', () => this.startNewConversation());
            this.DOMElements.clearChatBtn?.addEventListener('click', () => this.clearCurrentConversation());
            this.DOMElements.historyToggleBtn?.addEventListener('click', () => this.toggleHistoryPanel());
            this.DOMElements.chatbotSendBtn?.addEventListener('click', () => this.processUserMessage());
            this.DOMElements.chatbotInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !this.state.isThinking) { e.preventDefault(); this.processUserMessage(); }
            });
            this.DOMElements.historyList?.addEventListener('click', (e) => {
                const item = e.target.closest('.history-item');
                if (!item) return;
                const conversationId = item.dataset.id;
                if (e.target.closest('.delete-history-btn')) {
                    this.deleteConversation(conversationId);
                } else {
                    this.loadConversation(conversationId);
                    if (window.innerWidth <= 768) this.toggleHistoryPanel(); // Close panel on mobile
                }
            });
        },
        
        toggleHistoryPanel() { this.DOMElements.historyPanel?.classList.toggle('closed'); },
        saveConversations() { localStorage.setItem('judson_ai_conversations', JSON.stringify(this.state.conversations)); },

        loadConversations() {
            const saved = localStorage.getItem('judson_ai_conversations');
            if (saved) {
                this.state.conversations = JSON.parse(saved);
                const keys = Object.keys(this.state.conversations);
                if (keys.length > 0) {
                    this.state.currentConversationId = keys[keys.length - 1];
                    this.loadConversation(this.state.currentConversationId);
                }
            }
             // On desktop, the panel is open by default. On mobile, it's closed.
            if (window.innerWidth <= 768) {
                this.DOMElements.historyPanel?.classList.add('closed');
            }
        },
        
        startNewConversation() {
            this.state.currentConversationId = `chat_${Date.now()}`;
            this.state.conversations[this.state.currentConversationId] = {
                title: "New Chat",
                messages: [{ role: 'model', parts: [{ text: "Hello! I am Judson's AI assistant. How can I help you today?" }] }]
            };
            this.loadConversation(this.state.currentConversationId);
            this.renderHistoryList();
            this.saveConversations();
        },
        
        clearCurrentConversation() {
            if (!this.state.currentConversationId) return;
            // Reset messages but keep the conversation entry and title
            this.state.conversations[this.state.currentConversationId].messages = [
                 { role: 'model', parts: [{ text: "Chat cleared. How can I help you now?" }] }
            ];
            this.loadConversation(this.state.currentConversationId);
            this.saveConversations();
        },

        loadConversation(id) {
            if (!this.state.conversations[id]) return;
            this.state.currentConversationId = id;
            const conversation = this.state.conversations[id];
            
            this.DOMElements.welcomeScreen?.classList.add('hidden');
            this.DOMElements.chatInterface?.classList.remove('hidden');
            this.DOMElements.chatDisplay.innerHTML = '';
            this.DOMElements.chatTitle.textContent = conversation.title;
            
            conversation.messages.forEach(msg => {
                this.addMessageToDOM(msg.role, msg.parts[0].text);
            });
            this.renderHistoryList();
        },
        
        deleteConversation(id) {
            delete this.state.conversations[id];
            this.saveConversations();
            this.renderHistoryList();
            if (this.state.currentConversationId === id) {
                const keys = Object.keys(this.state.conversations);
                if (keys.length > 0) {
                    this.loadConversation(keys[keys.length - 1]);
                } else {
                    this.DOMElements.welcomeScreen?.classList.remove('hidden');
                    this.DOMElements.chatInterface?.classList.add('hidden');
                    this.state.currentConversationId = null;
                }
            }
        },

        renderHistoryList() {
            if (!this.DOMElements.historyList) return;
            this.DOMElements.historyList.innerHTML = '';
            Object.keys(this.state.conversations).reverse().forEach(id => {
                const conversation = this.state.conversations[id];
                const item = document.createElement('div');
                item.className = 'history-item';
                if (id === this.state.currentConversationId) item.classList.add('active');
                item.dataset.id = id;
                item.innerHTML = `<span>${conversation.title}</span><button class="delete-history-btn"><i data-feather="trash-2"></i></button>`;
                this.DOMElements.historyList.appendChild(item);
            });
            feather.replace();
        },

        showThinking(show) {
            this.state.isThinking = show;
            this.DOMElements.thinkingIndicator?.classList.toggle('hidden', !show);
            if (this.DOMElements.chatbotInput) this.DOMElements.chatbotInput.disabled = show;
            if (this.DOMElements.chatbotSendBtn) this.DOMElements.chatbotSendBtn.disabled = show;
        },

        addMessageToDOM(sender, text) {
            const senderClass = sender === 'model' ? 'ai' : sender;
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${senderClass}`;
            messageDiv.innerHTML = senderClass === 'ai' ? marked.parse(text) : text;
            this.DOMElements.chatDisplay.appendChild(messageDiv);
            this.DOMElements.chatDisplay.scrollTop = this.DOMElements.chatDisplay.scrollHeight;
        },

        async processUserMessage() {
            if (!this.state.currentConversationId) this.startNewConversation();
            const userMessage = this.DOMElements.chatbotInput.value.trim();
            if (!userMessage || this.state.isThinking) return;

            const conversation = this.state.conversations[this.state.currentConversationId];
            conversation.messages.push({ role: "user", parts: [{ text: userMessage }] });
            this.addMessageToDOM('user', userMessage);
            this.DOMElements.chatbotInput.value = '';
            this.showThinking(true);
            
            await this.getAIResponse();
            
            const userMessages = conversation.messages.filter(m => m.role === 'user').length;
            if (userMessages === 1) this.generateTitleForConversation(this.state.currentConversationId);
        },

        async getAIResponse() {
            const conversation = this.state.conversations[this.state.currentConversationId];
            try {
                const response = await fetch('/.netlify/functions/ask-gemini', {
                    method: 'POST', body: JSON.stringify({ history: conversation.messages }),
                });
                if (!response.ok) throw new Error((await response.json()).message);
                const data = await response.json();
                const aiResponseObject = data.response;
                conversation.messages.push(aiResponseObject);

                const part = aiResponseObject.parts[0];
                if (part.functionCall) await this.handleFunctionCall(part.functionCall);
                else if (part.text) { this.addMessageToDOM('model', part.text); this.showThinking(false); }
                else throw new Error("Invalid AI response format.");
            } catch (error) {
                this.addMessageToDOM('model', `Error: ${error.message}`);
                this.showThinking(false);
            } finally { this.saveConversations(); }
        },
        
        async handleFunctionCall(functionCall) {
            const conversation = this.state.conversations[this.state.currentConversationId];
            this.addMessageToDOM('tool', `*Using tool: \`${functionCall.name}\`...*`);
            try {
                const toolResponse = await fetch('/.netlify/functions/chatbot-tools', {
                    method: 'POST', body: JSON.stringify({ toolName: functionCall.name, args: functionCall.args }),
                });
                if (!toolResponse.ok) throw new Error("Tool execution failed.");
                const toolResult = await toolResponse.json();
                conversation.messages.push({
                    role: "tool",
                    parts: [{ functionResponse: { name: functionCall.name, response: toolResult } }]
                });
                await this.getAIResponse();
            } catch (error) {
                this.addMessageToDOM('model', `Tool error: ${error.message}`);
                this.showThinking(false);
            }
        },
        
        async generateTitleForConversation(id) {
            const conversation = this.state.conversations[id];
            if (!conversation) return;
            const titlePrompt = `Based on the following conversation, create a very short, concise title (3-5 words max).\n\nConversation:\n${conversation.messages.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}`;
            try {
                 const response = await fetch('/.netlify/functions/ask-gemini', {
                    method: 'POST', body: JSON.stringify({ prompt: titlePrompt }),
                });
                if (!response.ok) return;
                const data = await response.json();
                if(data.response && data.response.parts[0].text) {
                    conversation.title = data.response.parts[0].text.replace(/"/g, '');
                    this.saveConversations();
                    this.renderHistoryList();
                    this.DOMElements.chatTitle.textContent = conversation.title;
                }
            } catch (e) { console.error("Could not generate title:", e); }
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
            window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        },
        resizeCanvases() {
            document.querySelectorAll('.background-canvas, #cursor-trail-canvas').forEach(c => {
                if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
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
