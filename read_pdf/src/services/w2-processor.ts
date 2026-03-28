import { pdfParserService } from '@/read_pdf/src/services/pdf-parser';
import { getMiniMaxService } from '@/read_pdf/src/lib/minimax';
import { W2Form, ParsedW2Data } from '@/read_pdf/src/types/w2';

export class W2ProcessorService {
  async processPDF(buffer: Buffer): Promise<ParsedW2Data> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const text = await pdfParserService.extractW2Text(buffer);
      
      const validation = pdfParserService.validateW2Text(text);
      warnings.push(...validation.warnings);
      
      const minimaxService = getMiniMaxService();
      const jsonString = await minimaxService.extractW2Data(text);
      
      let w2Form: W2Form;
      try {
        const cleanedJson = this.cleanJsonString(jsonString);
        w2Form = JSON.parse(cleanedJson);
      } catch (parseError) {
        const correctedJson = await minimaxService.validateAndCorrectW2(jsonString);
        const cleanedJson = this.cleanJsonString(correctedJson);
        w2Form = JSON.parse(cleanedJson);
        warnings.push('JSON was auto-corrected by MiniMax');
      }
      
      this.validateW2Form(w2Form, errors, warnings);

      const confidence = this.calculateConfidence(w2Form);
      
      return {
        rawText: text,
        confidence: confidence,
        w2Forms: [w2Form],
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        rawText: '',
        confidence: 0,
        w2Forms: [],
        errors,
        warnings,
      };
    }
  }

  async processMultiplePDFs(buffers: Buffer[]): Promise<ParsedW2Data[]> {
    const results: ParsedW2Data[] = [];
    
    for (const buffer of buffers) {
      const result = await this.processPDF(buffer);
      results.push(result);
    }
    
    return results;
  }

  private cleanJsonString(jsonString: string): string {
    let cleaned = jsonString.trim();
    
    cleaned = cleaned.replace(/^```json\s*/, '');
    cleaned = cleaned.replace(/^```\s*/, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    
    return cleaned.trim();
  }

  private validateW2Form(w2Form: W2Form, errors: string[], warnings: string[]): void {
    if (!w2Form.employer?.ein) {
      errors.push('Missing employer EIN');
    } else if (!this.isValidEIN(w2Form.employer.ein)) {
      warnings.push('Employer EIN format may be invalid');
    }

    if (!w2Form.employee?.ssn) {
      errors.push('Missing employee SSN');
    } else if (!this.isValidSSN(w2Form.employee.ssn)) {
      warnings.push('Employee SSN format may be invalid');
    }

    if (w2Form.wages?.federalTaxWithheld === undefined) {
      warnings.push('Missing federal tax withholding amount (Box 2)');
    }

    if (w2Form.wages?.wagesTipsOtherCompensation === undefined) {
      warnings.push('Missing wages amount (Box 1)');
    }
  }

  private isValidEIN(ein: string): boolean {
    const einCleaned = ein.replace(/[-\s]/g, '');
    return /^2[0-9]{7}$/.test(einCleaned);
  }

  private isValidSSN(ssn: string): boolean {
    const ssnCleaned = ssn.replace(/[-\s]/g, '');
    return /^[0-9]{9}$/.test(ssnCleaned);
  }

  private calculateConfidence(w2Form: W2Form): number {
    const fieldsToTrack = [
      w2Form.employer?.name,
      w2Form.employer?.ein,
      w2Form.employer?.address?.street,
      w2Form.employer?.address?.city,
      w2Form.employer?.address?.state,
      w2Form.employer?.address?.zipCode,
      w2Form.employee?.ssn,
      w2Form.employee?.firstName,
      w2Form.employee?.lastName,
      w2Form.employee?.address?.street,
      w2Form.employee?.address?.city,
      w2Form.employee?.address?.state,
      w2Form.employee?.address?.zipCode,
    ];

    const filledFields = fieldsToTrack.filter(field => field !== null && field !== undefined && field !== '').length;
    const totalFields = fieldsToTrack.length;

    if (totalFields === 0) {
      return 0;
    }

    const confidence = Math.round((filledFields / totalFields) * 100);
    return confidence;
  }
}

export const w2ProcessorService = new W2ProcessorService();
