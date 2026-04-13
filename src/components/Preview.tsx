import React from 'react';
import { DischargeData } from '../types';
import { AlertTriangle } from 'lucide-react';

interface PreviewProps {
  data: DischargeData;
}

export const Preview: React.FC<PreviewProps> = ({ data }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:p-0">
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">DISCHARGE SUMMARY</h1>
        {data.dischargeAgainstMedicalAdvice && (
          <div className="mt-2 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-300">
            <AlertTriangle size={16} />
            DISCHARGE AGAINST MEDICAL ADVICE (DAMA)
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm border-b pb-6">
        <div><span className="font-semibold text-gray-600">Patient Name:</span> <span className="text-gray-900">{data.patientName || '-'}</span></div>
        <div><span className="font-semibold text-gray-600">Inpatient No (IP NO):</span> <span className="text-gray-900">{data.ipNo || '-'}</span></div>
        <div><span className="font-semibold text-gray-600">Age / Gender:</span> <span className="text-gray-900">{data.age || '-'} / {data.gender || '-'}</span></div>
        <div><span className="font-semibold text-gray-600">Date of Admission:</span> <span className="text-gray-900">{data.admissionDate || '-'}</span></div>
        <div><span className="font-semibold text-gray-600">Date of Discharge:</span> <span className="text-gray-900">{data.dischargeDate || '-'}</span></div>
      </div>

      <div className="space-y-6 text-sm">
        {data.finalDiagnosis && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Final Diagnosis</h2>
            <div className="whitespace-pre-wrap text-gray-700">{data.finalDiagnosis}</div>
          </section>
        )}

        {data.clinicalPresentation && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Clinical Presentation</h2>
            <div className="whitespace-pre-wrap text-gray-700">{data.clinicalPresentation}</div>
          </section>
        )}

        {data.investigations.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Investigations</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-2 px-3 font-semibold text-gray-700">Date</th>
                  <th className="py-2 px-3 font-semibold text-gray-700">Category</th>
                  <th className="py-2 px-3 font-semibold text-gray-700">Investigation</th>
                  <th className="py-2 px-3 font-semibold text-gray-700">Result</th>
                </tr>
              </thead>
              <tbody>
                {data.investigations.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-600">{inv.date}</td>
                    <td className="py-2 px-3 text-gray-600">{inv.category}</td>
                    <td className="py-2 px-3 text-gray-800">{inv.name}</td>
                    <td className="py-2 px-3 text-gray-800">{inv.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {data.treatmentGiven.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Treatment Given</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {data.treatmentGiven.map((tx) => (
                <li key={tx.id}>
                  <span className="font-medium text-gray-900">
                    {tx.dosage ? `${tx.name} ${tx.dosage}` : tx.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.hospitalCourse && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Course in Hospital</h2>
            <div className="whitespace-pre-wrap text-gray-700">{data.hospitalCourse}</div>
          </section>
        )}

        {data.dischargeAdvice && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Advice on Discharge</h2>
            <div className="whitespace-pre-wrap text-gray-700">{data.dischargeAdvice}</div>
          </section>
        )}

        {data.followUp && (
          <section>
            <h2 className="font-bold text-gray-800 uppercase mb-2 border-b pb-1">Follow Up</h2>
            <div className="text-gray-700">{data.followUp}</div>
          </section>
        )}
      </div>

      <div className="mt-16 flex justify-between pt-8">
        <div className="text-center">
          <div className="w-40 border-b border-gray-400 mb-2"></div>
          <p className="text-sm font-semibold text-gray-600">Patient / Relative Signature</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-gray-400 mb-2"></div>
          <p className="text-sm font-semibold text-gray-600">Doctor Signature</p>
        </div>
      </div>
    </div>
  );
};
