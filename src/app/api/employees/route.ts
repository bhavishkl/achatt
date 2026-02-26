import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required' }, { status: 400 });
  }

  try {
    const { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select('*, advance_amount')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json({ message: 'Error fetching employees', error: error.message }, { status: 500 });
    }

    // Transform snake_case to camelCase for frontend if needed, 
    // but better to align types. I will keep snake_case in API response 
    // and let frontend handle it or update frontend types.
    // For now, let's return as is.
    return NextResponse.json({ employees });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, employeeId, name, basicSalary, department } = body;

    if (!companyId || !employeeId || !name || !basicSalary || !department) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .insert([
        {
          company_id: companyId,
          employee_id: employeeId,
          name,
          basic_salary: basicSalary,
          department,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json({ message: 'Error creating employee', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ employee }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
