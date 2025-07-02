import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
){
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if(!email || !password){
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('auth')
      .select('id')
      .eq('email', email)
      .single();

    if(existingUser){
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Auth entry
    const { data: newAuth, error: authError } = await supabase
      .from('auth')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
        }
      ])
      .select()
      .single();

    if (authError) {
      console.error('Error creating auth entry:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...newAuth,
      }
    });
    
  } catch(error){
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}