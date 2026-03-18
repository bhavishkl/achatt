"use client";

import React, { useState } from 'react';
import { EditorForm } from '../../components/EditForm';
import { Preview } from '../../components/Preview';
import { DischargeData } from '../../types';
import { dischargeTemplates } from '../../lib/dcardTemplates';
import { Printer, Edit, Eye, FileText } from 'lucide-react';
import { generateDocx } from '../../lib/exportDocx';

export default function DischargeCardPage() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('blank');
  const [data, setData] = useState<DischargeData>(dischargeTemplates.blank.data);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedTemplateKey(key);
    // Deep clone to avoid mutating the base template
    setData(JSON.parse(JSON.stringify(dischargeTemplates[key].data)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    await generateDocx(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">Discharge Card Generator</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedTemplateKey}
              onChange={handleTemplateChange}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {Object.entries(dischargeTemplates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {viewMode === 'edit' ? <><Eye size={18} /> Preview</> : <><Edit size={18} /> Edit</>}
            </button>
            {viewMode === 'preview' && (
              <>
                <button
                  onClick={handleExportWord}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText size={18} /> Word
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  <Printer size={18} /> Print
                </button>
              </>
            )}
          </div>
        </div>

        <div className={viewMode === 'edit' ? 'block print:hidden' : 'hidden'}>
          <EditorForm data={data} onChange={setData} />
        </div>

        <div className={viewMode === 'preview' ? 'block print:block' : 'hidden print:block'}>
          <Preview data={data} />
        </div>
      </div>
    </div>
  );
}
