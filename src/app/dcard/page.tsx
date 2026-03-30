"use client";

import React, { useState } from 'react';
import { EditorForm } from '../../components/EditForm';
import { Preview } from '../../components/Preview';
import { DischargeData } from '../../types';
import { dischargeTemplates } from '../../lib/dcardTemplates';
import { Printer, Edit, Eye, FileText, ClipboardPaste, CheckCircle, AlertCircle } from 'lucide-react';
import { generateDocx } from '../../lib/exportDocx';
import { parseDischargeText } from '../../lib/parseDischargeText';

type Tab = 'paste' | 'edit' | 'preview';

export default function DischargeCardPage() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('blank');
  const [data, setData] = useState<DischargeData>(dischargeTemplates.blank.data);
  const [tab, setTab] = useState<Tab>('paste');
  const [rawText, setRawText] = useState('');
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parseMsg, setParseMsg] = useState('');

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedTemplateKey(key);
    setData(JSON.parse(JSON.stringify(dischargeTemplates[key].data)));
  };

  const handlePrint = () => window.print();

  const handleExportWord = async () => {
    await generateDocx(data);
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      setParseStatus('error');
      setParseMsg('Please paste some text first.');
      return;
    }
    try {
      const parsed = parseDischargeText(rawText);
      setData(parsed);
      setParseStatus('success');
      setParseMsg('Parsed successfully! Switched to Edit tab — review and adjust before exporting.');
      setTimeout(() => setTab('edit'), 800);
    } catch (e) {
      setParseStatus('error');
      setParseMsg(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">Discharge Card Generator</h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedTemplateKey}
              onChange={handleTemplateChange}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {Object.entries(dischargeTemplates).map(([key, template]) => (
                <option key={key} value={key}>{template.name}</option>
              ))}
            </select>

            {tab === 'preview' && (
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

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-4 print:hidden border-b border-gray-300">
          {(
            [
              { key: 'paste', icon: <ClipboardPaste size={16} />, label: 'Paste Text' },
              { key: 'edit', icon: <Edit size={16} />, label: 'Edit Form' },
              { key: 'preview', icon: <Eye size={16} />, label: 'Preview' },
            ] as { key: Tab; icon: React.ReactNode; label: string }[]
          ).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-t-md transition-colors ${tab === key
                  ? 'bg-white border border-b-white border-gray-300 text-teal-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Paste Text Tab ── */}
        {tab === 'paste' && (
          <div className="bg-white rounded-lg shadow p-6 print:hidden">
            <p className="text-sm text-gray-600 mb-3">
              Paste a plain-text discharge summary below. The parser will auto-fill all fields.
              You can review and edit everything in the <strong>Edit Form</strong> tab before exporting.
            </p>

            <textarea
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setParseStatus('idle'); }}
              placeholder={`Patient Name - John Doe\nAge : 64/ Male\nIP NUMBER  2636/26\nD/O/A 21/03/2026\nD/O/D 28/03/2026\n\nClinical presentation\nPatient having...\n\nINVESTIGATION\nRADIOLOGY\n21/03/2026\nCXR - Cardiomegaly\n\nTreatment Given\nInj- Pantop 40mg iv/tid\n...`}
              rows={22}
              className="w-full font-mono text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
            />

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handleParse}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                <ClipboardPaste size={18} />
                Parse &amp; Fill Form
              </button>

              {parseStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle size={18} />
                  <span>{parseMsg}</span>
                </div>
              )}
              {parseStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  <span>{parseMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Edit Form Tab ── */}
        <div className={tab === 'edit' ? 'block print:hidden' : 'hidden'}>
          <EditorForm data={data} onChange={setData} />
        </div>

        {/* ── Preview Tab ── */}
        <div className={tab === 'preview' ? 'block print:block' : 'hidden print:block'}>
          <Preview data={data} />
        </div>

      </div>
    </div>
  );
}
