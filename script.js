// Global Variables
let currentSection = 'tanyaai';
let currentTab = 'chat';
let isListening = false;
let recognition = null;
let chatMessages = [];

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initTabs();
    initChat();
    initVoice();
    initImageGeneration();
    initLibrary();
    showWelcomeMessage();
});

// Navigation
function initNavigation() {
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            switchSection(section);
        });
    });

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.style.display = mobileMenu.style.display === 'flex' ? 'none' : 'flex';
    });
}

function switchSection(sectionId) {
    currentSection = sectionId;
    
    // Update navigation
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    // Update sections
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });
    
    // Hide mobile menu
    mobileMenu.style.display = 'none';
    
    // Load section specific content
    if (sectionId === 'library') {
        loadBooks();
    }
}

// Tabs
function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Update tab buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab contents
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
}

// Chat functionality
function initChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function showWelcomeMessage() {
    const welcomeMessage = {
        content: "Hello! I'm JoseAI, your intelligent assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date()
    };
    
    chatMessages.push(welcomeMessage);
    displayMessage(welcomeMessage);
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    const userMessage = {
        content: message,
        isUser: true,
        timestamp: new Date()
    };
    
    chatMessages.push(userMessage);
    displayMessage(userMessage);
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        if (response.ok) {
            const aiMessage = {
                content: data.response,
                isUser: false,
                timestamp: new Date()
            };
            
            chatMessages.push(aiMessage);
            displayMessage(aiMessage);
            
            // Speak response if in voice mode
            if (currentTab === 'voice') {
                speakText(data.response);
            }
        } else {
            throw new Error(data.error || 'Failed to get response');
        }
    } catch (error) {
        hideTypingIndicator();
        showError('Failed to get AI response. Please check your internet connection and try again.');
    }
}

function displayMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.isUser ? 'user-message' : 'ai-message'}`;
    
    const avatarSvg = message.isUser ? 
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>` :
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    
    messageEl.innerHTML = `
        <div class="message-avatar">${avatarSvg}</div>
        <div class="message-content">${message.content}</div>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingEl = document.createElement('div');
    typingEl.className = 'message ai-message typing-indicator';
    typingEl.id = 'typing-indicator';
    
    typingEl.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Voice functionality
function initVoice() {
    const startVoiceBtn = document.getElementById('startVoice');
    const stopVoiceBtn = document.getElementById('stopVoice');
    
    startVoiceBtn.addEventListener('click', startVoiceRecognition);
    stopVoiceBtn.addEventListener('click', stopVoiceRecognition);
    
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        startVoiceBtn.disabled = true;
        startVoiceBtn.textContent = '❌ Not Supported';
    }
}

function startVoiceRecognition() {
    if (isListening) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        document.getElementById('voiceIcon').classList.add('listening');
        updateVoiceButtons();
    };
    
    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            document.getElementById('voiceTranscript').innerHTML = `
                <strong>You said:</strong> ${finalTranscript}
            `;
            
            // Send the transcript as a message
            setTimeout(() => {
                document.getElementById('chatInput').value = finalTranscript;
                sendMessage();
                document.getElementById('voiceTranscript').innerHTML = '';
            }, 1000);
        }
    };
    
    recognition.onend = () => {
        isListening = false;
        document.getElementById('voiceIcon').classList.remove('listening');
        updateVoiceButtons();
    };
    
    recognition.onerror = () => {
        isListening = false;
        document.getElementById('voiceIcon').classList.remove('listening');
        updateVoiceButtons();
        showError('Voice recognition error. Please try again.');
    };
    
    recognition.start();
}

function stopVoiceRecognition() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

function updateVoiceButtons() {
    const startBtn = document.getElementById('startVoice');
    const stopBtn = document.getElementById('stopVoice');
    
    startBtn.disabled = isListening;
    stopBtn.disabled = !isListening;
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
    }
}

// Image Generation
function initImageGeneration() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', generateImage);
}

async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    
    if (!prompt) {
        showError('Please enter an image description.');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.textContent;
    generateBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Generating...
    `;
    generateBtn.disabled = true;
    
    // Show loading in image container
    const imageContainer = document.getElementById('generatedImage');
    imageContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Generating your image...</p>
    `;
    
    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            imageContainer.innerHTML = `
                <img src="${data.imageUrl}" alt="Generated Image" />
                <p>Generated successfully!</p>
            `;
            showSuccess('Image generated successfully!');
        } else {
            throw new Error(data.error || 'Failed to generate image');
        }
    } catch (error) {
        imageContainer.innerHTML = `
            <div class="error-message">
                Failed to generate image. Please try again.
            </div>
        `;
        showError('Failed to generate image. Please try again.');
    } finally {
        generateBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
                <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Generate Image
        `;
        generateBtn.disabled = false;
    }
}

