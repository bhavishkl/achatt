"use client";

import React, { useEffect, useState } from 'react';
import { EditorForm } from '../../components/EditForm';
import { Preview } from '../../components/Preview';
import { DischargeData } from '../../types';
import { dischargeTemplates } from '../../lib/dcardTemplates';
import { Printer, Edit, Eye, FileText, ClipboardPaste, CheckCircle, AlertCircle, ImagePlus, Trash2 } from 'lucide-react';
import { generateDocx } from '../../lib/exportDocx';
import { parseDischargeText } from '../../lib/parseDischargeText';

type Tab = 'paste' | 'edit' | 'preview';

const FORM_STORAGE_KEY = 'dcard-form-data';
const TEMPLATE_STORAGE_KEY = 'dcard-template-key';
const HEADER_IMAGE_STORAGE_KEY = 'dcard-header-image';

export default function DischargeCardPage() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(() => {
    if (typeof window === 'undefined') return 'blank';
    return window.localStorage.getItem(TEMPLATE_STORAGE_KEY) ?? 'blank';
  });

  const [data, setData] = useState<DischargeData>(() => {
    if (typeof window === 'undefined') return dischargeTemplates.blank.data;
    const savedData = window.localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData) as DischargeData;
      } catch {
        return dischargeTemplates.blank.data;
      }
    }
    const savedTemplate = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return dischargeTemplates[savedTemplate ?? 'blank']?.data ?? dischargeTemplates.blank.data;
  });

  const [tab, setTab] = useState<Tab>('paste');
  const [rawText, setRawText] = useState('');
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parseMsg, setParseMsg] = useState('');
  const [headerImageDataUrl, setHeaderImageDataUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(HEADER_IMAGE_STORAGE_KEY);
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedTemplateKey(key);
    setData(JSON.parse(JSON.stringify(dischargeTemplates[key].data)));
  };

  const resetForm = () => {
    const resetData = JSON.parse(JSON.stringify(dischargeTemplates[selectedTemplateKey]?.data ?? dischargeTemplates.blank.data));
    setData(resetData);
    window.localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const handlePrint = () => window.print();

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setHeaderImageDataUrl(result);
      if (typeof window !== 'undefined') {
        if (result) {
          window.localStorage.setItem(HEADER_IMAGE_STORAGE_KEY, result);
        } else {
          window.localStorage.removeItem(HEADER_IMAGE_STORAGE_KEY);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const clearHeaderImage = () => {
    setHeaderImageDataUrl(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(HEADER_IMAGE_STORAGE_KEY);
    }
  };

  const handleExportWord = async () => {
    await generateDocx(data, headerImageDataUrl ?? undefined);
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

  useEffect(() => {
    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, selectedTemplateKey);
  }, [selectedTemplateKey]);

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

        {/* ── Header image uploader ── */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Custom header image for Word export</p>
              <p className="text-sm text-gray-500">Upload a logo or clinic header and it will appear at the top of the exported document.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <ImagePlus size={16} />
                {headerImageDataUrl ? 'Change image' : 'Upload image'}
                <input type="file" accept="image/*" onChange={handleHeaderImageChange} className="sr-only" />
              </label>

              {headerImageDataUrl && (
                <button
                  onClick={clearHeaderImage}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={16} /> Remove
                </button>
              )}
            </div>
          </div>

          {headerImageDataUrl && (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
              <img src={headerImageDataUrl} alt="Header preview" className="max-h-24 rounded object-contain" />
            </div>
          )}
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
          <EditorForm data={data} onChange={setData} onReset={resetForm} />
        </div>

        {/* ── Preview Tab ── */}
        <div className={tab === 'preview' ? 'block print:block' : 'hidden print:block'}>
          <Preview data={data} />
        </div>

      </div>
    </div>
  );
}
