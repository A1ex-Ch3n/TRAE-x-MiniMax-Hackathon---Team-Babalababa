import { NextRequest, NextResponse } from 'next/server';
import { taxFormMapperService } from '@/read_pdf/src/services/tax-form-mapper';
import { W2Form } from '@/read_pdf/src/types/w2';
import { Form1040NR } from '@/read_pdf/src/types/tax-forms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { w2Forms, taxYear, filingStatus } = body as {
      w2Forms: W2Form[];
      taxYear: number;
      filingStatus: Form1040NR['filingStatus'];
    };

    if (!w2Forms || w2Forms.length === 0) {
      return NextResponse.json({ error: 'No W2 forms provided' }, { status: 400 });
    }

    if (!taxYear || !filingStatus) {
      return NextResponse.json({ error: 'Tax year and filing status are required' }, { status: 400 });
    }

    const form1040NR = taxFormMapperService.mapW2ToForm1040NR(w2Forms, taxYear, filingStatus);

    return NextResponse.json(form1040NR);
  } catch (error) {
    console.error('Error generating Form 1040-NR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate Form 1040-NR' },
      { status: 500 }
    );
  }
}
