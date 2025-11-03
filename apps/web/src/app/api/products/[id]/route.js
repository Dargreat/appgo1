import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const product = await sql`
      SELECT 
        p.id, p.title, p.description, p.price, p.image_url, p.condition, 
        p.location, p.status, p.created_at, p.updated_at,
        c.name as category_name, c.color as category_color,
        u.id as seller_id, u.name as seller_name, u.rating as seller_rating, 
        u.total_sales, u.avatar_url as seller_avatar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ${id}
    `;

    if (product.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get additional product images
    const images = await sql`
      SELECT image_url, display_order
      FROM product_images
      WHERE product_id = ${id}
      ORDER BY display_order
    `;

    return Response.json({
      success: true,
      product: {
        ...product[0],
        images: images.map(img => img.image_url)
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, description, price, imageUrl, categoryId, condition, location, status } = await request.json();

    const updatedProduct = await sql`
      UPDATE products 
      SET 
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        price = COALESCE(${price}, price),
        image_url = COALESCE(${imageUrl}, image_url),
        category_id = COALESCE(${categoryId}, category_id),
        condition = COALESCE(${condition}, condition),
        location = COALESCE(${location}, location),
        status = COALESCE(${status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedProduct.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      product: updatedProduct[0]
    });

  } catch (error) {
    console.error('Update product error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const deletedProduct = await sql`
      UPDATE products 
      SET status = 'removed'
      WHERE id = ${id}
      RETURNING id
    `;

    if (deletedProduct.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Product removed successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}