import { W2Form } from './w2';

export interface TaxpayerInfo {
  ssn: string;
  firstName: string;
  lastName: string;
}

export interface Address {
  homeAddress: string;
  apartmentNumber: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IncomeDetails {
  wages: number;
  taxableInterest: number;
  ordinaryDividends: number;
  iraDistributions: number;
  pensionsAndAnnuities: number;
  socialSecurityBenefits: number;
  capitalGainOrLoss: number;
  otherIncome: number;
  totalIncome: number;
}

export interface AdjustmentDetails {
  educatorExpenses: number;
  hsaDeduction: number;
  businessIncomeLoss: number;
  selfEmploymentTax: number;
  selfEmploymentHealthInsurance: number;
  penaltyOnEarlyWithdrawal: number;
  alaskaPermanentFundDividend: number;
  otherAdjustments: number;
  totalAdjustments: number;
}

export interface DeductionDetails {
  standardDeduction: number;
  qualifiedBusinessIncomeDeduction: number;
  sumOfDeductions: number;
  taxableIncome: number;
}

export interface TaxAndCreditDetails {
  computedTax: number;
  alternativeMinimumTax: number;
  excessAdvancePremiumTaxCreditRepayment: number;
  totalTax: number;
  childTaxCredit: number;
  recoveryRebateCredit: number;
  otherCredits: number;
  totalCredits: number;
}

export interface PaymentDetails {
  federalTaxWithheld: number;
  estimatedTaxPayments: number;
  refundableCredits: number;
  otherPayments: number;
  totalPayments: number;
}

export interface RefundDetails {
  overpayment: number;
  amountRefunded: number;
  appliedToNextYear: number;
}

export interface Form1040NR {
  taxYear: number;
  filingStatus: 'single' | 'nonresident_alien';
  taxpayerInfo: TaxpayerInfo;
  address: Address;
  income: IncomeDetails;
  adjustments: AdjustmentDetails;
  deductions: DeductionDetails;
  taxAndCredits: TaxAndCreditDetails;
  payments: PaymentDetails;
  refund: RefundDetails;
  amountYouOwe: number;
  sourceW2s: W2Form[];
}

export interface Form8843 {
  taxYear: number;
  personalInfo: {
    ssn: string;
    firstName: string;
    middleInitial: string;
    lastName: string;
    address: Address;
    countryOfResidence: string;
    visaType: string;
    immigrationStatus: string;
  };
  exemptionReason: 'student' | 'teacher' | 'trainee' | 'researcher' | 'other';
  academicInstitution?: {
    name: string;
    address: Address;
    startDate: string;
    endDate: string;
  };
  daysPresentInUS: {
    currentYear: number;
    previousYear1: number;
    previousYear2: number;
    totalThreeYears: number;
  };
  sourceW2s: W2Form[];
}
