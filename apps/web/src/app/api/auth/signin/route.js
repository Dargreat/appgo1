import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Find user
    const user = await sql`
      SELECT id, name, email, password_hash, user_type, location, rating, total_sales, total_purchases, avatar_url, created_at
      FROM users 
      WHERE email = ${email}
    `;

    if (user.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await argon2.verify(user[0].password_hash, password);
    
    if (!isValidPassword) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Remove password hash from response
    const { password_hash, ...userData } = user[0];

    return Response.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Signin error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}