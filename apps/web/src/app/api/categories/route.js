import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const categories = await sql`
      SELECT id, name, color, created_at
      FROM categories
      ORDER BY name
    `;

    return Response.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, color = '#3b82f6' } = await request.json();

    if (!name) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }

    const newCategory = await sql`
      INSERT INTO categories (name, color)
      VALUES (${name}, ${color})
      RETURNING *
    `;

    return Response.json({
      success: true,
      category: newCategory[0]
    });

  } catch (error) {
    console.error('Create category error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}