import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const mockResponses: Record<string, string> = {
      'form8843': 'Form 8843 是所有 F-1 學生都必須填寫的表格，用於聲明您的免稅身份。即使您在美國沒有收入，也需要提交此表格。',
      'form1040nr': 'Form 1040-NR (Nonresident Alien Income Tax Return) 是非居民外籍人士用於申報美國收入的表格。如果您在美國有工資或其他收入，就需要填寫此表格。',
      'w2': 'W-2 是您的雇主提供的工資單，顯示您在該年度的工資收入和已扣除的稅款。您需要將 W-2 上的信息填入 Form 1040-NR。',
      'default': '感謝您的提問！作為 F-1 學生，您通常需要提交 Form 8843。如果您在美國有收入，還需要提交 Form 1040-NR。建議您準備好護照、I-20、I-94 和 W-2 等文件。'
    };

    const lowerMessage = message.toLowerCase();
    let response = mockResponses.default;

    if (lowerMessage.includes('8843')) {
      response = mockResponses.form8843;
    } else if (lowerMessage.includes('1040-nr') || lowerMessage.includes('1040nr')) {
      response = mockResponses.form1040nr;
    } else if (lowerMessage.includes('w-2') || lowerMessage.includes('w2')) {
      response = mockResponses.w2;
    } else if (lowerMessage.includes('需要哪些表格') || lowerMessage.includes('需要什麼表格')) {
      response = '根據您的 F-1 學生身份，您需要：\n\n1. **Form 8843**（必需）- 所有 F-1 學生都必須提交\n2. **Form 1040-NR**（如有收入）- 如果您在美國工作或有其他收入\n\n建議您準備：護照、I-20、I-94、W-2（如有）、SSN 或 ITIN。';
    } else if (lowerMessage.includes('沒有收入') || lowerMessage.includes('沒收入')) {
      response = '即使沒有收入，F-1 學生仍然需要提交 **Form 8843**！這是 IRS 的要求，用於記錄您在美國的居住狀態。\n\n但是，如果沒有收入，您通常不需要提交 Form 1040-NR。';
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'TaxHelper Chat API is running',
    endpoints: {
      POST: '/api/chat',
      body: { message: 'string' }
    }
  });
}
