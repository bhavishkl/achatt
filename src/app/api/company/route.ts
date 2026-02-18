import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ message: 'User ID and Company Name are required' }, { status: 400 });
    }

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
      return NextResponse.json({ 
        message: 'Server configuration error: Missing service role key. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.' 
      }, { status: 500 });
    }

    // 1. Create Company using Admin client (bypass RLS)
    const { data: company, error: createError } = await supabaseAdmin
      .from('companies')
      .insert([{ name }])
      .select()
      .single();

    if (createError) {
      console.error("Supabase Create Company Error:", createError);
      return NextResponse.json({ message: 'Failed to create company', error: createError.message, details: createError }, { status: 500 });
    }

    // 2. Update User with company_id using Admin client (bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ company_id: company.id })
      .eq('id', userId);

    if (updateError) {
      console.error("Supabase Update User Error:", updateError);
      return NextResponse.json({ message: 'Company created but failed to link to user', error: updateError.message, details: updateError }, { status: 500 });
    }

    return NextResponse.json({ company }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
