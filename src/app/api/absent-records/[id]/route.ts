import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('absent_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting absent record:', error);
      return NextResponse.json({ message: 'Error deleting absent record', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Absent record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
