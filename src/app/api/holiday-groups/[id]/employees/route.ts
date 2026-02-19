import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { employeeId } = body;

    if (!groupId || !employeeId) {
      return NextResponse.json({ message: 'Group ID and Employee ID are required' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('holiday_group_employees')
      .select('id')
      .eq('holiday_group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (existing) {
        return NextResponse.json({ message: 'Employee already in group' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from('holiday_group_employees')
      .insert([
        {
          holiday_group_id: groupId,
          employee_id: employeeId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error assigning employee to holiday group:', error);
      return NextResponse.json({ message: 'Error assigning employee', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignment: data }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!groupId || !employeeId) {
      return NextResponse.json({ message: 'Group ID and Employee ID are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('holiday_group_employees')
      .delete()
      .eq('holiday_group_id', groupId)
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Error removing employee from holiday group:', error);
      return NextResponse.json({ message: 'Error removing employee', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Employee removed from holiday group' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
