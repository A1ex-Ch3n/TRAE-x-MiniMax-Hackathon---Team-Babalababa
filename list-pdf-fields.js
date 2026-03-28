const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function listPdfFields(filePath) {
  if (!filePath) {
    console.error('Please provide a path to a PDF file.');
    process.exit(1);
  }

  try {
    console.log(`Reading ${filePath}...`);
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      // Some PDFs have object streams that are not yet supported by pdf-lib.
      // This option allows to parse them anyways.
      updateMetadata: false 
    });
    const form = pdfDoc.getForm();

    console.log(`\n--- Fields in ${filePath.split('/').pop()} ---\n`);
    const fields = form.getFields();
    fields.forEach(field => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`${type}: ${name}`);
    });

  } catch (error) {
    console.error(`Error reading PDF at ${filePath}:`, error);
  }
}

const filePath = process.argv[2];
listPdfFields(filePath);
