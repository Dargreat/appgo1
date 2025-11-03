import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'buyer' or 'seller'

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    let whereClause = '';
    if (type === 'buyer') {
      whereClause = 'WHERE o.buyer_id = $1';
    } else if (type === 'seller') {
      whereClause = 'WHERE o.seller_id = $1';
    } else {
      whereClause = 'WHERE (o.buyer_id = $1 OR o.seller_id = $1)';
    }

    const orders = await sql(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.status, o.order_date, 
        o.shipped_date, o.delivered_date, o.estimated_delivery,
        p.id as product_id, p.title as product_title, p.image_url as product_image,
        buyer.id as buyer_id, buyer.name as buyer_name, buyer.avatar_url as buyer_avatar,
        seller.id as seller_id, seller.name as seller_name, seller.avatar_url as seller_avatar
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      ${whereClause}
      ORDER BY o.order_date DESC
    `, [userId]);

    return Response.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { buyerId, sellerId, productId, totalAmount } = await request.json();

    if (!buyerId || !sellerId || !productId || !totalAmount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate order number
    const orderNumber = 'ORD-' + Date.now();

    // Set estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const [newOrder, updatedProduct] = await sql.transaction([
      sql`
        INSERT INTO orders (order_number, buyer_id, seller_id, product_id, total_amount, estimated_delivery)
        VALUES (${orderNumber}, ${buyerId}, ${sellerId}, ${productId}, ${totalAmount}, ${estimatedDelivery})
        RETURNING *
      `,
      sql`
        UPDATE products 
        SET status = 'sold'
        WHERE id = ${productId}
        RETURNING id
      `
    ]);

    return Response.json({
      success: true,
      order: newOrder[0]
    });

  } catch (error) {
    console.error('Create order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}