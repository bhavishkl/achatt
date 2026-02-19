import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, daysOff } = body;

    if (!name || !daysOff) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: group, error } = await supabaseAdmin
      .from('week_off_groups')
      .update({
        name,
        days_off: daysOff,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating week-off group:', error);
      return NextResponse.json({ message: 'Error updating week-off group', error: error.message }, { status: 500 });
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

    // Delete related employees first to be safe, though cascade might handle it
    const { error: empError } = await supabaseAdmin
      .from('week_off_group_employees')
      .delete()
      .eq('week_off_group_id', id);

    if (empError) {
        console.error('Error deleting week-off group employees:', empError);
        // Continue to try deleting the group, or fail?
        // Let's fail if we can't clean up references, unless they are already gone.
    }

    const { error } = await supabaseAdmin
      .from('week_off_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting week-off group:', error);
      return NextResponse.json({ message: 'Error deleting week-off group', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Week-off group deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
