import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import database from "../database/db.js";
import Stripe from "stripe";
import cloudinary from "cloudinary";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ================= PLACE ORDER =================
export const placeOrder = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.user.id;

  // ── Normalise shipping: Payment.jsx sends flat fields OR nested shippingInfo ──
  const body = req.body;

  // Support both field names: "orderedItems" (from Payment.jsx) or "orderItems" (legacy)
  const rawItems = body.orderedItems || body.orderItems || [];

  if (!rawItems || rawItems.length === 0) {
    return next(new ErrorHandler("No order items found.", 400));
  }

  // Normalise each item to the DB-insert format by querying product details from PostgreSQL DB
  const orderItems = [];
  let calculatedTotalPrice = 0;

  for (const item of rawItems) {
    const p = item.product || {};
    const productId = p.id || p._id || item.productId || item.product_id || null;
    const quantity = item.quantity || 1;

    let dbPrice = 0;
    let dbTitle = "Product";
    let dbImage = "";

    if (productId) {
      try {
        const prodRes = await database.query("SELECT * FROM products WHERE id = $1", [productId]);
        if (prodRes.rows.length > 0) {
          const prod = prodRes.rows[0];
          dbPrice = parseFloat(prod.price) || 0;
          dbTitle = prod.name || "Product";
          
          // Parse images
          let parsedImages = [];
          if (typeof prod.images === "string") {
            try {
              parsedImages = JSON.parse(prod.images);
            } catch (err) {}
          } else if (Array.isArray(prod.images)) {
            parsedImages = prod.images;
          }
          dbImage = (parsedImages && parsedImages[0]?.url) || prod.image_url || "";
        }
      } catch (err) {
        console.error("Error fetching product details:", err.message);
      }
    }

    // Fallbacks if not found in database or query failed
    const finalPriceVal = dbPrice || parseFloat(p.price) || parseFloat(item.price) || 0;
    const finalTitleVal = dbTitle !== "Product" ? dbTitle : (p.name || item.name || item.title || "Product");
    const finalImageVal = dbImage || p.image || (Array.isArray(p.images) && p.images[0]?.url) || item.image || "";

    calculatedTotalPrice += finalPriceVal * quantity;

    orderItems.push({
      productId,
      quantity,
      price: finalPriceVal,
      title: finalTitleVal,
      image: finalImageVal,
    });
  }

  // Normalise shipping info: flat fields (Payment.jsx) OR nested shippingInfo object
  const si = body.shippingInfo || {};
  const shipping = {
    full_name: body.full_name  || si.fullName  || si.full_name  || "",
    state:     body.state      || si.state      || "",
    city:      body.city       || si.city       || "",
    country:   body.country    || si.country    || "India",
    address:   body.address    || si.address    || "",
    pincode:   body.pincode    || si.pinCode    || si.pincode    || "",
    phone:     body.phone      || si.phoneNo    || si.phone      || "",
  };

  // Pricing calculations
  const calculatedTaxPrice = Number((calculatedTotalPrice * 0.18).toFixed(2));
  const calculatedDeliveryCharges = (calculatedTotalPrice > 999 || calculatedTotalPrice === 0) ? 0 : 99;
  const calculatedFinalPrice = Number((calculatedTotalPrice + calculatedTaxPrice + calculatedDeliveryCharges).toFixed(2));

  // Pricing fields - fall back to server calculations if client sends 0 or invalid values
  const clientTotalPrice    = parseFloat(body.totalPrice)    || parseFloat(body.finalPrice) || 0;
  const clientTaxPrice      = parseFloat(body.taxPrice)      || parseFloat(body.gst)        || 0;
  const clientShippingPrice = parseFloat(body.shippingPrice) || parseFloat(body.deliveryCharges) || 0;
  const clientFinalPrice    = parseFloat(body.finalPrice)    || clientTotalPrice;

  const totalPrice   = clientTotalPrice   || calculatedTotalPrice;
  const taxPrice     = clientTaxPrice     || calculatedTaxPrice;
  const shippingPrice= clientShippingPrice|| calculatedDeliveryCharges;
  const finalPrice   = clientFinalPrice   || calculatedFinalPrice;
  const paymentMode  = body.paymentMode  || "Prepaid";
  const paymentInfo  = body.paymentInfo  || null;

  try {
    await database.query("BEGIN");

    // 1. Create the order record
    const orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price, payment_mode, order_status, delivery_boy_name, delivery_boy_phone, delivery_boy_vehicle, delivery_otp)
       VALUES ($1, $2, $3, $4, $5, 'Processing', $6, $7, $8, $9) RETURNING *`,
      [
        buyerId,
        finalPrice || totalPrice,
        taxPrice,
        shippingPrice,
        paymentMode,
        null,
        null,
        null,
        Math.floor(100000 + Math.random() * 900000).toString(),
      ]
    );

    const orderId = orderResult.rows[0].id;

    // 2. Insert each order item
    for (const item of orderItems) {
      await database.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, image, title)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.productId, item.quantity, item.price, item.image, item.title]
      );
    }

    // 3. Insert shipping info
    await database.query(
      `INSERT INTO shipping_info (order_id, full_name, state, city, country, address, pincode, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        shipping.full_name,
        shipping.state,
        shipping.city,
        shipping.country,
        shipping.address,
        shipping.pincode,
        shipping.phone,
      ]
    );

    // 4. Insert payment record if provided
    if (paymentInfo && paymentInfo.id) {
      await database.query(
        `INSERT INTO payments (order_id, payment_id, status)
         VALUES ($1, $2, $3)`,
        [orderId, paymentInfo.id, paymentInfo.status || "paid"]
      );
    }

    await database.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId,
    });
  } catch (error) {
    await database.query("ROLLBACK");
    return next(new ErrorHandler(error.message, 500));
  }
});


