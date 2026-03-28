const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// Import the same mock data used for writing, to use as our 'expected' values.
// Note: This is a simplified import for a script. In a real app, you might share types.
const { MOCK_DATA_1040NR } = require('./test-api.js');

// This function reads a generated PDF and verifies its field values.
async function verifyPdf(filePath, expectedData) {
  console.log(`\n--- Verifying: ${filePath} ---\n`);

  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // A helper to get a field's value, returning '[BLANK]' if empty.
    const getFieldValue = (fieldName) => {
      try {
        const field = form.getTextField(fieldName);
        return field.getText() || '[BLANK]';
      } catch (e) {
        return '[FIELD NOT TEXT OR NOT FOUND]';
      }
    };

    // Define the mapping of data keys to the PDF field names we expect to fill.
    const fieldMapping = {
      // Using the new, corrected field names for verification from f1040nr_v2.pdf
      firstName: 'topmostSubform[0].Page1[0].f1_1[0]',
      lastName: 'topmostSubform[0].Page1[0].f1_2[0]',
      identifyingNumber: 'topmostSubform[0].Page1[0].f1_3[0]',
      address: 'topmostSubform[0].Page1[0].f1_4[0]',
      aptNo: 'topmostSubform[0].Page1[0].f1_5[0]',
      cityStateZipCombined: 'topmostSubform[0].Page1[0].f1_6[0]',
      foreignCountry: 'topmostSubform[0].Page1[0].f1_7[0]',
      foreignProvince: 'topmostSubform[0].Page1[0].f1_8[0]',
      foreignPostalCode: 'topmostSubform[0].Page1[0].f1_9[0]',
    };

    let allCorrect = true;

    // Check each field
    for (const [key, fieldName] of Object.entries(fieldMapping)) {
      let expectedValue;
      if (key === 'fullName') {
        expectedValue = `${expectedData.firstName} ${expectedData.lastName}`;
      } else if (key === 'cityStateZipCombined') {
        expectedValue = `${expectedData.cityTownPostOffice}, ${expectedData.state} ${expectedData.zipCode}`;
      } else {
        expectedValue = expectedData[key];
      }
        
      const actualValue = getFieldValue(fieldName);

      if (actualValue === expectedValue) {
        console.log(`[SUCCESS] Field '${key}' (${fieldName}) matches expected value.`);
      } else {
        allCorrect = false;
        console.error(`[FAILED]  Field '${key}' (${fieldName})`);
        console.error(`  - Expected: "${expectedValue}"`);
        console.error(`  - Actual:   "${actualValue}"`);
      }
    }

    console.log('\nVerification complete.');
    return allCorrect;

  } catch (error) {
    console.error(`Failed to read or verify PDF: ${error.message}`);
    return false;
  }
}

// We need to export the function for other scripts if needed, and also be able to run it directly.
if (require.main === module) {
  verifyPdf('./test-output-1040nr.pdf', MOCK_DATA_1040NR.data);
}

module.exports = { verifyPdf };
