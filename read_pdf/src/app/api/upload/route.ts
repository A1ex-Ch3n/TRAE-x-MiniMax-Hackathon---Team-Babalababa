import { NextRequest, NextResponse } from 'next/server';
import { initializeMiniMaxService } from '@/read_pdf/src/lib/minimax';
import { w2ProcessorService } from '@/read_pdf/src/services/w2-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const minimaxApiKey = formData.get('minimaxApiKey') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!minimaxApiKey) {
      return NextResponse.json({ error: 'MiniMax API key is required' }, { status: 400 });
    }

    initializeMiniMaxService(minimaxApiKey);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await w2ProcessorService.processPDF(buffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing W2:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process W2' },
      { status: 500 }
    );
  }
}
