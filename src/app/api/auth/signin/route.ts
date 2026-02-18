import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new NextResponse(JSON.stringify({ message: 'Email and password are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password')
      .eq('email', email);

    if (error) {
      console.error('Error fetching user:', error);
      return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!users || users.length === 0) {
      return new NextResponse(JSON.stringify({ message: 'Invalid email or password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return new NextResponse(JSON.stringify({ message: 'Invalid email or password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // For now, just return a success message.
    // In a real application, you would create a session/JWT here.
    return new NextResponse(JSON.stringify({ message: 'Sign in successful', userId: user.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Signin error:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
