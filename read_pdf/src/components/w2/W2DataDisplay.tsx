'use client';

import { useState } from 'react';
import { ParsedW2Data } from '@/read_pdf/src/types/w2';

interface W2DataDisplayProps {
  data: ParsedW2Data;
}

export default function W2DataDisplay({ data }: W2DataDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'raw' | 'details'>('summary');

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const w2 = data.w2Forms?.[0];

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">W2 Data</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Confidence:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  data.confidence >= 80
                    ? 'bg-green-500'
                    : data.confidence >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <span className="text-sm font-medium">{data.confidence}%</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Full Details
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Raw Data
          </button>
        </div>
      </div>

      {activeTab === 'summary' && w2 && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Employee Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">
                    {w2.employee?.firstName} {w2.employee?.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">SSN:</span>
                  <p className="font-medium font-mono">{w2.employee?.ssn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="font-medium">
                    {w2.employee?.address?.street}, {w2.employee?.address?.city},{' '}
                    {w2.employee?.address?.state} {w2.employee?.address?.zipCode}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Employer Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{w2.employer?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">EIN:</span>
                  <p className="font-medium font-mono">{w2.employer?.ein || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="font-medium">
                    {w2.employer?.address?.street}, {w2.employer?.address?.city},{' '}
                    {w2.employer?.address?.state} {w2.employer?.address?.zipCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Key Financial Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Wages (Box 1)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(w2.wages?.wagesTipsOtherCompensation)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Federal Tax Withheld (Box 2)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(w2.wages?.federalTaxWithheld)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Social Security (Box 3)</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(w2.wages?.socialSecurityWages)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Medicare (Box 5)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(w2.wages?.medicareWages)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">SS Tax Withheld (Box 4)</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(w2.wages?.socialSecurityTaxWithheld)}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Medicare Tax (Box 6)</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(w2.wages?.medicareTaxWithheld)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && w2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Complete W2 Information</h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Box 1 - Wages, tips, other compensation</h4>
                <p className="text-2xl font-bold">{formatCurrency(w2.wages?.wagesTipsOtherCompensation)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Box 2 - Federal income tax withheld</h4>
                <p className="text-2xl font-bold">{formatCurrency(w2.wages?.federalTaxWithheld)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Box 3 - Social Security wages</h4>
                <p className="text-2xl font-bold">{formatCurrency(w2.wages?.socialSecurityWages)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Box 4 - Social Security tax withheld</h4>
                <p className="text-2xl font-bold">{formatCurrency(w2.wages?.socialSecurityTaxWithheld)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Box 5 - Medicare wages and tips</h4>
                <p className="text-2xl font-bold">{formatCurrency(w2.wages?.medicareWages)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Box 6 - Medicare tax withheld</h4>
                <p className="text-2xl font-bold">{formatCurrency(w2.wages?.medicareTaxWithheld)}</p>
              </div>

              {w2.stateTaxWithholding && w2.stateTaxWithholding.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">State Tax Withholding</h4>
                  {w2.stateTaxWithholding.map((state, idx) => (
                    <div key={idx} className="mt-2">
                      <p className="font-medium">{state.state}</p>
                      <p>Wages: {formatCurrency(state.stateWages)}</p>
                      <p>Tax: {formatCurrency(state.stateTaxWithheld)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'raw' && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Raw JSON Data</h3>
          <div className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {data.warnings && data.warnings.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-700">Warnings</h3>
          <div className="space-y-2">
            {data.warnings.map((warning, idx) => (
              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-yellow-400 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="ml-3 text-sm text-yellow-700">{warning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.errors && data.errors.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-red-700">Errors</h3>
          <div className="space-y-2">
            {data.errors.map((error, idx) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-400 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
