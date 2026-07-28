import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Globe2, Truck, ShieldCheck, Users, Star, Award, TrendingUp, Loader2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const About = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAbout = async () => {
      try {
        const res = await axiosInstance.get("/site/about");
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch about data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--primary)]">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen pb-20 pt-28 bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-[var(--primary)]/10 text-[var(--primary)] mb-4">
            <Building2 size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            {data.title}
          </h1>
          <p className="text-lg md:text-xl opacity-70 leading-relaxed font-medium">
            {data.subtitle}
          </p>
        </motion.div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {data.stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 md:p-8 rounded-[2rem] text-center border border-[var(--border)] shadow-xl relative overflow-hidden group"
              style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-3xl md:text-4xl font-black text-[var(--primary)] mb-2 relative z-10">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest opacity-60 relative z-10">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* STORY & MISSION */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-black flex items-center gap-3">
              <Star className="text-[var(--primary)]" /> Our Story
            </h2>
            <p className="text-lg opacity-70 leading-relaxed">
              {data.story}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 p-8 rounded-[2rem] border border-[var(--primary)]/20 shadow-2xl relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--card)) 0%, var(--card) 100%)" }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--primary)]/10 rounded-full blur-3xl" />
            <h2 className="text-3xl font-black flex items-center gap-3 relative z-10">
              <Award className="text-[var(--primary)]" /> Our Mission
            </h2>
            <p className="text-lg opacity-80 leading-relaxed font-medium relative z-10">
              "{data.mission}"
            </p>
          </motion.div>
        </div>

        {/* CORE VALUES */}
        <div className="pt-10">
          <h2 className="text-3xl font-black text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe2, title: "Global Reach", desc: "Connecting you to international brands seamlessly." },
              { icon: Truck, title: "Ultra-Fast Delivery", desc: "Same-day and next-day deliveries for premium members." },
              { icon: ShieldCheck, title: "100% Secure", desc: "Bank-level encryption for all your transactions." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2rem] bg-[var(--card)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-black mb-3">{feature.title}</h3>
                <p className="opacity-60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;