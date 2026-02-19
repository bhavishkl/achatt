import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, leavesPerMonth } = body;

    if (!name || leavesPerMonth === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: group, error } = await supabaseAdmin
      .from('leave_groups')
      .update({
        name,
        leaves_per_month: leavesPerMonth,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating leave group:', error);
      return NextResponse.json({ message: 'Error updating leave group', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ group });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related employees first
    const { error: empError } = await supabaseAdmin
      .from('leave_group_employees')
      .delete()
      .eq('leave_group_id', id);

    if (empError) {
        console.error('Error deleting leave group employees:', empError);
    }

    const { error } = await supabaseAdmin
      .from('leave_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting leave group:', error);
      return NextResponse.json({ message: 'Error deleting leave group', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Leave group deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
