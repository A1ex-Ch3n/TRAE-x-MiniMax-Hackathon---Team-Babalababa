const fetch = require('node-fetch');
const fs = require('fs');

// 注意：如果您的伺服器運行在不同埠，請修改這裡
const API_URL = 'http://localhost:3001/api/generate-pdf';

// --- Test Case 1: Form 8843 ---
const MOCK_DATA_8843 = {
  formType: '8843',
  data: {
    firstName: 'Alexy',
    lastName: 'Chen',
    tin: 'F-1',
    addressInUS: '123 University Ave, Palo Alto, CA 94301',
    addressInCountryOfResidence: '456 Home Rd, Taipei, Taiwan',
    visaType: 'F-1',
    nonimmigrantStatus: 'F-1 Student',
    citizenCountry: 'Taiwan',
    passportCountry: 'Taiwan',
    passportNumber: 'P123456789',
    daysIn2023: '0', // Assuming 0 for past years as per typical student scenario
    daysIn2024: '0',
    academicInstitutionInfo: 'CLAREMONT MCKENNA COLLEGE, 500 EAST NINTH STREET, CLAREMONT, CA, 91711, 9096218109',
    directorInfo: 'ERICA HONGO, 500 EAST NINTH STREET, CLAREMONT, CA, 91711, 9096077386',
    visaHistory2021: '',
    visaHistory2022: '',
    visaHistory2023: '',
    visaHistory2024: '',
    visaHistory2025: 'F-1',
    line12_moreThan5Years: false, // Check "No" on line 12
    line13_appliedForLPR: false,  // Check "No" on line 13
  }
};

// --- Test Case 2: Form 1040-NR ---
const MOCK_DATA_1040NR = {
  formType: '1040nr',
  data: {
    year: '2025',
    firstName: 'Alexy',
    lastName: 'Chen',
    identifyingNumber: '999-99-9999',
    address: '500 E 9th St',
    aptNo: 'APT 123',
    cityTownPostOffice: 'Claremont',
    state: 'CA',
    zipCode: '91711',
    foreignCountry: 'Taiwan',
    foreignProvince: 'Taipei',
    foreignPostalCode: '106',
    filingStatus: 'single',
    hadDigitalAssets: false, // Check "No" for Digital Assets
    w2_income: '50000',
    total_income: '50000',
    adjusted_gross_income: '50000',
    total_tax: '7000',
    w2_withholding: '8000',
    total_payments: '8000',
    overpaid: '1000',
    refund: '1000',
    amount_you_owe: '0',
  }
};

async function testPdfGeneration(testCase, payload) {
  console.log(`\n--- Running Test Case: ${testCase} ---`);
  console.log('Sending request to API...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API responded with status: ${response.status}. Body: ${errorBody}`);
    }

    const buffer = await response.buffer();
    const outputFilename = payload.mode === 'locate'
      ? `locator-output-${payload.formType}.pdf`
      : `test-output-${payload.formType}.pdf`;
    fs.writeFileSync(outputFilename, buffer);

    console.log(`Successfully saved PDF to ${outputFilename}`);

  } catch (error) {
    console.error(`An error occurred during test case ${testCase}:`, error);
  }
}

async function runAllTests() {
  await testPdfGeneration('Form 8843', MOCK_DATA_8843);
  await testPdfGeneration('Form 1040-NR', MOCK_DATA_1040NR);
}

runAllTests();

module.exports = { MOCK_DATA_8843, MOCK_DATA_1040NR };