// Library functionality
function initLibrary() {
    const searchBtn = document.getElementById('searchBtn');
    const bookSearch = document.getElementById('bookSearch');
    
    searchBtn.addEventListener('click', () => {
        const query = bookSearch.value.trim();
        loadBooks(query);
    });
    
    bookSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = bookSearch.value.trim();
            loadBooks(query);
        }
    });
}

async function loadBooks(searchQuery = '') {
    const booksGrid = document.getElementById('booksGrid');
    const loadingBooks = document.getElementById('loadingBooks');
    
    loadingBooks.style.display = 'block';
    booksGrid.innerHTML = '';
    
    try {
        let url = '/api/books';
        if (searchQuery) {
            url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        loadingBooks.style.display = 'none';
        
        if (response.ok && data.results) {
            displayBooks(data.results);
        } else {
            throw new Error('Failed to load books');
        }
    } catch (error) {
        loadingBooks.style.display = 'none';
        booksGrid.innerHTML = `
            <div class="error-message">
                Failed to load books. Please try again.
            </div>
        `;
    }
}

function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        const author = book.authors && book.authors[0] ? book.authors[0].name : 'Unknown Author';
        const subjects = book.subjects ? book.subjects.slice(0, 2) : ['Fiction'];
        const coverUrl = book.formats && book.formats['image/jpeg'] 
            ? book.formats['image/jpeg'] 
            : `https://covers.openlibrary.org/b/id/${book.id}-M.jpg`;
        
        bookCard.innerHTML = `
            <div class="book-cover">
                <img src="${coverUrl}" alt="${book.title}" 
                     onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600'" />
            </div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">by ${author}</div>
                <div class="book-subjects">
                    ${subjects.map(subject => `<span class="subject-tag">${subject}</span>`).join('')}
                </div>
                <button class="read-btn" onclick="readBook('${book.formats && book.formats['text/plain'] ? book.formats['text/plain'] : book.formats && book.formats['text/html'] ? book.formats['text/html'] : '#'}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 19.5C4 20.881 5.119 22 6.5 22H20V2H6.5C5.119 2 4 3.119 4 4.5V19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M4 4.5C4 3.119 5.119 2 6.5 2H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Read Book
                </button>
            </div>
        `;
        
        booksGrid.appendChild(bookCard);
    });
}

function readBook(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    } else {
        showError('Sorry, this book is not available for reading.');
    }
}

// Utility functions
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.maxWidth = '300px';
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '9999';
    successDiv.style.maxWidth = '300px';
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// Add CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #94a3b8;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-dots span:nth-child(1) {
        animation-delay: -0.32s;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: -0.16s;
    }
    
    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavBtns = document.querySelectorAll('.mobile-menu .nav-btn');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('show');
    });
    
    // Close mobile menu when clicking on a nav item
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mobileMenu.classList.remove('show');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.classList.remove('show');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            mobileMenu.classList.remove('show');
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileMenu();
    initChat();
    initVoice();
    initImageGeneration();
    initLibrary();
    
    // Load initial books when library is first viewed
    loadBooks();
});