import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, holidays } = body;

    if (!name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Update Group Name
    const { data: group, error: groupError } = await supabaseAdmin
      .from('holiday_groups')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (groupError) {
      console.error('Error updating holiday group:', groupError);
      return NextResponse.json({ message: 'Error updating holiday group', error: groupError.message }, { status: 500 });
    }

    // 2. Delete Existing Entries
    const { error: deleteEntriesError } = await supabaseAdmin
      .from('holiday_entries')
      .delete()
      .eq('holiday_group_id', id);

    if (deleteEntriesError) {
      console.error('Error clearing old holiday entries:', deleteEntriesError);
      return NextResponse.json({ message: 'Error updating holiday entries', error: deleteEntriesError.message }, { status: 500 });
    }

    // 3. Insert New Entries
    if (holidays && holidays.length > 0) {
      const entriesToInsert = holidays.map((h: any) => ({
        holiday_group_id: id,
        date: h.date,
        label: h.label,
      }));

      const { error: insertEntriesError } = await supabaseAdmin
        .from('holiday_entries')
        .insert(entriesToInsert);

      if (insertEntriesError) {
        console.error('Error inserting new holiday entries:', insertEntriesError);
        return NextResponse.json({ message: 'Error updating holiday entries', error: insertEntriesError.message }, { status: 500 });
      }
    }

    // Return the updated group with its entries
    const formattedGroup = {
      id: group.id,
      name: group.name,
      holidays: holidays || [],
      // employeeIds are not updated here, so we don't need to return them for the store update unless we re-fetch everything
    };

    return NextResponse.json({ group: formattedGroup });

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

    // Delete related entries and employees first (explicitly)
    // 1. Entries
    const { error: entriesError } = await supabaseAdmin
      .from('holiday_entries')
      .delete()
      .eq('holiday_group_id', id);

    if (entriesError) {
        console.error('Error deleting holiday entries:', entriesError);
    }

    // 2. Employees
    const { error: empError } = await supabaseAdmin
      .from('holiday_group_employees')
      .delete()
      .eq('holiday_group_id', id);

    if (empError) {
        console.error('Error deleting holiday group employees:', empError);
    }

    // 3. Group
    const { error } = await supabaseAdmin
      .from('holiday_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting holiday group:', error);
      return NextResponse.json({ message: 'Error deleting holiday group', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Holiday group deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
