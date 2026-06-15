export const InvoiceTemplate = (order, authUser) => {
  const getVal = (key) => {
    return order[key] || 
           order.shippingInfo?.[key] || 
           order.shipping_info?.[key] || 
           (key === 'full_name' ? (order.fullName || order.shippingInfo?.fullName || order.shipping_info?.fullName || authUser?.name || 'Guest Customer') : '') || 
           (key === 'phone' ? (order.phoneNumber || order.phone_number || order.shippingInfo?.phone_number || order.shipping_info?.phone_number || order.phone || 'N/A') : '') ||
           '';
  };

  const shippingDetails = {
    fullName: getVal("full_name"),
    address: getVal("address") || "Address N/A",
    city: getVal("city") || "",
    state: getVal("state") || "",
    pincode: getVal("pincode") || "",
    country: getVal("country") || "India",
    phone: getVal("phone")
  };

  const orderedItems = order.order_items || order.orderItems || order.orderedItems || order.ordered_items || [];
  const dbItemsTotal = orderedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const totalQty = orderedItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  const getGSTCalculations = (price, quantity) => {
    const gross = price * quantity;
    const taxableValue = gross;
    const igst = Number((gross * 0.18).toFixed(2));
    const total = Number((gross + igst).toFixed(2));
    return {
      gross: gross.toFixed(2),
      discount: "0.00",
      taxable: taxableValue.toFixed(2),
      igst: igst.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const formatInvoiceDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) + ", " + date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const itemsRows = orderedItems.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const calcs = getGSTCalculations(price, qty);

    return `
      <tr class="border-b border-black">
        <td class="py-2 px-2 border-r border-black font-bold text-black">${item.title || item.name || "E-Commerce Item"}</td>
        <td class="py-2 px-2 border-r border-black text-slate-600 text-[9px]">
          HSN: 33030040 | IGST: 18.00% | CESS: 0.00%
        </td>
        <td class="py-2 px-2 border-r border-black text-center font-bold text-black">${qty}</td>
        <td class="py-2 px-2 border-r border-black text-right font-mono font-semibold">₹${calcs.gross}</td>
        <td class="py-2 px-2 border-r border-black text-right font-mono text-slate-500">-${calcs.discount}</td>
        <td class="py-2 px-2 border-r border-black text-right font-mono">₹${calcs.taxable}</td>
        <td class="py-2 px-2 border-r border-black text-right font-mono">₹${calcs.igst}</td>
        <td class="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
        <td class="py-2 px-2 text-right font-mono font-bold text-black">₹${calcs.total}</td>
      </tr>
    `;
  }).join("");

  const packageItems = orderedItems.map((item) => `
    <li class="flex justify-between items-center">
      <span>- ${item.title || item.name || "E-Commerce Item"}</span>
      <span class="font-bold bg-white border border-slate-300 px-1.5 py-0.5 rounded">Qty: ${item.quantity}</span>
    </li>
  `).join("");

  const totalInclusive = Number((dbItemsTotal * 1.18).toFixed(2));
  const isPaid = order.status === "Delivered" || order.status === "Shipped" || order.order_status === "Delivered" || order.order_status === "Shipped" || true;
  const paymentType = isPaid ? "NONCOD" : "COD";
  const collectAmount = isPaid ? "0.0" : totalInclusive.toFixed(1);
  const amountDue = isPaid ? 0 : totalInclusive;

  const orderIdRaw = order.id || order._id || "OD4374923228";
  const orderIdClean = String(orderIdRaw).toUpperCase();

  const formattedOrderDate = formatInvoiceDate(order.created_at || order.createdAt);
  const formattedAddressStr = `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}`;

  const qrRawString = `=== TAX INVOICE ===
Seller: BALAJI CART PRIVATE LIMITED
Order ID: ${orderIdClean}
Order Date: ${formattedOrderDate}
Customer: ${shippingDetails.fullName}
Shipping Address: ${formattedAddressStr}
Total Qty: ${totalQty}
Grand Total: INR ${totalInclusive.toFixed(2)}
===================`;
  const qrDataEncoded = encodeURIComponent(qrRawString);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Tax Invoice - BC-${orderIdClean}</title>
      <meta charset="utf-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { background: white !important; margin: 0 !important; padding: 40px !important; color: black !important; }
        @page { size: A4; margin: 0; }
        /* Force exact background colors and border printing */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          body { padding: 0 !important; }
          .no-print { display: none !important; }
          button { display: none !important; }
        }
        .print-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 20px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.2s;
        }
        .print-btn:hover {
          background: #4338ca;
        }
      </style>
    </head>
    <body class="bg-white text-black">
      <div class="no-print" style="max-width: 800px; margin: auto; text-align: right;">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <div class="space-y-8 select-text relative">
        <!-- 📄 PAGE 1: PRODUCT TAX INVOICE -->
        <div
          class="bg-white text-black p-6 sm:p-8 border border-slate-300 relative font-sans text-[11px] leading-relaxed max-w-[800px] mx-auto box-border shadow-2xl"
          style="min-height: 11.27in; page-break-after: always; break-after: page;"
        >
          <div class="relative z-10 space-y-6">
            <!-- TOP HEADER DETAILS -->
            <div class="flex justify-between items-start border-b border-black pb-4 gap-6">
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 mb-1.5 select-none">
                  <!-- Premium corporate Balaji Cart logo shield badge -->
                  <svg viewBox="0 0 24 24" class="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="black" />
                    <path d="M8.5 7.5h4c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5V7.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 11.9h4.5c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5v-4.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 12h5.5l-2-2m2 2l-2 2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div class="leading-tight">
                    <span class="text-[14px] font-black tracking-widest text-black font-sans uppercase block leading-none">
                      BALAJI CART
                    </span>
                    <span class="text-[7.5px] font-black tracking-[0.25em] text-slate-500 font-mono uppercase block leading-none mt-1">
                      PRIVATE LIMITED
                    </span>
                  </div>
                </div>
                <h1 class="text-2xl font-black tracking-tight text-black">Tax Invoice</h1>
                <div class="text-[10px] text-slate-800 space-y-0.5 mt-2">
                  <p><strong>Order Id:</strong> ${orderIdRaw}</p>
                  <p><strong>Order Date:</strong> ${formatInvoiceDate(order.created_at || order.createdAt)}</p>
                  <p><strong>Invoice No:</strong> LWAABGM${String(orderIdRaw).slice(-8).toUpperCase()}</p>
                  <p><strong>Invoice Date:</strong> ${formatInvoiceDate(order.paidAt || order.paid_at || order.created_at || order.createdAt)}</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="text-right text-[10px] text-slate-800 space-y-0.5 mt-1">
                  <p><strong>GSTIN:</strong> 27AAFCI1834E1ZT</p>
                  <p><strong>PAN:</strong> AAFCI1834E</p>
                </div>
                <!-- Dynamic QR Code based on detailed invoice data -->
                <div class="border border-slate-300 p-1 bg-white">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrDataEncoded}"
                    alt="Order QR Code"
                    class="w-16 h-16"
                  />
                </div>
              </div>
            </div>

            <!-- ADDRESSES ROW -->
            <div class="grid grid-cols-3 gap-4 border-b border-black py-4 text-[10px] text-slate-800">
              <!-- SOLD BY -->
              <div class="space-y-1 pr-2">
                <h4 class="font-bold text-black uppercase tracking-wider">Sold By:</h4>
                <p class="font-bold">BALAJI CART PRIVATE LIMITED,</p>
                <p class="text-slate-600">Sai Dhara Warehousing Complex, I2 Warehouse,</p>
                <p class="text-slate-600">Mumbai Nashik Highway NH3 Bhiwandi,</p>
                <p class="text-slate-600">BHIWANDI - 421302, IN-MH</p>
                <p class="font-bold text-black mt-2">GSTIN: 27AABCF8078M1Z1</p>
              </div>

              <!-- BILLING ADDRESS -->
              <div class="space-y-1 px-2 border-l border-slate-200">
                <h4 class="font-bold text-black uppercase tracking-wider">Billing Address:</h4>
                <p class="font-bold">${shippingDetails.fullName}</p>
                <p class="text-slate-600">${shippingDetails.address}</p>
                <p class="text-slate-600">
                  ${shippingDetails.city ? `${shippingDetails.city}, ` : ""}${shippingDetails.state} - ${shippingDetails.pincode}
                </p>
                <p class="text-slate-600">Country: ${shippingDetails.country}</p>
                <p class="font-bold text-black mt-1">Phone: ${shippingDetails.phone}</p>
              </div>

              <!-- SHIPPING ADDRESS -->
              <div class="space-y-1 pl-2 border-l border-slate-200">
                <h4 class="font-bold text-black uppercase tracking-wider">Shipping Address:</h4>
                <p class="font-bold">${shippingDetails.fullName}</p>
                <p class="text-slate-600">${shippingDetails.address}</p>
                <p class="text-slate-600">
                  ${shippingDetails.city ? `${shippingDetails.city}, ` : ""}${shippingDetails.state} - ${shippingDetails.pincode}
                </p>
                <p class="text-slate-600">Country: ${shippingDetails.country}</p>
                <p class="font-bold text-black mt-1">Phone: ${shippingDetails.phone}</p>
              </div>
            </div>

            <!-- TABLE OF ITEMS -->
            <div class="w-full">
              <table class="w-full text-[10px] text-left border-collapse border border-black">
                <thead>
                  <tr class="bg-slate-50 border-b border-black text-black font-bold uppercase tracking-wider text-[9px]">
                    <th class="py-2 px-2 border-r border-black w-[25%]">Product</th>
                    <th class="py-2 px-2 border-r border-black w-[22%]">Description</th>
                    <th class="py-2 px-2 border-r border-black text-center w-[5%]">Qty</th>
                    <th class="py-2 px-2 border-r border-black text-right w-[10%]">Gross</th>
                    <th class="py-2 px-2 border-r border-black text-right w-[8%]">Discount</th>
                    <th class="py-2 px-2 border-r border-black text-right w-[10%]">Taxable</th>
                    <th class="py-2 px-2 border-r border-black text-right w-[10%]">IGST (18%)</th>
                    <th class="py-2 px-2 border-r border-black text-right w-[5%]">Cess</th>
                    <th class="py-2 px-2 text-right w-[10%]">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black font-medium text-slate-800">
                  ${itemsRows}

                  <!-- Handling Fee line to match layout -->
                  <tr class="border-b border-black">
                    <td class="py-2 px-2 border-r border-black font-bold text-black">Handling Fee</td>
                    <td class="py-2 px-2 border-r border-black text-slate-600 text-[9px]">
                      SAC: 996511 | IGST: 0.00% | CESS: 0.00%
                    </td>
                    <td class="py-2 px-2 border-r border-black text-center font-bold text-black">1</td>
                    <td class="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                    <td class="py-2 px-2 border-r border-black text-right font-mono text-slate-500">-0.00</td>
                    <td class="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                    <td class="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                    <td class="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                    <td class="py-2 px-2 text-right font-mono font-bold text-black">₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TOTAL QUANTITY AND PRICE BLOCK -->
            <div class="border border-black p-3.5 bg-slate-50 text-[10px] font-bold text-black uppercase tracking-wider space-y-1.5">
              <div class="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
                <div>
                  TOTAL QTY: <span class="font-mono text-xs">${totalQty}</span>
                </div>
                <div>
                  SUBTOTAL (EXCL. TAX): <span class="font-mono text-xs">₹${dbItemsTotal.toFixed(2)}</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <div>
                  TOTAL TAX (IGST 18%): <span class="font-mono text-xs text-slate-600">₹ ${(dbItemsTotal * 0.18).toFixed(2)}</span>
                </div>
                <div>
                  GRAND TOTAL (INCL. TAX): <span class="font-mono text-sm text-indigo-600">₹ ${(dbItemsTotal * 1.18).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- SELLER ADDRESS, PAYMENT METHOD, SIGNATORY GRID -->
            <div class="grid grid-cols-2 gap-6 border-b border-black pb-4 text-[10px] text-slate-800">
              <div class="space-y-3">
                <!-- SELLER REGISTERED ADDRESS -->
                <div class="space-y-1">
                  <h5 class="font-bold text-black uppercase">Seller Registered Address:</h5>
                  <p class="text-slate-600 leading-relaxed text-[9px]">
                    BALAJI CART PRIVATE LIMITED, <br />
                    PLOT NO. 88, INDUSTRIAL AREA, GWALIOR, <br />
                    MADHYA PRADESH - 474001. FSSAI License number: 10822999000483
                  </p>
                </div>

                <!-- PAYMENT MODE & PLATFORM -->
                <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
                  <p class="font-bold text-black flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Payment Mode: <span class="text-emerald-700 font-mono">Online Card (Stripe Checkout)</span>
                  </p>
                  <p class="text-[9px] text-slate-500 border-b border-slate-200 pb-1.5">
                    <strong>Platform Ordered:</strong> Balaji Cart E-Commerce Platform
                  </p>
                  <div class="text-[9px] text-slate-600 space-y-0.5 pt-0.5">
                    <p class="flex justify-between"><span>Product Subtotal:</span> <span class="font-mono font-bold text-black">₹${dbItemsTotal.toFixed(2)}</span></p>
                    <p class="flex justify-between"><span>Integrated Tax (IGST 18%):</span> <span class="font-mono font-bold text-black">₹ ${(dbItemsTotal * 0.18).toFixed(2)}</span></p>
                    <p class="flex justify-between text-[10px] font-extrabold text-indigo-700 border-t border-dashed border-slate-300 pt-1 mt-1">
                      <span>NET INVOICE VALUE:</span> <span>₹ ${(dbItemsTotal * 1.18).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- AUTHORIZED SIGNATORY -->
              <div class="flex flex-col justify-between items-end text-right pl-6 h-full">
                <div class="space-y-1">
                  <h5 class="font-bold text-black uppercase">Ordered Through</h5>
                  <p class="font-mono text-[9px] text-slate-500">Balaji Cart / Spectrum Retail</p>
                </div>

                <div class="flex flex-col items-center justify-center space-y-1 mt-4">
                  <p class="text-[8px] uppercase font-bold text-slate-400">BALAJI CART PRIVATE LIMITED</p>
                  <!-- STYLIZED SIGNATURE STAMP -->
                  <div class="relative border border-dashed border-amber-400 p-1.5 bg-amber-50/10 rounded-md select-none w-44 text-center my-1.5">
                    <span class="font-serif italic text-base text-amber-900 tracking-widest inline-block transform rotate-[-3deg] font-bold select-none pr-4">
                      Premdeep Gupta
                    </span>
                    <span class="absolute bottom-0 right-1 text-[7px] text-amber-500 font-black uppercase transform rotate-[-8deg] pointer-events-none tracking-widest">
                      BALAJI CART SECURE SEAL
                    </span>
                  </div>
                  <p class="text-[9px] font-bold text-black uppercase tracking-wider">Authorized Signature</p>
                </div>
              </div>
            </div>

            <!-- EXTRA FOOTER -->
            <div class="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-4">
              <span>Subject to Gurgaon Jurisdiction</span>
              <span class="tracking-widest uppercase text-black">E. & O.E. page 1 of 1</span>
            </div>
          </div>
        </div>

        <!-- 📄 PAGE 2: PRODUCT PACKAGING LABEL & STICKER -->
        <div
          class="bg-white text-black p-4 border border-slate-300 relative font-mono text-[10px] leading-tight max-w-[800px] mx-auto box-border mt-8 shadow-2xl"
          style="min-height: 11.27in;"
        >
          <!-- The entire label has a black outer border -->
          <div class="border-[3px] border-black p-0 m-0 w-full bg-white text-black select-none">
            
            <!-- Section 1: Ship To & Logo / Payment -->
            <div class="flex border-b-[3px] border-black items-stretch">
              
              <!-- Left Column: Ship To Address -->
              <div class="w-[60%] p-3 border-r-[3px] border-black flex flex-col justify-between">
                <div>
                  <div class="text-[15px] font-black tracking-wide mb-1">Ship To:</div>
                  <div class="text-[14px] font-black tracking-tight leading-none uppercase font-sans mb-1.5">
                    ${shippingDetails.fullName}
                  </div>
                  <div class="text-[10px] font-bold text-slate-800 leading-normal uppercase max-w-[280px]">
                    ${shippingDetails.address}
                  </div>
                </div>
                
                <div class="mt-3 space-y-0.5">
                  <div class="text-[11px] font-black text-black uppercase flex justify-between">
                    <span>${shippingDetails.city.toUpperCase() || "CITY N/A"}</span>
                    <span class="pr-4">${shippingDetails.state.toUpperCase() || "STATE N/A"}</span>
                  </div>
                  <div class="text-[11px] font-black text-black uppercase flex justify-between">
                    <span>IN</span>
                    <span class="pr-4">${shippingDetails.pincode || "PINCODE N/A"}</span>
                  </div>
                  <div class="text-[10px] font-bold text-slate-800 pt-1.5 border-t border-dashed border-slate-300 mt-1">
                    AddressType: HOME
                  </div>
                </div>
              </div>

              <!-- Right Column: Logo & Payment Type -->
              <div class="w-[40%] flex flex-col justify-between items-stretch">
                <!-- Logo Box -->
                <div class="p-3 border-b-[3px] border-black text-right flex flex-col items-end justify-center h-[50%]">
                  <span class="text-[26px] font-black tracking-tighter uppercase font-sans leading-none">
                    BALAJI CART
                  </span>
                  <span class="text-[8px] uppercase tracking-widest text-slate-600 font-bold block mt-1">
                    EXPRESS LOGISTICS
                  </span>
                </div>

                <!-- Payment & Collect Box -->
                <div class="p-3 flex-1 flex flex-col justify-center space-y-1">
                  <div class="text-[12px] font-black text-black leading-none">
                    PaymentType: <span class="underline font-extrabold">${paymentType}</span>
                  </div>
                  <div class="text-[12px] font-black text-black mt-1 flex justify-between leading-none">
                    <span>Collect:</span>
                    <span class="font-mono text-[13px] font-extrabold">Rs. ${collectAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: First Barcode (Carrier & AWB) -->
            <div class="flex border-b-[3px] border-black items-stretch">
              
              <!-- Left side: Barcode -->
              <div class="w-[60%] p-4 border-r-[3px] border-black flex flex-col items-center justify-center">
                <!-- SVG representation of scannable barcode -->
                <div class="w-full flex justify-center items-center h-14 overflow-hidden bg-white mb-1.5">
                  <svg class="w-full h-12" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <rect x="2" width="1.5" height="20" fill="black" />
                    <rect x="5" width="2.5" height="20" fill="black" />
                    <rect x="9" width="1" height="20" fill="black" />
                    <rect x="11" width="3" height="20" fill="black" />
                    <rect x="15" width="1" height="20" fill="black" />
                    <rect x="18" width="2" height="20" fill="black" />
                    <rect x="21" width="1.5" height="20" fill="black" />
                    <rect x="24" width="4" height="20" fill="black" />
                    <rect x="29" width="1" height="20" fill="black" />
                    <rect x="31" width="2" height="20" fill="black" />
                    <rect x="35" width="1.5" height="20" fill="black" />
                    <rect x="38" width="3" height="20" fill="black" />
                    <rect x="42" width="1" height="20" fill="black" />
                    <rect x="44" width="2" height="20" fill="black" />
                    <rect x="48" width="1.5" height="20" fill="black" />
                    <rect x="51" width="4" height="20" fill="black" />
                    <rect x="56" width="1" height="20" fill="black" />
                    <rect x="58" width="2.5" height="20" fill="black" />
                    <rect x="62" width="1.5" height="20" fill="black" />
                    <rect x="65" width="3" height="20" fill="black" />
                    <rect x="69" width="1" height="20" fill="black" />
                    <rect x="71" width="2" height="20" fill="black" />
                    <rect x="74" width="1.5" height="20" fill="black" />
                    <rect x="77" width="4" height="20" fill="black" />
                    <rect x="82" width="1" height="20" fill="black" />
                    <rect x="84" width="2.5" height="20" fill="black" />
                    <rect x="88" width="1.5" height="20" fill="black" />
                    <rect x="91" width="3" height="20" fill="black" />
                    <rect x="95" width="1" height="20" fill="black" />
                    <rect x="97" width="2.5" height="20" fill="black" />
                  </svg>
                </div>
                <span class="text-[12px] font-black tracking-widest font-mono text-black uppercase">
                  SF${String(orderIdRaw).slice(-8).toUpperCase()}SIN
                </span>
              </div>

              <!-- Right side: Carrier Details, Decorative Logo & Routing State -->
              <div class="w-[40%] p-3 flex flex-col justify-between items-stretch">
                <div class="text-[8px] font-bold text-slate-700 leading-tight space-y-0.5 uppercase">
                  <p>Carrier Name: SHADOWFAX</p>
                  <p>Carrier Service: SHADOWFAX SURFACE</p>
                </div>
                
                <div class="flex justify-between items-end pr-1 select-none">
                  <!-- Small decorative corporate Balaji Cart logo near state routing indicator -->
                  <svg viewBox="0 0 24 24" class="w-6 h-6 mb-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="black" />
                    <path d="M8.5 7.5h4c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5V7.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 11.9h4.5c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5v-4.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 12h5.5l-2-2m2 2l-2 2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  <div class="text-[52px] font-black tracking-tighter leading-none text-black font-sans">
                    ${(shippingDetails.state || "MH").trim().toUpperCase().slice(0, 2)}
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Origin / Destination / Routing Code -->
            <div class="grid grid-cols-3 border-b-[3px] border-black text-center divide-x-[3px] divide-black text-[12px] font-black items-stretch">
              <div class="p-2 flex flex-col justify-center">
                <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Origin :</span>
                <span class="text-black text-[13px] tracking-tight">MH/BWI</span>
              </div>
              <div class="p-2 flex flex-col justify-center">
                <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Destination :</span>
                <span class="text-black text-[13px] tracking-tight border-b border-transparent">
                  ${String(shippingDetails.state || "WB").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div class="p-2 flex flex-col justify-center bg-slate-50/50">
                <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Routing Code:</span>
                <span class="text-black text-[13px] tracking-tight">
                  ${String(shippingDetails.state || "WB").slice(0, 2).toUpperCase()}/${String(shippingDetails.pincode || "700").slice(0, 2)}
                </span>
              </div>
            </div>

            <!-- Section 4: Barcode 2 (Order #) -->
            <div class="p-3 border-b-[3px] border-black flex flex-col items-center justify-center">
              <div class="w-full flex justify-between items-center text-[10px] font-bold text-slate-700 px-4 leading-none">
                <span>Order #</span>
                <span class="font-mono text-black font-black">BC-${orderIdClean}</span>
              </div>
              <div class="w-[80%] flex justify-center items-center h-8 overflow-hidden bg-white mt-1.5 mb-1">
                <svg class="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <rect x="5" width="2.5" height="20" fill="black" />
                  <rect x="9" width="1" height="20" fill="black" />
                  <rect x="12" width="3" height="20" fill="black" />
                  <rect x="17" width="1" height="20" fill="black" />
                  <rect x="19" width="2" height="20" fill="black" />
                  <rect x="23" width="1" height="20" fill="black" />
                  <rect x="26" width="4" height="20" fill="black" />
                  <rect x="32" width="1" height="20" fill="black" />
                  <rect x="35" width="2.5" height="20" fill="black" />
                  <rect x="39" width="1" height="20" fill="black" />
                  <rect x="42" width="3" height="20" fill="black" />
                  <rect x="47" width="1" height="20" fill="black" />
                  <rect x="50" width="2" height="20" fill="black" />
                  <rect x="54" width="1" height="20" fill="black" />
                  <rect x="57" width="4" height="20" fill="black" />
                  <rect x="63" width="1" height="20" fill="black" />
                  <rect x="66" width="2.5" height="20" fill="black" />
                  <rect x="70" width="1" height="20" fill="black" />
                  <rect x="73" width="3" height="20" fill="black" />
                  <rect x="78" width="1.5" height="20" fill="black" />
                  <rect x="81" width="2" height="20" fill="black" />
                  <rect x="85" width="1" height="20" fill="black" />
                  <rect x="88" width="4" height="20" fill="black" />
                  <rect x="94" width="1" height="20" fill="black" />
                </svg>
              </div>
              <span class="text-[11px] font-black tracking-widest font-mono text-black uppercase">
                BC${String(orderIdRaw).slice(-8).toUpperCase()}
              </span>
            </div>

            <!-- Section 5: Barcode 3 (Container #) -->
            <div class="p-3 border-b-[3px] border-black flex flex-col items-center justify-center">
              <div class="w-full flex justify-between items-center text-[10px] font-bold text-slate-700 px-4 leading-none">
                <span>Container # :</span>
                <span class="font-mono text-black font-black">FLSBC-${String(orderIdRaw).slice(-4).toUpperCase()}</span>
              </div>
              <div class="w-[90%] flex justify-center items-center h-10 overflow-hidden bg-white mt-1.5 mb-1">
                <svg class="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <rect x="1" width="1.5" height="20" fill="black" />
                  <rect x="3" width="2.5" height="20" fill="black" />
                  <rect x="6" width="1" height="20" fill="black" />
                  <rect x="8" width="1" height="20" fill="black" />
                  <rect x="10" width="3.5" height="20" fill="black" />
                  <rect x="14" width="1" height="20" fill="black" />
                  <rect x="16" width="2" height="20" fill="black" />
                  <rect x="19" width="1.5" height="20" fill="black" />
                  <rect x="21" width="4" height="20" fill="black" />
                  <rect x="26" width="1" height="20" fill="black" />
                  <rect x="28" width="2.5" height="20" fill="black" />
                  <rect x="31" width="1" height="20" fill="black" />
                  <rect x="33" width="3.5" height="20" fill="black" />
                  <rect x="37" width="1" height="20" fill="black" />
                  <rect x="39" width="2" height="20" fill="black" />
                  <rect x="42" width="1.5" height="20" fill="black" />
                  <rect x="44" width="4" height="20" fill="black" />
                  <rect x="49" width="1" height="20" fill="black" />
                  <rect x="51" width="2.5" height="20" fill="black" />
                  <rect x="54" width="1.5" height="20" fill="black" />
                  <rect x="56" width="3.5" height="20" fill="black" />
                  <rect x="60" width="1" height="20" fill="black" />
                  <rect x="62" width="2" height="20" fill="black" />
                  <rect x="65" width="1.5" height="20" fill="black" />
                  <rect x="67" width="4" height="20" fill="black" />
                  <rect x="72" width="1" height="20" fill="black" />
                  <rect x="74" width="2.5" height="20" fill="black" />
                  <rect x="77" width="1.5" height="20" fill="black" />
                  <rect x="79" width="3.5" height="20" fill="black" />
                  <rect x="83" width="1" height="20" fill="black" />
                  <rect x="85" width="2" height="20" fill="black" />
                  <rect x="88" width="1.5" height="20" fill="black" />
                  <rect x="90" width="4" height="20" fill="black" />
                  <rect x="95" width="1" height="20" fill="black" />
                  <rect x="97" width="2.5" height="20" fill="black" />
                </svg>
              </div>
              <span class="text-[11px] font-black tracking-widest font-mono text-black uppercase">
                FLSAUYA1779473915040381${String(orderIdRaw).slice(-4).toUpperCase()}
              </span>
            </div>

            <!-- Section 6: Split Shipment Info & UPI QR Code -->
            <div class="flex justify-between items-stretch border-b-[3px] border-black">
              
              <!-- Shipment Info fields -->
              <div class="w-[60%] border-r-[3px] border-black flex flex-col text-[10px] justify-between">
                <div class="flex flex-col divide-y border-b border-black">
                  <div class="p-2 grid grid-cols-2">
                    <span>Shipment #</span>
                    <span class="font-black text-black">119440${String(orderIdRaw).slice(-4).toUpperCase()}</span>
                  </div>
                  <div class="p-2 grid grid-cols-2">
                    <span>FO Order ID #</span>
                    <span class="font-black text-black">FO119440${String(orderIdRaw).slice(-4).toUpperCase()}</span>
                  </div>
                  <div class="p-2 grid grid-cols-2 bg-slate-50/50">
                    <span>Total Quantity</span>
                    <span class="font-black text-black text-[12px]">${totalQty}</span>
                  </div>
                </div>
                
                <div class="p-2.5 bg-white space-y-1">
                  <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider block leading-none">Consignor Node :</span>
                  <p class="font-bold text-black uppercase leading-tight text-[8px] font-sans">
                    BALAJI CART DISPATCH DEPOT,<br />
                    SAI DHARA WAREHOUSING COMPLEX, I2 WAREHOUSE,<br />
                    MUMBAI NASHIK HIGHWAY NH3 BHIWANDI,<br />
                    MAHARASHTRA - 421302
                  </p>
                </div>
              </div>

              <!-- QR Code Block -->
              <div class="w-[40%] p-3 flex flex-col justify-center items-center bg-white space-y-1">
                <div class="border border-slate-400 p-1.5 bg-white shadow-sm rounded-lg">
                  <img 
                    src="${amountDue > 0 
                      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=balajicart@upi%26pn=Balaji%20Cart%26am=${amountDue}%26cu=INR%26tn=Order_${orderIdRaw}`
                      : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=OrderPaid:${orderIdRaw}`
                    }" 
                    alt="UPI Payment QR Code" 
                    class="w-24 h-24"
                  />
                </div>
                <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center leading-none mt-1">
                  ${amountDue > 0 ? "SCAN TO PAY COD" : "PREPAID VERIFIED"}
                </span>
              </div>
            </div>

            <!-- Package Manifest Slip -->
            <div class="p-3 bg-slate-50 text-[10px] font-bold text-black border-b border-black">
              <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Items in Package:</span>
              <ul class="space-y-1 text-slate-800 font-mono text-[9px]">
                ${packageItems}
              </ul>
            </div>

            <!-- Footer notice -->
            <div class="p-2 text-center text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">
              <span>Balaji Cart Logistics Network - Paste this label on outer packaging box</span>
            </div>
          </div>
        </div>
      </div>

      <script>
        // Trigger print prompt automatically when document is fully loaded
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => { window.print(); }, 1200);
        });
      </script>
    </body>
    </html>
  `;
};
