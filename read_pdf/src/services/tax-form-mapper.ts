import { W2Form } from '@/read_pdf/src/types/w2';
import { Form1040NR, Form8843 } from '@/read_pdf/src/types/tax-forms';

export class TaxFormMapperService {
  mapW2ToForm1040NR(w2Forms: W2Form[], taxYear: number, filingStatus: Form1040NR['filingStatus']): Form1040NR {
    const totalWages = this.sumField(w2Forms, 'wagesTipsOtherCompensation');
    const totalFederalTax = this.sumField(w2Forms, 'federalTaxWithheld');
    
    const form1040NR: Form1040NR = {
      taxYear,
      filingStatus,
      taxpayerInfo: {
        ssn: w2Forms[0]?.employee?.ssn || '',
        firstName: w2Forms[0]?.employee?.firstName || '',
        lastName: w2Forms[0]?.employee?.lastName || '',
      },
      address: {
        homeAddress: w2Forms[0]?.employee?.address?.street || '',
        apartmentNumber: '',
        city: w2Forms[0]?.employee?.address?.city || '',
        state: w2Forms[0]?.employee?.address?.state || '',
        zipCode: w2Forms[0]?.employee?.address?.zipCode || '',
      },
      income: {
        wages: totalWages,
        taxableInterest: 0,
        ordinaryDividends: 0,
        iraDistributions: 0,
        pensionsAndAnnuities: 0,
        socialSecurityBenefits: 0,
        capitalGainOrLoss: 0,
        otherIncome: 0,
        totalIncome: totalWages,
      },
      adjustments: {
        educatorExpenses: 0,
        hsaDeduction: 0,
        businessIncomeLoss: 0,
        selfEmploymentTax: 0,
        selfEmploymentHealthInsurance: 0,
        penaltyOnEarlyWithdrawal: 0,
        alaskaPermanentFundDividend: 0,
        otherAdjustments: 0,
        totalAdjustments: 0,
      },
      deductions: {
        standardDeduction: this.getStandardDeduction(taxYear),
        qualifiedBusinessIncomeDeduction: 0,
        sumOfDeductions: this.getStandardDeduction(taxYear),
        taxableIncome: totalWages - this.getStandardDeduction(taxYear),
      },
      taxAndCredits: {
        computedTax: 0,
        alternativeMinimumTax: 0,
        excessAdvancePremiumTaxCreditRepayment: 0,
        totalTax: 0,
        childTaxCredit: 0,
        recoveryRebateCredit: 0,
        otherCredits: 0,
        totalCredits: 0,
      },
      payments: {
        federalTaxWithheld: totalFederalTax,
        estimatedTaxPayments: 0,
        refundableCredits: 0,
        otherPayments: 0,
        totalPayments: totalFederalTax,
      },
      refund: {
        overpayment: totalFederalTax,
        amountRefunded: 0,
        appliedToNextYear: 0,
      },
      amountYouOwe: 0,
      sourceW2s: w2Forms,
    };

    return form1040NR;
  }

  mapW2ToForm8843(
    w2Forms: W2Form[], 
    taxYear: number, 
    exemptionReason: Form8843['exemptionReason'],
    academicInstitution?: Form8843['academicInstitution'],
    daysPresentInUS?: Form8843['daysPresentInUS']
  ): Form8843 {
    const form8843: Form8843 = {
      taxYear,
      personalInfo: {
        ssn: w2Forms[0]?.employee?.ssn || '',
        firstName: w2Forms[0]?.employee?.firstName || '',
        middleInitial: '',
        lastName: w2Forms[0]?.employee?.lastName || '',
        address: {
          homeAddress: w2Forms[0]?.employee?.address?.street || '',
          apartmentNumber: '',
          city: w2Forms[0]?.employee?.address?.city || '',
          state: w2Forms[0]?.employee?.address?.state || '',
          zipCode: w2Forms[0]?.employee?.address?.zipCode || '',
        },
        countryOfResidence: '',
        visaType: '',
        immigrationStatus: '',
      },
      exemptionReason,
      academicInstitution,
      daysPresentInUS: daysPresentInUS || {
        currentYear: 0,
        previousYear1: 0,
        previousYear2: 0,
        totalThreeYears: 0,
      },
      sourceW2s: w2Forms,
    };

    return form8843;
  }

  private sumField(w2Forms: W2Form[], field: string): number {
    return w2Forms.reduce((sum, w2) => {
      const value = this.getNestedValue(w2, field);
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  private getStandardDeduction(taxYear: number): number {
    const deductions: Record<number, number> = {
      2024: 14600,
      2023: 13850,
      2022: 12950,
    };

    return deductions[taxYear] || 14600;
  }
}

export const taxFormMapperService = new TaxFormMapperService();
