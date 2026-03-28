import { PDFForm, PDFTextField } from 'pdf-lib';

// Helper to safely fill a text field
const fillTextField = (form: PDFForm, fieldName: string, text: string) => {
  if (!text) return; // Don't fill if text is empty
  try {
    form.getTextField(fieldName).setText(text);
  } catch (e) {
    console.warn(`Could not fill text field "${fieldName}".`);
  }
};

// Helper to safely check a checkbox
const checkCheckbox = (form: PDFForm, fieldName: string) => {
  try {
    form.getCheckBox(fieldName).check();
  } catch (e) {
    console.warn(`Could not check checkbox "${fieldName}".`);
  }
};

export interface Form1040NRData {
  // Header
  year: string;
  firstName: string;
  lastName: string;
  identifyingNumber: string;
  // Address
  address: string;
  aptNo: string;
  cityTownPostOffice: string;
  state: string;
  zipCode: string;
  foreignCountry: string;
  foreignProvince: string;
  foreignPostalCode: string;
  // Filing Status
  filingStatus: 'single';
  hadDigitalAssets: boolean;
  // Income
  w2_income: string; // Line 1a
  total_income: string; // Line 1z
  adjusted_gross_income: string; // Line 11a
  // Tax
  total_tax: string; // Line 24
  // Payments
  w2_withholding: string; // Line 25a
  total_payments: string; // Line 33
  // Refund or Amount Owed
  overpaid: string; // Line 34
  refund: string; // Line 35a
  amount_you_owe: string; // Line 37
}

// New function to fill all text fields with their own names as locators
export function fillWithLocators(form: PDFForm) {
  const fields = form.getFields();
  fields.forEach(field => {
    if (field instanceof PDFTextField) {
      // To make the locator more readable, let's shorten it a bit
      const fieldName = field.getName();
      const parts = fieldName.split('.');
      const locator = parts.pop() || fieldName; // Use the last part of the name, e.g., f1_1[0]
      try {
        field.setText(locator);
      } catch (e) {
        console.warn(`Could not set text for locator on field "${fieldName}".`);
      }
    }
  });
  console.log('Filled PDF with locator text in each field.');
}

// Filler function for Form 1040-NR
export function fill1040NR(form: PDFForm, data: Form1040NRData) {
  // Mapping based on user-annotated screenshot
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_4[0]', data.firstName);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_5[0]', data.lastName);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_6[0]', data.identifyingNumber);

  // Address fields
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_7[0]', data.address);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_8[0]', data.aptNo);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_9[0]', data.cityTownPostOffice); // City
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_10[0]', data.state); // State
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_11[0]', data.zipCode); // Zip
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_12[0]', data.foreignCountry);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_13[0]', data.foreignProvince);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_14[0]', data.foreignPostalCode);

  // Filing Status - The user pointed to f1_15[0], but analysis shows c1_1[0] is the correct checkbox.
  if (data.filingStatus === 'single') {
    checkCheckbox(form, 'topmostSubform[0].Page1[0].c1_1[0]');
  }

  // Digital Assets - Checkbox 'No'
  if (!data.hadDigitalAssets) {
    checkCheckbox(form, 'topmostSubform[0].Page1[0].c1_3[1]');
  }

  // Income
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_28[0]', data.w2_income); // Line 1a
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_39[0]', data.total_income); // Line 1z
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_53[0]', data.adjusted_gross_income); // Line 11

  // Using previous analysis for Page 2 as it was not in the screenshot
  // Tax and Credits (Page 2)
  fillTextField(form, 'topmostSubform[0].Page2[0].f2_8[0]', data.total_tax); // Line 24
  // Payments (Page 2)
  fillTextField(form, 'topmostSubform[0].Page2[0].f2_10[0]', data.w2_withholding); // Line 25a
  fillTextField(form, 'topmostSubform[0].Page2[0].f2_22[0]', data.total_payments); // Line 33
  // Refund or Amount You Owe (Page 2)
  fillTextField(form, 'topmostSubform[0].Page2[0].f2_23[0]', data.overpaid); // Line 34
  fillTextField(form, 'topmostSubform[0].Page2[0].f2_24[0]', data.refund); // Line 35a
  fillTextField(form, 'topmostSubform[0].Page2[0].f2_30[0]', data.amount_you_owe); // Line 37
}
