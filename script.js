const API_URL = 'http://localhost:5000/api';

// ===== DATASET MATERIAL COMPARATOR =====
const MATERIALS_DB = {
    'Beton Konvensional': {
        icon: '🧱',
        scores: { 'Kekuatan': 90, 'Keberlanjutan': 30, 'Biaya': 70, 'Durabilitas': 85, 'Estetika': 50, 'Konstruksi': 75 }
    },
    'Baja': {
        icon: '🔩',
        scores: { 'Kekuatan': 95, 'Keberlanjutan': 35, 'Biaya': 55, 'Durabilitas': 90, 'Estetika': 65, 'Konstruksi': 80 }
    },
    'Kayu Solid': {
        icon: '',
        scores: { 'Kekuatan': 60, 'Keberlanjutan': 85, 'Biaya': 75, 'Durabilitas': 55, 'Estetika': 90, 'Konstruksi': 70 }
    },
    'Kayu Engineered (CLT)': {
        icon: '🌲',
        scores: { 'Kekuatan': 80, 'Keberlanjutan': 90, 'Biaya': 60, 'Durabilitas': 75, 'Estetika': 85, 'Konstruksi': 85 }
    },
    'Bambu': {
        icon: '🎋',
        scores: { 'Kekuatan': 65, 'Keberlanjutan': 95, 'Biaya': 90, 'Durabilitas': 50, 'Estetika': 80, 'Konstruksi': 75 }
    },
    'Bata Merah': {
        icon: '🟥',
        scores: { 'Kekuatan': 70, 'Keberlanjutan': 55, 'Biaya': 80, 'Durabilitas': 80, 'Estetika': 70, 'Konstruksi': 65 }
    },
    'Bata Ringan (Hebel)': {
        icon: '⬜',
        scores: { 'Kekuatan': 65, 'Keberlanjutan': 60, 'Biaya': 75, 'Durabilitas': 75, 'Estetika': 60, 'Konstruksi': 85 }
    },
    'Beton Daur Ulang': {
        icon: '♻️',
        scores: { 'Kekuatan': 75, 'Keberlanjutan': 80, 'Biaya': 65, 'Durabilitas': 75, 'Estetika': 50, 'Konstruksi': 70 }
    },
    'Baja Daur Ulang': {
        icon: '🔄',
        scores: { 'Kekuatan': 90, 'Keberlanjutan': 75, 'Biaya': 60, 'Durabilitas': 85, 'Estetika': 65, 'Konstruksi': 80 }
    },
    'Kaca Low-E': {
        icon: '🪟',
        scores: { 'Kekuatan': 40, 'Keberlanjutan': 70, 'Biaya': 45, 'Durabilitas': 70, 'Estetika': 95, 'Konstruksi': 60 }
    },
    'Batu Alam': {
        icon: '🪨',
        scores: { 'Kekuatan': 95, 'Keberlanjutan': 65, 'Biaya': 40, 'Durabilitas': 95, 'Estetika': 90, 'Konstruksi': 50 }
    },
    'Bambu Laminasi': {
        icon: '🌿',
        scores: { 'Kekuatan': 75, 'Keberlanjutan': 92, 'Biaya': 70, 'Durabilitas': 70, 'Estetika': 85, 'Konstruksi': 80 }
    }
};

let state = {
    messages: [],
    bookmarks: JSON.parse(localStorage.getItem('arcsus_bookmarks') || '[]'),
    chatHistory: JSON.parse(localStorage.getItem('arcsus_history') || '[]'),
    currentChat: [],
    isRecording: false,
    recognition: null,
    isDarkMode: localStorage.getItem('arcsus_darkmode') === 'true',
    currentTheme: localStorage.getItem('arcsus_theme') || 'green'
};

let selectedMaterial1 = null;
let selectedMaterial2 = null;
let materialChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSpeechRecognition();
    updateBookmarkCount();
    loadChatHistory();
    checkHealth();
});

// ===== THEME =====
function initTheme() {
    if (state.isDarkMode) document.documentElement.setAttribute('data-theme', 'dark');
    if (state.currentTheme !== 'green') document.documentElement.setAttribute('data-theme-color', state.currentTheme);
}

function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    localStorage.setItem('arcsus_darkmode', state.isDarkMode);
}

function toggleThemeMenu() { document.getElementById('themeMenu').classList.toggle('show'); }

