import { NextRequest, NextResponse } from 'next/server';
import { taxFormMapperService } from '@/read_pdf/src/services/tax-form-mapper';
import { W2Form } from '@/read_pdf/src/types/w2';
import { Form8843 } from '@/read_pdf/src/types/tax-forms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { w2Forms, taxYear, exemptionReason, academicInstitution, daysPresentInUS } = body as {
      w2Forms: W2Form[];
      taxYear: number;
      exemptionReason: Form8843['exemptionReason'];
      academicInstitution?: Form8843['academicInstitution'];
      daysPresentInUS?: Form8843['daysPresentInUS'];
    };

    if (!w2Forms || w2Forms.length === 0) {
      return NextResponse.json({ error: 'No W2 forms provided' }, { status: 400 });
    }

    if (!taxYear || !exemptionReason) {
      return NextResponse.json({ error: 'Tax year and exemption reason are required' }, { status: 400 });
    }

    const form8843 = taxFormMapperService.mapW2ToForm8843(
      w2Forms, 
      taxYear, 
      exemptionReason, 
      academicInstitution, 
      daysPresentInUS
    );

    return NextResponse.json(form8843);
  } catch (error) {
    console.error('Error generating Form 8843:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate Form 8843' },
      { status: 500 }
    );
  }
}
