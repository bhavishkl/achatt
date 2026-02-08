"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useAppStore } from "@/lib/store";
import type { PunchRecord } from "@/lib/types";

export default function PunchUploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  
  const { employees, addPunchRecords, clearPunchRecords, punchRecords, processedPunches } = useAppStore();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setMessage("");
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setStatus("error");
      setMessage("Please select a file first");
      return;
    }

    setStatus("processing");
    setMessage("Processing file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // Parse Excel data to PunchRecords
      const punchRecords: PunchRecord[] = [];
      
      // Type definition for Excel row
      type ExcelRow = Record<string, unknown>;
      
      // Assuming columns: Employee Id, Employee Name, Punch Time
      // Or the data might be in different column names depending on Excel file
      // We'll handle both numeric and string keys
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as ExcelRow;
        
        // Extract values using different possible column names
        let employeeId = "";
        let employeeName = "";
        let punchTime = "";

        // Try different possible column names
        if (row["Employee Id"] !== undefined) {
          employeeId = String(row["Employee Id"]);
        } else if (row["EmployeeID"] !== undefined) {
          employeeId = String(row["EmployeeID"]);
        } else if (row["EMP ID"] !== undefined) {
          employeeId = String(row["EMP ID"]);
        } else if (row["emp_id"] !== undefined) {
          employeeId = String(row["emp_id"]);
        } else {
          const keys = Object.keys(row);
          if (keys[0]) {
            employeeId = String(row[keys[0]]);
          }
        }

        if (row["Employee Name"] !== undefined) {
          employeeName = String(row["Employee Name"]);
        } else if (row["Name"] !== undefined) {
          employeeName = String(row["Name"]);
        } else if (row["employee_name"] !== undefined) {
          employeeName = String(row["employee_name"]);
        } else {
          const keys = Object.keys(row);
          if (keys[1]) {
            employeeName = String(row[keys[1]]);
          }
        }

        if (row["Punch Time"] !== undefined) {
          punchTime = String(row["Punch Time"]);
        } else if (row["PunchTime"] !== undefined) {
          punchTime = String(row["PunchTime"]);
        } else if (row["punch_time"] !== undefined) {
          punchTime = String(row["punch_time"]);
        } else {
          const keys = Object.keys(row);
          if (keys[2]) {
            punchTime = String(row[keys[2]]);
          }
        }

        // Parse punch time
        let date: Date;
        if (/^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}$/.test(punchTime)) {
          // Format: 2026/1/9 10:03
          const [datePart, timePart] = punchTime.split(' ');
          const [year, month, day] = datePart.split('/').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          date = new Date(year, month - 1, day, hours, minutes);
        } else {
          // Try parsing as Date
          date = new Date(punchTime);
        }

        // Validate
        if (!employeeId || !employeeName || isNaN(date.getTime())) {
          console.warn("Skipping invalid row:", row);
          continue;
        }

        // Check if employee exists in app (using employeeId)
        const existingEmployee = employees.find(emp => emp.employeeId === employeeId);
        if (!existingEmployee) {
          console.warn("Skipping unknown employee:", employeeId);
          continue;
        }

        punchRecords.push({
          id: Math.random().toString(36).substr(2, 9),
          employeeId,
          employeeName,
          punchTime: date.toISOString(),
          date: date.toISOString().split('T')[0],
        });
      }

      // Add to store
      addPunchRecords(punchRecords);
      setUploadedCount(punchRecords.length);
      setStatus("success");
      setMessage(`Successfully processed ${punchRecords.length} punch records`);
    } catch (error) {
      console.error("Error processing file:", error);
      setStatus("error");
      setMessage(`Error: ${(error as Error).message}`);
    }
  }, [file, employees, addPunchRecords]);

  const handleClear = useCallback(() => {
    clearPunchRecords();
    setFile(null);
    setStatus("idle");
    setMessage("");
    setUploadedCount(0);
  }, [clearPunchRecords]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Biometric Punch Data</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excel File (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || status === "processing"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {status === "processing" ? "Processing..." : "Process File"}
          </button>
          {(punchRecords.length > 0 || status === "success") && (
            <button
              onClick={handleClear}
              disabled={status === "processing"}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Clear Records
            </button>
          )}
        </div>

        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {message}
          </div>
        )}
      </div>

      {processedPunches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processed Punch Records ({processedPunches.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punch In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punch Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedPunches.map((punch, index) => {
                  const employee = employees.find(emp => emp.employeeId === punch.employeeId);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {punch.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee?.name || punch.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {punch.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {punch.punchIn || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {punch.punchOut || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          punch.status === 'present' ? 'bg-green-100 text-green-800' :
                          punch.status === 'missed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {punch.status === 'present' ? 'Present' :
                           punch.status === 'missed' ? 'Missed Punch' :
                           'Absent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {employees.length === 0 && status === "idle" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700 text-sm">
            No employees have been added yet. Please add employees first before uploading punch data.
          </p>
        </div>
      )}
    </div>
  );
}