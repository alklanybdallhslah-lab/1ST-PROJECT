// --- 1. دالة توحيد وتنظيف النصوص العربية ---
function normalizeArabicText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[أإآءئؤ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '') // إزالة التشكيل
        .replace(/ـ/g, '')             // إزالة التطويل
        .replace(/[؟?،,.!:\-_"'/()\n\r]/g, ' ') // إزالة علامات الترقيم
        .replace(/\s+/g, ' ')           // إزالة المسافات الزائدة
        .trim();
}

// --- 2. دالة إجابة البوت المحدثة (مقاومة للتغييرات في HTML) ---
function getBotAnswer(userQuestion) {
    if (!userQuestion || !userQuestion.trim()) {
        return 'من فضلك اكتب سؤالاً واضحاً.';
    }

    const container = document.getElementById('articleContent');
    if (!container) {
        return 'خطأ: لم يتم العثور على عنصر المقال (articleContent).';
    }

    const cleanQuery = normalizeArabicText(userQuestion);
    const stopWords = ['ما', 'ماذا', 'ماهي', 'ماهو', 'من', 'عن', 'هل', 'كيف', 'في', 'على', 'الي', 'إلي', 'ماذ'];
    
    // استخراج الكلمات المفتاحية
    const keywords = cleanQuery
        .split(' ')
        .filter(word => word.length >= 2 && !stopWords.includes(word));

    if (keywords.length === 0) {
        return 'يرجى كتابة سؤال يحتوي على كلمات مفتاحية (مثل: الرأسمالية، الشيوعية، الديون، المراجع).';
    }

    // استهداف جميع العناوين والفقرات والقوائم
    const searchTargets = container.querySelectorAll('p, li, h2, h3, h4');
    let bestMatchText = '';
    let highestScore = 0;

    searchTargets.forEach(node => {
        // نأخذ النص الصافي بدون وسوم HTML المضافة من البحث
        const rawText = node.textContent.replace(/\s+/g, ' ').trim();
        const normalizedText = normalizeArabicText(rawText);

        if (!normalizedText) return;

        let score = 0;

        keywords.forEach(word => {
            if (normalizedText.includes(word)) {
                score += 2;
            }
        });

        if (score > highestScore) {
            highestScore = score;
            bestMatchText = rawText;
        }
    });

    if (bestMatchText && highestScore > 0) {
        return 'بناءً على محتوى المقال:\n\n"' + bestMatchText + '"';
    }

    return 'عذراً، لم أجد إجابة مطابقة لسؤالك داخل المقال. حاول استخدام كلمات مفتاحية أخرى.';
}

// --- 3. إرسال رسائل الشات ---
function sendMessage() {
    const input = document.getElementById('chatInput');
    const messagesContainer = document.getElementById('chatMessages');

    if (!input || !messagesContainer) return;

    const text = input.value.trim();
    if (text === '') return;

    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = text;
    messagesContainer.appendChild(userMsg);

    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.textContent = getBotAnswer(text);
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 200);
}

// --- 4. تهيئة جميع الأحداث بعد تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', () => {

    // --- أحداث الشات ---
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatBox = document.getElementById('chatBox');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');

    if (chatToggleBtn && chatBox) {
        chatToggleBtn.addEventListener('click', () => chatBox.classList.toggle('hidden'));
    }

    if (closeChatBtn && chatBox) {
        closeChatBtn.addEventListener('click', () => chatBox.classList.add('hidden'));
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // --- أحداث الملاحظات ---
    const toggleNotesBtn = document.getElementById('toggleNotesBtn');
    const notesBox = document.getElementById('notesBox');
    const notesInput = document.getElementById('notesInput');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const downloadNotesBtn = document.getElementById('downloadNotesBtn');

    if (notesInput) {
        notesInput.value = localStorage.getItem('user_article_notes') || '';
    }

    if (toggleNotesBtn && notesBox) {
        toggleNotesBtn.addEventListener('click', () => notesBox.classList.toggle('hidden'));
    }

    if (saveNotesBtn && notesInput) {
        saveNotesBtn.addEventListener('click', () => {
            localStorage.setItem('user_article_notes', notesInput.value);
            alert('تم حفظ ملاحظاتك بنجاح!');
        });
    }

    if (downloadNotesBtn && notesInput) {
        downloadNotesBtn.addEventListener('click', () => {
            const text = notesInput.value.trim();
            if (!text) {
                alert('صندوق الملاحظات فارغ!');
                return;
            }
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ملاحظاتي.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // --- أحداث التظليل والملاحظات المنبثقة ---
    const highlightTooltip = document.getElementById('highlightTooltip');
    const noteIconBtn = document.getElementById('noteIconBtn');
    const popNoteModal = document.getElementById('popNoteModal');
    const popNoteTextarea = document.getElementById('popNoteTextarea');
    const savePopNote = document.getElementById('savePopNote');
    const closePopNote = document.getElementById('closePopNote');
    const articleArea = document.getElementById('articleContent');

    let selectedQuote = '';

    if (articleArea) {
        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text && selection.anchorNode && articleArea.contains(selection.anchorNode)) {
                selectedQuote = text;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                if (noteIconBtn) {
                    noteIconBtn.style.top = `${window.scrollY + rect.top - 45}px`;
                    noteIconBtn.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 18}px`;
                    noteIconBtn.style.display = 'block';
                }
            } else {
                if (noteIconBtn) noteIconBtn.style.display = 'none';
            }
        });
    }

    if (noteIconBtn && popNoteModal && popNoteTextarea) {
        noteIconBtn.addEventListener('click', () => {
            noteIconBtn.style.display = 'none';
            popNoteTextarea.value = `📌 الاقتباس: "${selectedQuote}"\nملاحظتي: `;
            popNoteModal.classList.remove('hidden');
        });
    }

    if (closePopNote && popNoteModal) {
        closePopNote.addEventListener('click', () => popNoteModal.classList.add('hidden'));
    }

    if (savePopNote && popNoteModal && popNoteTextarea) {
        savePopNote.addEventListener('click', () => {
            const newNote = popNoteTextarea.value.trim();
            if (newNote && notesInput) {
                const currentNotes = notesInput.value;
                notesInput.value = currentNotes + (currentNotes ? '\n\n' : '') + newNote;
                localStorage.setItem('user_article_notes', notesInput.value);
            }
            popNoteTextarea.value = '';
            popNoteModal.classList.add('hidden');
        });
    }

    // --- أحداث البحث السريع ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput && articleArea) {
        const originalHTML = articleArea.innerHTML;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query === '') {
                articleArea.innerHTML = originalHTML;
                return;
            }

            articleArea.innerHTML = originalHTML;
            const searchableNodes = articleArea.querySelectorAll('h2, h3, p, li');
            let firstMatchFound = false;

            searchableNodes.forEach(node => {
                const normalizedText = normalizeArabicText(node.textContent);
                const normalizedQuery = normalizeArabicText(query);

                if (normalizedText.includes(normalizedQuery)) {
                    const regex = new RegExp(`(${query})`, 'gi');
                    node.innerHTML = node.innerHTML.replace(regex, '<mark class="highlight">$1</mark>');

                    if (!firstMatchFound) {
                        firstMatchFound = true;
                        const firstMark = node.querySelector('mark.highlight');
                        if (firstMark) {
                            firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
            });
        });
    }
});