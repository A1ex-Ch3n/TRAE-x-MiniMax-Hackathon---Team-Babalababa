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

export interface Form8843Data {
  firstName: string;
  lastName: string;
  tin: string;
  addressInUS: string;
  addressInCountryOfResidence: string;
  visaType: string;
  nonimmigrantStatus: string;
  citizenCountry: string;
  passportCountry: string;
  passportNumber: string;
  daysIn2023: string;
  daysIn2024: string;
  academicInstitutionInfo: string;
  directorInfo: string;
  visaHistory2021: string;
  visaHistory2022: string;
  visaHistory2023: string;
  visaHistory2024: string;
  visaHistory2025: string;
  line12_moreThan5Years: boolean;
  line13_appliedForLPR: boolean;
}

// Filler function for Form 8843
export function fill8843(form: PDFForm, data: Form8843Data) {
  // Mapping based on user-annotated screenshot
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_04[0]', data.firstName);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_05[0]', data.lastName);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_06[0]', data.tin);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_07[0]', data.addressInCountryOfResidence);
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_08[0]', data.addressInUS);

  // Part I: General Information
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_09[0]', data.visaType); // 1a
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_10[0]', data.nonimmigrantStatus); // 1b
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_11[0]', data.citizenCountry); // 2
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_12[0]', data.passportCountry); // 3a
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_13[0]', data.passportNumber); // 3b
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_16[0]', data.daysIn2023); // 4a 2023
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_15[0]', data.daysIn2024); // 4a 2024

  // Part III: Students (assuming user is a student)
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_26[0]', data.academicInstitutionInfo); // 9
  fillTextField(form, 'topmostSubform[0].Page1[0].f1_27[0]', data.directorInfo); // 10

  // Checkboxes - based on prior analysis, these should be correct
  if (data.line12_moreThan5Years) {
    checkCheckbox(form, 'topmostSubform[0].Page1[0].c1_1[0]'); // Yes
  } else {
    checkCheckbox(form, 'topmostSubform[0].Page1[0].c1_1[1]'); // No
  }

  if (data.line13_appliedForLPR) {
    checkCheckbox(form, 'topmostSubform[0].Page1[0].c1_2[0]'); // Yes
  } else {
    checkCheckbox(form, 'topmostSubform[0].Page1[0].c1_2[1]'); // No
  }
}
