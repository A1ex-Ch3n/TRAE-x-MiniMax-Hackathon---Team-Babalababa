
let userAnswers = {
    travelSegments: [], // To store multiple entry/exit dates
};
let currentQuestionIndex = -1;
let conversationStarted = false;
let isAskingTravelDates = false; // State to manage travel date loop
let currentTravelSegment = {};

// Define the entire conversation flow
const questions = [
    {
        key: 'f1_entry_year',
        text: '您首次以 F-1 學生身份進入美國是哪一年？ (請輸入年份，例如 2022)',
        type: 'number',
    },
    {
        key: 'has_travel_history',
        text: '在过去一年，您是否有任何進出美國的記錄？',
        type: 'yes_no',
    },
    // Travel date questions will be handled dynamically
    {
        key: 'nationality',
        text: '您的國籍（護照簽發國）是？ (例如: Taiwan)',
        type: 'text',
        condition: () => !isAskingTravelDates, // Ask only when not in travel loop
    },
    {
        key: 'passport_number',
        text: '請輸入您的護照號碼。',
        type: 'text',
    },
    {
        key: 'state',
        text: '您目前居住在哪個州？ (例如: California)',
        type: 'text',
    },
    {
        key: 'academic_institution_name',
        text: '您就读的学术机构（学校）的全称是？ (例如: Harvey Mudd College)',
        type: 'text',
    },
    {
        key: 'academic_institution_address',
        text: '该机构的完整地址是？ (例如: 301 Platt Boulevard, Claremont, CA 91711)',
        type: 'text',
    },
    {
        key: 'academic_institution_phone',
        text: '该机构的电话号码是？ (例如: 9096218000)',
        type: 'text',
    },
    {
        key: 'program_director_name',
        text: '您所参与的学术项目负责人的姓名是？ (例如: Nita Kansara)',
        type: 'text',
    },
    {
        key: 'program_director_address',
        text: '该负责人的地址是？（如果与学校地址相同，请再次输入）',
        type: 'text',
    },
    {
        key: 'program_director_phone',
        text: '该负责人的电话号码是？',
        type: 'text',
    },
    {
        key: 'visa_type_current_year',
        text: `在刚刚过去的纳税年度（${new Date().getFullYear() - 1}年），您持有哪种类型的美国签证？ (例如: F-1, J-1, M-1, Q-1)`,
        type: 'text',
    },
    // Dynamically create questions for the past 6 years
    ...Array.from({ length: 6 }, (_, i) => {
        const year = new Date().getFullYear() - 2 - i;
        return {
            key: `visa_type_${year}`,
            text: `在 ${year} 年，您持有哪种类型的美国签证？ (如果不在美国请填 N/A)`,
            type: 'text',
        };
    }),
    {
        key: 'exempt_for_more_than_5_years',
        text: '在过去的任何时间里，您作为教师、实习生或学生身份获得免税的日历年是否超过5年？',
        type: 'yes_no',
    },
    {
        key: 'exempt_explanation',
        text: '请提供详细说明，以证明您不打算永久居住在美国。',
        type: 'text',
        condition: () => userAnswers.exempt_for_more_than_5_years === 'yes',
    },
    {
        key: 'applied_for_green_card',
        text: `在上一个纳税年度，您是否申请了或采取了其他积极步骤申请美国合法永久居民身份（绿卡），或者有正在申请中的身份变更？`,
        type: 'yes_no',
    },
    {
        key: 'green_card_explanation',
        text: '请简要说明您申请绿卡或身份变更的情况。',
        type: 'text',
        condition: () => userAnswers.applied_for_green_card === 'yes',
    },
    {
        key: 'has_ssn_itin',
        text: '您是否擁有社會安全碼 (SSN) 或個人納稅識別號碼 (ITIN)？',
        type: 'yes_no',
    },
    {
        key: 'ssn_itin_number',
        text: '請輸入您的 SSN 或 ITIN。(這是一個演示，您可以輸入 123-456-789)',
        type: 'text',
        condition: () => userAnswers.has_ssn_itin === 'yes',
    },
    {
        key: 'has_income',
        text: '在上一個納稅年度，您是否有任何來自美國的收入？',
        type: 'yes_no',
    },
    {
        key: 'income_sources',
        text: '您的收入來源包括哪些？ (可複選)',
        type: 'multiselect',
        options: ['校內工作', '獎學金/助學金', '銀行存款利息', '其他'],
        condition: () => userAnswers.has_income === 'yes',
    },
    {
        key: 'received_forms',
        text: '根據您的收入來源，您收到了以下哪些表格？ (可複選)',
        type: 'multiselect',
        options: ['Form W-2', 'Form 1042-S', 'Form 1099-INT', 'Form 1099-MISC / 1099-NEC'],
        condition: () => userAnswers.has_income === 'yes',
    },
];

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <h3>👋 歡迎來到引導式報稅問答流程！</h3>
            <p>我將通過一系列問題來幫助您確定報稅身份和所需文件。</p>
            <p style="margin-top: 20px;">請在下方輸入任何內容（例如 “開始”）來啟動問答流程。</p>
        </div>
    `;
    document.querySelector('.quick-actions').style.display = 'none';
});

function handleKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    if (!conversationStarted) {
        startConversation();
    } else {
        processAnswer(message);
    }
}

function startConversation() {
    conversationStarted = true;
    document.getElementById('chatInput').placeholder = "請在這裡回答問題...";
    askNextQuestion();
}

function processAnswer(answer) {
    if (isAskingTravelDates) {
        handleTravelDateAnswer(answer);
        return;
    }

    const question = questions[currentQuestionIndex];
    userAnswers[question.key] = answer;

    if (question.key === 'has_travel_history' && answer === 'yes') {
        isAskingTravelDates = true;
        askForEntryDate();
    } else {
        askNextQuestion();
    }
}

function handleTravelDateAnswer(answer) {
    // This function manages the loop of asking for entry, exit, and more dates.
    if (!currentTravelSegment.entry) {
        currentTravelSegment.entry = answer;
        askForExitDate();
    } else if (!currentTravelSegment.exit) {
        const entryYear = new Date(currentTravelSegment.entry).getFullYear();
        const exitYear = new Date(answer).getFullYear();

        if (entryYear !== exitYear) {
            addMessage('錯誤：出境年份必須與入境年份相同。請重新輸入正確的出境日期 (格式 YYYY-MM-DD)。', 'bot');
            return; // Stay on the exit date question
        }

        currentTravelSegment.exit = answer;
        userAnswers.travelSegments.push(currentTravelSegment);
        askForMoreTravel();
    } else { // This part handles the 'add more?' question
        if (answer === 'yes') {
            currentTravelSegment = {}; // Reset for next segment
            askForEntryDate();
        } else {
            isAskingTravelDates = false;
            askNextQuestion();
        }
    }
}

function askForEntryDate() {
    addMessage('請提供一次入境美國的日期 (格式 YYYY-MM-DD)。', 'bot');
}

function askForExitDate() {
    addMessage('請提供對應的出境日期 (格式 YYYY-MM-DD)。', 'bot');
}

function askForMoreTravel() {
    addMessage('您在該納稅年度還有其他的出入境記錄嗎？', 'bot');
    renderOptions(['是', '否'], (selection) => {
        addMessage(selection, 'user');
        handleTravelDateAnswer(selection.toLowerCase() === '是' ? 'yes' : 'no');
    });
}

function askNextQuestion() {
    let nextIndex = -1;
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
        const nextQuestion = questions[i];
        if (!nextQuestion.condition || nextQuestion.condition()) {
            nextIndex = i;
            break;
        }
    }

    if (nextIndex !== -1) {
        currentQuestionIndex = nextIndex;
        const question = questions[currentQuestionIndex];
        addMessage(question.text, 'bot');
        if (question.type === 'yes_no') {
            renderOptions(['是', '否'], (selection) => {
                addMessage(selection, 'user');
                processAnswer(selection.toLowerCase() === '是' ? 'yes' : 'no');
            });
        } else if (question.type === 'multiselect') {
            renderOptions(question.options, (selection) => {
                if (!userAnswers[question.key]) userAnswers[question.key] = [];
                if (!userAnswers[question.key].includes(selection)) {
                    userAnswers[question.key].push(selection);
                }
                addMessage(`已選擇: ${selection}`, 'user');
            }, true);
            renderOptions(['完成選擇'], () => processAnswer(userAnswers[question.key]));
        }
    } else {
        generateSummary();
    }
}

function calculateTotalDays() {
    let totalDays = 0;
    const taxYear = new Date().getFullYear() - 1; // Assuming previous year

    userAnswers.travelSegments.forEach(segment => {
        const start = new Date(segment.entry);
        const end = new Date(segment.exit);

        // Clamp dates to the tax year
        const yearStart = new Date(taxYear, 0, 1);
        const yearEnd = new Date(taxYear, 11, 31);

        const effectiveStart = start > yearStart ? start : yearStart;
        const effectiveEnd = end < yearEnd ? end : yearEnd;

        if (effectiveEnd >= effectiveStart) {
            const diffTime = Math.abs(effectiveEnd - effectiveStart);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
            totalDays += diffDays;
        }
    });
    return totalDays;
}

function generateSummary() {
    const totalDaysInUS = calculateTotalDays();
    userAnswers.days_in_us = totalDaysInUS;

    const f1_years = new Date().getFullYear() - parseInt(userAnswers.f1_entry_year, 10);
    let taxStatus = 'Nonresident Alien (NRA)';
    if (f1_years > 5) {
        taxStatus = '可能為 Resident Alien (需要進行實質性存在測試)';
    }

    let requiredForms = ['Form 8843'];
    if (userAnswers.has_income === 'yes') {
        requiredForms.push('Form 1040-NR');
    }

    let summary = `
        <div class="document-checklist" style="margin: 0; background: #e8f4fd;">
            <h4 style="color: #667eea;">📝 您的稅務情況總結</h4>
            <p>根據您的回答，我們得出以下結論：</p>
            <div class="checklist-item"><strong>稅務身份：</strong> ${taxStatus}</div>
            <div class="checklist-item"><strong>上年度在美天數：</strong> ${totalDaysInUS} 天</div>
            <h5 style="margin-top: 15px; color: #667eea;">您需要提交的表格：</h5>
            <ul>${requiredForms.map(form => `<li style="padding: 5px 0; list-style-type: '✓ '; margin-left: 20px;">${form}</li>`).join('')}</ul>
            <p style="margin-top: 20px;">這是一個基於通用規則的初步結論。強烈建議您諮詢專業稅務顧問。</p>
        </div>
    `;

    addMessage(summary, 'bot');
    document.getElementById('chatInput').disabled = true;
}

// --- UI and Helper Functions (mostly unchanged) ---
function addMessage(content, type) {
    const messagesDiv = document.getElementById('chatMessages');
    const welcome = messagesDiv.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

    if (content.includes('<div')) {
         messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    } else {
        const sanitizedContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        messageDiv.innerHTML = `
            <div class="message-content">${sanitizedContent}</div>
            <div class="message-time">${time}</div>
        `;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderOptions(options, callback, isMulti = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quick-actions';
    
    options.forEach(optionText => {
        const button = document.createElement('button');
        button.className = 'quick-btn';
        button.innerText = optionText;
        button.onclick = () => {
            callback(optionText);
            if (!isMulti) {
                optionsContainer.querySelectorAll('button').forEach(btn => { btn.disabled = true; btn.style.cursor = 'not-allowed'; });
            }
        };
        optionsContainer.appendChild(button);
    });

    messagesDiv.appendChild(optionsContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function openModal(modalId) { document.getElementById(modalId).classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }
window.onclick = function(event) { if (event.target.classList.contains('modal')) event.target.classList.remove('active'); }

// Other functions like handleFileUpload, removeFile, generateDocuments, updateCountdown etc. remain the same.
let uploadedFiles = [];
function handleFileUpload(event) {
    const files = event.target.files;
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    for (let file of files) {
        uploadedFiles.push(file);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `<span>📄 ${file.name}</span><button class="remove-file" onclick="removeFile(this, '${file.name}')">移除</button>`;
        uploadedFilesDiv.appendChild(fileItem);
    }
}
function removeFile(button, fileName) {
    uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
    button.parentElement.remove();
}
function generateDocuments() {
    if (uploadedFiles.length === 0) { alert('請先上傳至少一個文件！'); return; }
    alert('文件已上傳。這是一個演示版本，實際的PDF生成需要後端支持。');
    closeModal('uploadModal');
}
function getTaxDeadline() {
    const now = new Date();
    let year = now.getFullYear();
    const deadline = new Date(`${year}-04-15T23:59:59`);
    if (now > deadline) {
        year++;
        return new Date(`${year}-04-15T23:59:59`);
    }
    return deadline;
}
const deadline = getTaxDeadline().getTime();
function updateCountdown() {
    const now = new Date().getTime();
    const distance = deadline - now;
    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '報稅截止日期已過！';
        return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    document.getElementById('countdown').innerHTML = `📅 距離報稅截止日期還有：${days}天 ${hours}小時 ${minutes}分鐘 ${seconds}秒`;
}
setInterval(updateCountdown, 1000);
updateCountdown();
