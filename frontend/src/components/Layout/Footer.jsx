import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowUp,
  ShieldCheck,
  RotateCcw,
  Truck,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing to our newsletter! 🎉");
      setEmail("");
    } else {
      toast.error("Please enter a valid email address.");
    }
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerLinks = {
    shop: [
      { name: "Electronics", path: "/products?category=Electronics" },
      { name: "Mobiles & Tablets", path: "/products?category=Mobiles" },
      { name: "Fashion Clothing", path: "/products?category=Fashion" },
      { name: "Beauty & Grooming", path: "/products?category=Beauty" },
      { name: "Home & Kitchen", path: "/products?category=Home" },
      { name: "Sports & Fitness", path: "/products?category=Sports" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Careers", path: "#" },
      { name: "Press Releases", path: "#" },
      { name: "Corporate Blog", path: "#" },
    ],
    customer: [
      { name: "Contact Us", path: "/contact" },
      { name: "Help Center / FAQ", path: "/faq" },
      { name: "Shipping & Delivery Info", path: "#" },
      { name: "Returns & Exchanges Policy", path: "#" },
    ],
    legal: [
      { name: "Privacy Policy", path: "#" },
      { name: "Terms of Service", path: "#" },
      { name: "Cookie Settings", path: "#" },
      { name: "Security Center", path: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-[#1877F2] hover:border-[#1877F2]" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-[#1DA1F2] hover:border-[#1DA1F2]" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-[#E1306C] hover:border-[#E1306C]" },
    { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-[#FF0000] hover:border-[#FF0000]" },
  ];

  return (
    <footer className="glass border-t border-[hsla(var(--glass-border))] mt-20 relative w-full overflow-hidden">
      {/* BACK TO TOP BAR */}
      <button
        onClick={handleBackToTop}
        className="w-full py-4 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border-b border-[hsla(var(--glass-border))] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--primary)] hover:text-white transition-all duration-300"
      >
        <ArrowUp className="w-4 h-4 animate-bounce" />
        <span>Back To Top</span>
      </button>

      {/* VALUE PROPOSITIONS / TRUST BLOCK */}
      <div className="border-b border-[hsla(var(--glass-border))] bg-black/20">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl text-[var(--primary)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">100% Original</h4>
                <p className="text-xs text-[var(--text)]/65 font-medium mt-0.5">Guaranteed authentic items</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl text-[var(--primary)]">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Easy Returns</h4>
                <p className="text-xs text-[var(--text)]/65 font-medium mt-0.5">7-day hassle-free exchanges</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl text-[var(--primary)]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Free Shipping</h4>
                <p className="text-xs text-[var(--text)]/65 font-medium mt-0.5">On orders above ₹499</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl text-[var(--primary)]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Secure Payments</h4>
                <p className="text-xs text-[var(--text)]/65 font-medium mt-0.5">Fully encrypted transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {/* DIRECTORY COLUMNS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12 mb-16">
          {/* Shop Columns */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[var(--primary)] pl-3 mb-6">
              Shop Categories
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-[var(--text)]/70 hover:text-[var(--primary)] font-semibold transition-colors duration-200 block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[var(--primary)] pl-3 mb-6">
              Company
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-[var(--text)]/70 hover:text-[var(--primary)] font-semibold transition-colors duration-200 block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[var(--primary)] pl-3 mb-6">
              Customer Support
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.customer.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-[var(--text)]/70 hover:text-[var(--primary)] font-semibold transition-colors duration-200 block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[var(--primary)] pl-3 mb-6">
              Legal Info
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-[var(--text)]/70 hover:text-[var(--primary)] font-semibold transition-colors duration-200 block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MIDDLE SECTION: CONTACT INFO & NEWSLETTER CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-center">
          {/* Brand Contact */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <Link to="/">
                <h2 className="text-3xl font-black gradient-primary bg-clip-text text-transparent w-fit mb-3">
                  Balaji Mart
                </h2>
              </Link>
              <p className="text-sm text-[var(--text)]/70 font-semibold leading-relaxed max-w-sm">
                Your premier online destination for premium, high-quality products. Experience exceptional customer care and fast nationwide delivery.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center space-x-3.5 text-sm text-[var(--text)]/80 font-bold group">
                <Mail className="w-5 h-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">support@balajimart.com</span>
              </div>
              <div className="flex items-center space-x-3.5 text-sm text-[var(--text)]/80 font-bold group">
                <Phone className="w-5 h-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3.5 text-sm text-[var(--text)]/80 font-bold group">
                <MapPin className="w-5 h-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Premium Newsletter Card */}
          <div className="lg:col-span-7 bg-[var(--card)]/40 border border-[hsla(var(--glass-border))] rounded-[2rem] p-6 sm:p-8 backdrop-blur-md relative overflow-hidden group shadow-lg">
            {/* Ambient background glow */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[var(--primary)]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--primary)]/25 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left space-y-1.5">
                <h4 className="text-lg font-black text-white uppercase tracking-wider">Stay Connected</h4>
                <p className="text-xs text-[var(--text)]/65 font-bold">
                  Subscribe to our premium catalog newsletter for exclusive sales events and news.
                </p>
              </div>

              <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center bg-black/40 border border-[var(--border)] rounded-2xl p-1.5 focus-within:border-[var(--primary)] transition-all duration-300">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder-[var(--text)]/30 outline-none w-full min-w-[150px] font-bold"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-xl transition duration-200 shadow-md shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/45 shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* BOTTOM SOCIAL & COPYRIGHT & PAYMENT BADGES PANEL */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-8 border-t border-[hsla(var(--glass-border))]">
          {/* Social Links */}
          <div className="flex items-center space-x-3.5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className={`p-3 bg-[var(--card)]/40 border border-[var(--border)] text-[var(--text)]/60 rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center hover:scale-115 ${social.color}`}
              >
                <social.icon className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>

          {/* Payment Partner Icons */}
          <div className="flex flex-wrap items-center gap-3 bg-[var(--card)]/20 border border-[var(--border)]/50 px-5 py-2.5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text)]/40 mr-1.5">Payment Partners</span>
            <div className="flex items-center gap-3 text-[var(--text)]/60 text-xs font-black">
              {/* Visa Badge */}
              <div className="px-2 py-0.5 border border-[var(--border)] rounded bg-black/40 text-[9px] font-black tracking-widest uppercase border-slate-700/60 text-white">
                Visa
              </div>
              {/* MasterCard Badge */}
              <div className="px-2 py-0.5 border border-[var(--border)] rounded bg-black/40 text-[9px] font-black tracking-widest uppercase border-slate-700/60 text-white">
                MasterCard
              </div>
              {/* Rupay Badge */}
              <div className="px-2 py-0.5 border border-[var(--border)] rounded bg-black/40 text-[9px] font-black tracking-widest uppercase border-slate-700/60 text-white">
                Rupay
              </div>
              {/* UPI Badge */}
              <div className="px-2 py-0.5 border border-[var(--border)] rounded bg-black/40 text-[9px] font-black tracking-widest uppercase border-slate-700/60 text-white">
                UPI
              </div>
            </div>
          </div>

          {/* Copyright Info */}
          <div className="text-center lg:text-right space-y-1">
            <p className="text-[var(--text)]/50 text-xs font-bold">
              © 2026 <span className="text-white font-black">Balaji Mart</span>. All rights reserved.
            </p>
            <p className="text-[var(--text)]/35 text-[10px] font-semibold">
              Developed By <span className="text-[var(--primary)] font-bold">Premdeep kumar gupta</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
