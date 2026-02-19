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
      .from('week_off_groups')
      .select('*, week_off_group_employees(employee_id)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching week-off groups:', error);
      return NextResponse.json({ message: 'Error fetching week-off groups', error: error.message }, { status: 500 });
    }

    const formattedGroups = groups.map((g: any) => ({
      id: g.id,
      name: g.name,
      daysOff: g.days_off || [],
      employeeIds: g.week_off_group_employees ? g.week_off_group_employees.map((e: any) => e.employee_id) : [],
    }));

    return NextResponse.json({ groups: formattedGroups });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, daysOff } = body;

    if (!companyId || !name || !daysOff) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: group, error } = await supabaseAdmin
      .from('week_off_groups')
      .insert([
        {
          company_id: companyId,
          name,
          days_off: daysOff,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating week-off group:', error);
      return NextResponse.json({ message: 'Error creating week-off group', error: error.message }, { status: 500 });
    }

    const formattedGroup = {
      id: group.id,
      name: group.name,
      daysOff: group.days_off,
      employeeIds: [],
    };

    return NextResponse.json({ group: formattedGroup }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
