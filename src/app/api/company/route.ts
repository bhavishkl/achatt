import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

function mapCompany(company: any) {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    emailId: company.email_id,
    mobileNumber1: company.mobile_number_1,
    mobileNumber2: company.mobile_number_2,
    ownerName: company.owner_name,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  };
}

export async function POST(request: Request) {
  try {
    const {
      userId,
      name,
      address,
      emailId,
      mobileNumber1,
      mobileNumber2,
      ownerName,
    } = await request.json();

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
      .insert([
        {
          name: String(name).trim(),
          address: address ? String(address).trim() : null,
          email_id: emailId ? String(emailId).trim() : null,
          mobile_number_1: mobileNumber1 ? String(mobileNumber1).trim() : null,
          mobile_number_2: mobileNumber2 ? String(mobileNumber2).trim() : null,
          owner_name: ownerName ? String(ownerName).trim() : null,
        },
      ])
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

    return NextResponse.json({ company: mapCompany(company) }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const {
      userId,
      name,
      address,
      emailId,
      mobileNumber1,
      mobileNumber2,
      ownerName,
    } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ message: 'User ID and Company Name are required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.company_id) {
      return NextResponse.json({ message: 'Company not found for this user' }, { status: 404 });
    }

    const { data: company, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        email_id: emailId ? String(emailId).trim() : null,
        mobile_number_1: mobileNumber1 ? String(mobileNumber1).trim() : null,
        mobile_number_2: mobileNumber2 ? String(mobileNumber2).trim() : null,
        owner_name: ownerName ? String(ownerName).trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.company_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ message: 'Failed to update company', error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ company: mapCompany(company) }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.company_id) {
      return NextResponse.json({ message: 'Company not found for this user' }, { status: 404 });
    }

    const companyId = user.company_id;

    const { error: unlinkError } = await supabaseAdmin
      .from('users')
      .update({ company_id: null })
      .eq('id', userId);

    if (unlinkError) {
      return NextResponse.json({ message: 'Failed to unlink company from user', error: unlinkError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (deleteError) {
      // Best-effort rollback to avoid leaving the current user unlinked on delete failure.
      await supabaseAdmin
        .from('users')
        .update({ company_id: companyId })
        .eq('id', userId);

      if (deleteError.code === '23503') {
        return NextResponse.json(
          { message: 'Cannot delete company while related records exist (employees/groups/etc).' },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: 'Failed to delete company', error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Company deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
