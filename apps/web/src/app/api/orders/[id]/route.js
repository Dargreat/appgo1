import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const order = await sql`
      SELECT 
        o.id, o.order_number, o.total_amount, o.status, o.order_date, 
        o.shipped_date, o.delivered_date, o.estimated_delivery,
        p.id as product_id, p.title as product_title, p.description as product_description,
        p.image_url as product_image, p.condition as product_condition,
        buyer.id as buyer_id, buyer.name as buyer_name, buyer.email as buyer_email,
        buyer.avatar_url as buyer_avatar, buyer.location as buyer_location,
        seller.id as seller_id, seller.name as seller_name, seller.email as seller_email,
        seller.avatar_url as seller_avatar, seller.location as seller_location
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.id = ${id}
    `;

    if (order.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      order: order[0]
    });

  } catch (error) {
    console.error('Get order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status) {
      return Response.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    let updateData = { status };
    
    // Set timestamps based on status
    if (status === 'shipped') {
      updateData.shipped_date = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_date = new Date();
    }

    const updatedOrder = await sql`
      UPDATE orders 
      SET 
        status = ${status},
        shipped_date = COALESCE(${updateData.shipped_date || null}, shipped_date),
        delivered_date = COALESCE(${updateData.delivered_date || null}, delivered_date)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedOrder.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      order: updatedOrder[0]
    });

  } catch (error) {
    console.error('Update order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}