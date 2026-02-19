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
      .from('holiday_groups')
      .select('*, holiday_entries(*), holiday_group_employees(employee_id)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching holiday groups:', error);
      return NextResponse.json({ message: 'Error fetching holiday groups', error: error.message }, { status: 500 });
    }

    const formattedGroups = groups.map((g: any) => ({
      id: g.id,
      name: g.name,
      holidays: g.holiday_entries.map((h: any) => ({
        date: h.date,
        label: h.label,
      })),
      employeeIds: g.holiday_group_employees ? g.holiday_group_employees.map((e: any) => e.employee_id) : [],
    }));

    return NextResponse.json({ groups: formattedGroups });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, holidays } = body;

    if (!companyId || !name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('holiday_groups')
      .insert([
        {
          company_id: companyId,
          name,
        },
      ])
      .select()
      .single();

    if (groupError) {
      console.error('Error creating holiday group:', groupError);
      return NextResponse.json({ message: 'Error creating holiday group', error: groupError.message }, { status: 500 });
    }

    // 2. Create Entries
    if (holidays && holidays.length > 0) {
      const entriesToInsert = holidays.map((h: any) => ({
        holiday_group_id: group.id,
        date: h.date,
        label: h.label,
      }));

      const { error: entriesError } = await supabaseAdmin
        .from('holiday_entries')
        .insert(entriesToInsert);

      if (entriesError) {
        console.error('Error creating holiday entries:', entriesError);
        // Clean up group? Or partial success?
        // Ideally we delete the group.
        await supabaseAdmin.from('holiday_groups').delete().eq('id', group.id);
        return NextResponse.json({ message: 'Error creating holiday entries', error: entriesError.message }, { status: 500 });
      }
    }

    const formattedGroup = {
      id: group.id,
      name: group.name,
      holidays: holidays || [],
      employeeIds: [],
    };

    return NextResponse.json({ group: formattedGroup }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
