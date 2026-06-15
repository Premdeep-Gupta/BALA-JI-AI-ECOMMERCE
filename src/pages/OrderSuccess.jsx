import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderSuccess = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="bg-green-500/10 p-6 rounded-full mb-6">
        <CheckCircle size={80} className="text-green-500" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">Payment Successful! ✅</h1>
      <p className="text-slate-400 text-lg mb-8 max-w-md">
        Your order has been placed successfully! You can track its status in the My Orders section.
      </p>
      <div className="flex gap-4">
        <Link to="/orders" className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
          View Orders
        </Link>
        <Link to="/" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;