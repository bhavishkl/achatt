import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  // Optional: filter by month/year or employeeId if needed for optimization
  const month = searchParams.get('month'); // YYYY-MM format

  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required' }, { status: 400 });
  }

  try {
    // Join with employees to filter by company_id, as leave_records doesn't have company_id directly
    let query = supabaseAdmin
      .from('leave_records')
      .select('*, employees!inner(company_id)')
      .eq('employees.company_id', companyId);

    if (month) {
      // Filter by month prefix e.g. '2026-02'
      // Use text search on date column cast to text or range query
      // range query is better: start of month to end of month
      const [year, m] = month.split('-').map(Number);
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
      const endDate = new Date(year, m, 0).toISOString().split('T')[0]; // Last day of month
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data: records, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching leave records:', error);
      return NextResponse.json({ message: 'Error fetching leave records', error: error.message }, { status: 500 });
    }

    const formattedRecords = records.map((r: any) => ({
      id: r.id,
      employeeId: r.employee_id,
      date: r.date,
      reason: r.reason,
      substituteEmployeeId: r.substitute_employee_id || undefined,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ records: formattedRecords });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, date, reason, substituteEmployeeId } = body;

    if (!employeeId || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: record, error } = await supabaseAdmin
      .from('leave_records')
      .insert([
        {
          employee_id: employeeId,
          date,
          reason,
          substitute_employee_id: substituteEmployeeId || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating leave record:', error);
      return NextResponse.json({ message: 'Error creating leave record', error: error.message }, { status: 500 });
    }

    const formattedRecord = {
      id: record.id,
      employeeId: record.employee_id,
      date: record.date,
      reason: record.reason,
      substituteEmployeeId: record.substitute_employee_id || undefined,
      createdAt: record.created_at,
    };

    return NextResponse.json({ record: formattedRecord }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
