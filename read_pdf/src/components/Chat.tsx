'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/store';

// This would be moved to a separate file in a real app
const questions: any[] = []; // Omitting the long questions array for brevity

export default function Chat() {
  const { messages, addMessage, userAnswers, setUserAnswer } = useStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user' as const,
      content: inputValue,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(userMessage);
    // Here you would add the logic to process the user's answer and get the bot's response
    // For now, we'll just echo the message as the bot.
    const botMessage = {
        type: 'bot' as const,
        content: `你說了: "${inputValue}"`,
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    }
    addMessage(botMessage);

    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };
  
    const askQuestion = (question: string) => {
        const userMessage = {
            type: 'user' as const,
            content: question,
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        };
        addMessage(userMessage);
        const botMessage = {
            type: 'bot' as const,
            content: `關於 "${question}" 的問題，我需要後端知識庫的支援才能回答。`, // Placeholder response
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        }
        addMessage(botMessage);
  };


  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 智能稅務顧問</h2>
      </div>
      
      <div className="chat-messages" id="chatMessages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>👋 歡迎使用 TaxHelper！</h3>
            <p>我是您的智能稅務助理，可以幫助您了解複雜的稅務術語，</p>
            <p>並根據您的情況推薦需要提交的文件。</p>
            <p style={{marginTop: '20px', fontSize: '0.95rem'}}>請告訴我您的情況，例如：</p>
            <p style={{fontSize: '0.9rem', color: '#667eea'}}>"我是F-1學生，去年在美國實習了3個月"</p>
            <p style={{fontSize: '0.9rem', color: '#667eea'}}>"我有校內工作，需要報稅嗎？"</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-content">{msg.content}</div>
              <div className="message-time">{msg.time}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-actions">
          <button className="quick-btn" onClick={() => askQuestion('我需要提交哪些表格？')}>📋 需要哪些表格？</button>
          <button className="quick-btn" onClick={() => askQuestion('什麼是Form 8843？')}>❓ Form 8843 是什麼？</button>
          <button className="quick-btn" onClick={() => askQuestion('什麼是Form 1040-NR')}>❓ Form 1040-NR 是什麼？</button>
          <button className="quick-btn" onClick={() => askQuestion('我收到了W-2表格，怎麼辦？')}>📨 收到W-2怎麼辦？</button>
          <button className="quick-btn" onClick={() => askQuestion('沒有收入也要報稅嗎？')}>💰 沒有收入要報稅嗎？</button>
      </div>

      <div className="chat-input-container">
        <input 
          type="text" 
          className="chat-input" 
          id="chatInput" 
          placeholder="輸入您的問題..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress} 
        />
        <button className="send-btn" onClick={handleSendMessage}>發送</button>
      </div>
    </div>
  );
}
