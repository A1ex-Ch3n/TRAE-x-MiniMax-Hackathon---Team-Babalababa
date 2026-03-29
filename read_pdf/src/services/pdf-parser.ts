//import pdfParse from 'pdf-parse';
//const pdfParse = require('pdf-parse');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
// 在逻辑中兼容处理：


export interface PDFParseResult {
  text: string;
  numPages: number;
  info: any;
  metadata: any;
}
export class PDFParserService {
       async parsePDF(buffer: Buffer): Promise<PDFParseResult> {
    try {
      // 现在的 pdfParse 应该是直接的函数了
      const data = await (pdfParse as any)(buffer);
      
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info || {},
        metadata: data.metadata || {},
      };
    } catch (error) {
      // 如果还报错，打印一下这个“新”的 pdfParse 是什么
      console.error('Final check - pdfParse is:', typeof pdfParse);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  
  validateW2Text(text: string) {
    const warnings: string[] = [];
    if (!text.includes('W-2')) {
      warnings.push('The document may not be a W-2 form.');
    }
    if (!text.includes('Employer identification number')) {
      warnings.push('Missing "Employer identification number" field.');
    }
    return { warnings };
  }
}

export const pdfParserService = new PDFParserService();
