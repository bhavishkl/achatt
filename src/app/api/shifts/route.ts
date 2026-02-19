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
      .from('shift_groups')
      .select('*, shift_group_employees(employee_id)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shift groups:', error);
      return NextResponse.json({ message: 'Error fetching shift groups', error: error.message }, { status: 500 });
    }

    // Transform to match frontend types
    const formattedGroups = groups.map((g: any) => ({
      id: g.id,
      name: g.name,
      startTime: g.start_time, // DB is time, frontend expects HH:mm
      endTime: g.end_time,
      employeeIds: g.shift_group_employees.map((e: any) => e.employee_id),
    }));

    return NextResponse.json({ groups: formattedGroups });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, startTime, endTime } = body;

    if (!companyId || !name || !startTime || !endTime) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: group, error } = await supabaseAdmin
      .from('shift_groups')
      .insert([
        {
          company_id: companyId,
          name,
          start_time: startTime,
          end_time: endTime,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating shift group:', error);
      return NextResponse.json({ message: 'Error creating shift group', error: error.message }, { status: 500 });
    }

    const formattedGroup = {
      id: group.id,
      name: group.name,
      startTime: group.start_time,
      endTime: group.end_time,
      employeeIds: [],
    };

    return NextResponse.json({ group: formattedGroup }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