function setTheme(color) {
    state.currentTheme = color;
    document.documentElement.setAttribute('data-theme-color', color);
    localStorage.setItem('arcsus_theme', color);
    document.getElementById('themeMenu').classList.remove('show');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-selector')) document.getElementById('themeMenu').classList.remove('show');
});

// ===== TEXTAREA =====
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ===== SEND MESSAGE =====
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';
    showTypingIndicator();
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        removeTypingIndicator();
        if (data.success) {
            addMessage(data.response, 'bot');
            updateSmartSuggestions(message);
        } else {
            addMessage('Maaf, terjadi kesalahan.', 'bot');
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('Maaf, tidak dapat terhubung ke server.', 'bot');
    }
}

function sendSuggestion(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
}

// ===== MATERIAL COMPARATOR =====
function openMaterialComparator() {
    document.getElementById('comparatorModal').classList.add('show');
    renderMaterialGrids();
    resetChart();
}

function renderMaterialGrids() {
    const grid1 = document.getElementById('materialGrid1');
    const grid2 = document.getElementById('materialGrid2');
    
    grid1.innerHTML = '';
    grid2.innerHTML = '';
    
    Object.keys(MATERIALS_DB).forEach(name => {
        const mat = MATERIALS_DB[name];
        
        const opt1 = document.createElement('button');
        opt1.className = 'material-option' + (selectedMaterial1 === name ? ' selected' : '');
        opt1.innerHTML = `<span class="material-icon">${mat.icon}</span><span>${name}</span>`;
        opt1.onclick = () => selectMaterial(1, name);
        grid1.appendChild(opt1);
        
        const opt2 = document.createElement('button');
        opt2.className = 'material-option' + (selectedMaterial2 === name ? ' selected' : '');
        opt2.innerHTML = `<span class="material-icon">${mat.icon}</span><span>${name}</span>`;
        opt2.onclick = () => selectMaterial(2, name);
        grid2.appendChild(opt2);
    });
}

function selectMaterial(slot, name) {
    if (slot === 1) {
        selectedMaterial1 = name;
    } else {
        selectedMaterial2 = name;
    }
    
    renderMaterialGrids();
    
    if (selectedMaterial1 && selectedMaterial2) {
        setTimeout(() => compareMaterials(), 300);
    }
}

function compareMaterials() {
    if (!selectedMaterial1 || !selectedMaterial2) {
        alert('Pilih 2 material terlebih dahulu!');
        return;
    }
    
    if (selectedMaterial1 === selectedMaterial2) {
        alert('Pilih 2 material yang berbeda!');
        return;
    }
    
    const mat1 = MATERIALS_DB[selectedMaterial1];
    const mat2 = MATERIALS_DB[selectedMaterial2];
    const labels = Object.keys(mat1.scores);
    const data1 = labels.map(l => mat1.scores[l]);
    const data2 = labels.map(l => mat2.scores[l]);
    
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('chartContainer').style.display = 'block';
    
    if (materialChartInstance) {
        materialChartInstance.destroy();
    }
    
    const ctx = document.getElementById('materialChart').getContext('2d');
    materialChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `${mat1.icon} ${selectedMaterial1}`,
                    data: data1,
                    backgroundColor: 'rgba(26, 95, 63, 0.2)',
                    borderColor: 'rgba(26, 95, 63, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(26, 95, 63, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(26, 95, 63, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: `${mat2.icon} ${selectedMaterial2}`,
                    data: data2,
                    backgroundColor: 'rgba(255, 107, 53, 0.2)',
                    borderColor: 'rgba(255, 107, 53, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 107, 53, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 107, 53, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 13, family: "'Inter', sans-serif", weight: '600' },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}/100`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(0,0,0,0.1)' },
                    grid: { color: 'rgba(0,0,0,0.08)' },
                    pointLabels: {
                        font: { size: 12, family: "'Inter', sans-serif", weight: '600' },
                        color: '#333'
                    },
                    ticks: {
                        beginAtZero: true,
                        max: 100,
                        stepSize: 20,
                        font: { size: 10 },
                        backdropColor: 'transparent',
                        color: '#999'
                    }
                }
            }
        }
    });
}

