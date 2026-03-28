'use client';

import { useState, useEffect } from 'react';

interface TravelSegment {
  entry: string;
  exit: string;
}

interface Question {
  key: string;
  text: string;
  type: 'number' | 'text' | 'yes_no' | 'multiselect';
  options?: string[];
  condition?: () => boolean;
}

export default function Home() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  // Chat flow states
  const [conversationStarted, setConversationStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [isAskingTravelDates, setIsAskingTravelDates] = useState(false);
  const [currentTravelSegment, setCurrentTravelSegment] = useState<TravelSegment>({} as TravelSegment);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({
    travelSegments: [],
  });
  const [chatMessages, setChatMessages] = useState<Array<{type: string; content: string; time?: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');

  const taxYear = new Date().getFullYear() - 1;

  const questions: Question[] = [
    {
      key: 'f1_entry_year',
      text: '您首次以 F-1 學生身份進入美國是哪一年？ (請輸入年份，例如 2022)',
      type: 'number',
    },
    {
      key: 'has_travel_history',
      text: '在过去一年，您是否有任何进出美国的学习？',
      type: 'yes_no',
    },
    {
      key: 'nationality',
      text: '您的国籍（护照签发国）是？ (例如: Taiwan)',
      type: 'text',
      condition: () => !isAskingTravelDates,
    },
    {
      key: 'passport_number',
      text: '请输入您的护照号码。',
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
      text: `在刚刚过去的纳税年度（${taxYear}年），您持有哪种类型的美国签证？ (例如: F-1, J-1, M-1, Q-1)`,
      type: 'text',
    },
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
      text: '在上一个纳税年度，您是否申请了或采取了其他积极步骤申请美国合法永久居民身份（绿卡），或者有正在申请中的身份变更？',
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

  const addMessage = (content: string, type: string) => {
    const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { type, content, time }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage;
    addMessage(message, 'user');
    setInputMessage('');

    if (!conversationStarted) {
      startConversation();
    } else {
      processAnswer(message);
    }
  };

  const startConversation = () => {
    setConversationStarted(true);
    askNextQuestion();
  };

  const processAnswer = (answer: string) => {
    if (isAskingTravelDates) {
      handleTravelDateAnswer(answer);
      return;
    }

    const question = questions[currentQuestionIndex];
    setUserAnswers(prev => ({ ...prev, [question.key]: answer }));

    if (question.key === 'has_travel_history' && answer === 'yes') {
      setIsAskingTravelDates(true);
      askForEntryDate();
    } else {
      askNextQuestion();
    }
  };

  const handleTravelDateAnswer = (answer: string) => {
    if (!currentTravelSegment.entry) {
      setCurrentTravelSegment({ entry: answer, exit: '' });
      askForExitDate();
    } else if (!currentTravelSegment.exit) {
      const entryYear = new Date(currentTravelSegment.entry).getFullYear();
      const exitYear = new Date(answer).getFullYear();

      if (entryYear !== exitYear) {
        addMessage('錯誤：出境年份必須與入境年份相同。請重新輸入正確的出境日期 (格式 YYYY-MM-DD)。', 'bot');
        return;
      }

      const newSegment = { ...currentTravelSegment, exit: answer };
      setUserAnswers(prev => ({
        ...prev,
        travelSegments: [...(prev.travelSegments || []), newSegment]
      }));
      setCurrentTravelSegment({} as TravelSegment);
      askForMoreTravel();
    } else {
      if (answer === '是' || answer.toLowerCase() === 'yes') {
        setCurrentTravelSegment({} as TravelSegment);
        askForEntryDate();
      } else {
        setIsAskingTravelDates(false);
        askNextQuestion();
      }
    }
  };

  const askForEntryDate = () => {
    addMessage('請提供一次入境美國的日期 (格式 YYYY-MM-DD)。', 'bot');
  };

  const askForExitDate = () => {
    addMessage('請提供對應的出境日期 (格式 YYYY-MM-DD)。', 'bot');
  };

  const askForMoreTravel = () => {
    addMessage('您在該納稅年度還有其他的出入境記錄嗎？', 'bot');
  };

  const askNextQuestion = () => {
    let nextIndex = -1;
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
      const nextQuestion = questions[i];
      if (!nextQuestion.condition || nextQuestion.condition()) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== -1) {
      setCurrentQuestionIndex(nextIndex);
      const question = questions[nextIndex];
      addMessage(question.text, 'bot');
    } else {
      generateSummary();
    }
  };

  const calculateTotalDays = (): number => {
    let totalDays = 0;
    const yearStart = new Date(taxYear, 0, 1);
    const yearEnd = new Date(taxYear, 11, 31);

    (userAnswers.travelSegments || []).forEach((segment: TravelSegment) => {
      const start = new Date(segment.entry);
      const end = new Date(segment.exit);

      const effectiveStart = start > yearStart ? start : yearStart;
      const effectiveEnd = end < yearEnd ? end : yearEnd;

      if (effectiveEnd >= effectiveStart) {
        const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        totalDays += diffDays;
      }
    });
    return totalDays;
  };

  const generateSummary = () => {
    const totalDaysInUS = calculateTotalDays();
    const f1Years = new Date().getFullYear() - parseInt(userAnswers.f1_entry_year, 10);
    let taxStatus = 'Nonresident Alien (NRA)';
    if (f1Years > 5) {
      taxStatus = '可能為 Resident Alien (需要進行實質性存在測試)';
    }

    const requiredForms = ['Form 8843'];
    if (userAnswers.has_income === 'yes') {
      requiredForms.push('Form 1040-NR');
    }

    const summary = `
      <div class="document-checklist" style="margin: 0; background: #e8f4fd;">
        <h4 style="color: #667eea;">📝 您的稅務情況總結</h4>
        <p>根據您的回答，我們得出以下結論：</p>
        <div class="checklist-item"><strong>稅務身份：</strong> ${taxStatus}</div>
        <div class="checklist-item"><strong>上年度在美天數：</strong> ${totalDaysInUS} 天</div>
        <div class="checklist-item"><strong>護照號碼：</strong> ${userAnswers.passport_number || '未提供'}</div>
        <div class="checklist-item"><strong>就讀學校：</strong> ${userAnswers.academic_institution_name || '未提供'}</div>
        <h5 style="margin-top: 15px; color: #667eea;">您需要提交的表格：</h5>
        <ul>${requiredForms.map(form => `<li style="padding: 5px 0; list-style-type: '✓ '; margin-left: 20px;">${form}</li>`).join('')}</ul>
        <p style="margin-top: 20px;">這是一個基於通用規則的初步結論。強烈建議您諮詢專業稅務顧問。</p>
      </div>
    `;

    addMessage(summary, 'bot');
  };

  const handleOptionClick = (option: string, questionType?: string) => {
    if (questionType === 'yes_no') {
      const value = option === '是' ? 'yes' : 'no';
      addMessage(option, 'user');
      processAnswer(value);
    } else if (questionType === 'multiselect') {
      addMessage(`已選擇: ${option}`, 'user');
      setUserAnswers(prev => {
        const key = questions[currentQuestionIndex].key;
        const current = prev[key] || [];
        if (!current.includes(option)) {
          return { ...prev, [key]: [...current, option] };
        }
        return prev;
      });
    }
  };

  const handleMultiselectDone = () => {
    askNextQuestion();
  };

  useEffect(() => {
    const getTaxDeadline = () => {
      const now = new Date();
      let year = now.getFullYear();
      const deadline = new Date(`${year}-04-15T23:59:59`);
      if (now > deadline) {
        year++;
        return new Date(`${year}-04-15T23:59:59`);
      }
      return deadline;
    };

    const deadline = getTaxDeadline().getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setCountdown('報稅截止日期已過！');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown(`📅 距離報稅截止日期還有：${days}天 ${hours}小時 ${minutes}分鐘 ${seconds}秒`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const generateDocuments = () => {
    console.log('Generating documents with answers:', userAnswers);
    alert('文件生成功能即將推出！\n\n已收集的資料：\n- 護照資訊\n- 學校資訊\n- 簽證歷史\n- 旅行記錄\n- 收入情況');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  return (
    <>
      <div className="header">
        <h1>🧾 TaxHelper 報稅助手</h1>
        <div className="countdown">{countdown}</div>
      </div>

      <div className="main-container">
        <div className="left-sidebar">
          <div className="card">
            <h2>📤 文件上傳</h2>
            <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
              📄 Upload & Generate
            </button>
            <button className="btn btn-secondary" onClick={() => setRecordModalOpen(true)}>
              📋 Personal Record
            </button>
            
            <div className="info-section">
              <h4>💡 提示</h4>
              <ul>
                <li>所有 F-1 學生都必須提交 Form 8843</li>
                <li>如有收入，需提交 Form 1040-NR</li>
                <li>请根据下方清单上傳您的身份信息文件</li>
                <li>我们将为您生成可直接打印寄回税务局的表格</li>
              </ul>
            </div>

            <div style={{marginTop: '15px', padding: '10px', background: '#fff3e0', borderRadius: '8px', borderLeft: '4px solid #ff9800'}}>
              <p style={{fontSize: '0.85rem', color: '#e65100', margin: 0}}>
                <strong>⚠️ 隱私提醒：</strong>這是 MVP 演示版。所有對話和上傳的內容僅保存在您的本地設備上。
              </p>
            </div>
          </div>

          <div className="card">
            <h2>📝 需要上传的文件清单</h2>
            <div className="document-checklist">
              <h4>根據您的情況，您可能需要：</h4>
              <div>
                <div className="checklist-item">
                  <input type="checkbox" id="doc1" defaultChecked disabled />
                  <label htmlFor="doc1">Form 8843（所有 F-1 學生必需）</label>
                </div>
                <div className="checklist-item">
                  <input type="checkbox" id="doc2" disabled />
                  <label htmlFor="doc2">Form 1040-NR（如有收入）</label>
                </div>
                <div className="checklist-item">
                  <input type="checkbox" id="doc3" disabled />
                  <label htmlFor="doc3">護照掃描件</label>
                </div>
                <div className="checklist-item">
                  <input type="checkbox" id="doc4" disabled />
                  <label htmlFor="doc4">I-94 入境記錄</label>
                </div>
                <div className="checklist-item">
                  <input type="checkbox" id="doc5" disabled />
                  <label htmlFor="doc5">I-20 表格</label>
                </div>
                <div className="checklist-item">
                  <input type="checkbox" id="doc6" disabled />
                  <label htmlFor="doc6">SSN 或 ITIN</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-content">
          <div className="chat-container">
            <div className="chat-header">
              <h2>💬 引導式報稅問答</h2>
            </div>
            
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="welcome-message">
                  <h3>👋 歡迎來到引導式報稅問答流程！</h3>
                  <p>我將通過一系列問題來幫助您確定報稅身份和所需文件。</p>
                  <p style={{marginTop: '20px'}}>請在下方輸入任何內容（例如 "開始"）來啟動問答流程。</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.type}`}>
                    <div className="message-content">
                      {msg.content.includes('<div') ? (
                        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.time && <div className="message-time">{msg.time}</div>}
                  </div>
                ))
              )}
            </div>

            {conversationStarted && currentQuestionIndex >= 0 && questions[currentQuestionIndex] && (
              <div className="quick-actions">
                {questions[currentQuestionIndex].type === 'yes_no' && !isAskingTravelDates && (
                  <>
                    <button className="quick-btn" onClick={() => handleOptionClick('是', 'yes_no')}>是</button>
                    <button className="quick-btn" onClick={() => handleOptionClick('否', 'yes_no')}>否</button>
                  </>
                )}
                {questions[currentQuestionIndex].type === 'multiselect' && (
                  <>
                    {questions[currentQuestionIndex].options?.map((option, idx) => (
                      <button key={idx} className="quick-btn" onClick={() => handleOptionClick(option, 'multiselect')}>
                        {option}
                      </button>
                    ))}
                    <button className="quick-btn" onClick={handleMultiselectDone}>完成選擇</button>
                  </>
                )}
                {isAskingTravelDates && (
                  <>
                    <button className="quick-btn" onClick={() => handleOptionClick('是', 'yes_no')}>是</button>
                    <button className="quick-btn" onClick={() => handleOptionClick('否', 'yes_no')}>否</button>
                  </>
                )}
              </div>
            )}

            <div className="chat-input-container">
              <input 
                type="text" 
                className="chat-input" 
                id="chatInput" 
                placeholder={conversationStarted ? "請在這裡回答問題..." : "輸入 '開始' 啟動問答流程..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-btn" onClick={handleSendMessage}>發送</button>
            </div>
          </div>
        </div>
      </div>

      {uploadModalOpen && (
        <div className="modal active" onClick={() => setUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 上傳並生成文件</h2>
              <button className="close-btn" onClick={() => setUploadModalOpen(false)}>&times;</button>
            </div>
            
            <div style={{background: '#e8f5e9', borderLeft: '4px solid #4caf50', padding: '15px', marginBottom: '20px', borderRadius: '4px'}}>
              <h4 style={{color: '#2e7d32', marginBottom: '8px'}}>🔒 隱私安全保障</h4>
              <p style={{color: '#555', fontSize: '0.9rem', margin: 0}}>
                <strong>MVP 演示版：</strong>所有文件僅保存在您本地設備的瀏覽器中，<strong>不會上傳到任何服務器</strong>。
                關閉瀏覽器後，所有上傳記錄將自動清除。
              </p>
            </div>
            
            <div className="upload-area" onClick={() => document.getElementById('fileInput')?.click()}>
              <p>📁 點擊上傳文件</p>
              <small>支持 PDF, JPG, PNG 格式</small>
              <input type="file" id="fileInput" multiple accept=".pdf,.jpg,.jpeg,.png" style={{display: 'none'}} onChange={handleFileUpload} />
            </div>

            <div className="file-list">
              <h4>已上傳的文件：</h4>
              {uploadedFiles.length > 0 ? (
                <ul>
                  {uploadedFiles.map((file, idx) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p style={{color: '#999', fontSize: '0.9rem'}}>尚未上傳任何文件</p>
              )}
            </div>

            <div className="info-section">
              <h4>📋 需要上傳的基本文件：</h4>
              <ul>
                <li>護照首頁掃描件</li>
                <li>I-94 入出境記錄</li>
                <li>I-20 表格</li>
                <li>SSN 或 ITIN 證明（如有）</li>
                <li>收入證明（W-2, 1042-S, 1099 等）</li>
              </ul>
            </div>

            <button className="btn btn-primary" onClick={generateDocuments}>
              🚀 生成稅務文件
            </button>
          </div>
        </div>
      )}

      {recordModalOpen && (
        <div className="modal active" onClick={() => setRecordModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 個人報稅記錄</h2>
              <button className="close-btn" onClick={() => setRecordModalOpen(false)}>&times;</button>
            </div>

            <div className="history-list">
              <div className="history-item">
                <h4>2023 稅年</h4>
                <p>Form 8843, Form 1040-NR</p>
                <div className="date">提交日期：2023年4月15日</div>
              </div>
              <div className="history-item">
                <h4>2022 稅年</h4>
                <p>Form 8843</p>
                <div className="date">提交日期：2022年4月15日</div>
              </div>
              <div className="history-item">
                <h4>2021 稅年</h4>
                <p>Form 8843</p>
                <div className="date">提交日期：2021年4月15日</div>
              </div>
            </div>

            <div className="info-section" style={{marginTop: '20px'}}>
              <h4>💡 記錄說明</h4>
              <p>這裡保存了您歷年提交的稅務文件副本，方便您回顧和参考。建議至少保存 7 年的記錄以備 IRS 查驗。</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
