import { NextRequest, NextResponse } from 'next/server';

// Force this route to be executed in the Node.js environment
export const runtime = 'nodejs';

import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { fill1040NR, Form1040NRData } from '@/app/lib/pdf-fillers/f1040nr-filler';
import { w2ProcessorService } from '@/read_pdf/src/services/w2-processor';
import { initializeMiniMaxService } from '@/read_pdf/src/lib/minimax';

// Initialize the MiniMax service when the server starts.
if (process.env.MINIMAX_API_KEY) {
  initializeMiniMaxService(process.env.MINIMAX_API_KEY);
} else {
  console.warn('MINIMAX_API_KEY environment variable not set. W2 processing will likely fail.');
}

export async function POST(request: NextRequest) {
  console.log('\n[API START] /api/generate-1040nr-from-w2');
  try {
    const formData = await request.formData();
    console.log('[API] FormData received.');

    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('[API ERROR] No file found in FormData.');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    console.log(`[API] File received: ${file.name}, size: ${file.size} bytes`);

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('[API] File converted to buffer. Calling w2ProcessorService...');

    const w2Data = await w2ProcessorService.processPDF(buffer);
    console.log('[API] w2ProcessorService finished. Result:', JSON.stringify(w2Data, null, 2));

    if (w2Data.errors.length > 0 || w2Data.w2Forms.length === 0) {
      console.error('[API ERROR] W2 parsing failed or returned no forms.', w2Data.errors);
      return NextResponse.json({ error: 'Failed to parse W2 form', details: w2Data.errors }, { status: 500 });
    }

    console.log('[API] W2 data parsed. Mapping to 1040NR format...');
    const formInfo = w2Data.w2Forms[0];

    // Defensively access properties to prevent crashes
    const employee = formInfo.employee || {};
    const empAddress = employee.address || {};
    const wages = formInfo.wages || {};

    const mappedData: Form1040NRData = {
      year: new Date().getFullYear().toString(),
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      identifyingNumber: employee.ssn || '',
      address: empAddress.street || '',
      aptNo: '',
      cityTownPostOffice: empAddress.city || '',
      state: empAddress.state || '',
      zipCode: empAddress.zipCode || '',
      foreignCountry: '',
      foreignProvince: '',
      foreignPostalCode: '',
      filingStatus: 'single',
      hadDigitalAssets: false,
      w2_income: wages.wagesTipsOtherCompensation?.toString() || '0',
      total_income: wages.wagesTipsOtherCompensation?.toString() || '0',
      adjusted_gross_income: wages.wagesTipsOtherCompensation?.toString() || '0',
      total_tax: '0',
      w2_withholding: wages.federalTaxWithheld?.toString() || '0',
      total_payments: wages.federalTaxWithheld?.toString() || '0',
      overpaid: '0',
      refund: '0',
      amount_you_owe: '0',
    };
    console.log('[API] Data mapped successfully:', mappedData);

    const templatePath = path.join(process.cwd(), 'public', 'forms', 'f1040nr_v2.pdf');
    const pdfTemplateBytes = await fs.readFile(templatePath);
    console.log('[API] PDF template loaded. Filling form...');
    
    const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
    const form = pdfDoc.getForm();
    fill1040NR(form, mappedData);
    console.log('[API] Form filled. Saving PDF...');

    const pdfBytes = await pdfDoc.save();
    console.log('[API] PDF saved. Sending response to client.');

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="generated_1040NR.pdf"`,
      },
    });

  } catch (error) {
    console.error('--- [API CRITICAL] UNCAUGHT ERROR IN 1040NR GENERATION ---');
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate 1040NR PDF', details: errorMessage }, { status: 500 });
  }
}