function askBotAboutMaterials() {
    if (!selectedMaterial1 || !selectedMaterial2) return;
    closeModal('comparatorModal');
    const query = `BANDINGKAN ${selectedMaterial1.toUpperCase()} DAN ${selectedMaterial2.toUpperCase()}`;
    document.getElementById('userInput').value = query;
    sendMessage();
}

function resetChart() {
    selectedMaterial1 = null;
    selectedMaterial2 = null;
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('chartContainer').style.display = 'none';
    if (materialChartInstance) {
        materialChartInstance.destroy();
        materialChartInstance = null;
    }
}

// ===== IMAGE ANALYSIS =====
function openImageAnalysis() {
    document.getElementById('imageAnalysisModal').classList.add('show');
}

function handleImageAnalysisUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('analysisPreviewImg').src = e.target.result;
        document.getElementById('imageUploadArea').style.display = 'none';
        document.getElementById('imageAnalysisPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function resetImageAnalysis() {
    document.getElementById('imageAnalysisInput').value = '';
    document.getElementById('imageUploadArea').style.display = 'block';
    document.getElementById('imageAnalysisPreview').style.display = 'none';
}

function analyzeImageWithAIML() {
    closeModal('imageAnalysisModal');
    document.getElementById('userInput').value = 'ANALISIS GAMBAR INI';
    sendMessage();
}

// ===== CHALLENGE =====
function startChallenge() {
    document.getElementById('challengeModal').classList.add('show');
}

function beginChallenge() {
    closeModal('challengeModal');
    document.getElementById('userInput').value = 'MULAI CHALLENGE';
    sendMessage();
}

// ===== CARBON CALCULATOR =====
function startCarbonCalc() {
    document.getElementById('carbonModal').classList.add('show');
}

function beginCarbonCalc() {
    closeModal('carbonModal');
    document.getElementById('userInput').value = 'MULAI CARBON CALCULATOR';
    sendMessage();
}

// ===== MODAL HELPER =====
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// ===== VOICE INPUT =====
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.recognition = new SpeechRecognition();
        state.recognition.lang = 'id-ID';
        state.recognition.continuous = false;
        state.recognition.interimResults = false;
        state.recognition.onresult = (event) => {
            document.getElementById('userInput').value = event.results[0][0].transcript;
            stopVoiceInput();
            setTimeout(() => sendMessage(), 500);
        };
        state.recognition.onerror = () => stopVoiceInput();
        state.recognition.onend = () => stopVoiceInput();
    }
}

function toggleVoiceInput() {
    if (!state.recognition) { alert('Browser tidak mendukung voice input.'); return; }
    if (state.isRecording) stopVoiceInput(); else startVoiceInput();
}

function startVoiceInput() {
    state.isRecording = true;
    document.getElementById('voiceBtn').classList.add('recording');
    document.getElementById('voiceModal').classList.add('show');
    state.recognition.start();
}

function stopVoiceInput() {
    state.isRecording = false;
    document.getElementById('voiceBtn').classList.remove('recording');
    document.getElementById('voiceModal').classList.remove('show');
    if (state.recognition) state.recognition.stop();
}

// ===== TEXT TO SPEECH =====
function toggleTextToSpeech() {
    const messages = document.querySelectorAll('.message.bot');
    if (messages.length === 0) { alert('Belum ada pesan dari bot.'); return; }
    const text = messages[messages.length - 1].querySelector('.message-content').textContent;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
    }
}

// ===== BOOKMARKS =====
function toggleBookmarks() {
    const modal = document.getElementById('bookmarksModal');
    modal.classList.toggle('show');
    if (modal.classList.contains('show')) renderBookmarks();
}

function bookmarkMessage(text) {
    state.bookmarks.push({ id: Date.now(), text, date: new Date().toLocaleString('id-ID') });
    localStorage.setItem('arcsus_bookmarks', JSON.stringify(state.bookmarks));
    updateBookmarkCount();
    alert('Jawaban berhasil disimpan!');
}

function removeBookmark(id) {
    state.bookmarks = state.bookmarks.filter(b => b.id !== id);
    localStorage.setItem('arcsus_bookmarks', JSON.stringify(state.bookmarks));
    updateBookmarkCount();
    renderBookmarks();
}

function updateBookmarkCount() { document.getElementById('bookmarkCount').textContent = state.bookmarks.length; }