// ================= GET MY ORDERS =================
export const getMyOrders = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.user.id;

  const result = await database.query(
    `SELECT o.*,
            json_agg(json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'title', oi.title,
              'price', oi.price,
              'quantity', oi.quantity,
              'image', oi.image
            )) AS order_items,
            row_to_json(s) AS shipping_info,
            json_build_object(
              'status', r.status,
              'action', r.action,
              'reason', r.reason,
              'refund_details', r.refund_details,
              'qc_report', r.qc_report,
              'created_at', r.created_at
            ) AS return_info
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN shipping_info s ON o.id = s.order_id
     LEFT JOIN order_returns r ON o.id = r.order_id
     WHERE o.buyer_id = $1
     GROUP BY o.id, s.id, r.id
     ORDER BY o.created_at DESC`,
    [buyerId]
  );

  // Flatten shipping info into the order object
  const myOrders = result.rows.map((order) => {
    const si = order.shipping_info || {};
    return {
      ...order,
      full_name: si.full_name,
      address: si.address,
      city: si.city,
      state: si.state,
      pincode: si.pincode,
      phone: si.phone,
      country: si.country,
    };
  });

  res.status(200).json({ success: true, myOrders });
});

// ================= GET ALL ORDERS (ADMIN) =================
export const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT o.*,
            u.name AS buyer_name,
            u.email AS buyer_email,
            json_agg(json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'title', oi.title,
              'price', oi.price,
              'quantity', oi.quantity,
              'image', oi.image
            )) AS order_items,
            row_to_json(s) AS shipping_info
     FROM orders o
     LEFT JOIN users u ON o.buyer_id = u.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN shipping_info s ON o.id = s.order_id
     GROUP BY o.id, u.id, s.id
     ORDER BY o.created_at DESC`
  );

  res.status(200).json({ success: true, orders: result.rows });
});

// ================= UPDATE ORDER STATUS (ADMIN) =================
export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { status, delivery_boy_name, delivery_boy_phone, delivery_boy_vehicle, delivery_boy_photo, otp } = req.body;

  const allowedStatuses = [
    "Processing", "Packed", "Order Packed", "Shipped", "Out for Delivery", "Delivered",
    "Cancelled", "Return Requested", "Returned", "Refunded",
    "Exchange Approved", "Exchange Out for Delivery", "Exchange Completed"
  ];

  if (!allowedStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid order status provided.", 400));
  }

  const orderCheck = await database.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (orderCheck.rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }
  const order = orderCheck.rows[0];

  // OTP check for prepaid delivery
  if ((status === "Delivered" || status === "Exchange Completed") && !order.payment_mode?.includes("COD") && order.delivery_otp) {
    if (!otp || otp !== order.delivery_otp) {
      return next(new ErrorHandler("Invalid delivery verification OTP.", 400));
    }
  }

  let query = "UPDATE orders SET order_status = $1";
  const params = [status, orderId];
  let paramIndex = 3;

  if (status === "Exchange Out for Delivery") {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    query += `, delivery_otp = $${paramIndex++}`;
    params.push(newOtp);
  }

  if (delivery_boy_name !== undefined) {
    query += `, delivery_boy_name = $${paramIndex++}`;
    params.push(delivery_boy_name);
  }
  if (delivery_boy_phone !== undefined) {
    query += `, delivery_boy_phone = $${paramIndex++}`;
    params.push(delivery_boy_phone);
  }
  if (delivery_boy_vehicle !== undefined) {
    query += `, delivery_boy_vehicle = $${paramIndex++}`;
    params.push(delivery_boy_vehicle);
  }
  if (delivery_boy_photo !== undefined) {
    query += `, delivery_boy_photo = $${paramIndex++}`;
    params.push(delivery_boy_photo);
  }

  query += ` WHERE id = $2 RETURNING *`;

  const updatedOrder = await database.query(query, params);

  const orderData = {
    ...updatedOrder.rows[0],
    _id: updatedOrder.rows[0].id,
  };

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}.`,
    order: orderData,
    updatedOrder: orderData,
  });
});

