import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required' }, { status: 400 });
  }

  try {
    const { data: groups, error } = await supabaseAdmin
      .from('leave_groups')
      .select('*, leave_group_employees(employee_id)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leave groups:', error);
      return NextResponse.json({ message: 'Error fetching leave groups', error: error.message }, { status: 500 });
    }

    const formattedGroups = groups.map((g: any) => ({
      id: g.id,
      name: g.name,
      leavesPerMonth: g.leaves_per_month,
      employeeIds: g.leave_group_employees ? g.leave_group_employees.map((e: any) => e.employee_id) : [],
    }));

    return NextResponse.json({ groups: formattedGroups });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, leavesPerMonth } = body;

    if (!companyId || !name || leavesPerMonth === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: group, error } = await supabaseAdmin
      .from('leave_groups')
      .insert([
        {
          company_id: companyId,
          name,
          leaves_per_month: leavesPerMonth,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating leave group:', error);
      return NextResponse.json({ message: 'Error creating leave group', error: error.message }, { status: 500 });
    }

    const formattedGroup = {
      id: group.id,
      name: group.name,
      leavesPerMonth: group.leaves_per_month,
      employeeIds: [],
    };

    return NextResponse.json({ group: formattedGroup }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
