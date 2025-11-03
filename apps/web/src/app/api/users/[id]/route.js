import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const user = await sql`
      SELECT id, name, email, user_type, avatar_url, rating, total_sales, total_purchases, location, created_at
      FROM users
      WHERE id = ${id}
    `;

    if (user.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: user[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, email, avatarUrl, location, password } = await request.json();

    let updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (avatarUrl) updateFields.avatar_url = avatarUrl;
    if (location) updateFields.location = location;

    // Handle password update
    if (password) {
      updateFields.password_hash = await argon2.hash(password);
    }

    if (Object.keys(updateFields).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await sql`
      UPDATE users 
      SET 
        name = COALESCE(${updateFields.name || null}, name),
        email = COALESCE(${updateFields.email || null}, email),
        avatar_url = COALESCE(${updateFields.avatar_url || null}, avatar_url),
        location = COALESCE(${updateFields.location || null}, location),
        password_hash = COALESCE(${updateFields.password_hash || null}, password_hash),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, email, user_type, avatar_url, rating, total_sales, total_purchases, location, updated_at
    `;

    if (updatedUser.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}