function renderBookmarks() {
    const list = document.getElementById('bookmarksList');
    if (state.bookmarks.length === 0) { list.innerHTML = '<p class="empty-state">Belum ada jawaban yang disimpan</p>'; return; }
    list.innerHTML = state.bookmarks.map(b => `
        <div class="bookmark-item">
            <div class="text">${b.text}</div>
            <div class="date">${b.date}</div>
            <button class="action-btn" onclick="removeBookmark(${b.id})" style="margin-top: 8px;"><i class="fas fa-trash"></i> Hapus</button>
        </div>`).join('');
}

// ===== EXPORT CHAT =====
function exportChat() { document.getElementById('exportModal').classList.add('show'); }
function closeExportModal() { document.getElementById('exportModal').classList.remove('show'); }

function exportChatAs(format) {
    closeExportModal();
    
    if (format === 'pdf') {
        exportAsPDF();
    } else if (format === 'json') {
        exportAsJSON();
    } else {
        exportAsTXT();
    }
}

function exportAsTXT() {
    const messages = document.querySelectorAll('.message');
    let content = `ARCSUS AI - Chat Export\nTanggal: ${new Date().toLocaleString('id-ID')}\n${'='.repeat(50)}\n\n`;
    messages.forEach(msg => {
        const sender = msg.classList.contains('user') ? '👤 Anda' : '🤖 Arcsus AI';
        content += `[${sender}]: ${msg.querySelector('.message-content').textContent}\n\n`;
    });
    downloadFile(content, `arcsus_chat_${Date.now()}.txt`, 'text/plain');
}

function exportAsJSON() {
    const messages = Array.from(document.querySelectorAll('.message')).map(msg => ({
        sender: msg.classList.contains('user') ? 'user' : 'bot',
        text: msg.querySelector('.message-content').textContent,
        timestamp: new Date().toISOString()
    }));
    const content = JSON.stringify({
        app: 'Arcsus AI v3.5',
        exportDate: new Date().toLocaleString('id-ID'),
        totalMessages: messages.length,
        messages: messages
    }, null, 2);
    downloadFile(content, `arcsus_chat_${Date.now()}.json`, 'application/json');
}

