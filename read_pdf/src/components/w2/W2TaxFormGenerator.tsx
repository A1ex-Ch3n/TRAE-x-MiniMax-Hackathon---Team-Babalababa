'use client';

import { useState } from 'react';
import { W2Form } from '@/read_pdf/src/types/w2';
import { Form1040NR, Form8843 } from '@/read_pdf/src/types/tax-forms';

interface TaxFormGeneratorProps {
  w2Forms: W2Form[];
}

export default function W2TaxFormGenerator({ w2Forms }: TaxFormGeneratorProps) {
  const [selectedForm, setSelectedForm] = useState<'1040NR' | '8843'>('8843');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<Form1040NR | Form8843 | null>(null);
  const [error, setError] = useState('');

  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);

  const [filingStatus, setFilingStatus] = useState<Form1040NR['filingStatus']>('nonresident_alien');

  const [exemptionReason, setExemptionReason] = useState<Form8843['exemptionReason']>('student');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCity, setInstitutionCity] = useState('');
  const [institutionState, setInstitutionState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentYearDays, setCurrentYearDays] = useState(0);
  const [prevYear1Days, setPrevYear1Days] = useState(0);
  const [prevYear2Days, setPrevYear2Days] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedForm(null);

    try {
      let endpoint: string;
      let body: any;

      if (selectedForm === '1040NR') {
        endpoint = '/api/generate1040';
        body = { w2Forms, taxYear, filingStatus };
      } else {
        endpoint = '/api/generate8843';
        body = {
          w2Forms,
          taxYear,
          exemptionReason,
          academicInstitution: {
            name: institutionName,
            address: {
              homeAddress: '',
              apartmentNumber: '',
              city: institutionCity,
              state: institutionState,
              zipCode: '',
            },
            startDate,
            endDate,
          },
          daysPresentInUS: {
            currentYear: currentYearDays,
            previousYear1: prevYear1Days,
            previousYear2: prevYear2Days,
            totalThreeYears: currentYearDays + prevYear1Days + prevYear2Days,
          },
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate ${selectedForm === '1040NR' ? 'Form 1040-NR' : 'Form 8843'}`);
      }

      const data = await response.json();
      setGeneratedForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Generate Tax Form</h2>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedForm('8843')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedForm === '8843'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Form 8843
          </button>
          <button
            onClick={() => setSelectedForm('1040NR')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedForm === '1040NR'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Form 1040-NR
          </button>
        </div>
      </div>

      {selectedForm === '8843' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="form-label">Tax Year</label>
            <select 
              value={taxYear} 
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="form-input"
            >
              <option>{new Date().getFullYear()}</option>
              <option>{new Date().getFullYear() - 1}</option>
              <option>{new Date().getFullYear() - 2}</option>
            </select>
          </div>
          <div>
            <label className="form-label">Exemption Reason</label>
            <select 
              value={exemptionReason} 
              onChange={(e) => setExemptionReason(e.target.value as Form8843['exemptionReason'])}
              className="form-input"
            >
              <option value="student">Student (F-1)</option>
              <option value="teacher">Teacher/Trainee (J-1)</option>
              <option value="researcher">Researcher (J-1)</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Academic Institution Name</label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="form-input"
              placeholder="e.g., Harvard University"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Institution City</label>
              <input
                type="text"
                value={institutionCity}
                onChange={(e) => setInstitutionCity(e.target.value)}
                className="form-input"
                placeholder="City"
              />
            </div>
            <div>
              <label className="form-label">Institution State</label>
              <input
                type="text"
                value={institutionState}
                onChange={(e) => setInstitutionState(e.target.value)}
                className="form-input"
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Program Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Program End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="pt-4 border-t">
            <label className="form-label font-semibold">Days Present in US</label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <label className="text-sm text-gray-600">Current Year ({taxYear})</label>
                <input
                  type="number"
                  value={currentYearDays}
                  onChange={(e) => setCurrentYearDays(Number(e.target.value))}
                  className="form-input"
                  min="0"
                  max="366"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Previous Year 1 ({taxYear - 1})</label>
                <input
                  type="number"
                  value={prevYear1Days}
                  onChange={(e) => setPrevYear1Days(Number(e.target.value))}
                  className="form-input"
                  min="0"
                  max="366"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Previous Year 2 ({taxYear - 2})</label>
                <input
                  type="number"
                  value={prevYear2Days}
                  onChange={(e) => setPrevYear2Days(Number(e.target.value))}
                  className="form-input"
                  min="0"
                  max="366"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedForm === '1040NR' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="form-label">Tax Year</label>
            <select 
              value={taxYear} 
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="form-input"
            >
              <option>{new Date().getFullYear() - 1}</option>
              <option>{new Date().getFullYear() - 2}</option>
              <option>{new Date().getFullYear() - 3}</option>
            </select>
          </div>
          <div>
            <label className="form-label">Filing Status</label>
            <select 
              value={filingStatus} 
              onChange={(e) => setFilingStatus(e.target.value as Form1040NR['filingStatus'])}
              className="form-input"
            >
              <option value="nonresident_alien">Nonresident Alien</option>
              <option value="single">Single</option>
            </select>
          </div>
        </div>
      )}

      <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary w-full">
        {isGenerating ? 'Generating...' : `Generate ${selectedForm === '1040NR' ? 'Form 1040-NR' : 'Form 8843'}`}
      </button>

      {error && (
        <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {generatedForm && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Generated {selectedForm === '1040NR' ? 'Form 1040-NR' : 'Form 8843'}</h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[500px]">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(generatedForm, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