// ================= CREATE RETURN REQUEST (CUSTOMER) =================
export const createReturnRequest = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { action, reason, comments, items, pickup, media, refund_method, bank_details } = req.body;
  const buyerId = req.user.id;

  if (!action || !reason || !items || items.length === 0 || !pickup || !pickup.date || !pickup.slot) {
    return next(new ErrorHandler("Please provide all required fields for return.", 400));
  }

  // 1. Verify the order exists and belongs to the buyer
  const orderCheck = await database.query(
    "SELECT * FROM orders WHERE id = $1 AND buyer_id = $2",
    [orderId, buyerId]
  );
  if (orderCheck.rows.length === 0) {
    return next(new ErrorHandler("Order not found or access denied.", 404));
  }

  const order = orderCheck.rows[0];

  // 2. Check if the order is already delivered
  if (order.order_status !== "Delivered") {
    return next(new ErrorHandler("Only delivered orders can be returned.", 400));
  }

  // 3. Upload each base64 image to Cloudinary and get back real hosted URLs
  //    For exchange (no images), media will be empty - that's fine.
  const processedMedia = [];

  if (media && media.length > 0) {
    for (const mediaItem of media) {
      if (!mediaItem || typeof mediaItem !== "string") continue;

      // If it's a base64 data URL - upload to cloudinary
      if (mediaItem.startsWith("data:image") || mediaItem.startsWith("data:video")) {
        try {
          const uploadResult = await cloudinary.v2.uploader.upload(mediaItem, {
            folder: "return_proofs",
            resource_type: "auto",
            quality: "auto:good",
            fetch_format: "auto",
          });
          processedMedia.push(uploadResult.secure_url);
        } catch (uploadErr) {
          console.error("Cloudinary upload failed for return proof:", uploadErr.message);
          // Skip this file if upload fails
        }
      } else if (mediaItem.startsWith("http")) {
        // Already a valid URL - keep it
        processedMedia.push(mediaItem);
      }
    }
  }

  try {
    await database.query("BEGIN");

    // 4. Create return request entry — also store refund_method chosen by user
    const returnResult = await database.query(
      `INSERT INTO order_returns (order_id, buyer_id, action, reason, comments, items, pickup_date, pickup_slot, media, status, refund_method, bank_details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::jsonb, 'Pending', $10, $11::jsonb)
       RETURNING *`,
      [
        orderId,
        buyerId,
        action,
        reason,
        comments || null,
        JSON.stringify(items),
        pickup.date,
        pickup.slot,
        JSON.stringify(processedMedia),
        refund_method || null,
        bank_details ? JSON.stringify(bank_details) : null,
      ]
    );

    // 5. Update the order status to 'Return Requested'
    await database.query(
      "UPDATE orders SET order_status = 'Return Requested' WHERE id = $1",
      [orderId]
    );

    await database.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully.",
      returnRequest: returnResult.rows[0],
    });
  } catch (error) {
    await database.query("ROLLBACK");
    return next(new ErrorHandler(error.message, 500));
  }
});

// ================= FETCH ALL RETURN REQUESTS (ADMIN) =================
export const fetchAllReturnRequests = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(`
    SELECT r.*, 
           o.total_price AS order_total, 
           o.payment_mode,
           u.name AS buyer_name, 
           u.email AS buyer_email,
           s.full_name AS shipping_name,
           s.phone AS shipping_phone,
           s.address,
           s.city,
           s.state,
           s.pincode
    FROM order_returns r
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN users u ON r.buyer_id = u.id
    LEFT JOIN shipping_info s ON o.id = s.order_id
    ORDER BY r.created_at DESC
  `);
  res.status(200).json({
    success: true,
    message: "All return requests fetched.",
    returns: result.rows,
  });
});