function exportAsPDF() {
    const messages = document.querySelectorAll('.message');
    if (messages.length === 0) {
        alert('Belum ada percakapan untuk di-export!');
        return;
    }
    
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdfPreview';
    
    let html = `
        <div class="pdf-header">
            <h1>️ Arcsus AI</h1>
            <p>Asisten Arsitektur Berkelanjutan</p>
            <p style="margin-top: 10px;">Export Date: ${new Date().toLocaleString('id-ID')}</p>
        </div>
    `;
    
    messages.forEach(msg => {
        const sender = msg.classList.contains('user') ? '👤 Anda' : '🤖 Arcsus AI';
        const content = msg.querySelector('.message-content').textContent;
        const type = msg.classList.contains('user') ? 'user' : 'bot';
        html += `
            <div class="pdf-chat-item ${type}">
                <div class="sender">${sender}</div>
                <div class="content">${content}</div>
            </div>
        `;
    });
    
    html += `
        <div class="pdf-footer">
            <p>Generated by Arcsus AI v3.5 - Sustainable Architecture Assistant</p>
            <p>Total Messages: ${messages.length}</p>
        </div>
    `;
    
    pdfContainer.innerHTML = html;
    document.body.appendChild(pdfContainer);
    
    const opt = {
        margin: 15,
        filename: `arcsus_chat_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(pdfContainer).save().then(() => {
        document.body.removeChild(pdfContainer);
        alert('✅ PDF berhasil di-download!');
    }).catch(err => {
        document.body.removeChild(pdfContainer);
        alert('❌ Gagal generate PDF: ' + err.message);
    });
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== CHAT HISTORY =====
function saveChatToHistory() {
    if (state.currentChat.length === 0) return;
    const chat = { id: Date.now(), title: state.currentChat[0]?.text?.substring(0, 30) || 'Chat baru', messages: [...state.currentChat], date: new Date().toLocaleString('id-ID') };
    state.chatHistory.unshift(chat);
    if (state.chatHistory.length > 10) state.chatHistory.pop();
    localStorage.setItem('arcsus_history', JSON.stringify(state.chatHistory));
    loadChatHistory();
}

function loadChatHistory() {
    const container = document.getElementById('chatHistory');
    if (state.chatHistory.length === 0) { container.innerHTML = '<p class="empty-history">Belum ada riwayat</p>'; return; }
    container.innerHTML = state.chatHistory.map(chat => `<div class="chat-history-item" onclick="loadChat(${chat.id})"><i class="fas fa-comment"></i> ${chat.title}...</div>`).join('');
}

function loadChat(id) {
    const chat = state.chatHistory.find(c => c.id === id);
    if (!chat) return;
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    chat.messages.forEach(msg => addMessage(msg.text, msg.sender, false));
}

// ===== SMART SUGGESTIONS =====
function updateSmartSuggestions(lastMessage) {
    const suggestions = {
        'energi': ['Solar panel untuk bangunan', 'Efisiensi energi HVAC', 'Net zero energy building'],
        'material': ['Bambu sebagai material bangunan', 'Green concrete', 'Recycled material'],
        'air': ['Rainwater harvesting', 'Greywater recycling', 'Water efficiency'],
        'sertifikasi': ['LEED certification', 'GREENSHIP Indonesia', 'EDGE certification'],
        'default': ['Contoh bangunan hijau Indonesia', 'Biophilic design', 'Climate resilient design']
    };
    const lowerMsg = lastMessage.toLowerCase();
    let selectedKey = 'default';
    for (const key in suggestions) { if (lowerMsg.includes(key)) { selectedKey = key; break; } }
    document.getElementById('suggestionList').innerHTML = suggestions[selectedKey].map(s => `<button class="suggestion-chip" onclick="sendSuggestion('${s}')">${s}</button>`).join('');
}

// ===== FEATURE INFO =====
function showFeatureInfo(feature) {
    const info = {
        voice: ' Voice Input: Klik tombol mikrofon untuk berbicara dalam Bahasa Indonesia.',
        comparator: '⚖️ Material Comparator: Bandingkan 2 material bangunan dengan Radar Chart interaktif!',
        image: '🖼️ Image Analysis: Upload gambar bangunan untuk dianalisis dengan AI!',
        challenge: '🎮 Green Architect Challenge: Uji kemampuan desain berkelanjutan Anda!',
        carbon: ' Carbon Calculator: Hitung estimasi jejak karbon bangunan Anda!'
    };
    alert(info[feature] || 'Fitur ini sedang dalam pengembangan.');
}

// ===== ADD MESSAGE =====
function addMessage(text, sender, saveToHistory = true) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    const avatar = sender === 'bot' ? '<i class="fas fa-leaf"></i>' : '<i class="fas fa-user"></i>';
    const safeText = text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div>${text}</div>
            ${sender === 'bot' ? `<div class="message-actions">
                <button class="action-btn" onclick="bookmarkMessage('${safeText}')"><i class="fas fa-bookmark"></i> Simpan</button>
                <button class="action-btn" onclick="speakText('${safeText}')"><i class="fas fa-volume-up"></i> Baca</button>
                <button class="action-btn" onclick="copyText('${safeText}')"><i class="fas fa-copy"></i> Salin</button>
            </div>` : ''}
        </div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (saveToHistory) state.currentChat.push({ text, sender });
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-leaf"></i></div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
    }
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => alert('Teks berhasil disalin!'));
}

function newChat() {
    if (state.currentChat.length > 0) saveChatToHistory();
    state.currentChat = [];
    document.getElementById('chatMessages').innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon"><i class="fas fa-leaf"></i></div>
            <h2>Chat Baru Dimulai</h2>
            <p>Silakan ajukan pertanyaan baru.</p>
            <div class="feature-grid">
                <div class="feature-card" onclick="showFeatureInfo('voice')"><i class="fas fa-microphone"></i><span>Voice Input</span></div>
                <div class="feature-card" onclick="openMaterialComparator()"><i class="fas fa-balance-scale"></i><span>Material Comparator</span></div>
                <div class="feature-card" onclick="openImageAnalysis()"><i class="fas fa-image"></i><span>Image Analysis</span></div>
                <div class="feature-card" onclick="startChallenge()"><i class="fas fa-gamepad"></i><span>Green Challenge</span></div>
            </div>
        </div>`;
}

async function checkHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('✅ Arcsus AI Status:', data);
        const patternElement = document.getElementById('patternCount');
        if (patternElement && data.total_patterns) {
            patternElement.textContent = `${data.total_patterns} Patterns`;
        }
    } catch (error) {
        console.error(' Health check failed:', error.message);
    }
}