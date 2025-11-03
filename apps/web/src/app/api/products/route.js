import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const condition = searchParams.get('condition');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');

    let whereConditions = [`status = 'available'`];
    let params = [];
    let paramIndex = 1;

    if (categoryId) {
      whereConditions.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(LOWER(title) LIKE LOWER($${paramIndex}) OR LOWER(description) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (condition) {
      whereConditions.push(`condition = $${paramIndex}`);
      params.push(condition);
      paramIndex++;
    }

    if (minPrice) {
      whereConditions.push(`price >= $${paramIndex}`);
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      whereConditions.push(`price <= $${paramIndex}`);
      params.push(maxPrice);
      paramIndex++;
    }

    if (location) {
      whereConditions.push(`LOWER(location) LIKE LOWER($${paramIndex})`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        p.id, p.title, p.description, p.price, p.image_url, p.condition, 
        p.location, p.created_at,
        c.name as category_name, c.color as category_color,
        u.name as seller_name, u.rating as seller_rating
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const products = await sql(query, params);

    return Response.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Get products error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, description, price, imageUrl, categoryId, sellerId, condition = 'new', location } = await request.json();

    if (!title || !price || !sellerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProduct = await sql`
      INSERT INTO products (title, description, price, image_url, category_id, seller_id, condition, location)
      VALUES (${title}, ${description}, ${price}, ${imageUrl}, ${categoryId}, ${sellerId}, ${condition}, ${location})
      RETURNING *
    `;

    return Response.json({
      success: true,
      product: newProduct[0]
    });

  } catch (error) {
    console.error('Create product error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}