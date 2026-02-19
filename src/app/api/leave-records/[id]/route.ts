import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('leave_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting leave record:', error);
      return NextResponse.json({ message: 'Error deleting leave record', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Leave record deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
