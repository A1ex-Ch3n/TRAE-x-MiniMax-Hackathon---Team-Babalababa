export interface W2Form {
  employer: EmployerInfo;
  employee: EmployeeInfo;
  wages: WageInfo;
  federalTaxWithholding: FederalTaxInfo;
  stateTaxWithholding: StateTaxInfo[];
  localTaxWithholding: LocalTaxInfo[];
  otherInfo: OtherW2Info;
}

export interface EmployerInfo {
  ein: string;
  name: string;
  address: Address;
  state: string;
}

export interface EmployeeInfo {
  ssn: string;
  firstName: string;
  lastName: string;
  address: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface WageInfo {
  wagesTipsOtherCompensation: number;
  federalTaxWithheld: number;
  socialSecurityWages: number;
  socialSecurityTaxWithheld: number;
  medicareWages: number;
  medicareTaxWithheld: number;
  socialSecurityTips: number;
  allocatedTips: number;
  dependentCareBenefits: number;
  nonqualifiedPlans: number;
  severancePay?: number;
  taxableCostOfGroupTermLife?: number;
}

export interface FederalTaxInfo {
  withholdingCode: string;
  retirementPlan: boolean;
  thirdPartySickPay: boolean;
}

export interface StateTaxInfo {
  state: string;
  employerStateID: string;
  stateWages: number;
  stateTaxWithheld: number;
}

export interface LocalTaxInfo {
  localityName: string;
  localWages: number;
  localTaxWithheld: number;
}

export interface OtherW2Info {
  box12a: string;
  box12b: string;
  box12c: string;
  box12d: string;
  box13: {
    statutoryEmployee: boolean;
    retirementPlan: boolean;
    thirdPartySickPay: boolean;
  };
  box14: string;
}

export interface ParsedW2Data {
  rawText: string;
  confidence: number;
  w2Forms: W2Form[];
  errors: string[];
  warnings: string[];
}
