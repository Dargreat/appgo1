import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const favorites = await sql`
      SELECT 
        f.id as favorite_id, f.created_at as favorited_at,
        p.id, p.title, p.description, p.price, p.image_url, p.condition, 
        p.location, p.status, p.created_at,
        c.name as category_name, c.color as category_color,
        u.name as seller_name, u.rating as seller_rating
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE f.user_id = ${userId} AND p.status = 'available'
      ORDER BY f.created_at DESC
    `;

    return Response.json({
      success: true,
      favorites
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
      return Response.json({ error: 'User ID and Product ID are required' }, { status: 400 });
    }

    // Check if already favorited
    const existing = await sql`
      SELECT id FROM favorites WHERE user_id = ${userId} AND product_id = ${productId}
    `;

    if (existing.length > 0) {
      return Response.json({ error: 'Product already in favorites' }, { status: 409 });
    }

    const newFavorite = await sql`
      INSERT INTO favorites (user_id, product_id)
      VALUES (${userId}, ${productId})
      RETURNING *
    `;

    return Response.json({
      success: true,
      favorite: newFavorite[0]
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return Response.json({ error: 'User ID and Product ID are required' }, { status: 400 });
    }

    const deleted = await sql`
      DELETE FROM favorites 
      WHERE user_id = ${userId} AND product_id = ${productId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return Response.json({ error: 'Favorite not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Favorite removed successfully'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}