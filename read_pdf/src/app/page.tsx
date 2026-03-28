'use client';

import { useState, useEffect } from 'react';
import Chat from '../components/Chat';

export default function Home() {
  // Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Countdown state
  const [countdown, setCountdown] = useState('');

  const generateDocuments = () => {
    console.log('Generating documents...');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Files uploaded:', event.target.files);
  };

  // Effect for tax deadline countdown
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
    }

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
          <Chat />
        </div>
      </div>

      {/* Upload Modal */}
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
              <div id="uploadedFiles"></div>
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

      {/* Record Modal */}
      {recordModalOpen && (
        <div className="modal active" onClick={() => setRecordModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 個人報稅記錄</h2>
              <button className="close-btn" onClick={() => setRecordModalOpen(false)}>&times;</button>
            </div>

            <div className="history-list">
              <div className="history-item" onClick={() => alert('View 2023 Record')">
                <h4>2023 Tax Year</h4>
                <p>Form 8843, Form 1040-NR</p>
                <div className="date">Submitted: April 15, 2023</div>
              </div>
              <div className="history-item" onClick={() => alert('View 2022 Record')">
                <h4>2022 Tax Year</h4>
                <p>Form 8843</p>
                <div className="date">Submitted: April 15, 2022</div>
              </div>
              <div className="history-item" onClick={() => alert('View 2021 Record')">
                <h4>2021 Tax Year</h4>
                <p>Form 8843</p>
                <div className="date">Submitted: April 15, 2021</div>
              </div>
            </div>

            <div className="info-section" style={{marginTop: '20px'}}>
              <h4>Record Information</h4>
              <p>Your submitted tax documents are saved here for your reference. It is recommended to keep records for at least 7 years for IRS verification.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
