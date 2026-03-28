import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fill8843, Form8843Data } from '../../lib/pdf-fillers/f8843-filler';
import { fill1040NR, Form1040NRData } from '../../lib/pdf-fillers/f1040nr-filler';

// Master type for the request body
interface ApiRequestBody {
  formType: '8843' | '1040nr';
  data: Form8843Data | Form1040NRData;
}

export async function POST(req: NextRequest) {
  try {
    const body: ApiRequestBody = await req.json();
    const { formType, data } = body;

    let formPath: string;
    let fillerFunction: (form: PDFForm, data: any) => void;

    if (formType === '8843') {
      formPath = path.join(process.cwd(), 'public', 'forms', 'f8843.pdf');
      fillerFunction = fill8843;
    } else if (formType === '1040nr') {
      formPath = path.join(process.cwd(), 'public', 'forms', 'f1040nr_v2.pdf');
      fillerFunction = fill1040NR;
    } else {
      return new NextResponse('Invalid form type provided.', { status: 400 });
    }

    const formBytes = await fs.readFile(formPath);
    const pdfDoc = await PDFDocument.load(formBytes);
    const form = pdfDoc.getForm();

    // Call the selected filler function
    fillerFunction(form, data);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formType}-filled.pdf"`,
      },
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
    return new NextResponse('Error generating PDF.', { status: 500 });
  }
}
