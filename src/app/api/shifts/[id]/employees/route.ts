import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { employeeId } = await request.json();

    if (!groupId || !employeeId) {
      return NextResponse.json({ message: 'Group ID and Employee ID are required' }, { status: 400 });
    }

    // Check if relationship already exists?
    // Supabase insert will fail if unique constraint violated, but we don't have explicit unique index on (group_id, employee_id) in schema.json provided?
    // Usually DBs enforce unique PK or unique constraint.
    // If not, we might duplicate. Let's check schema.json...
    // shift_group_employees has `id` PK. It doesn't show unique constraint on (shift_group_id, employee_id).
    // We should probably check first to avoid duplicates if DB doesn't enforce it.

    const { data: existing } = await supabaseAdmin
      .from('shift_group_employees')
      .select('id')
      .eq('shift_group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (existing) {
        return NextResponse.json({ message: 'Employee already in group' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from('shift_group_employees')
      .insert([
        {
          shift_group_id: groupId,
          employee_id: employeeId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error assigning employee to shift:', error);
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
      .from('shift_group_employees')
      .delete()
      .eq('shift_group_id', groupId)
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Error removing employee from shift:', error);
      return NextResponse.json({ message: 'Error removing employee', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Employee removed from shift group' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
