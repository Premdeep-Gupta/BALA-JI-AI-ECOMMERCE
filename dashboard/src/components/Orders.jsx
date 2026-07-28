import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Search,
  LayoutGrid,
} from "lucide-react";

import {
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
  fetchDeliveryAgents,
} from "../store/slices/orderSlice";

// ✅ FIXED: Products list refetch karne ke liye import kiya
import { fetchAllProducts } from "../store/slices/productsSlice";

const geocodeAddress = async (shipping) => {
  if (!shipping) return null;
  const addressStr = [
    shipping.address,
    shipping.city,
    shipping.state,
    shipping.pincode
  ].filter(Boolean).join(", ");
  
  if (!addressStr) return null;
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
  }
  return null;
};

const Orders = () => {
  const statusArray = [
    "All",
    "New Orders (24h)",
    "Processing",
    "Order Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  const dispatch = useDispatch();

  const { orders, loading, deliveryAgents = [] } = useSelector(
    (state) => state.order
  );

  const [selectedStatus, setSelectedStatus] =
    useState({});

  const [filterByStaus, setFilterByStatus] =
    useState("All");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [previewImage, setPreviewImage] =
    useState(null);

  const [deleteConfirm, setDeleteConfirm] =
    useState({
      open: false,
      id: null,
    });

  const [deliveryModal, setDeliveryModal] = useState({
    open: false,
    orderId: null,
    status: null,
    name: "",
    phone: "",
    vehicle: "",
    photo: "",
    customerCoords: null,
    geocoding: false,
  });

  const [otpModal, setOtpModal] = useState({
    open: false,
    orderId: null,
    status: null,
    otp: "",
    error: "",
  });

  useEffect(() => {
    dispatch(fetchAllOrders());
    dispatch(fetchDeliveryAgents());
  }, [dispatch]);

  const handleStatusChange = (
    orderId,
    newStatus
  ) => {
    const order = orders.find(o => (o.id || o._id) === orderId);

    if (newStatus === "Out for Delivery" || newStatus === "Exchange Out for Delivery") {
      setDeliveryModal({
        open: true,
        orderId,
        status: newStatus,
        name: order.delivery_boy_name || "",
        phone: order.delivery_boy_phone || "",
        vehicle: order.delivery_boy_vehicle || "",
        photo: order.delivery_boy_photo || "",
        customerCoords: null,
        geocoding: true,
      });

      geocodeAddress(order.shippingInfo || order.shipping_info).then(coords => {
        setDeliveryModal(prev => {
          if (prev.orderId === orderId) {
            return {
              ...prev,
              customerCoords: coords,
              geocoding: false
            };
          }
          return prev;
        });
      });
      return;
    }

    if ((newStatus === "Delivered" || newStatus === "Exchange Completed") && !order?.payment_mode?.includes("COD") && order?.payment_mode !== "Exchange") {
      setOtpModal({
        open: true,
        orderId,
        status: newStatus,
        otp: "",
        error: "",
      });
      return;
    }

    setSelectedStatus((prev) => ({
      ...prev,
      [orderId]: newStatus,
    }));

    dispatch(
      updateOrderStatus({
        orderId,
        status: newStatus,
      })
    );
  };

  const submitDeliveryDetails = () => {
    if (!deliveryModal.name || !deliveryModal.phone) {
      alert("Delivery Boy Name and Phone Number are required.");
      return;
    }

    setSelectedStatus((prev) => ({
      ...prev,
      [deliveryModal.orderId]: deliveryModal.status,
    }));

    dispatch(
      updateOrderStatus({
        orderId: deliveryModal.orderId,
        status: deliveryModal.status,
        delivery_boy_name: deliveryModal.name,
        delivery_boy_phone: deliveryModal.phone,
        delivery_boy_vehicle: deliveryModal.vehicle,
        delivery_boy_photo: deliveryModal.photo,
      })
    );

    setDeliveryModal({
      open: false,
      orderId: null,
      status: null,
      name: "",
      phone: "",
      vehicle: "",
      photo: "",
      customerCoords: null,
      geocoding: false,
    });
  };

  const submitOtpDetails = async () => {
    if (!otpModal.otp) {
      setOtpModal(prev => ({ ...prev, error: "Please enter the verification OTP." }));
      return;
    }

    setSelectedStatus((prev) => ({
      ...prev,
      [otpModal.orderId]: otpModal.status,
    }));

    const actionResult = await dispatch(
      updateOrderStatus({
        orderId: otpModal.orderId,
        status: otpModal.status,
        otp: otpModal.otp,
      })
    );

    if (actionResult.error) {
      const order = orders.find(o => (o.id || o._id) === otpModal.orderId);
      setSelectedStatus((prev) => ({
        ...prev,
        [otpModal.orderId]: order?.order_status || order?.status,
      }));
      setOtpModal(prev => ({ 
        ...prev, 
        error: actionResult.payload || "Invalid verification OTP." 
      }));
    } else {
      setOtpModal({
        open: false,
        orderId: null,
        status: null,
        otp: "",
        error: "",
      });
    }
  };

  const availableCategories = [
    "All", "Electronics", "Fashion", "Mobiles", "Home", "Sports", 
    "Books", "Beauty", "Automotive", "Kids & Baby"
  ];

  const filterdOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    return orders.filter((order) => {
      const orderId = order._id || order.id || "";
      const orderStatus = order.status || order.order_status || "Processing";
      const orderDate = order.createdAt || order.created_at;
      const shipping = order.shippingInfo || order.shipping_info;
      const items = order.orderedItems || order.ordered_items || order.order_items || [];
      const phone = shipping?.phone_number || shipping?.phone || "";

      // 1. Search term match (Order ID or Phone Number)
      const matchesSearch =
        !searchTerm.trim() ||
        orderId.toString().toLowerCase().includes(searchTerm.toLowerCase().replace("#", "")) ||
        phone.toString().toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Status / Time Filter
      let matchesStatus = true;
      if (filterByStaus === "New Orders (24h)") {
        if (!orderDate) matchesStatus = false;
        else {
          const timeDiff = new Date() - new Date(orderDate);
          matchesStatus = timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
        }
      } else if (filterByStaus !== "All") {
        matchesStatus = orderStatus === filterByStaus;
      }

      // 3. Category Filter
      const matchesCategory =
        selectedCategory === "All" ||
        items.some((item) => {
          const cat = item.category || "";
          return cat.toLowerCase() === selectedCategory.toLowerCase();
        });

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [orders, searchTerm, filterByStaus, selectedCategory]);

  // ✅ FIXED: Delete hote hi backend stock ko frontend products state ke sath instant sync karega
  const confirmDelete = async () => {
    const idToDelete = deleteConfirm.id;
    if (idToDelete) {
      // 1. Pehle order delete karne ki API trigger hogi
      await dispatch(deleteOrder(idToDelete));
      
      // 2. 🔥 THE FIX: Order delete hote hi fresh stock products state ko refetch karega!
      dispatch(fetchAllProducts());
      
      // 3. Fallback check: Kuch scenarios mein orders list ko refresh karne ke liye
      dispatch(fetchAllOrders());
    }

    setDeleteConfirm({
      open: false,
      id: null,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen md:pl-[17rem]">
         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full bg-gray-50 min-h-screen">
        {/* HEADER */}
        <div className="flex-1 md:p-6 mb:pb-0">
          <Header />

          <h1 className="text-2xl font-bold">
            All Orders
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            Manage all your orders.
          </p>
        </div>

        {/* CONTENT */}
        <div className="md:px-6">
          
          {/* CONDITION: Only show filter if there are actually orders in the database */}
          {orders && orders.length > 0 ? (
            <>
              {/* SEARCH BAR & FILTERS PANEL */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 space-y-5">
                
                {/* SEARCH INPUT */}
                <div className="relative w-full flex items-center group">
                  <Search className="absolute left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by Order ID or Customer Mobile Number..."
                    className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl font-semibold text-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 text-xs font-bold text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* STATUS FILTER PILLS */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Filter size={11}/> Order Status Segment:
                  </span>
                  <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {statusArray.map((status) => (
                      <button
                        key={`filter-${status}`}
                        onClick={() => setFilterByStatus(status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                          filterByStaus === status
                            ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CATEGORY SEGMENT FILTER PILLS */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <LayoutGrid size={11}/> Category Segment:
                  </span>
                  <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
                    {availableCategories.map((cat) => (
                      <button
                        key={`cat-filter-${cat}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                          selectedCategory === cat
                            ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-500/10"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Check if filtered results are empty */}
              {filterdOrders.length === 0 ? (
                 <div className="flex flex-col items-center justify-center mt-20 bg-white p-10 rounded-xl shadow-sm">
                    <Package size={50} className="text-gray-300 mb-4" />
                    <p className="text-xl font-semibold text-gray-500">
                      {filterByStaus === "All" && selectedCategory === "All"
                        ? "No orders found."
                        : filterByStaus !== "All" && selectedCategory === "All"
                        ? `No ${filterByStaus} orders found.`
                        : filterByStaus === "All" && selectedCategory !== "All"
                        ? `No orders found in ${selectedCategory} category.`
                        : `No ${filterByStaus} orders found in ${selectedCategory} category.`}
                    </p>
                 </div>
              ) : (
                filterdOrders.map((order) => {
                  const orderId = order._id || order.id;
                  const orderStatus = order.status || order.order_status; 
                  const orderDate = order.createdAt || order.created_at;
                  const amount = order.totalAmount || order.total_amount || order.total_price; 
                  const shipping = order.shippingInfo || order.shipping_info;
                  const items = order.orderedItems || order.ordered_items || order.order_items; 

                  return (
                    <div
                      key={orderId}
                      className="bg-white rounded-lg shadow p-6 mb-4 border border-gray-100"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <strong>Order ID:</strong>{" "}
                            #{orderId?.toString().slice(-6) || "N/A"}
                          </p>

                          <p className="my-1">
                            <strong>Status:</strong>{" "}
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {orderStatus || "Processing"}
                            </span>
                          </p>

                          <p>
                            <strong>
                              Placed At:
                            </strong>{" "}
                            {orderDate ? new Date(orderDate).toLocaleString() : "Date N/A"}
                          </p>

                          <p className="my-1">
                            <strong>Payment Mode:</strong>{" "}
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              order.payment_mode?.includes('COD') 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                              {order.payment_mode?.includes('COD') ? 'Cash on Delivery (COD)' : (order.payment_mode || 'Prepaid (Online)')}
                            </span>
                          </p>

                          <p className="text-lg font-bold text-blue-600 mt-2">
                            <strong>
                              Total Amount:
                            </strong>{" "}
                            ₹{amount || "0"}
                          </p>
                        </div>

                        {/* Customer Account Info in the middle */}
                        <div className="flex-1 min-w-[250px] max-w-md p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            👤 Customer Account Info
                          </h4>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-700">
                              <strong className="text-gray-500">Reg. Name:</strong>{" "}
                              <span className="font-semibold text-gray-900">{order.buyer_name || "Guest / Deleted User"}</span>
                            </p>
                            <p className="text-xs text-gray-700">
                              <strong className="text-gray-500">Reg. Email:</strong>{" "}
                              <span className="font-semibold text-gray-900 break-all">{order.buyer_email || "N/A"}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              <strong className="text-gray-450 font-semibold">Buyer ID:</strong>{" "}
                              <span className="font-mono bg-gray-200/60 text-gray-650 px-1.5 py-0.5 rounded text-[10px]">
                                {order.buyer_id || "N/A"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <select
                            value={
                              selectedStatus[orderId] || orderStatus
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                orderId,
                                e.target.value
                              )
                            }
                            className="border p-2 rounded text-sm bg-gray-50"
                          >
                            {["Exchange Approved", "Exchange Out for Delivery", "Exchange Completed"].includes(orderStatus) ? (
                              ["Exchange Approved", "Exchange Out for Delivery", "Exchange Completed"].map(st => (
                                <option key={`opt-${orderId}-${st}`} value={st}>{st}</option>
                              ))
                            ) : (
                              statusArray.map(
                                (status) => (
                                  status !== "All" && status !== "New Orders (24h)" && (
                                    <option
                                      key={`opt-${orderId}-${status}`}
                                      value={status}
                                    >
                                      {status}
                                    </option>
                                  )
                                )
                              )
                            )}
                          </select>

                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                id: orderId,
                              })
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-all text-sm font-semibold"
                          >
                            Delete Order
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-1 border-b pb-1">
                          Shipping Info
                        </h4>

                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Name:</strong>{" "}
                          {shipping?.full_name || shipping?.fullName || "N/A"}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong>{" "}
                          {shipping?.phone_number || shipping?.phone || "N/A"}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Address:</strong>{" "}
                          {shipping?.address || "N/A"}, {shipping?.city || ""}, {shipping?.state || ""}, {shipping?.pincode || ""}
                        </p>
                      </div>

                      {order.delivery_boy_name && (
                        <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          {order.delivery_boy_photo && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-blue-200 bg-white flex-shrink-0">
                              <img src={order.delivery_boy_photo} alt="Agent Profile" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-800 mb-1 border-b border-blue-100 pb-1 flex items-center gap-1.5">
                              <Truck size={16} /> Delivery Agent Assigned
                            </h4>
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Name:</strong> {order.delivery_boy_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Phone:</strong> {order.delivery_boy_phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Courier / Delivery Agency:</strong> {order.delivery_boy_vehicle || "N/A"}
                            </p>
                            {!order.payment_mode?.includes("COD") && order.delivery_otp && (
                              <p className="text-sm text-amber-800 font-bold mt-2 bg-amber-50 p-2 rounded border border-amber-150 inline-block">
                                🔒 Secure Verification OTP: {order.delivery_otp}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="font-semibold text-lg mb-2">
                          Ordered Items ({items?.length || 0})
                        </h4>

                        {Array.isArray(items) &&
                          items.map((item, idx) => {
                            return (
                              <div
                                key={item._id || item.id || item.order_item_id || idx}
                                className="flex items-center gap-4 mb-2 border-b pb-2 last:border-b-0"
                              >
                                {(item.image || item.url) && (
                                  <img
                                    src={item.image || item.url}
                                    alt={item.title || item.name}
                                    className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition-all shadow-sm"
                                    onClick={() =>
                                      setPreviewImage(
                                        item.image || item.url
                                      )
                                    }
                                  />
                                )}

                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {item.title || item.name || "Product Name N/A"}
                                  </p>

                                  <p className="text-sm text-gray-500">
                                    <strong>Qty:</strong> {item.quantity} | <strong>Price:</strong> ₹{item.price}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            /* SHOW THIS WHEN DATABASE IS COMPLETELY EMPTY */
            <div className="flex flex-col items-center justify-center mt-20 p-10 bg-white rounded-2xl shadow-lg border border-gray-100">
               <Package size={80} className="text-blue-100 mb-6" />
               <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Found</h2>
               <p className="text-gray-500 text-center max-w-xs">
                 Looks like your order list is empty. Once a customer places an order, it will appear here.
               </p>
            </div>
          )}
        </div>

        {/* IMAGE PREVIEW MODAL */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full rounded-lg shadow-2xl border-4 border-white"
            />
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full">
              <h3 className="text-xl font-bold mb-2">Delete Order?</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this order?</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      open: false,
                      id: null,
                    })
                  }
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
                >
                   Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY BOY INTAKE MODAL */}
        {deliveryModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-blue-500 to-indigo-600" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Truck className="text-blue-600" /> Assign Delivery Agent
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Please enter the details of the delivery agent who will transport this order.
              </p>

              {/* Proximity sorted suggestions using Haversine distance */}
              {(() => {
                const selectedOrder = orders.find(o => (o.id || o._id) === deliveryModal.orderId);
                const shipping = selectedOrder?.shipping_info || selectedOrder?.shippingInfo;
                
                const getAddressCoordinates = (shipInfo) => {
                  const city = (shipInfo?.city || "").toLowerCase();
                  let lat = 22.5726; // Kolkata hub default
                  let lng = 88.3639;

                  if (city.includes("bangalore") || city.includes("bengaluru")) {
                    lat = 12.9716; lng = 77.5946;
                  } else if (city.includes("mumbai") || city.includes("bombay")) {
                    lat = 19.0760; lng = 72.8777;
                  } else if (city.includes("delhi") || city.includes("noida") || city.includes("gurgaon")) {
                    lat = 28.7041; lng = 77.1025;
                  } else if (city.includes("kolkata") || city.includes("calcutta")) {
                    lat = 22.5726; lng = 88.3639;
                  } else if (city.includes("chennai") || city.includes("madras")) {
                    lat = 13.0827; lng = 80.2707;
                  }
                  return { lat, lng };
                };

                const calculateDistance = (lat1, lon1, lat2, lon2) => {
                  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
                  const R = 6371; // km
                  const dLat = (lat2 - lat1) * Math.PI / 180;
                  const dLon = (lon2 - lon1) * Math.PI / 180;
                  const a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  return R * c;
                };

                const custCoords = deliveryModal.customerCoords || getAddressCoordinates(shipping);
                
                // Map agents with calculated proximity distances
                const agentsWithDistance = deliveryAgents.map(agent => {
                  const dist = calculateDistance(
                    custCoords.lat, 
                    custCoords.lng, 
                    agent.latitude ? Number(agent.latitude) : null, 
                    agent.longitude ? Number(agent.longitude) : null
                  );
                  return { ...agent, distance: dist };
                }).sort((a, b) => a.distance - b.distance);

                const nearbyAgents = agentsWithDistance.filter(a => a.distance <= 30);
                const farAgents = agentsWithDistance.filter(a => a.distance > 30);

                return (
                  <div className="space-y-4 mb-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">
                          Select Registered Agent (30km Geofence) {deliveryModal.geocoding && <span className="text-blue-500 animate-pulse font-normal lowercase ml-1">(geocoding customer address...)</span>}
                        </label>
                        {nearbyAgents.length > 0 ? (
                          <span className="text-[9px] bg-green-150 text-green-700 font-extrabold px-2 py-0.5 rounded-full">
                            {nearbyAgents.length} Agents Nearby
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-100 text-amber-700 font-extrabold px-2 py-0.5 rounded-full">
                            No Agents Within 30km
                          </span>
                        )}
                      </div>

                      <select
                        onChange={(e) => {
                          const agentId = e.target.value;
                          if (agentId) {
                            const agent = deliveryAgents.find(a => a.id === agentId);
                            if (agent) {
                              setDeliveryModal(prev => ({
                                ...prev,
                                name: agent.name,
                                phone: agent.phone,
                                vehicle: agent.vehicle_number || "",
                                photo: agent.avatar_url || ""
                              }));
                            }
                          }
                        }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition font-bold text-xs bg-white text-gray-750"
                      >
                        <option value="">-- Choose suggested proximity partner --</option>
                        {nearbyAgents.length > 0 && (
                          <optgroup label="✨ Suggested Nearby Partners (within 30 km)">
                            {nearbyAgents.map(agent => (
                              <option key={agent.id} value={agent.id}>
                                🟢 {agent.name} ({agent.phone}) - {agent.distance.toFixed(1)} km away ({agent.shift_preference || "General"})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="🌐 Other Registered Partners">
                          {farAgents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.phone}) - {agent.distance > 5000 ? "N/A" : `${agent.distance.toFixed(1)} km`} ({agent.shift_preference || "General"})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={deliveryModal.name}
                    onChange={(e) => setDeliveryModal({ ...deliveryModal, name: e.target.value })}
                    placeholder="E.g., Rajesh Kumar"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={deliveryModal.phone}
                    onChange={(e) => setDeliveryModal({ ...deliveryModal, phone: e.target.value })}
                    placeholder="E.g., +91 9876543210"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Courier / Delivery Agency *</label>
                  <input
                    type="text"
                    value={deliveryModal.vehicle}
                    onChange={(e) => setDeliveryModal({ ...deliveryModal, vehicle: e.target.value })}
                    placeholder="E.g., Shadowfax, BlueDart, Delhivery"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Agent Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden flex-shrink-0">
                      {deliveryModal.photo ? (
                        <img src={deliveryModal.photo} alt="Agent Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Truck size={24} className="text-gray-300" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      id="agent-photo-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setDeliveryModal(prev => ({ ...prev, photo: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("agent-photo-upload").click()}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Choose Photo
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeliveryModal({ open: false, orderId: null, status: null, name: "", phone: "", vehicle: "" })}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDeliveryDetails}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition text-sm shadow-md"
                >
                  Assign & Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP VERIFICATION MODAL */}
        {otpModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-amber-500 to-orange-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <CheckCircle className="text-amber-500" /> Delivery Verification
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                This is a prepaid order. Please enter the secure 6-digit OTP shared by the customer to verify delivery completion.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">6-Digit Verification OTP *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpModal.otp}
                    onChange={(e) => setOtpModal({ ...otpModal, otp: e.target.value.replace(/\D/g, ""), error: "" })}
                    placeholder="Enter OTP"
                    className="w-full text-center text-2xl font-mono tracking-widest border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition font-black text-gray-800"
                  />
                  {otpModal.error && (
                    <p className="text-xs text-red-500 font-bold mt-2 text-center bg-red-50 p-2 rounded border border-red-100">
                      {otpModal.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOtpModal({ open: false, orderId: null, status: null, otp: "", error: "" })}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitOtpDetails}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition text-sm shadow-md"
                >
                  Verify & Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Orders;