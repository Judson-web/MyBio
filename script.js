/**
 * Judson AI - Gemini UI Professional Chatbot
 * @version 10.0.0
 * @author Judson Saji
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL SETUP ---
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const userProfileImageUrl = "https://firebasestorage.googleapis.com/v0/b/crnn-b7d8f.appspot.com/o/files%2FIMG_20250717_215454_617-modified.png?alt=media&token=bea1f0dd-abf1-4cfb-8a83-0d3b603d3fde";
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
                historyBackdrop: document.getElementById('history-backdrop'),
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
            this.DOMElements.historyBackdrop?.addEventListener('click', () => this.toggleHistoryPanel());
            this.DOMElements.chatbotSendBtn?.addEventListener('click', () => this.processUserMessage());
            this.DOMElements.chatbotInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !this.state.isThinking) { e.preventDefault(); this.processUserMessage(); }
            });
            this.DOMElements.chatbotInput?.addEventListener('input', this.autoResizeTextarea);
            this.DOMElements.historyList?.addEventListener('click', (e) => {
                const item = e.target.closest('.history-item');
                if (!item) return;
                const conversationId = item.dataset.id;
                if (e.target.closest('.delete-history-btn')) {
                    this.deleteConversation(conversationId);
                } else {
                    this.loadConversation(conversationId);
                    if (window.innerWidth <= 768) this.toggleHistoryPanel();
                }
            });
        },
        
        autoResizeTextarea(e) {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        },

        toggleHistoryPanel() {
            const panel = this.DOMElements.historyPanel;
            if (!panel) return;
            const isClosed = panel.classList.contains('closed');
            panel.classList.toggle('closed');
            if (window.innerWidth <= 768) {
                this.DOMElements.historyBackdrop.classList.toggle('hidden', !isClosed);
            }
        },
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
            if (window.innerWidth > 768) {
                this.DOMElements.historyPanel?.classList.remove('closed');
            } else {
                this.DOMElements.historyPanel?.classList.add('closed');
            }
        },
        
        startNewConversation() {
            this.state.currentConversationId = `chat_${Date.now()}`;
            this.state.conversations[this.state.currentConversationId] = {
                title: "New Chat",
                messages: []
            };
            this.loadConversation(this.state.currentConversationId);
            this.renderHistoryList();
            this.saveConversations();
        },
        
        clearCurrentConversation() {
            if (!this.state.currentConversationId) return;
            this.state.conversations[this.state.currentConversationId].messages = [];
            this.loadConversation(this.state.currentConversationId);
            this.saveConversations();
        },

        loadConversation(id) {
            if (!this.state.conversations[id]) return;
            this.state.currentConversationId = id;
            const conversation = this.state.conversations[id];
            
            this.DOMElements.chatInterface?.classList.remove('hidden');
            this.DOMElements.chatDisplay.innerHTML = '';
            this.DOMElements.chatTitle.textContent = conversation.title;
            
            if (conversation.messages.length === 0) {
                 this.DOMElements.welcomeScreen?.classList.remove('hidden');
            } else {
                this.DOMElements.welcomeScreen?.classList.add('hidden');
                conversation.messages.forEach(msg => {
                    this.addMessageToDOM(msg.role, msg.parts[0].text);
                });
            }
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
                    this.DOMElements.chatInterface?.classList.add('hidden');
                    this.DOMElements.welcomeScreen?.classList.remove('hidden');
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
            this.DOMElements.welcomeScreen?.classList.add('hidden');
            const senderClass = sender === 'model' ? 'ai' : sender;
            const messageContainer = document.createElement('div');
            messageContainer.className = `chat-message ${senderClass}`;

            const avatar = document.createElement('div');
            avatar.className = `avatar ${senderClass}`;
            if (senderClass === 'user') {
                avatar.innerHTML = `<img src="${userProfileImageUrl}" alt="User Avatar">`;
            } else {
                avatar.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gemini-gradient-avatar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#89b3f9;stop-opacity:1" /><stop offset="100%" style="stop-color:#d8b6ff;stop-opacity:1" /></linearGradient></defs><path d="M12 2.75L14.25 9.25L21.25 9.75L15.75 14.75L17.75 21.5L12 17.5L6.25 21.5L8.25 14.75L2.75 9.75L9.75 9.25L12 2.75Z" stroke="url(#gemini-gradient-avatar)" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
            }
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.innerHTML = marked.parse(text);

            messageContainer.appendChild(avatar);
            messageContainer.appendChild(messageContent);
            this.DOMElements.chatDisplay.appendChild(messageContainer);
            this.DOMElements.chatDisplay.scrollTop = this.DOMElements.chatDisplay.scrollHeight;

            messageContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
                const pre = block.parentElement;
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-code-btn';
                copyButton.innerHTML = 'Copy';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(block.textContent);
                    copyButton.innerHTML = 'Copied!';
                    setTimeout(() => copyButton.innerHTML = 'Copy', 2000);
                };
                pre.appendChild(copyButton);
            });
        },

        async processUserMessage() {
            if (!this.state.currentConversationId) this.startNewConversation();
            const userMessage = this.DOMElements.chatbotInput.value.trim();
            if (!userMessage || this.state.isThinking) return;

            const conversation = this.state.conversations[this.state.currentConversationId];
            conversation.messages.push({ role: "user", parts: [{ text: userMessage }] });
            this.addMessageToDOM('user', userMessage);
            this.DOMElements.chatbotInput.value = '';
            this.autoResizeTextarea({target: this.DOMElements.chatbotInput});
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
                    conversation.title = data.response.parts[0].text.replace(/"/g, '').replace(/\./g, '');
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
                    this.cursorTrailCtx.fillStyle = 'rgba(137, 179, 249, 0.5)';
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
