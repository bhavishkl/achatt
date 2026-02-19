import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startTime, endTime } = body;

    const { data: group, error } = await supabaseAdmin
      .from('shift_groups')
      .update({
        name,
        start_time: startTime,
        end_time: endTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shift group:', error);
      return NextResponse.json({ message: 'Error updating shift group', error: error.message }, { status: 500 });
    }

    // We don't fetch employees here because usually edit doesn't change members
    // unless we design it that way, but for now we just return the group details.
    return NextResponse.json({ 
      group: {
        id: group.id,
        name: group.name,
        startTime: group.start_time,
        endTime: group.end_time,
      } 
    });

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

    // First delete associated employees (if cascade isn't set up, but usually it is good practice to handle explicitly if needed)
    // Actually, let's assume cascade delete on foreign key or just delete group and hope for cascade.
    // Checking schema: strict foreign keys usually restrict delete unless cascade.
    // I will try deleting the group directly. If it fails, I might need to delete members first.
    
    const { error } = await supabaseAdmin
      .from('shift_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shift group:', error);
      return NextResponse.json({ message: 'Error deleting shift group', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Shift group deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