// ================= UPDATE RETURN STATUS (ADMIN) =================
export const updateReturnStatus = catchAsyncErrors(async (req, res, next) => {
  const { returnId } = req.params;
  const { status, qc_report, refund_details } = req.body;

  if (!status) {
    return next(new ErrorHandler("Please provide return status.", 400));
  }

  const returnCheck = await database.query("SELECT * FROM order_returns WHERE id = $1", [returnId]);
  if (returnCheck.rows.length === 0) {
    return next(new ErrorHandler("Return request not found.", 404));
  }

  const returnRequest = returnCheck.rows[0];
  const orderId = returnRequest.order_id;

  try {
    await database.query("BEGIN");

    let finalStatus = status;
    let finalRefundDetails = refund_details;

    if (status === "Refund Processed" && returnRequest.action === "exchange") {
      // Set default co-pickup & delivery agent details on original order
      await database.query(
        `UPDATE orders 
         SET delivery_boy_name = $1, 
             delivery_boy_phone = $2, 
             delivery_boy_vehicle = $3 
         WHERE id = $4`,
        [
          "Ramesh Kumar (Exchange Agent)",
          "+91 9998887776",
          "Shadowfax Courier (Co-Pickup)",
          orderId
        ]
      );

      finalStatus = "Refund Processed";
      finalRefundDetails = {
        utr: `EXCH-${orderId.slice(-8).toUpperCase()}`,
        channel: "Balaji Mart Exchange Dispatch",
        method: "Product Replacement",
        timestamp: new Date().toISOString()
      };
    }

    // 1. Update return status and JSON columns in database
    const updatedReturn = await database.query(
      `UPDATE order_returns 
       SET status = $1, 
           qc_report = COALESCE($3, qc_report), 
           refund_details = COALESCE($4, refund_details) 
       WHERE id = $2 RETURNING *`,
      [finalStatus, returnId, qc_report ? JSON.stringify(qc_report) : null, finalRefundDetails ? JSON.stringify(finalRefundDetails) : null]
    );

    // 2. Update order status in orders table accordingly
    let newOrderStatus = null; // null means: do not change order_status
    let newOtp = null;
    if (finalStatus === "Approved") {
      newOrderStatus = returnRequest.action === "exchange" ? "Exchange Approved" : "Returned";
    } else if (finalStatus === "Product Picked Up") {
      // Product is physically picked up — keep order status the same, just track in returns table
      newOrderStatus = null;
    } else if (finalStatus === "Refund Processed") {
      if (returnRequest.action === "exchange") {
        newOrderStatus = "Exchange Out for Delivery";
        newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      } else {
        newOrderStatus = "Refunded";
      }
    } else if (finalStatus === "Rejected") {
      newOrderStatus = "Delivered";
    }

    if (newOrderStatus !== null) {
      if (newOtp) {
        await database.query(
          "UPDATE orders SET order_status = $1, delivery_otp = $2 WHERE id = $3",
          [newOrderStatus, newOtp, orderId]
        );
      } else {
        await database.query(
          "UPDATE orders SET order_status = $1 WHERE id = $2",
          [newOrderStatus, orderId]
        );
      }
    }

    await database.query("COMMIT");

    res.status(200).json({
      success: true,
      message: `Return status updated to ${status}.`,
      returnRequest: updatedReturn.rows[0],
    });
  } catch (error) {
    await database.query("ROLLBACK");
    return next(new ErrorHandler(error.message, 500));
  }
});

// ================= FETCH SINGLE ORDER =================
export const fetchSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const buyerId = req.user.id;

  const result = await database.query(
    `SELECT o.*,
            json_agg(json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'title', oi.title,
              'price', oi.price,
              'quantity', oi.quantity,
              'image', oi.image
            )) AS order_items,
            row_to_json(s) AS shipping_info
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN shipping_info s ON o.id = s.order_id
     WHERE o.id = $1 AND o.buyer_id = $2
     GROUP BY o.id, s.id`,
    [orderId, buyerId]
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  res.status(200).json({ success: true, order: result.rows[0] });
});

// ================= DELETE ORDER (ADMIN) =================
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  const check = await database.query("SELECT id FROM orders WHERE id = $1", [orderId]);
  if (check.rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  await database.query("DELETE FROM orders WHERE id = $1", [orderId]);

  res.status(200).json({ success: true, message: "Order deleted successfully." });
});

// ================= ROUTER NAME ALIASES =================
// Router imports these specific names — alias them here
export const placeNewOrder = placeOrder;
export const fetchMyOrders = getMyOrders;
export const fetchAllOrders = getAllOrders;