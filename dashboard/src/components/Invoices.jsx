import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  FileText, Search, Printer, Download, Clock, CheckCircle,
  XCircle, Receipt, TrendingUp, Landmark, ShieldCheck, Mail, Phone, MapPin, Settings
} from "lucide-react";
import { fetchAllOrders } from "../store/slices/orderSlice";
import { toggleComponent } from "../store/slices/extraSlice";

const Invoices = () => {
  const dispatch = useDispatch();
  const { orders = [], loading } = useSelector((state) => state.order || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  // Set default selected order once loaded
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0]._id || orders[0].id);
    }
  }, [orders, selectedOrderId]);

  // Dynamic filter indices
  const filteredInvoices = useMemo(() => {
    return orders.filter((order) => {
      const orderIdString = String(order._id || order.id || "").toLowerCase();
      const customerName = String(
        order.shippingInfo?.full_name || order.shippingInfo?.fullName ||
        order.shipping_info?.full_name || order.shipping_info?.fullName || ""
      ).toLowerCase();
      const orderStatus = order.status || order.order_status || "Processing";

      const matchesSearch = orderIdString.includes(searchTerm.toLowerCase()) ||
        customerName.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Get active selected invoice detail
  const activeInvoice = useMemo(() => {
    return orders.find(o => (o._id || o.id) === selectedOrderId) || filteredInvoices[0] || null;
  }, [orders, selectedOrderId, filteredInvoices]);

  // Invoice calculations
  const invoiceCalculations = useMemo(() => {
    if (!activeInvoice) return { subtotal: 0, tax: 0, total: 0 };
    const total = Number(activeInvoice.totalAmount || activeInvoice.total_amount || activeInvoice.total_price || 0);
    const tax = Number((total * 0.18).toFixed(2));
    const subtotal = Number((total - tax).toFixed(2));
    return { subtotal, tax, total };
  }, [activeInvoice]);

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-area");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Invoice</title>
          ${Array.from(document.querySelectorAll("link, style")).map(el => el.outerHTML).join("\n")}
          <style>
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            @page { size: A4; margin: 0; }
            /* Force exact background colors and border printing */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="bg-white text-black p-0 m-0">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const invoiceStats = useMemo(() => {
    const stats = { paid: 0, pending: 0, cancelled: 0 };
    orders.forEach(o => {
      const status = o.status || o.order_status || "Processing";
      if (status === "Delivered" || status === "Shipped") stats.paid++;
      else if (status === "Cancelled") stats.cancelled++;
      else stats.pending++;
    });
    return stats;
  }, [orders]);

  const orderedItems = useMemo(() => {
    if (!activeInvoice) return [];
    return activeInvoice.orderedItems || activeInvoice.ordered_items || activeInvoice.order_items || activeInvoice.orderItems || [];
  }, [activeInvoice]);

  const totalAmount = useMemo(() => {
    return Number(activeInvoice?.totalAmount || activeInvoice?.total_amount || activeInvoice?.total_price || 0);
  }, [activeInvoice]);

  const dbItemsTotal = useMemo(() => {
    return orderedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  }, [orderedItems]);

  const scaleFactor = 1;

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

  const totalQty = useMemo(() => {
    return orderedItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }, [orderedItems]);

  const shippingDetails = useMemo(() => {
    if (!activeInvoice) return {
      fullName: "Guest Customer",
      address: "Address N/A",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phone: "N/A"
    };

    const getVal = (key1, key2) => {
      return activeInvoice.shippingInfo?.[key1] ||
        activeInvoice.shippingInfo?.[key2] ||
        activeInvoice.shipping_info?.[key1] ||
        activeInvoice.shipping_info?.[key2] || "";
    };

    return {
      fullName: getVal("full_name", "fullName") || "Guest Customer",
      address: getVal("address", "address") || "Address N/A",
      city: getVal("city", "city"),
      state: getVal("state", "state"),
      pincode: getVal("pincode", "pincode"),
      country: getVal("country", "country") || "India",
      phone: getVal("phone", "phone_number") || getVal("phone_number", "phone_number") || "N/A"
    };
  }, [activeInvoice]);

  const invoiceSettings = useMemo(() => {
    const DEFAULT_SETTINGS = {
      companyName: "BALAJI CART PRIVATE LIMITED",
      gstin: "27AABCF8078M1Z1",
      pan: "AAFCI1834E",
      registeredAddress: "Sai Dhara Warehousing Complex, I2 Warehouse,\nMumbai Nashik Highway NH3 Bhiwandi,\nBHIWANDI - 421302, IN-MH",
      sellerRegisteredAddress: "BALAJI CART PRIVATE LIMITED,\nPLOT NO. 88, INDUSTRIAL AREA, GWALIOR,\nMADHYA PRADESH - 474001. FSSAI License number: 10822999000483",
      dispatchAddress: "BALAJI CART DISPATCH DEPOT,\nSAI DHARA WAREHOUSING COMPLEX, I2 WAREHOUSE,\nMUMBAI NASHIK HIGHWAY NH3 BHIWANDI,\nMAHARASHTRA - 421302",
      upiId: "balajicart@upi",
      authorizedSignatory: "Premdeep Gupta",
      subjectJurisdiction: "Gurgaon Jurisdiction",
      logoBase64: ""
    };

    const saved = localStorage.getItem("balaji_invoice_settings");
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return DEFAULT_SETTINGS;
  }, [activeInvoice]);

  const qrData = useMemo(() => {
    if (!activeInvoice) return "";
    const company = invoiceSettings.companyName;
    const orderId = activeInvoice.id || activeInvoice._id || "";
    const date = formatInvoiceDate(activeInvoice.createdAt || activeInvoice.created_at);
    const customer = shippingDetails.fullName;
    const address = `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}`;
    const totalInclusive = (dbItemsTotal * 1.18).toFixed(2);
    
    return encodeURIComponent(`=== TAX INVOICE ===
Seller: ${company}
Order ID: ${orderId}
Order Date: ${date}
Customer: ${customer}
Shipping Address: ${address}
Total Qty: ${totalQty}
Grand Total: INR ${totalInclusive}
===================`);
  }, [activeInvoice, shippingDetails, dbItemsTotal, totalQty, invoiceSettings]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen md:pl-[17rem] bg-[#090d16]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#090d16] font-sans text-slate-200 pb-20 transition-all duration-500 w-full antialiased p-[10px] pl-[10px] md:pl-[17rem] box-border relative overflow-x-hidden">

      {/* BACKGROUND VECTOR */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="flex-1 md:p-6 space-y-8 relative z-10 w-full box-border">
        <Header />

        {/* 🌌 HERO HEADER */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group w-full box-border">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>

          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-xl shadow-inner w-max">
              <Receipt size={11} className="text-indigo-400 animate-pulse" /> Financial Ledger Node
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Invoices Console<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Manage billing parameters, export PDF ledger streams, and review customer order valuations.
            </p>
          </div>

          {/* QUICK COUNTERS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-emerald-950/40 border border-emerald-800/30 px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Settled</p>
                <h4 className="text-white text-sm font-black mt-0.5">{invoiceStats.paid} Invoices</h4>
              </div>
            </div>
            <div className="bg-amber-950/40 border border-amber-800/30 px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Pending</p>
                <h4 className="text-white text-sm font-black mt-0.5">{invoiceStats.pending} Unpaid</h4>
              </div>
            </div>

            <button
              onClick={() => dispatch(toggleComponent("Invoice Settings"))}
              className="px-4 py-2.5 rounded-2xl bg-indigo-650/40 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-slate-200 hover:text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition duration-300 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Settings size={13} className="text-indigo-400 group-hover:text-white" />
              <span>Configure Invoice Details</span>
            </button>
          </div>
        </div>

        {/* 🛠️ MAIN SPLIT VIEW PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full box-border">

          {/* LEFT: INVOICES DIRECTORY (5 Columns) */}
          <div className="lg:col-span-5 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4 max-h-[750px] overflow-hidden">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText size={15} className="text-indigo-400" /> Billing Records
              </h3>

              {/* SEARCH INPUT */}
              <div className="relative flex items-center group w-full">
                <Search className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input
                  type="text"
                  placeholder="Search by ID or customer..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/60 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all placeholder:text-slate-500 text-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* FILTERS REGIMENT */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {["All", "Delivered", "Processing", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${statusFilter === status
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white"
                      }`}
                  >
                    {status === "Delivered" ? "Settled" : status}
                  </button>
                ))}
              </div>
            </div>

            {/* INVOICES LIST SCROLL */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const invoiceId = invoice._id || invoice.id;
                  const invoiceStatus = invoice.status || invoice.order_status || "Processing";
                  const orderDate = invoice.createdAt || invoice.created_at;
                  const isSelected = invoiceId === (activeInvoice?._id || activeInvoice?.id);

                  return (
                    <div
                      key={invoiceId}
                      onClick={() => setSelectedOrderId(invoiceId)}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group/card ${isSelected
                        ? "bg-indigo-600/10 border-indigo-500/80 shadow-md"
                        : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80"
                        }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-indigo-400">
                            #INV-{invoiceId.toString().slice(-6).toUpperCase()}
                          </p>
                          <h4 className="text-white text-xs font-black truncate max-w-[160px]">
                            {invoice.shippingInfo?.full_name || invoice.shippingInfo?.fullName || invoice.shipping_info?.full_name || invoice.shipping_info?.fullName || "Guest Customer"}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {orderDate ? new Date(orderDate).toLocaleDateString("en-IN") : "Date N/A"}
                          </span>
                        </div>

                        <div className="text-right space-y-1.5">
                          <p className="text-white font-black text-sm">
                            ₹{Number(invoice.totalAmount || invoice.total_amount || invoice.total_price || 0).toLocaleString("en-IN")}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-black text-[8px] uppercase tracking-wider ${invoiceStatus === "Delivered" ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" :
                            invoiceStatus === "Cancelled" ? "bg-rose-950/60 border-rose-800/50 text-rose-400" :
                              "bg-amber-950/60 border-amber-800/50 text-amber-400"
                            }`}>
                            {invoiceStatus === "Delivered" ? "Settled" : invoiceStatus === "Cancelled" ? "Cancelled" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Landmark className="text-slate-700" size={32} />
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider">No matching invoices found</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INVOICE DETAILS PREVIEW (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {activeInvoice ? (
              <>
                <div
                  id="invoice-print-area"
                  className="space-y-8 select-text relative"
                >
                  {/* 📄 PAGE 1: PRODUCT TAX INVOICE */}
                  <div
                    className="bg-white text-black p-6 sm:p-8 border border-slate-300 relative font-sans text-[11px] leading-relaxed max-w-[800px] mx-auto box-border shadow-2xl"
                    style={{ minHeight: "11.27in", pageBreakAfter: "always", breakAfter: "page" }}
                  >
                    <div className="relative z-10 space-y-6">
                      {/* TOP HEADER DETAILS */}
                      <div className="flex justify-between items-start border-b border-black pb-4 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 mb-1.5 select-none">
                            {invoiceSettings.logoBase64 ? (
                              <img src={invoiceSettings.logoBase64} alt="Brand Logo" className="w-8 h-8 rounded object-contain p-0.5 bg-white border border-slate-200" />
                            ) : (
                              /* Premium corporate Balaji Cart logo shield badge */
                              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="black" />
                                <path d="M8.5 7.5h4c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5V7.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8.5 11.9h4.5c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5v-4.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.5 12h5.5l-2-2m2 2l-2 2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            <div className="leading-tight">
                              <span className="text-[14px] font-black tracking-widest text-black font-sans uppercase block leading-none">
                                {invoiceSettings.companyName.split(" ").slice(0, 2).join(" ")}
                              </span>
                              <span className="text-[7.5px] font-black tracking-[0.25em] text-slate-500 font-mono uppercase block leading-none mt-1">
                                {invoiceSettings.companyName.split(" ").slice(2).join(" ") || "PRIVATE LIMITED"}
                              </span>
                            </div>
                          </div>
                          <h1 className="text-2xl font-black tracking-tight text-black">Tax Invoice</h1>
                          <div className="text-[10px] text-slate-800 space-y-0.5 mt-2">
                            <p><strong>Order Id:</strong> {activeInvoice.id || activeInvoice._id}</p>
                            <p><strong>Order Date:</strong> {formatInvoiceDate(activeInvoice.createdAt || activeInvoice.created_at)}</p>
                            <p><strong>Invoice No:</strong> LWAABGM{String(activeInvoice.id || activeInvoice._id || "").slice(-8).toUpperCase()}</p>
                            <p><strong>Invoice Date:</strong> {formatInvoiceDate(activeInvoice.paidAt || activeInvoice.paid_at || activeInvoice.createdAt || activeInvoice.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="text-right text-[10px] text-slate-800 space-y-0.5 mt-1">
                            <p><strong>GSTIN:</strong> {invoiceSettings.gstin}</p>
                            <p><strong>PAN:</strong> {invoiceSettings.pan}</p>
                          </div>
                          {/* Dynamic QR Code with complete order details */}
                          <div className="border border-slate-300 p-1 bg-white">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrData}`}
                              alt="Order QR Code"
                              className="w-16 h-16"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ADDRESSES ROW */}
                      <div className="grid grid-cols-3 gap-4 border-b border-black py-4 text-[10px] text-slate-800">
                        {/* SOLD BY */}
                        <div className="space-y-1 pr-2">
                          <h4 className="font-bold text-black uppercase tracking-wider">Sold By:</h4>
                          <p className="font-bold">{invoiceSettings.companyName.toUpperCase()},</p>
                          {invoiceSettings.registeredAddress.split("\n").map((line, lIdx) => (
                            <p key={lIdx} className="text-slate-600">{line}</p>
                          ))}
                          <p className="font-bold text-black mt-2">GSTIN: {invoiceSettings.gstin}</p>
                        </div>

                        {/* BILLING ADDRESS */}
                        <div className="space-y-1 px-2 border-l border-slate-200">
                          <h4 className="font-bold text-black uppercase tracking-wider">Billing Address:</h4>
                          <p className="font-bold">{shippingDetails.fullName}</p>
                          <p className="text-slate-600">{shippingDetails.address}</p>
                          <p className="text-slate-600">
                            {shippingDetails.city ? `${shippingDetails.city}, ` : ""}{shippingDetails.state} - {shippingDetails.pincode}
                          </p>
                          <p className="text-slate-600">Country: {shippingDetails.country}</p>
                          <p className="font-bold text-black mt-1">Phone: {shippingDetails.phone}</p>
                        </div>

                        {/* SHIPPING ADDRESS */}
                        <div className="space-y-1 pl-2 border-l border-slate-200">
                          <h4 className="font-bold text-black uppercase tracking-wider">Shipping Address:</h4>
                          <p className="font-bold">{shippingDetails.fullName}</p>
                          <p className="text-slate-600">{shippingDetails.address}</p>
                          <p className="text-slate-600">
                            {shippingDetails.city ? `${shippingDetails.city}, ` : ""}{shippingDetails.state} - {shippingDetails.pincode}
                          </p>
                          <p className="text-slate-600">Country: {shippingDetails.country}</p>
                          <p className="font-bold text-black mt-1">Phone: {shippingDetails.phone}</p>
                        </div>
                      </div>

                      {/* TABLE OF ITEMS */}
                      <div className="w-full">
                        <table className="w-full text-[10px] text-left border-collapse border border-black">
                          <thead>
                            <tr className="bg-slate-50 border-b border-black text-black font-bold uppercase tracking-wider text-[9px]">
                              <th className="py-2 px-2 border-r border-black w-[25%]">Product</th>
                              <th className="py-2 px-2 border-r border-black w-[22%]">Description</th>
                              <th className="py-2 px-2 border-r border-black text-center w-[5%]">Qty</th>
                              <th className="py-2 px-2 border-r border-black text-right w-[10%]">Gross</th>
                              <th className="py-2 px-2 border-r border-black text-right w-[8%]">Discount</th>
                              <th className="py-2 px-2 border-r border-black text-right w-[10%]">Taxable</th>
                              <th className="py-2 px-2 border-r border-black text-right w-[10%]">IGST (18%)</th>
                              <th className="py-2 px-2 border-r border-black text-right w-[5%]">Cess</th>
                              <th className="py-2 px-2 text-right w-[10%]">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black font-medium text-slate-800">
                            {orderedItems.map((item, idx) => {
                              const qty = Number(item.quantity || 1);
                              const price = Number(item.price || 0) * scaleFactor;
                              const calcs = getGSTCalculations(price, qty);

                              return (
                                <tr key={idx} className="border-b border-black">
                                  <td className="py-2 px-2 border-r border-black font-bold text-black">{item.title || item.name || "E-Commerce Item"}</td>
                                  <td className="py-2 px-2 border-r border-black text-slate-600 text-[9px]">
                                    HSN: 33030040 | IGST: 18.00% | CESS: 0.00%
                                  </td>
                                  <td className="py-2 px-2 border-r border-black text-center font-bold text-black">{qty}</td>
                                  <td className="py-2 px-2 border-r border-black text-right font-mono font-semibold">₹{calcs.gross}</td>
                                  <td className="py-2 px-2 border-r border-black text-right font-mono text-slate-500">-{calcs.discount}</td>
                                  <td className="py-2 px-2 border-r border-black text-right font-mono">₹{calcs.taxable}</td>
                                  <td className="py-2 px-2 border-r border-black text-right font-mono">₹{calcs.igst}</td>
                                  <td className="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-black">₹{calcs.total}</td>
                                </tr>
                              );
                            })}

                            {/* Handling Fee line to match layout */}
                            <tr className="border-b border-black">
                              <td className="py-2 px-2 border-r border-black font-bold text-black">Handling Fee</td>
                              <td className="py-2 px-2 border-r border-black text-slate-600 text-[9px]">
                                SAC: 996511 | IGST: 0.00% | CESS: 0.00%
                              </td>
                              <td className="py-2 px-2 border-r border-black text-center font-bold text-black">1</td>
                              <td className="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                              <td className="py-2 px-2 border-r border-black text-right font-mono text-slate-500">-0.00</td>
                              <td className="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                              <td className="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                              <td className="py-2 px-2 border-r border-black text-right font-mono">₹0.00</td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-black">₹0.00</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* TOTAL QUANTITY AND PRICE BLOCK */}
                      <div className="border border-black p-3.5 bg-slate-50 text-[10px] font-bold text-black uppercase tracking-wider space-y-1.5">
                        <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
                          <div>
                            TOTAL QTY: <span className="font-mono text-xs">{orderedItems.reduce((s, i) => s + Number(i.quantity || 1), 0)}</span>
                          </div>
                          <div>
                            SUBTOTAL (EXCL. TAX): <span className="font-mono text-xs">₹{dbItemsTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            TOTAL TAX (IGST 18%): <span className="font-mono text-xs text-slate-600">₹{(dbItemsTotal * 0.18).toFixed(2)}</span>
                          </div>
                          <div>
                            GRAND TOTAL (INCL. TAX): <span className="font-mono text-sm text-indigo-600">₹{(dbItemsTotal * 1.18).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* SELLER ADDRESS, PAYMENT METHOD, SIGNATORY GRID */}
                      <div className="grid grid-cols-2 gap-6 border-b border-black pb-4 text-[10px] text-slate-800">
                        <div className="space-y-3">
                          {/* SELLER REGISTERED ADDRESS */}
                          <div className="space-y-1">
                            <h5 className="font-bold text-black uppercase">Seller Registered Address:</h5>
                            <p className="text-slate-600 leading-relaxed text-[9px]">
                              {invoiceSettings.sellerRegisteredAddress.split("\n").map((line, lIdx) => (
                                <span key={lIdx}>{line}<br /></span>
                              ))}
                            </p>
                          </div>

                          {/* PAYMENT MODE & PLATFORM */}
                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
                            <p className="font-bold text-black flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              Payment Mode: <span className="text-emerald-700 font-mono">Online Card (Stripe Checkout)</span>
                            </p>
                            <p className="text-[9px] text-slate-500 border-b border-slate-200 pb-1.5">
                              <strong>Platform Ordered:</strong> {invoiceSettings.companyName.split(" ").slice(0, 2).join(" ")} E-Commerce Platform
                            </p>
                            <div className="text-[9px] text-slate-600 space-y-0.5 pt-0.5">
                              <p className="flex justify-between"><span>Product Subtotal:</span> <span className="font-mono font-bold text-black">₹{dbItemsTotal.toFixed(2)}</span></p>
                              <p className="flex justify-between"><span>Integrated Tax (IGST 18%):</span> <span className="font-mono font-bold text-black">₹{(dbItemsTotal * 0.18).toFixed(2)}</span></p>
                              <p className="flex justify-between text-[10px] font-extrabold text-indigo-700 border-t border-dashed border-slate-300 pt-1 mt-1">
                                <span>NET INVOICE VALUE:</span> <span>₹{(dbItemsTotal * 1.18).toFixed(2)}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* AUTHORIZED SIGNATORY */}
                        <div className="flex flex-col justify-between items-end text-right pl-6 h-full">
                          <div className="space-y-1">
                            <h5 className="font-bold text-black uppercase">Ordered Through</h5>
                            <p className="font-mono text-[9px] text-slate-500">{invoiceSettings.companyName.split(" ").slice(0, 2).join(" ")} / Spectrum Retail</p>
                          </div>

                          <div className="flex flex-col items-center justify-center space-y-1 mt-4">
                            <p className="text-[8px] uppercase font-bold text-slate-400">{invoiceSettings.companyName.toUpperCase()}</p>
                            {/* STYLIZED SIGNATURE STAMP */}
                            <div className="relative border border-dashed border-amber-400 p-1.5 bg-amber-50/10 rounded-md select-none w-44 text-center my-1.5">
                              <span className="font-serif italic text-base text-amber-900 tracking-widest inline-block transform rotate-[-3deg] font-bold select-none pr-4">
                                {invoiceSettings.authorizedSignatory}
                              </span>
                              <span className="absolute bottom-0 right-1 text-[7px] text-amber-500 font-black uppercase transform rotate-[-8deg] pointer-events-none tracking-widest">
                                {invoiceSettings.companyName.split(" ").slice(0, 2).join(" ").toUpperCase()} SECURE SEAL
                              </span>
                            </div>
                            <p className="text-[9px] font-bold text-black uppercase tracking-wider">Authorized Signature</p>
                          </div>
                        </div>
                      </div>

                      {/* EXTRA FOOTER */}
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-4">
                        <span>Subject to {invoiceSettings.subjectJurisdiction}</span>
                        <span className="tracking-widest uppercase text-black">E. & O.E. page 1 of 1</span>
                      </div>
                    </div>
                  </div>

                  {/* 📄 PAGE 2: PRODUCT PACKAGING LABEL & STICKER */}
                  <div
                    className="bg-white text-black p-4 border border-slate-300 relative font-mono text-[10px] leading-tight max-w-[800px] mx-auto box-border mt-8 shadow-2xl"
                    style={{ minHeight: "11.27in" }}
                  >
                    {/* The entire label has a black outer border */}
                    <div className="border-[3px] border-black p-0 m-0 w-full bg-white text-black select-none">

                      {/* Section 1: Ship To & Logo / Payment */}
                      <div className="flex border-b-[3px] border-black items-stretch">

                        {/* Left Column: Ship To Address */}
                        <div className="w-[60%] p-3 border-r-[3px] border-black flex flex-col justify-between">
                          <div>
                            <div className="text-[15px] font-black tracking-wide mb-1">Ship To:</div>
                            <div className="text-[14px] font-black tracking-tight leading-none uppercase font-sans mb-1.5">
                              {shippingDetails.fullName}
                            </div>
                            <div className="text-[10px] font-bold text-slate-800 leading-normal uppercase max-w-[280px]">
                              {shippingDetails.address}
                            </div>
                          </div>

                          <div className="mt-3 space-y-0.5">
                            <div className="text-[11px] font-black text-black uppercase flex justify-between">
                              <span>{shippingDetails.city.toUpperCase() || "CITY N/A"}</span>
                              <span className="pr-4">{shippingDetails.state.toUpperCase() || "STATE N/A"}</span>
                            </div>
                            <div className="text-[11px] font-black text-black uppercase flex justify-between">
                              <span>IN</span>
                              <span className="pr-4">{shippingDetails.pincode || "PINCODE N/A"}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-800 pt-1.5 border-t border-dashed border-slate-300 mt-1">
                              AddressType: HOME
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Logo & Payment Type */}
                        <div className="w-[40%] flex flex-col justify-between items-stretch">
                          {/* Logo Box */}
                          <div className="p-3 border-b-[3px] border-black text-right flex flex-col items-end justify-center h-[50%] select-none">
                            {invoiceSettings.logoBase64 ? (
                              <img src={invoiceSettings.logoBase64} alt="Logo" className="max-h-10 max-w-[150px] object-contain bg-white p-0.5 rounded border border-slate-200" />
                            ) : (
                              <span className="text-[26px] font-black tracking-tighter uppercase font-sans leading-none">
                                {invoiceSettings.companyName.split(" ").slice(0, 2).join(" ")}
                              </span>
                            )}
                            <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold block mt-1">
                              EXPRESS LOGISTICS
                            </span>
                          </div>

                          {/* Payment & Collect Box */}
                          {(() => {
                            const totalInclusive = Number((dbItemsTotal * 1.18).toFixed(2));
                            const isPaid = activeInvoice.status === "Delivered" || activeInvoice.status === "Shipped" || activeInvoice.order_status === "Delivered" || activeInvoice.order_status === "Shipped";
                            const paymentType = isPaid ? "NONCOD" : "COD";
                            const collectAmount = isPaid ? "0.0" : totalInclusive.toFixed(1);

                            return (
                              <div className="p-3 flex-1 flex flex-col justify-center space-y-1">
                                <div className="text-[12px] font-black text-black leading-none">
                                  PaymentType: <span className="underline font-extrabold">{paymentType}</span>
                                </div>
                                <div className="text-[12px] font-black text-black mt-1 flex justify-between leading-none">
                                  <span>Collect:</span>
                                  <span className="font-mono text-[13px] font-extrabold">Rs. {collectAmount}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Section 2: First Barcode (Carrier & AWB) */}
                      <div className="flex border-b-[3px] border-black items-stretch">

                        {/* Left side: Barcode */}
                        <div className="w-[60%] p-4 border-r-[3px] border-black flex flex-col items-center justify-center">
                          {/* SVG representation of scannable barcode */}
                          <div className="w-full flex justify-center items-center h-14 overflow-hidden bg-white mb-1.5">
                            <svg className="w-full h-12" viewBox="0 0 100 20" preserveAspectRatio="none">
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
                          <span className="text-[12px] font-black tracking-widest font-mono text-black uppercase">
                            SF{String(activeInvoice.id || activeInvoice._id || "").slice(-8).toUpperCase()}SIN
                          </span>
                        </div>

                        <div className="w-[40%] p-3 flex flex-col justify-between items-stretch">
                          <div className="text-[8px] font-bold text-slate-700 leading-tight space-y-0.5 uppercase">
                            <p>Carrier Name: SHADOWFAX</p>
                            <p>Carrier Service: SHADOWFAX SURFACE</p>
                          </div>
                          
                          <div className="flex justify-between items-end pr-1 select-none">
                            {/* Small decorative corporate Balaji Cart logo near state routing indicator */}
                            {invoiceSettings.logoBase64 ? (
                              <img src={invoiceSettings.logoBase64} alt="Logo" className="w-6 h-6 mb-1 object-contain p-0.5 bg-white rounded border border-slate-200" />
                            ) : (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 mb-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="black" />
                                <path d="M8.5 7.5h4c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5V7.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8.5 11.9h4.5c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5v-4.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.5 12h5.5l-2-2m2 2l-2 2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}

                            <div className="text-[52px] font-black tracking-tighter leading-none text-black font-sans">
                              {(() => {
                                const state = String(shippingDetails.state || "MH").trim().toUpperCase();
                                return state.slice(0, 2) || "SH";
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Origin / Destination / Routing Code */}
                      <div className="grid grid-cols-3 border-b-[3px] border-black text-center divide-x-[3px] divide-black text-[12px] font-black items-stretch">
                        <div className="p-2 flex flex-col justify-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Origin :</span>
                          <span className="text-black text-[13px] tracking-tight">MH/BWI</span>
                        </div>
                        <div className="p-2 flex flex-col justify-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Destination :</span>
                          <span className="text-black text-[13px] tracking-tight">
                            {String(shippingDetails.state || "WB").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="p-2 flex flex-col justify-center bg-slate-50/50">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Routing Code:</span>
                          <span className="text-black text-[13px] tracking-tight">
                            {String(shippingDetails.state || "WB").slice(0, 2).toUpperCase()}/{String(shippingDetails.pincode || "700").slice(0, 2)}
                          </span>
                        </div>
                      </div>

                      {/* Section 4: Barcode 2 (Order #) */}
                      <div className="p-3 border-b-[3px] border-black flex flex-col items-center justify-center">
                        <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-700 px-4 leading-none">
                          <span>Order #</span>
                          <span className="font-mono text-black font-black">BC-{String(activeInvoice.id || activeInvoice._id || "").toUpperCase()}</span>
                        </div>
                        <div className="w-[80%] flex justify-center items-center h-8 overflow-hidden bg-white mt-1.5 mb-1">
                          <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
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
                        <span className="text-[11px] font-black tracking-widest font-mono text-black uppercase">
                          BC{String(activeInvoice.id || activeInvoice._id || "").slice(-8).toUpperCase()}
                        </span>
                      </div>

                      {/* Section 5: Barcode 3 (Container #) */}
                      <div className="p-3 border-b-[3px] border-black flex flex-col items-center justify-center">
                        <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-700 px-4 leading-none">
                          <span>Container # :</span>
                          <span className="font-mono text-black font-black">FLSBC-{String(activeInvoice.id || activeInvoice._id || "").slice(-4).toUpperCase()}</span>
                        </div>
                        <div className="w-[90%] flex justify-center items-center h-10 overflow-hidden bg-white mt-1.5 mb-1">
                          <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
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
                        <span className="text-[11px] font-black tracking-widest font-mono text-black uppercase">
                          FLSAUYA1779473915040381{String(activeInvoice.id || activeInvoice._id || "").slice(-4).toUpperCase()}
                        </span>
                      </div>

                      {/* Section 6: Split Shipment Info & UPI QR Code */}
                      <div className="flex justify-between items-stretch border-b-[3px] border-black">

                        {/* Shipment Info fields */}
                        <div className="w-[60%] border-r-[3px] border-black flex flex-col text-[10px] justify-between">
                          <div className="flex flex-col divide-y border-b border-black">
                            <div className="p-2 grid grid-cols-2">
                              <span>Shipment #</span>
                              <span className="font-black text-black">119440{String(activeInvoice.id || activeInvoice._id || "").slice(-4).toUpperCase()}</span>
                            </div>
                            <div className="p-2 grid grid-cols-2">
                              <span>FO Order ID #</span>
                              <span className="font-black text-black">FO119440{String(activeInvoice.id || activeInvoice._id || "").slice(-4).toUpperCase()}</span>
                            </div>
                            <div className="p-2 grid grid-cols-2 bg-slate-50/50">
                              <span>Total Quantity</span>
                              <span className="font-black text-black text-[12px]">{totalQty}</span>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white space-y-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block leading-none">Consignor Node :</span>
                            <p className="font-bold text-black uppercase leading-tight text-[8px] font-sans">
                              {invoiceSettings.dispatchAddress.split("\n").map((line, lIdx) => (
                                <span key={lIdx}>{line}<br /></span>
                              ))}
                            </p>
                          </div>
                        </div>

                        {/* QR Code Block */}
                        <div className="w-[40%] p-3 flex flex-col justify-center items-center bg-white space-y-1">
                          {(() => {
                            const totalInclusive = Number((dbItemsTotal * 1.18).toFixed(2));
                            const isPaid = activeInvoice.status === "Delivered" || activeInvoice.status === "Shipped" || activeInvoice.order_status === "Delivered" || activeInvoice.order_status === "Shipped";
                            const amountDue = isPaid ? 0 : totalInclusive;

                            return (
                              <>
                                <div className="border border-slate-400 p-1.5 bg-white shadow-sm rounded-lg">
                                  <img
                                    src={amountDue > 0
                                      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${invoiceSettings.upiId}%26pn=${encodeURIComponent(invoiceSettings.companyName)}%26am=${amountDue}%26cu=INR%26tn=Order_${activeInvoice.id || activeInvoice._id}`
                                      : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=OrderPaid:${activeInvoice.id || activeInvoice._id}`
                                    }
                                    alt="UPI Payment QR Code"
                                    className="w-24 h-24"
                                  />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center leading-none mt-1">
                                  {amountDue > 0 ? "SCAN TO PAY COD" : "PREPAID VERIFIED"}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Package Manifest Slip */}
                      <div className="p-3 bg-slate-50 text-[10px] font-bold text-black border-b border-black">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Items in Package:</span>
                        <ul className="space-y-1 text-slate-800 font-mono text-[9px]">
                          {orderedItems.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center">
                              <span>- {item.title || item.name || "E-Commerce Item"}</span>
                              <span className="font-bold bg-white border border-slate-300 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer notice */}
                      <div className="p-2 text-center text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                        <span>{invoiceSettings.companyName.split(" ").slice(0, 2).join(" ")} Logistics Network - Paste this label on outer packaging box</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🌌 CONSOLE CONTROL ACTIONS */}
                <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={13} className="text-emerald-400" /> Secure Ledger node authenticated
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs transition"
                    >
                      <Printer size={13} /> Print Invoice
                    </button>

                    <button
                      onClick={handlePrint} // Triggers PDF print download dialog
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 transition"
                    >
                      <Download size={13} /> Download PDF
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-900/30 p-20 rounded-[2.5rem] border border-slate-800/60 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-950/60 rounded-[1.5rem] flex items-center justify-center text-slate-500 shadow-inner">
                  <Receipt size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-300">Select Invoice Preview</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Select a billing record invoice entry from the left directory column to inspect specs</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Invoices;
