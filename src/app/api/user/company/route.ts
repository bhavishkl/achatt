import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    // 1. Get user to find company_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError) {
        console.error("Error fetching user:", userError);
        // If user not found, or error
        return NextResponse.json({ message: 'User not found or error', error: userError.message }, { status: 404 });
    }

    if (!user.company_id) {
        return NextResponse.json({ company: null });
    }

    // 2. Get company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', user.company_id)
      .single();

    if (companyError) {
        console.error("Error fetching company:", companyError);
        return NextResponse.json({ message: 'Company not found', error: companyError.message }, { status: 404 });
    }

    return NextResponse.json({ company });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
