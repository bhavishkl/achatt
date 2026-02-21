import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'Rotation ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('shift_rotations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shift rotation:', error);
      return NextResponse.json({ message: 'Error deleting shift rotation', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Shift rotation deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
