import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required' }, { status: 400 });
  }

  try {
    const { data: rotations, error } = await supabaseAdmin
      .from('shift_rotations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shift rotations:', error);
      return NextResponse.json({ message: 'Error fetching shift rotations', error: error.message }, { status: 500 });
    }

    const formattedRotations = rotations.map((r: any) => ({
      id: r.id,
      employeeId: r.employee_id,
      shiftType: r.shift_type,
      startDate: r.start_date,
      endDate: r.end_date,
    }));

    return NextResponse.json({ rotations: formattedRotations });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, employeeId, shiftType, startDate, endDate } = body;

    if (!companyId || !employeeId || !shiftType || !startDate || !endDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: rotation, error } = await supabaseAdmin
      .from('shift_rotations')
      .insert([
        {
          company_id: companyId,
          employee_id: employeeId,
          shift_type: shiftType,
          start_date: startDate,
          end_date: endDate,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating shift rotation:', error);
      return NextResponse.json({ message: 'Error creating shift rotation', error: error.message }, { status: 500 });
    }

    const formattedRotation = {
      id: rotation.id,
      employeeId: rotation.employee_id,
      shiftType: rotation.shift_type,
      startDate: rotation.start_date,
      endDate: rotation.end_date,
    };

    return NextResponse.json({ rotation: formattedRotation }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
