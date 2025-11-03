import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function POST(request) {
  try {
    const { name, email, password, userType = 'buyer', location } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return Response.json({ error: 'User already exists with this email' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const newUser = await sql`
      INSERT INTO users (name, email, password_hash, user_type, location)
      VALUES (${name}, ${email}, ${passwordHash}, ${userType}, ${location})
      RETURNING id, name, email, user_type, location, rating, total_sales, total_purchases, created_at
    `;

    return Response.json({
      success: true,
      user: newUser[0]
    });

  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}