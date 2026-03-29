'use client';

import { useState, useEffect, useRef } from 'react';

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

interface ChatMessage {
  type: string;
  content: string;
  time?: string;
  showButtons?: boolean;
  buttonOptions?: string[];
  isMulti?: boolean;
}

export default function Home() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const taxYear = new Date().getFullYear() - 1;

  const questions: Question[] = [
    {
      key: 'passport_name',
      text: '請輸入您的姓名（與護照上的姓名相同）。',
      type: 'text',
    },
    {
      key: 'address_in_country_of_residence',
      text: '請輸入您在居住國的完整地址（包括城市、州/省、郵遞區號和國家）。',
      type: 'text',
    },
    {
      key: 'address_in_us',
      text: '請輸入您在美國的完整地址（包括城市、州和郵遞區號）。',
      type: 'text',
    },
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
    {
      key: 'nationality',
      text: '您的國籍（護照簽發國）是？ (例如: Taiwan)',
      type: 'text',
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
      text: `在刚刚过去的纳税年度（${taxYear}年），您持有哪种类型的美国签证？ (例如: F-1, J-1, M-1, Q-1)`,
      type: 'text',
    },
    ...Array.from({ length: 6 }, (_, i): Question => {
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
    },
    {
      key: 'received_forms',
      text: '根據您的收入來源，您收到了以下哪些表格？ (可複選)',
      type: 'multiselect',
      options: ['Form W-2', 'Form 1042-S', 'Form 1099-INT', 'Form 1099-MISC / 1099-NEC'],
    },
  ];

  const [conversationStarted, setConversationStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [isAskingTravelDates, setIsAskingTravelDates] = useState(false);
  const [currentTravelSegment, setCurrentTravelSegment] = useState<TravelSegment>({ entry: '', exit: '' });
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({
    travelSegments: [],
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [showFormButton, setShowFormButton] = useState(false);

  const addMessage = (content: string, type: string) => {
    const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { type, content, time }]);
    setButtonsDisabled(false);
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
    const isTravelHistory = question.key === 'has_travel_history' && answer === 'yes';
    
    userAnswers[question.key] = answer;
    
    if (isTravelHistory) {
      setUserAnswers(prev => ({ ...prev, [question.key]: answer }));
      setIsAskingTravelDates(true);
      setTimeout(() => askForEntryDate(), 100);
    } else {
      setUserAnswers(prev => ({ ...prev, [question.key]: answer }));
      setTimeout(() => askNextQuestion(), 100);
    }
  };

  const handleTravelDateAnswer = (answer: string) => {
    if (answer === 'yes' || answer === '是' || answer === 'no' || answer === '否') {
      if (answer === 'yes' || answer === '是') {
        setCurrentTravelSegment({ entry: '', exit: '' });
        setTimeout(() => askForEntryDate(), 100);
      } else {
        setIsAskingTravelDates(false);
        setCurrentTravelSegment({ entry: '', exit: '' });
        setTimeout(() => askNextQuestion(), 100);
      }
    } else {
      if (!currentTravelSegment.entry) {
        setCurrentTravelSegment({ entry: answer, exit: '' });
        setTimeout(() => askForExitDate(), 100);
      } else if (!currentTravelSegment.exit) {
        const entryYear = new Date(currentTravelSegment.entry).getFullYear();
        const exitYear = new Date(answer).getFullYear();

        if (entryYear !== exitYear) {
          setTimeout(() => {
            addMessage('錯誤：出境年份必須與入境年份相同。請重新輸入正確的出境日期 (格式 YYYY-MM-DD)。', 'bot');
          }, 100);
          return;
        }

        const newSegment = { entry: currentTravelSegment.entry, exit: answer };
        setUserAnswers(prev => ({
          ...prev,
          travelSegments: [...(prev.travelSegments || []), newSegment]
        }));
        setCurrentTravelSegment({ entry: '', exit: '' });
        setTimeout(() => askForMoreTravel(), 100);
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
    
    setChatMessages(prev => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].type === 'bot') {
        const newMessages = [...prev];
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          showButtons: true,
          buttonOptions: ['是', '否'],
        };
        return newMessages;
      }
      return prev;
    });
  };

  const askNextQuestion = () => {
    let nextIndex = -1;
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
      const nextQuestion = questions[i];
      
      if (nextQuestion.key === 'exempt_explanation' && userAnswers.exempt_for_more_than_5_years !== 'yes') {
        continue;
      }
      if (nextQuestion.key === 'green_card_explanation' && userAnswers.applied_for_green_card !== 'yes') {
        continue;
      }
      if (nextQuestion.key === 'ssn_itin_number' && userAnswers.has_ssn_itin !== 'yes') {
        continue;
      }
      if (nextQuestion.key === 'income_sources' && userAnswers.has_income !== 'yes') {
        continue;
      }
      if (nextQuestion.key === 'received_forms' && userAnswers.has_income !== 'yes') {
        continue;
      }
      
      nextIndex = i;
      break;
    }

    if (nextIndex !== -1) {
      setCurrentQuestionIndex(nextIndex);
      const question = questions[nextIndex];
      addMessage(question.text, 'bot');

      if (question.type === 'yes_no') {
        setChatMessages(prev => {
          const lastIndex = prev.length - 1;
          if (lastIndex >= 0 && prev[lastIndex].type === 'bot') {
            const newMessages = [...prev];
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              showButtons: true,
              buttonOptions: ['是', '否'],
            };
            return newMessages;
          }
          return prev;
        });
      } else if (question.type === 'multiselect') {
        setUserAnswers(prev => ({ ...prev, [question.key]: [] }));
        
        setChatMessages(prev => {
          const lastIndex = prev.length - 1;
          if (lastIndex >= 0 && prev[lastIndex].type === 'bot') {
            const newMessages = [...prev];
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              showButtons: true,
              buttonOptions: [...(question.options || []), '完成選擇'],
              isMulti: true,
            };
            return newMessages;
          }
          return prev;
        });
      }
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

    const hasIncome = userAnswers.has_income === 'yes';
    const requiredForms = ['Form 8843'];
    if (hasIncome) {
      requiredForms.push('Form 1040-NR');
    }

    let summaryContent = `
      <div class="document-checklist" style="margin: 0; background: #e8f4fd;">
        <h4 style="color: #667eea;">📝 您的稅務情況總結</h4>
        <p>根據您的回答，我們得出以下結論：</p>
        <div class="checklist-item"><strong>稅務身份：</strong> ${taxStatus}</div>
        <div class="checklist-item"><strong>上年度在美天數：</strong> ${totalDaysInUS} 天</div>
        <div class="checklist-item"><strong>護照號碼：</strong> ${userAnswers.passport_number || '未提供'}</div>
        <div class="checklist-item"><strong>就讀學校：</strong> ${userAnswers.academic_institution_name || '未提供'}</div>
        <h5 style="margin-top: 15px; color: #667eea;">您需要提交的表格：</h5>
        <ul>${requiredForms.map(form => `<li style="padding: 5px 0; list-style-type: '✓ '; margin-left: 20px;">${form}</li>`).join('')}</ul>
    `;

    if (!hasIncome) {
      summaryContent += `
        <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #155724;"><strong>✅ 好消息！</strong>由於您沒有美國收入，您只需要提交 <strong>Form 8843</strong> 即可。</p>
        </div>
        <p style="margin-top: 15px; color: #666; font-size: 0.9rem;">點擊下方按鈕即可生成您的 Form 8843 文件。</p>
      `;
    } else {
      summaryContent += `
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h5 style="margin:0 0 10px 0; color: #856404;"><strong>下一步：生成 1040-NR</strong></h5>
          <p style="margin: 0; color: #856404;">由於您有美國收入，您需要提交 <strong>Form 1040-NR</strong>。請使用左側的 <strong>'Upload W2 & Generate 1040-NR'</strong> 按鈕來上傳您的 W2 文件，系統將會為您自動生成 1040-NR 表格。</p>
        </div>
      `;
    }

    summaryContent += `
        <p style="margin-top: 20px;">這是一個基於通用規則的初步結論。強烈建議您諮詢專業稅務顧問。</p>
      </div>
    `;

    addMessage(summaryContent, 'bot');
    // Only show the 8843 button if the user has NO income
    if (!hasIncome) {
      setShowFormButton(true);
    } else {
      setShowFormButton(false);
    }
  };

  const generateForm8843 = async () => {
    const fullName = userAnswers.passport_name || '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const formData = {
      firstName,
      lastName,
      tin: userAnswers.ssn_itin_number || '',
      addressInUS: userAnswers.address_in_us || '',
      addressInCountryOfResidence: userAnswers.address_in_country_of_residence || '',
      visaType: 'F-1',
      nonimmigrantStatus: userAnswers.current_status || 'F-1 Student',
      citizenCountry: userAnswers.citizenship_country || '',
      passportCountry: userAnswers.citizenship_country || '',
      passportNumber: userAnswers.passport_number || '',
      daysIn2023: '',
      daysIn2024: String(calculateTotalDays()),
      academicInstitutionInfo: userAnswers.academic_institution_name || '',
      directorInfo: userAnswers.f1_entry_year || '',
      visaHistory2021: userAnswers.visa_type_2021 || 'N/A',
      visaHistory2022: userAnswers.visa_type_2022 || 'N/A',
      visaHistory2023: userAnswers.visa_type_2023 || 'N/A',
      visaHistory2024: userAnswers.visa_type_2024 || 'N/A',
      visaHistory2025: userAnswers.visa_type_2025 || 'N/A',
      line12_moreThan5Years: userAnswers.exempt_for_more_than_5_years === 'yes',
      line13_appliedForLPR: userAnswers.applied_for_green_card === 'yes',
    };

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: '8843',
          data: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form_8843_${firstName}_${lastName}_${taxYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addMessage('✅ Form 8843 PDF 已經生成並下載！請仔細檢查所有資料是否正確，然後列印並簽名後寄出。', 'bot');
      setShowFormButton(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      addMessage('❌ 生成 PDF 時發生錯誤。請稍後再試。', 'bot');
    }
  };

  const handleYesNoButtonClick = (selection: string) => {
    setButtonsDisabled(true);
    addMessage(selection, 'user');
    
    if (isAskingTravelDates) {
      setTimeout(() => handleTravelDateAnswer(selection === '是' ? 'yes' : 'no'), 100);
    } else {
      const answer = selection === '是' ? 'yes' : 'no';
      
      if (questions[currentQuestionIndex]?.key === 'has_travel_history' && answer === 'yes') {
        userAnswers[questions[currentQuestionIndex].key] = answer;
        setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].key]: answer }));
        setIsAskingTravelDates(true);
        setTimeout(() => askForEntryDate(), 100);
      } else {
        userAnswers[questions[currentQuestionIndex].key] = answer;
        setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].key]: answer }));
        setTimeout(() => askNextQuestion(), 100);
      }
    }
  };

  const handleMultiSelectButtonClick = (option: string) => {
    const question = questions[currentQuestionIndex];
    
    if (option === '完成選擇') {
      setButtonsDisabled(true);
      addMessage('完成選擇', 'user');
      const selections = userAnswers[question.key] || [];
      setTimeout(() => processAnswer(selections), 100);
    } else {
      const currentSelections = userAnswers[question.key] || [];
      if (!currentSelections.includes(option)) {
        const newSelections = [...currentSelections, option];
        addMessage(`已選擇: ${option}`, 'user');
        setUserAnswers(prev => ({ ...prev, [question.key]: newSelections }));
      }
    }
  };

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  const handleW2UploadAndGenerate1040NR = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addMessage(`正在從 W2 文件 (${file.name}) 生成 1040-NR 表格...`, 'bot');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/generate-1040nr-from-w2', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // The server returned an error. It might be JSON or an HTML page from a crash.
        const responseBody = await response.text();
        let errorDetails = 'PDF generation failed on the server.';
        try {
          // Try to parse the response as JSON
          const errorData = JSON.parse(responseBody);
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (e) {
          // If it fails, it's not JSON. It's likely an HTML error page.
          console.error("Response was not valid JSON. It was likely an HTML error page from a server crash.");
          errorDetails = "Backend API crashed. Check the terminal where you ran 'npm run dev' for the full error log.";
        }
        throw new Error(errorDetails);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Generated_Form_1040NR_from_${file.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addMessage('✅ Form 1040-NR PDF 已經成功生成並下載！', 'bot');
    } catch (error) {
      console.error('Error generating 1040-NR:', error);
      addMessage(`❌ 生成 1040-NR 時發生錯誤: ${error instanceof Error ? error.message : 'Unknown error'}`, 'bot');
    }

    // Reset the file input so the user can upload the same file again if they want
    event.target.value = '';
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
              📄 Upload & Generate (8843)
            </button>
            {/* Hidden file input for W2 -> 1040NR flow */}
            <input 
              type="file" 
              id="w2-upload-for-1040nr" 
              style={{ display: 'none' }} 
              onChange={handleW2UploadAndGenerate1040NR} 
              accept=".pdf" 
            />
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '10px' }} 
              onClick={() => document.getElementById('w2-upload-for-1040nr')?.click()}
            >
              📄 Upload W2 & Generate 1040-NR
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
                <>
                  {chatMessages.map((msg, msgIndex) => (
                    <div key={msgIndex} className={`message ${msg.type}`}>
                      <div className="message-content">
                        {msg.content.includes('<div') ? (
                          <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.time && <div className="message-time">{msg.time}</div>}
                      {msg.showButtons && msg.buttonOptions && (
                        <div className="quick-actions">
                          {msg.buttonOptions.map((option, btnIndex) => (
                            <button
                              key={btnIndex}
                              className="quick-btn"
                              onClick={() => {
                                if (buttonsDisabled) return;
                                setButtonsDisabled(true);
                                if (msg.isMulti) {
                                  handleMultiSelectButtonClick(option);
                                } else {
                                  handleYesNoButtonClick(option);
                                }
                              }}
                              disabled={buttonsDisabled}
                              style={buttonsDisabled ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatMessagesEndRef} />
                  
                  {showFormButton && (
                    <div className="form-generation-section" style={{
                      marginTop: '20px',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      textAlign: 'center'
                    }}>
                      <h3 style={{color: 'white', marginBottom: '15px', fontSize: '1.2rem'}}>
                        📄 準備好生成您的 Form 8843 了嗎？
                      </h3>
                      <p style={{color: 'rgba(255,255,255,0.9)', marginBottom: '20px', fontSize: '0.95rem'}}>
                        點擊下方按鈕下載根據您的回答生成的 Form 8843 文件
                      </p>
                      <button
                        onClick={generateForm8843}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '12px 30px',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#218838';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#28a745';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        📥 下載 Form 8843
                      </button>
                      <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '15px', fontSize: '0.85rem'}}>
                        ⚠️ 這是演示版本，請在使用前驗證所有信息
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                id="chatInput"
                className="chat-input"
                placeholder={conversationStarted ? "請在這裡回答問題..." : "輸入任何內容開始..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-btn" onClick={handleSendMessage}>送出</button>
            </div>
          </div>
        </div>
      </div>

      {uploadModalOpen && (
        <div id="uploadModal" className="modal active">
          <div className="modal-content">
            <span className="close" onClick={() => setUploadModalOpen(false)}>&times;</span>
            <h2>上傳您的文件</h2>
            <p>請上傳您的護照、I-94、I-20 等文件。</p>
            <input type="file" id="fileInput" multiple onChange={handleFileUpload} />
            <div id="uploadedFiles" style={{marginTop: '20px'}}>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="file-item">
                  📄 {file}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{marginTop: '20px'}} onClick={generateDocuments}>
              生成表格
            </button>
          </div>
        </div>
      )}

      {recordModalOpen && (
        <div id="recordModal" className="modal active">
          <div className="modal-content">
            <span className="close" onClick={() => setRecordModalOpen(false)}>&times;</span>
            <h2>個人記錄</h2>
            <div className="record-section">
              <h3>基本資訊</h3>
              <p><strong>護照號碼：</strong>{userAnswers.passport_number || '未填寫'}</p>
              <p><strong>國籍：</strong>{userAnswers.nationality || '未填寫'}</p>
              <p><strong>就讀學校：</strong>{userAnswers.academic_institution_name || '未填寫'}</p>
            </div>
            {userAnswers.travelSegments && userAnswers.travelSegments.length > 0 && (
              <div className="record-section">
                <h3>旅行記錄</h3>
                {userAnswers.travelSegments.map((seg: TravelSegment, idx: number) => (
                  <p key={idx}>入境: {seg.entry} / 出境: {seg.exit}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
