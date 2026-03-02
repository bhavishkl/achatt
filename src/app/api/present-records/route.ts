import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const month = searchParams.get('month');

  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required' }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from('present_records')
      .select('*, employee_details:employees!present_records_employee_id_fkey!inner(company_id)')
      .eq('employee_details.company_id', companyId);

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
      const endDate = new Date(year, m, 0).toISOString().split('T')[0];
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data: records, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching present records:', error);
      return NextResponse.json({ message: 'Error fetching present records', error: error.message }, { status: 500 });
    }

    const formattedRecords = records.map((r: any) => ({
      id: r.id,
      employeeId: r.employee_id,
      date: r.date,
      note: r.note || undefined,
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
    const { employeeId, date, note } = body;

    if (!employeeId || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: record, error } = await supabaseAdmin
      .from('present_records')
      .insert([
        {
          employee_id: employeeId,
          date,
          note: note || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating present record:', error);
      return NextResponse.json({ message: 'Error creating present record', error: error.message }, { status: 500 });
    }

    const formattedRecord = {
      id: record.id,
      employeeId: record.employee_id,
      date: record.date,
      note: record.note || undefined,
      createdAt: record.created_at,
    };

    return NextResponse.json({ record: formattedRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
