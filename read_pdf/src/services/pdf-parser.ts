import pdfParse from 'pdf-parse';

export interface PDFParseResult {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
    modDate?: string;
  };
  metadata?: any;
}

export class PDFParserService {
  async parsePDF(buffer: Buffer): Promise<PDFParseResult> {
    try {
      const data = await pdfParse(buffer);
      
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info || {},
        metadata: data.metadata || {},
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractW2Text(buffer: Buffer): Promise<string> {
    const result = await this.parsePDF(buffer);
    
    const cleanedText = this.cleanW2Text(result.text);
    
    return cleanedText;
  }

  private cleanW2Text(text: string): string {
    let cleaned = text;
    
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    cleaned = cleaned.replace(/[^\x20-\x7E\n]/g, '');
    
    cleaned = cleaned.replace(/(\w)-\s+(\w)/g, '$1$2');
    
    return cleaned.trim();
  }

  validateW2Text(text: string): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    const requiredFields = [
      'SSN',
      'EIN',
      'Wages',
      'Federal',
      'Social Security',
      'Medicare',
    ];
    
    const missingFields = requiredFields.filter(
      field => !text.toLowerCase().includes(field.toLowerCase())
    );
    
    if (missingFields.length > 0) {
      warnings.push(`Possible missing fields: ${missingFields.join(', ')}`);
    }
    
    const ssnPattern = /\d{3}[-\s]?\d{2}[-\s]?\d{4}/;
    if (!ssnPattern.test(text)) {
      warnings.push('SSN format not detected or may be incomplete');
    }
    
    const einPattern = /\d{2}[-\s]?\d{7}/;
    if (!einPattern.test(text)) {
      warnings.push('EIN format not detected or may be incomplete');
    }
    
    return {
      valid: missingFields.length < requiredFields.length / 2,
      warnings,
    };
  }
}

export const pdfParserService = new PDFParserService();
