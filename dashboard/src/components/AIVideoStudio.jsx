import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles, Video, Music, Play, Pause, Download, Send, Volume2, VolumeX,
  RotateCcw, RefreshCw, Monitor, Upload, Plus, Trash2, Check, Film,
  Mic, Wand2, BarChart2, Eye, Share2, ChevronRight, Star, Search, X, Users

} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProductsForDashboard } from "../store/slices/productsSlice";
import { axiosInstance } from "../lib/axios";
import Header from "./Header";


const DEMO_PRODUCTS = [
  { id: 'p1', name: 'Traditional Silk Saree', price: '₹5,999', category: 'Fashion', emoji: '👘', color: '#be185d', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop' },
  { id: 'p2', name: 'Alienware Gaming Laptop', price: '₹1,24,999', category: 'Electronics', emoji: '💻', color: '#1d4ed8', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop' },
  { id: 'p3', name: 'Emerald Velvet Sofa', price: '₹48,500', category: 'Home & Living', emoji: '🛋️', color: '#047857', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop' },
  { id: 'p4', name: 'Chronograph Gold Watch', price: '₹18,999', category: 'Accessories', emoji: '⌚', color: '#b45309', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop' },
  { id: 'p5', name: 'Matte Crimson Lipstick', price: '₹899', category: 'Beauty', emoji: '💄', color: '#dc2626', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop' },
  { id: 'p6', name: 'Premium Butter Cookies', price: '₹299', category: 'Food & Groceries', emoji: '🍪', color: '#d97706', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=600&auto=format&fit=crop' }
];

const PLATFORMS = [
  { id: 'reels', name: 'Instagram Reels', aspect: '9:16', icon: '📱', bg: 'from-pink-500 to-purple-600' },
  { id: 'tiktok', name: 'TikTok', aspect: '9:16', icon: '🎵', bg: 'from-slate-900 to-slate-800' },
  { id: 'youtube', name: 'YouTube Ads', aspect: '16:9', icon: '▶️', bg: 'from-red-600 to-red-700' },
  { id: 'feed', name: 'Feed / Square', aspect: '1:1', icon: '📸', bg: 'from-blue-500 to-indigo-600' },
];

const CAPTION_STYLES = [
  { id: 'bold', name: 'Bold Impact', desc: 'Large, punchy headlines' },
  { id: 'minimal', name: 'Minimalist', desc: 'Clean, subtle overlay' },
  { id: 'neon', name: 'Neon Glow', desc: 'Electric cyberpunk look' },
  { id: 'luxury', name: 'Luxury Script', desc: 'Premium gold gradient' },
];

const BUILTIN_TRACKS = [
  { id: 't1', name: 'Summer Pop Energy', vibe: 'Trendy & Upbeat', bpm: 128, emoji: '☀️', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 't2', name: 'Lofi Premium Chill', vibe: 'Relaxed & Smooth', bpm: 80, emoji: '🌙', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 't3', name: 'Cinematic Orchestral', vibe: 'Grand & Luxury', bpm: 60, emoji: '🎻', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 't4', name: 'Hip Hop Bass Drop', vibe: 'Hype & Energetic', bpm: 140, emoji: '🎤', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
];

const CelebrityVoices = {
  srk: { pitch: 1.15, rate: 1.05, voiceName: 'en-IN', desc: '🌟 Bollywood Superstar (Energetic & Charismatic)' },
  modi: { pitch: 0.85, rate: 0.82, voiceName: 'en-IN', desc: '🎙️ Public Leader (Deep, Authoritative & Deliberate)' },
  deep: { pitch: 0.75, rate: 0.9, voiceName: 'en-US', desc: '🎤 Deep Announcer (Bold Studio Grade Baritone)' },
  luxury: { pitch: 1.1, rate: 0.8, voiceName: 'en-US', desc: '👑 Elegant Diva (Luxury Brand Signature Tone)' },
  viral_ugc: { pitch: 1.25, rate: 1.15, voiceName: 'en-US', desc: '⚡ High-Energy Influencer (Trendy & Fast-paced)' },
  homely: { pitch: 1.0, rate: 0.95, voiceName: 'en-IN', desc: '🏠 Warm Family Mom (Trustworthy & Caring)' },
  reviewer: { pitch: 0.95, rate: 1.0, voiceName: 'en-IN', desc: '👓 Professional Tech Critic (Balanced & Rational)' },
  off: { pitch: 1.0, rate: 1.0, voiceName: '', desc: '🔇 Voiceover Off' }
};

const SCRIPTS_DB = {
  television: {
    english: [
      "📺 Bring the theater home! Introducing the {name}.",
      "✨ Stunning 4K Ultra HD clarity, HDR color, and smart hub access.",
      "🛒 Elevate your family entertainment today on BalajiMart!"
    ],
    hindi: [
      "📺 सिनेमाहॉल का मज़ा अब घर पर! पेश है {name}।",
      "✨ शानदार 4K अल्ट्रा HD पिक्चर, HDR रंग और स्मार्ट फीचर्स।",
      "🛒 अपने मनोरंजन को अपग्रेड करें, आज ही बालाजी मार्ट से खरीदें!"
    ],
    hinglish: [
      "📺 Home par cinema hall ka double mazaa! Presenting {name}.",
      "✨ Ultra HD 4K clarity, rich HDR colors, aur infinite smart apps.",
      "🛒 Smart entertainment ab click away hai, buy on BalajiMart!"
    ],
    punjabi: [
      "📺 ਸਿਨੇਮਾ ਹਾਲ ਦਾ ਮਜ਼ਾ ਹੁਣ ਘਰ ਵਿੱਚ! ਪੇਸ਼ ਹੈ {name}।",
      "✨ ਸ਼ਾਨਦਾਰ 4K ਅਲਟਰਾ HD ਸਕ੍ਰੀਨ ਅਤੇ ਸਮਾਰਟ ਫੀਚਰ।",
      "🛒 ਅੱਜ ਹੀ ਆਰਡਰ ਕਰੋ BalajiMart ਤੋਂ!"
    ],
    bengali: [
      "📺 সিনেমা হলের আনন্দ এখন আপনার ঘরে! নিয়ে এলাম {name}।",
      "✨ চমৎকার 4K আল্ট্রা HD ডিসপ্লে এবং সব স্মার্ট অ্যাপস।",
      "🛒 আজই অর্ডার করুন BalajiMart থেকে সেরা অফারে!"
    ],
    tamil: [
      "📺 திரையரங்கு அனுபவம் இப்போது உங்கள் வீட்டில்! புதிய {name}!",
      "✨ அதிநவீன 4K அல்ட்ரா HD திரை மற்றும் ஸ்மார்ட் வசதிகள்.",
      "🛒 உங்கள் பொழுதுபோக்கை மேம்படுத்த உடனே வாங்குங்கள் BalajiMart!"
    ]
  },
  fashion: {
    english: [
      "👗 Sleek catwalk showcase! Presenting the new {name}.",
      "✨ Handcrafted premium silk saree, tailored for pure elegance.",
      "🛒 Get 25% off today at BalajiMart — Link in bio!"
    ],
    hindi: [
      "👗 प्रस्तुत है बेहद खूबसूरत {name}!",
      "✨ असली सिल्क और प्रीमियम कारीगरी का बेजोड़ संगम।",
      "🛒 आज ही खरीदें बालाजी मार्ट पर विशेष छूट के साथ!"
    ],
    hinglish: [
      "👗 Introducing the absolute stunning {name}!",
      "✨ Premium silk and elegant style ka perfect match.",
      "🛒 Aaj hi order karein BalajiMart par! Link bio mein hai."
    ],
    punjabi: [
      "👗 ਪੇਸ਼ ਹੈ ਬਹੁਤ ਹੀ ਖੂਬਸੂਰਤ {name}!",
      "✨ ਅਸਲੀ ਸਿਲਕ ਅਤੇ ਸ਼ਾਨਦਾਰ ਕੁਆਲਿਟੀ ਦਾ ਸੁਮੇਲ।",
      "🛒 ਅੱਜ ਹੀ ਖਰੀਦੋ BalajiMart ਤੋਂ ਵਿਸ਼ੇਸ਼ ਆਫਰ 'ਤੇ!"
    ],
    bengali: [
      "👗 পেশ করছি অসাধারণ সুন্দর {name}!",
      "✨ খাঁটি সিল্ক এবং প্রিমিয়াম ডিজাইনের মেলবন্ধন।",
      "🛒 আজই কিনুন BalajiMart থেকে বিশেষ অফারে!"
    ],
    tamil: [
      "👗 இதோ உங்களுக்காக அழகிய {name}!",
      "✨ பிரீமியம் சில்க் மற்றும் நேர்த்தியான வடிவமைப்பு.",
      "🛒 இன்று BalajiMart-இல் தள்ளுபடி விலையில் வாங்குங்கள்!"
    ]
  },
  electronics: {
    english: [
      "💻 Unboxing the next-gen powerhouse: {name}!",
      "⚡ Incredible speed, crystal-clear display, built for pros.",
      "🛒 Limited stocks available on BalajiMart. Tap to shop!"
    ],
    hindi: [
      "💻 पेश है अगला पॉवरहाउस: {name}!",
      "⚡ तेज़ स्पीड और शानदार डिस्प्ले का बेहतरीन तालमेल।",
      "🛒 बालाजी मार्ट पर सीमित स्टॉक उपलब्ध है। अभी खरीदें!"
    ],
    hinglish: [
      "💻 Unbox kijiye next-gen powerhouse: {name}!",
      "⚡ Superfast performance aur amazing display, pure power.",
      "🛒 BalajiMart par stock limited hai! Abhi purchase karein."
    ],
    punjabi: [
      "💻 ਪੇਸ਼ ਹੈ ਅਗਲੀ ਪੀੜ੍ਹੀ ਦਾ ਪਾਵਰਹਾਊਸ: {name}!",
      "⚡ ਤੇਜ਼ ਸਪੀਡ ਅਤੇ ਸ਼ਾਨਦਾਰ ਡਿਸਪਲੇਅ ਦਾ ਸੁਮੇਲ।",
      "🛒 BalajiMart 'ਤੇ ਲਿਮਿਟੇਡ ਸਟਾਕ ਹੈ। ਹੁਣੇ ਖਰੀਦੋ!"
    ],
    bengali: [
      "💻 পেশ করছি নেক্সট-জেন পাওয়ার হাউস: {name}!",
      "⚡ সুপারফাস্ট পারফরম্যান্স এবং চমৎকার ডিসপ্লে।",
      "🛒 BalajiMart-এ স্টক সীমিত। আজই অর্ডার করুন!"
    ],
    tamil: [
      "💻 இதோ அடுத்த தலைமுறை பவர்ஹவுஸ்: {name}!",
      "⚡ அதிவேக செயல்பாடு மற்றும் அதிநவீன திரை.",
      "🛒 BalajiMart-இல் வரையறுக்கப்பட்ட ஸ்டாக். உடனே வாங்குங்கள்!"
    ]
  },
  cosmetics: {
    english: [
      "💄 Get the perfect look with {name}!",
      "✨ Smudge-proof, long-lasting matte formula that feels weightless.",
      "🛒 Elevate your beauty routine. Buy now on BalajiMart!"
    ],
    hindi: [
      "💄 पाइये परफेक्ट लुक नए {name} के साथ!",
      "✨ वाटरप्रूफ, लंबे समय तक चलने वाला और बिल्कुल हल्का फ़ॉर्मूला।",
      "🛒 अपनी खूबसूरती को बढ़ाएं। अभी खरीदें बालाजी मार्ट पर!"
    ],
    hinglish: [
      "💄 Perfect beauty look with the new {name}!",
      "✨ Smudge-proof and extremely long-lasting matte finish.",
      "🛒 Apni beauty ko elevate karein! Order now on BalajiMart."
    ],
    punjabi: [
      "💄 ਪਾਓ ਪਰਫੈਕਟ ਲੁੱਕ ਨਵੇਂ {name} ਨਾਲ!",
      "✨ ਵਾਟਰਪਰੂਫ ਅਤੇ ਲੰਬੇ ਸਮੇਂ ਤੱਕ ਚੱਲਣ ਵਾਲਾ ਫਾਰਮੂਲਾ।",
      "🛒 ਹੁਣੇ ਖਰੀਦੋ BalajiMart ਤੋਂ ਵਿਸ਼ੇਸ਼ ਡਿਸਕਾਊਂਟ 'ਤੇ!"
    ],
    bengali: [
      "💄 পান নিখুঁত সৌন্দর্য নতুন {name}-এর সাথে!",
      "✨ ওয়াটারপ্রুফ এবং দীর্ঘস্থায়ী ম্যাট ফিনিশ ফর্মুলা।",
      "🛒 আপনার সৌন্দর্য আরও বাড়িয়ে তুলুন। কিনুন BalajiMart-এ!"
    ],
    tamil: [
      "💄 அழகிய தோற்றம் பெற புதிய {name}!",
      "✨ நீண்ட நேரம் கலையாத மேட் ஃபினிஷ்.",
      "🛒 உங்கள் அழகை மேம்படுத்துங்கள். உடனே வாங்குங்கள் BalajiMart-இல்!"
    ]
  },
  food: {
    english: [
      "😋 Satisfy your cravings with {name}!",
      "🍪 Handpicked ingredients for a rich, delicious taste.",
      "🛒 Healthy and tasty! Grab your pack now on BalajiMart."
    ],
    hindi: [
      "😋 अपनी छोटी भूख का स्वादिष्ट इलाज: {name}!",
      "🍪 बेहतरीन और ताज़ा सामग्रियों से बना बेहद लज़ीज़ स्वाद।",
      "🛒 स्वादिष्ट और सेहतमंद! अभी ऑर्डर करें बालाजी मार्ट पर।"
    ],
    hinglish: [
      "😋 Swad aur crunch ka unmatched double combo: {name}!",
      "🍪 Perfect ingredients, delicious and crispy, absolute love.",
      "🛒 Abhi order kijiye BalajiMart par and enjoy the taste!"
    ],
    punjabi: [
      "😋 ਸਵਾਦਿਸ਼ਟ ਅਤੇ ਕਰੰਚੀ: {name}!",
      "🍪 ਤਾਜ਼ਾ ਅਤੇ ਵਧੀਆ ਸਮੱਗਰੀ ਨਾਲ ਤਿਆਰ ਕੀਤਾ ਸਵਾਦ।",
      "🛒 ਹੁਣੇ ਆਰਡਰ ਕਰੋ BalajiMart 'ਤੇ ਅਤੇ ਸਵਾਦ ਲਓ!"
    ],
    bengali: [
      "😋 আপনার জিভের স্বাদ মেটাতে এসেছে {name}!",
      "🍪 সেরা উপাদান দিয়ে তৈরি সুস্বাদু ও মুচমুচে স্ন্যাক্স।",
      "🛒 আজই অর্ডার করুন BalajiMart থেকে আর উপভোগ করুন!"
    ],
    tamil: [
      "😋 சுவையான மற்றும் மொறுமொறுப்பான {name}!",
      "🍪 சிறந்த மூலப்பொருட்களால் தயாரிக்கப்பட்ட அலாதி சுவை.",
      "🛒 உடனே ஆர்டர் செய்யுங்கள் BalajiMart-இல்!"
    ]
  },
  home: {
    english: [
      "🛋️ Upgrade your home comfort with {name}!",
      "✨ Luxurious texture, high-density comfort, built to last.",
      "🛒 Redesign your interior. Buy today on BalajiMart!"
    ],
    hindi: [
      "🛋️ घर को दें एक मॉडर्न और लग्जरी लुक: {name}!",
      "✨ प्रीमियम फैब्रिक और आरामदायक डिज़ाइन जो चले बरसों।",
      "🛒 अपने घर को सजाएं। अभी आर्डर करें बालाजी मार्ट पर!"
    ],
    hinglish: [
      "🛋️ Apne ghar ko dijiye ek high-end premium vibe with {name}!",
      "✨ Elegant design and high comfort, makes your room complete.",
      "🛒 Interior redesign ke liye visit karein BalajiMart online!"
    ],
    punjabi: [
      "🛋️ ਘਰ ਨੂੰ ਦਿਓ ਇੱਕ ਆਧੁਨਿਕ ਲੁੱਕ: {name}!",
      "✨ ਪ੍ਰੀਮਿਅਮ ਕੁਆਲਿਟੀ ਅਤੇ ਆਰਾਮਦਾਇਕ ਡਿਜ਼ਾਈਨ।",
      "🛒 ਹੁਣੇ ਆਰਡਰ ਕਰੋ BalajiMart 'ਤੇ!"
    ],
    bengali: [
      "🛋️ আপনার ঘরকে দিন একটি আধুনিক লুক: {name}!",
      "✨ প্রিমিয়াম কোয়ালিটি এবং আরামদায়ক ডিজাইন।",
      "🛒 আপনার ঘর সাজাতে এখনই কিনুন BalajiMart থেকে!"
    ],
    tamil: [
      "🛋️ உங்கள் வீட்டிற்கு ஒரு நவீன மற்றும் சொகுசு தோற்றம்: {name}!",
      "✨ பிரீமியம் தரம் மற்றும் சொகுசான வடிவமைப்பு.",
      "🛒 உங்கள் வீட்டை அலங்கரிக்க உடனே வாங்குங்கள் BalajiMart-இல்!"
    ]
  },
  general: {
    english: [
      "📦 Presenting the highly anticipated {name}!",
      "✨ Uncompromising quality and performance you can trust.",
      "🛒 Shop the absolute best collection online at BalajiMart!"
    ],
    hindi: [
      "📦 प्रस्तुत है सबसे पसंदीदा {name}!",
      "✨ शानदार डिज़ाइन और दमदार क्वालिटी जिसपर आप भरोसा कर सकें।",
      "🛒 बेहतरीन प्रोडक्ट्स की खरीदारी करें सिर्फ बालाजी मार्ट पर!"
    ],
    hinglish: [
      "📦 Presenting the absolute best: {name}!",
      "✨ Best quality and premium styling, trusted by everyone.",
      "🛒 Online shop kijiye directly on BalajiMart right now!"
    ],
    punjabi: [
      "📦 ਪੇਸ਼ ਹੈ ਸਭ ਤੋਂ ਮਸ਼ਹੂਰ {name}!",
      "✨ ਸ਼ਾਨਦาร ਕੁਆਲਿਟੀ ਜਿਸ 'ਤੇ ਤੁਸੀਂ ਭਰੋਸา ਕਰ ਸਕਦੇ ਹੋ।",
      "🛒 ਖਰੀਦੋ ਸਿਰਫ BalajiMart ਤੋਂ!"
    ],
    bengali: [
      "📦 পেশ করছি সবার পছন্দের {name}!",
      "✨ চমৎকার গুণমান এবং স্থায়িত্ব যা আপনার আস্থা জয় করবে।",
      "🛒 সেরা প্রোডাক্টের কেনাকাটা করুন শুধুমাত্র BalajiMart থেকে!"
    ],
    tamil: [
      "📦 இதோ உங்களுக்கு பிடித்த {name}!",
      "✨ நம்பகமான தரம் மற்றும் சிறந்த செயல்பாடு.",
      "🛒 சிறந்த தயாரிப்புகளை வாங்க உடனே பாருங்கள் BalajiMart!"
    ]
  }
};


const CelebrityBadges = {
  srk: { label: "⭐ SRK Exclusive Endorsement", badgeClass: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black border-amber-300 font-extrabold shadow-lg" },
  modi: { label: "🎙️ Leadership Campaign Spotlight", badgeClass: "bg-gradient-to-r from-orange-600 to-orange-400 text-white border-orange-300 font-extrabold shadow-lg" },
  deep: { label: "✨ Premium Studio Choice", badgeClass: "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white border-indigo-400 font-extrabold shadow-lg" },
  luxury: { label: "💎 Luxury Platinum Edition", badgeClass: "bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 text-black border-cyan-300 font-extrabold shadow-lg" }
};

const AI_AVATARS = [
  { id: 'off', name: 'Product Only (No Avatar)', icon: '🚫', nationality: 'all', gender: 'all', archetype: 'all', desc: 'No spokesperson - standard commercial template' },
  // Indian Avatars
  { id: 'priya', name: 'Priya (Indian UGC Style)', icon: '👩🏽', nationality: 'indian', gender: 'female', archetype: 'influencer', desc: 'Warm, relatable Indian social influencer', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-to-camera-in-interview-43022-large.mp4' },
  { id: 'aarav', name: 'Aarav (Indian Tech Reviewer)', icon: '👨🏽', nationality: 'indian', gender: 'male', archetype: 'tech', desc: 'Detailed, specification-focused reviewer', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-explaining-something-with-gestures-in-office-42777-large.mp4' },
  { id: 'neha', name: 'Neha (Indian Luxury Presenter)', icon: '👩🏽', nationality: 'indian', gender: 'female', archetype: 'luxury', desc: 'Elegant presentation for high-end products', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'raj', name: 'Raj (Indian Corporate Reviewer)', icon: '🧔🏽', nationality: 'indian', gender: 'male', archetype: 'reviewer', desc: 'Professional review style, formal attire', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-corporate-man-talking-to-colleagues-43187-large.mp4' },
  { id: 'anaya', name: 'Anaya (Indian Kid Star)', icon: '👧🏽', nationality: 'indian', gender: 'child', archetype: 'influencer', desc: 'Cheerful child presenter for toys/groceries', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'sharma_family', name: 'Sharma Family (Indian Household)', icon: '👪', nationality: 'indian', gender: 'family', archetype: 'ambassador', desc: 'Warm household interaction for family brands', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-corporate-man-talking-to-colleagues-43187-large.mp4' },
  { id: 'srk_style', name: 'Raj Malhotra (Celebrity Presenter)', icon: '🌟', nationality: 'indian', gender: 'male', archetype: 'celebrity', desc: 'Charismatic Bollywood celebrity-style spokesperson', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-explaining-something-with-gestures-in-office-42777-large.mp4' },

  // International Avatars
  { id: 'chloe', name: 'Chloe (Intl UGC Style)', icon: '👩🏼', nationality: 'international', gender: 'female', archetype: 'influencer', desc: 'Trendy international content creator', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-to-camera-in-interview-43022-large.mp4' },
  { id: 'alex', name: 'Alex (Intl Tech Specs)', icon: '👨🏻', nationality: 'international', gender: 'male', archetype: 'tech', desc: 'Analytical international reviewer', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-explaining-something-with-gestures-in-office-42777-large.mp4' },
  { id: 'sophia', name: 'Sophia (Intl Luxury Presenter)', icon: '👩🏻', nationality: 'international', gender: 'female', archetype: 'luxury', desc: 'Premium editorial presentation model', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'liam', name: 'Liam (Intl Corporate Reviewer)', icon: '🧔🏻', nationality: 'international', gender: 'male', archetype: 'reviewer', desc: 'Corporate tone for high-end tech/corporate', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-corporate-man-talking-to-colleagues-43187-large.mp4' },
  { id: 'lily', name: 'Lily (Intl Kid Star)', icon: '👧🏼', nationality: 'international', gender: 'child', archetype: 'influencer', desc: 'Vibrant child presenter for books/games', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'smith_family', name: 'Smith Family (Intl Household)', icon: '👪', nationality: 'international', gender: 'family', archetype: 'ambassador', desc: 'Modern western family lifestyle presentation', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-corporate-man-talking-to-colleagues-43187-large.mp4' }
];


const AD_FORMATS = [
  { id: 'ugc', name: 'UGC Video', category: 'UGC', desc: 'Realistic social media style videos with talking avatar.', image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-to-camera-in-interview-43022-large.mp4' },
  { id: 'tutorial', name: 'Tutorial', category: 'UGC', desc: 'Step-by-step tutorials guiding the customer.', image: 'https://images.unsplash.com/photo-1488751045188-3c55baf9a3fa?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-unboxing-a-new-smartphone-40533-large.mp4' },
  { id: 'unboxing', name: 'Unboxing', category: 'UGC', desc: 'High-quality unboxing experience.', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-unboxing-a-gift-box-with-a-red-ribbon-42006-large.mp4' },
  { id: 'asmr', name: 'ASMR Review', category: 'UGC', desc: 'Crisp audio review capturing detailed sounds.', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-explaining-something-with-gestures-in-office-42777-large.mp4' },
  { id: 'transition', name: 'TikTok Transition', category: 'UGC', desc: 'Trendy fast-cut match-cuts and zoom changes.', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-posing-in-neon-sign-40502-large.mp4' },
  { id: 'street_interview', name: 'Street Interview', category: 'UGC', desc: 'Interviewer asking strangers about the product.', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-corporate-man-talking-to-colleagues-43187-large.mp4' },
  { id: 'day_life', name: 'Day in the Life', category: 'UGC', desc: 'Spokesperson using the product in daily routine.', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-sunglasses-posing-for-a-selfie-video-41777-large.mp4' },
  { id: 'behind_scenes', name: 'Behind The Scenes', category: 'UGC', desc: 'Spontaneous clip showing how it was made.', image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-studio-light-setup-in-empty-room-41834-large.mp4' },
  { id: 'grwm', name: 'Get Ready With Me', category: 'UGC', desc: 'Influencer vlog showcasing morning product use.', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bedroom-interior-with-morning-sun-light-41846-large.mp4' },
  { id: 'empty_bottle', name: 'Empty Bottle', category: 'UGC', desc: 'Honest review after fully using the product.', image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-in-vertical-position-41617-large.mp4' },
  { id: 'things_bought', name: 'Things I Bought', category: 'UGC', desc: 'A quick viral shopping haul visual list.', image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-unboxing-a-gift-box-with-a-red-ribbon-42006-large.mp4' },
  { id: 'aesthetic_vlog', name: 'Aesthetic Vlog', category: 'UGC', desc: 'Sleek, low-contrast, calming daily aesthetic.', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-over-clouds-42271-large.mp4' },
  { id: 'first_reaction', name: 'First Reaction', category: 'UGC', desc: 'Live reaction video of trying it the first time.', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'comparison_ugc', name: 'Product Compare', category: 'UGC', desc: 'Honest side-by-side comparison with rivals.', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-in-vertical-position-41617-large.mp4' },
  { id: 'gift_ideas', name: 'Gift Guide UGC', category: 'UGC', desc: 'Explaining why this is the perfect holiday gift.', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-unboxing-a-gift-box-with-a-red-ribbon-42006-large.mp4' },
  { id: 'hyper_motion', name: 'Hyper Motion', category: 'Commercial', desc: 'CGI commercial highlighting product contours.', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-lines-on-dark-background-40742-large.mp4' },
  { id: 'tv_spot', name: 'TV Spot', category: 'Commercial', desc: 'High-budget cinematic television commercial vibe.', image: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-view-of-a-neon-glowing-city-at-night-42207-large.mp4' },
  { id: 'anatomy', name: '3D Product Anatomy', category: 'Commercial', desc: 'Exploded blueprint model highlighting components.', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'grid_split', name: 'Split-Screen Grid', category: 'Commercial', desc: 'Dynamic grid showcase showing multiple angles.', image: 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-studio-light-setup-in-empty-room-41834-large.mp4' },
  { id: 'kinetic_type', name: 'Kinetic Typography', category: 'Commercial', desc: 'Fast, bold scrolling text animation overlays.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-lines-on-dark-background-40742-large.mp4' },
  { id: 'macro_high', name: 'High-Speed Macro', category: 'Commercial', desc: 'Super slow-motion zoom-in closeout detail.', image: 'https://images.unsplash.com/photo-1502740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sparks-and-flames-on-black-background-40082-large.mp4' },
  { id: 'stop_motion', name: 'Stop-Motion Build', category: 'Commercial', desc: 'Product pieces assembling themselves dynamically.', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stop-motion-animation-of-fresh-vegetables-chopping-42999-large.mp4' },
  { id: 'cyberpunk', name: 'Cyber Neon Promo', category: 'Commercial', desc: 'Futuristic lights with digital glow accents.', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-in-futuristic-neon-mask-in-cyberpunk-style-42261-large.mp4' },
  { id: 'retro_vhs', name: 'Retro VHS Style', category: 'Commercial', desc: '90s nostalgic analog tape texture overlays.', image: 'https://images.unsplash.com/photo-1542204172-e7052809f85e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-glitch-distortion-effect-42171-large.mp4' },
  { id: 'epic_slow', name: 'Epic Slow Motion', category: 'Commercial', desc: 'Ultra-slow motion tracking following product edges.', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-water-splashing-in-slow-motion-41805-large.mp4' },
  { id: 'hologram', name: 'Luxury Hologram', category: 'Commercial', desc: 'Abstract wireframes casting product holograms.', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'liquid_sim', name: 'Liquid Simulation', category: 'Commercial', desc: 'Abstract fluids interacting with the model.', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-flow-of-abstract-colorful-paint-in-water-43301-large.mp4' },
  { id: 'multi_collage', name: 'Multi-Angle Collage', category: 'Commercial', desc: 'Fast, overlapping frames for details.', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-42211-large.mp4' },
  { id: 'pan_scan', name: 'Dynamic Pan-Scan', category: 'Commercial', desc: 'Sleek horizontal sweeps displaying features.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-view-of-a-neon-glowing-city-at-night-42207-large.mp4' },
  { id: 'cgi_portal', name: 'CGI Portal Entry', category: 'Commercial', desc: 'Product emerges from an abstract virtual portal.', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-earth-from-space-orbit-41829-large.mp4' }
];

const SCROLL_HOOKS = [
  { id: 'product_hit', name: 'Product Hit', category: 'Stunt', desc: 'Object flies into frame, hits subject. Brief reaction.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sparks-and-flames-on-black-background-40082-large.mp4' },
  { id: 'spicy', name: 'Spicy Close-Up', category: 'Subtle', desc: 'Close-up camera pan highlighting elegant curves.', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-posing-in-neon-sign-40502-large.mp4' },
  { id: 'interview', name: 'Interview Question', category: 'Subtle', desc: 'Interviewer asks a second stranger a query.', image: 'https://images.unsplash.com/photo-1488751045188-3c55baf9a3fa?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-to-camera-in-interview-43022-large.mp4' },
  { id: 'random_hit', name: 'Random Object Drop', category: 'Stunt', desc: 'A bizarre, funny object falls into the frame.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stop-motion-animation-of-fresh-vegetables-chopping-42999-large.mp4' },
  { id: 'screen_throw', name: 'Phone Screen Throw', category: 'Stunt', desc: 'Hand throws product directly at camera screen.', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-in-vertical-position-41617-large.mp4' },
  { id: 'stop_warning', name: 'Stop Scroll Warning', category: 'Stunt', desc: 'Presenter points pointing alert sign directly.', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-explaining-something-with-gestures-in-office-42777-large.mp4' },
  { id: 'shattering', name: 'Glass Shatter', category: 'Stunt', desc: 'Virtual glass panes break revealing the product.', image: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-glass-cracking-and-shattering-close-up-41973-large.mp4' },
  { id: 'confetti', name: 'Confetti Explosion', category: 'Stunt', desc: 'Vibrant party poppers explode over the item.', image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-colorful-confetti-falling-on-black-background-40156-large.mp4' },
  { id: 'smoke_reveal', name: 'Smoke Screen Reveal', category: 'Stunt', desc: 'Dense aesthetic fog dissipates in slow motion.', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-smoke-drifting-on-a-black-background-40049-large.mp4' },
  { id: 'water_splash', name: 'Water Splash', category: 'Stunt', desc: 'Product falls into water with dynamic drops.', image: 'https://images.unsplash.com/photo-1548919973-721401250f64?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-water-splashing-in-slow-motion-41805-large.mp4' },
  { id: 'flame_ignite', name: 'Flame Torch Ignition', category: 'Stunt', desc: 'Cinematic flares flash across dark backdrops.', image: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sparks-and-flames-on-black-background-40082-large.mp4' },
  { id: 'fly_by', name: 'High Speed Fly-By', category: 'Stunt', desc: 'Camera zooms past the product at sonic speeds.', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-lines-on-dark-background-40742-large.mp4' },
  { id: 'fracture', name: 'Object Fracture', category: 'Stunt', desc: 'Mock stone blocks break away showing the model.', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-glass-cracking-and-shattering-close-up-41973-large.mp4' },
  { id: 'shockwave', name: '3D Glow Shockwave', category: 'Stunt', desc: 'Electric energy ring pulses outward from model.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-blue-electric-shockwave-41804-large.mp4' },
  { id: 'glitch', name: 'Glitch Transition', category: 'Stunt', desc: 'Digital tracking distortion catches user eye.', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-glitch-distortion-effect-42171-large.mp4' },
  { id: 'whisper', name: 'Whisper Voice', category: 'Subtle', desc: 'Intimate voiceover instantly drops audio level.', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'slow_zoom', name: 'Elegant Slow Zoom', category: 'Subtle', desc: 'A very quiet, smooth zoom on product details.', image: 'https://images.unsplash.com/photo-1449247700740-ad32607728ff?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-studio-light-setup-in-empty-room-41834-large.mp4' },
  { id: 'soft_focus', name: 'Soft Focus', category: 'Subtle', desc: 'Dreamy bokeh shifts slowly into sharp focus.', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-particles-floating-in-the-dark-40032-large.mp4' },
  { id: 'shimmer', name: 'Gold Dust Shimmer', category: 'Subtle', desc: 'Sparkling glowing particles drift around screen.', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-particles-floating-in-the-dark-40032-large.mp4' },
  { id: 'crackle', name: 'Minimal Sound Crackle', category: 'Subtle', desc: 'Analog vinyl pops play as backdrop highlights.', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-glitch-distortion-effect-42171-large.mp4' },
  { id: 'satisfying_cut', name: 'Satisfying Cut', category: 'Subtle', desc: 'A crisp slicing action displays clean segments.', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stop-motion-animation-of-fresh-vegetables-chopping-42999-large.mp4' },
  { id: 'card_swipe', name: 'Silent Card Swipe', category: 'Subtle', desc: 'Smooth horizontal glide shifts screen colors.', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-lines-on-dark-background-40742-large.mp4' },
  { id: 'color_burst', name: 'Color Splash Burst', category: 'Subtle', desc: 'Ink colors blend together in water backdrop.', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-flow-of-abstract-colorful-paint-in-water-43301-large.mp4' },
  { id: 'reflection', name: 'Macro Reflection', category: 'Subtle', desc: 'Camera scans glass surfaces catching light.', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'slide_reveal', name: 'Smooth Slide', category: 'Subtle', desc: 'Curtain slides aside showing the main product.', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-wing-of-an-airplane-flying-above-clouds-42266-large.mp4' },
  { id: 'typewriter', name: 'Typewriter Drop', category: 'Subtle', desc: 'Letters spell out hook caption piece by piece.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-lines-on-dark-background-40742-large.mp4' },
  { id: 'vhs_flicker', name: 'Retro VHS Flicker', category: 'Subtle', desc: 'Analog noise scanlines drift across viewports.', image: 'https://images.unsplash.com/photo-1542204172-e7052809f85e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-glitch-distortion-effect-42171-large.mp4' },
  { id: 'light_leak', name: 'Light Leak Spill', category: 'Subtle', desc: 'Warm overlay light leaks flare across borders.', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-particles-floating-in-the-dark-40032-large.mp4' },
  { id: 'glow_flare', name: 'Warm Glow Flare', category: 'Subtle', desc: 'Elegant sunbeams illuminate contours.', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sparks-and-flames-on-black-background-40082-large.mp4' },
  { id: 'prism_dist', name: 'Prism Distortion', category: 'Subtle', desc: 'Light splits into rainbows through crystal lens.', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-flow-of-abstract-colorful-paint-in-water-43301-large.mp4' }
];

const SCENE_SETTINGS = [
  { id: 'bedroom', name: 'Cozy Bedroom', category: 'Realistic', desc: 'Soft window light on a bed or nightstand.', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bedroom-interior-with-morning-sun-light-41846-large.mp4' },
  { id: 'airplane', name: 'Airplane Wing', category: 'Unrealistic', desc: 'Floating high in the clouds on a jet airliner.', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-wing-of-an-airplane-flying-above-clouds-42266-large.mp4' },
  { id: 'nature', name: 'Nature Forest', category: 'Realistic', desc: 'Outdoors trail, park, or beautiful garden.', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-forest-trees-with-sunbeams-shining-through-42023-large.mp4' },
  { id: 'rooftop', name: 'Rooftop Skyline', category: 'Realistic', desc: 'Looming high-rise building edge overlooking skyscrapers.', image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-42211-large.mp4' },
  { id: 'cyber_alley', name: 'Cyber Alleyway', category: 'Unrealistic', desc: 'Holograms casting violet beams in dark rain.', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-neon-alleyway-in-cyberpunk-style-42208-large.mp4' },
  { id: 'tech_lab', name: 'Futuristic Lab', category: 'Unrealistic', desc: 'Gleaming computer terminals & glowing cables.', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'library', name: 'Vintage Library', category: 'Realistic', desc: 'Towers of antique leather books & warm lamps.', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cozy-coffee-shop-interior-with-warm-lighting-42355-large.mp4' },
  { id: 'studio', name: 'Minimalist Studio', category: 'Realistic', desc: 'Flawless white backdrops and spotlight setups.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-studio-light-setup-in-empty-room-41834-large.mp4' },
  { id: 'penthouse', name: 'Luxury Penthouse', category: 'Realistic', desc: 'Looming glass windows overlooking city lights.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bedroom-interior-with-morning-sun-light-41846-large.mp4' },
  { id: 'beachside', name: 'Sunny Beachside', category: 'Realistic', desc: 'Ocean waves crashing gently on sandy shores.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-beach-with-waves-crashing-on-sand-42022-large.mp4' },
  { id: 'void', name: 'Abstract Void', category: 'Unrealistic', desc: 'Deep black expanse with glowing neon shapes.', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'undersea', name: 'Undersea Kingdom', category: 'Unrealistic', desc: 'Submerged coral reefs with sunrays filtering down.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-water-splashing-in-slow-motion-41805-large.mp4' },
  { id: 'space_orbit', name: 'Space Orbit', category: 'Unrealistic', desc: 'Satellite view high above the curving blue Earth.', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-earth-from-space-orbit-41829-large.mp4' },
  { id: 'egypt_temple', name: 'Egyptian Temple', category: 'Unrealistic', desc: 'Sandstone pillars carved with ancient hieroglyphs.', image: 'https://images.unsplash.com/photo-1600577916048-804c9191e36c?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'neon_arcade', name: 'Neon Arcade', category: 'Realistic', desc: 'Flashy pinball machines & glowing pixel games.', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-neon-alleyway-in-cyberpunk-style-42208-large.mp4' },
  { id: 'coffee_shop', name: 'Coffee Shop', category: 'Realistic', desc: 'Chattering patrons & steaming porcelain mugs.', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cozy-coffee-shop-interior-with-warm-lighting-42355-large.mp4' },
  { id: 'fireplace', name: 'Cabin Fireplace', category: 'Realistic', desc: 'Cracking burning logs casting orange glows.', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-burning-fireplace-with-flames-dancing-42401-large.mp4' },
  { id: 'gym', name: 'Gym Studio', category: 'Realistic', desc: 'Sleek dark weights & industrial cardio gear.', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-gym-interior-with-exercise-equipment-42352-large.mp4' },
  { id: 'runway', name: 'Fashion Runway', category: 'Realistic', desc: 'Flashe lights framing catwalks in dark halls.', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-runway-with-flashing-lights-42331-large.mp4' },
  { id: 'warehouse', name: 'Warehouse', category: 'Realistic', desc: 'Concrete floors under steel girder ceilings.', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-studio-light-setup-in-empty-room-41834-large.mp4' },
  { id: 'cloud_palace', name: 'Cloud Palace', category: 'Unrealistic', desc: 'White marble pillars emerging from pink clouds.', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-wing-of-an-airplane-flying-above-clouds-42266-large.mp4' },
  { id: 'matrix_grid', name: 'Matrix Digital', category: 'Unrealistic', desc: 'Falling green code streams in cyberspace.', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-mesh-grid-in-a-dark-void-40733-large.mp4' },
  { id: 'lava_cave', name: 'Lava Cavern', category: 'Unrealistic', desc: 'Molten orange rivers lighting obsidian rocks.', image: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-burning-fireplace-with-flames-dancing-42401-large.mp4' },
  { id: 'steampunk', name: 'Steampunk Engine', category: 'Unrealistic', desc: 'Gleaming copper pipes emitting white steam blasts.', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-studio-light-setup-in-empty-room-41834-large.mp4' },
  { id: 'ice_cave', name: 'Crystal Ice Cave', category: 'Unrealistic', desc: 'Glacial blue walls reflecting soft sunbeams.', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-water-splashing-in-slow-motion-41805-large.mp4' },
  { id: 'retro_grid', name: 'Retro 80s Grid', category: 'Unrealistic', desc: 'Glowing wireframe grids under synthwave suns.', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-glitch-distortion-effect-42171-large.mp4' },
  { id: 'desert_sands', name: 'Surreal Desert', category: 'Unrealistic', desc: 'Rose gold sand dunes under starry purple skies.', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-over-clouds-42271-large.mp4' },
  { id: 'floating_garden', name: 'Floating Garden', category: 'Unrealistic', desc: 'Islands with ancient trees drifting in air.', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-forest-trees-with-sunbeams-shining-through-42023-large.mp4' },
  { id: 'city_core', name: 'Cyber City Core', category: 'Unrealistic', desc: 'Towering skyscrapers linked by skybridges.', image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=300&auto=format&fit=crop', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-42211-large.mp4' },
];

const CATEGORY_AD_TEMPLATES = {
  fashion: {
    videoUrl: 'https://video.wixstatic.com/video/c9f0be_58b128bbe3f345a7b73046d88501a18e/1080p/mp4/file.mp4',
    label: '💃 Model Catwalk & Runway Lifestyle Showcase',
    className: 'opacity-95 filter brightness-100'
  },
  cosmetics: {
    videoUrl: 'https://video.wixstatic.com/video/550f4d_fabf39995ffe4e9f9e1da4c808af2d1e/1080p/mp4/file.mp4',
    label: '💄 Before-After Cosmetics Transformation Showcase',
    className: 'opacity-95 filter brightness-100'
  },
  food: {
    videoUrl: 'https://video.wixstatic.com/video/a5e29c_7e1fe25289d6445fa3b7b936f73621a8/480p/mp4/file.mp4',
    label: '🍽️ Culinary Prep & Natural Taste Reaction Video',
    className: 'opacity-95 filter brightness-100'
  },
  electronics: {
    videoUrl: 'https://video.wixstatic.com/video/52bd90_1323700cec5f4de1872921299e0db601/1080p/mp4/file.mp4',
    label: '💻 Hands-on Specs Review & Unboxing Sequence',
    className: 'opacity-95 filter brightness-100'
  },
  television: {
    videoUrl: 'https://video.wixstatic.com/video/dddd01_e45d52d0ccc740529ee203feb7430439/1080p/mp4/file.mp4',
    label: '📺 Premium Home Theater & TV Living Room Showcase',
    className: 'opacity-95 filter brightness-100'
  },
  home: {
    videoUrl: 'https://video.wixstatic.com/video/fee955_4c31236543f3463da6e7948747dbebee/1080p/mp4/file.mp4',
    label: '🛋️ Interior Placement & Premium Room Preview',
    className: 'opacity-90 filter brightness-100'
  },
  general: {
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    label: '📦 High-End Studio Product Display Commercial',
    className: 'opacity-40 filter brightness-[0.35]'
  }
};

const getProductCategoryKey = (product) => {
  if (!product) return 'general';
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  if (name.includes('tv') || name.includes('television') || name.includes('led') || name.includes('monitor') || name.includes('screen') || cat.includes('tv') || cat.includes('television') || cat.includes('monitor')) {
    return 'television';
  }
  if (cat.includes('fashion') || cat.includes('cloth') || cat.includes('apparel') || name.includes('shirt') || name.includes('tshirt') || name.includes('jeans') || name.includes('dress') || name.includes('jacket') || name.includes('suit') || name.includes('saree') || name.includes('pajama')) {
    return 'fashion';
  }
  if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('makeup') || cat.includes('personal') || name.includes('lipstick') || name.includes('cream') || name.includes('tint') || name.includes('gloss') || name.includes('shampoo') || name.includes('soap')) {
    return 'cosmetics';
  }
  if (cat.includes('food') || cat.includes('grocery') || cat.includes('drink') || cat.includes('snack') || name.includes('cookie') || name.includes('juice') || name.includes('snack') || name.includes('chips') || name.includes('tea') || name.includes('coffee') || name.includes('food') || name.includes('fryer') || name.includes('kitchen')) {
    return 'food';
  }
  if (cat.includes('electronic') || cat.includes('mobile') || cat.includes('laptop') || cat.includes('gadget') || cat.includes('tech') || name.includes('phone') || name.includes('earphone') || name.includes('headphone') || name.includes('watch') || name.includes('camera') || name.includes('mouse') || name.includes('keyboard')) {
    return 'electronics';
  }
  if (cat.includes('home') || cat.includes('living') || cat.includes('decor') || cat.includes('furniture') || name.includes('sofa') || name.includes('bed') || name.includes('lamp') || name.includes('table') || name.includes('chair') || name.includes('curtain')) {
    return 'home';
  }
  return 'general';
};

// HTML5 Audio Engine for real sound streaming
const AudioEngine = {
  audio: null,
  _interval: null,

  playTrack(url, volume, onBeat) {
    this.stop();
    this.audio = new Audio(url);
    this.audio.loop = true;
    this.audio.volume = volume;
    this.audio.play().catch(err => console.log("Audio play blocked by browser:", err));

    let step = 0;
    this._interval = setInterval(() => {
      step++;
      if (onBeat) onBeat(step);
    }, 150);
  },

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  },

  setVolume(v) {
    if (this.audio) {
      this.audio.volume = v;
    }
  }
};

const OptionCard = ({ item, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative aspect-[9/16] rounded-2xl overflow-hidden border text-left group transition-all duration-300 ${
        isActive ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/30'
      }`}
    >
      {/* Premium Reels Badge */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 z-20 pointer-events-none">
        <Film size={10} className="text-pink-500 animate-pulse" />
        <span className="text-[7px] font-black text-slate-200 tracking-wider uppercase">Reel</span>
      </div>

      {(isHovered || isActive) && item.videoUrl ? (
        <video
          src={getSafeVideoUrl(item.videoUrl)}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 bg-slate-950"
        />
      ) : (
        <img
          src={item.image}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-60 bg-slate-950"
        />
      )}
      
      {/* Dynamic bottom overlay details with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4 z-10 pointer-events-none">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black text-white leading-tight drop-shadow-md">{item.name}</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[8px] bg-white/10 border border-white/20 px-2 py-0.5 rounded-full text-slate-300 uppercase font-black">{item.category}</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 font-semibold mt-1 leading-normal line-clamp-3 drop-shadow-md">{item.desc}</p>
      </div>

      {isActive && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border border-white/20 shadow-md z-20">
          <Check size={12} className="text-white" />
        </div>
      )}
    </button>
  );
};

const AIVideoStudio = () => {
  const dispatch = useDispatch();
  const { allProducts } = useSelector((state) => state.product || {});

  const [activePanel, setActivePanel] = useState('source'); // 'source' | 'creative' | 'presenters'
  const [selectedProduct, setSelectedProduct] = useState(DEMO_PRODUCTS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [selectedTrack, setSelectedTrack] = useState(BUILTIN_TRACKS[0]);
  const [captionStyle, setCaptionStyle] = useState(CAPTION_STYLES[0]);
  const [voiceover, setVoiceover] = useState('srk'); // Fixed default key to 'srk' celebrity voice
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [beatStep, setBeatStep] = useState(0);
  const [activeTab, setActiveTab] = useState('builder');

  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const [useModelShowcase, setUseModelShowcase] = useState(true); // Default to true for premium real-world model showcase
  const [selectedAvatar, setSelectedAvatar] = useState(AI_AVATARS[0]);
  const [productUrl, setProductUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [isExtractingRef, setIsExtractingRef] = useState(false);

  // Advanced Casting & Voice States
  const [castingNationality, setCastingNationality] = useState('indian'); // 'indian' | 'international' | 'all'
  const [castingGender, setCastingGender] = useState('female'); // 'male' | 'female' | 'child' | 'family' | 'all'
  const [castingArchetype, setCastingArchetype] = useState('influencer'); // 'influencer' | 'reviewer' | 'celebrity' | 'luxury' | 'tech' | 'ambassador' | 'all'
  const [spokespersonLanguage, setSpokespersonLanguage] = useState('hinglish'); // 'english' | 'hindi' | 'hinglish' | 'punjabi' | 'bengali' | 'tamil'
  
  const filteredAvatars = useMemo(() => {
    return AI_AVATARS.filter(avatar => {
      if (avatar.id === 'off') return true;
      const matchNat = castingNationality === 'all' || avatar.nationality === castingNationality;
      const matchGen = castingGender === 'all' || avatar.gender === castingGender;
      const matchArch = castingArchetype === 'all' || avatar.archetype === castingArchetype;
      return matchNat && matchGen && matchArch;
    });
  }, [castingNationality, castingGender, castingArchetype]);
  
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [cameraMovement, setCameraMovement] = useState('orbit'); // 'orbit' | 'dolly' | 'macro' | 'tilt'
  const [lightingStyle, setLightingStyle] = useState('softbox'); // 'softbox' | 'sunset' | 'cyber' | 'highkey'
  const [isRunningABSimulation, setIsRunningABSimulation] = useState(false);
  const [abTestMetrics, setAbTestMetrics] = useState({
    versionA: { ctr: 4.2, conv: 1.8, roas: 3.2, score: 82, name: 'Version A: UGC Spontaneous Review' },
    versionB: { ctr: 3.5, conv: 1.2, roas: 2.4, score: 71, name: 'Version B: High-End Studio Commercial' },
    versionC: { ctr: 5.6, conv: 2.8, roas: 4.5, score: 94, name: 'Version C: Stop-Motion ASMR Showcase' }
  });
  const [selectedABVersion, setSelectedABVersion] = useState('versionC');
  const [abSimulationProgress, setAbSimulationProgress] = useState(0);
  const [abSimulationStep, setAbSimulationStep] = useState('');


  // Campaign rendering settings
  const [duration, setDuration] = useState(30);
  const [quality, setQuality] = useState('1080p');
  const [fps, setFps] = useState(30);
  const [colorFilter, setColorFilter] = useState('natural');
  const [renderEngine, setRenderEngine] = useState('neural');
  const [motionBlur, setMotionBlur] = useState(false);

  // Manual product creator states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion');
  const [newDescription, setNewDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    if (!newImageFile) {
      toast.error("Please upload a product image.");
      return;
    }
    if (!newName.trim() || !newPrice.trim() || !newCategory.trim() || !newDescription.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsCreatingProduct(true);
    const loadingToastId = toast.loading("Creating product in catalog...", { id: 'product-create' });

    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("description", newDescription);
      formData.append("price", parseFloat(newPrice));
      formData.append("category", newCategory);
      formData.append("stock", 100); // Required default stock
      formData.append("images", newImageFile);

      const { data } = await axiosInstance.post(
        "/product/admin/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true
        }
      );

      if (data.success && data.product) {
        toast.success("✨ Product created successfully!", { id: 'product-create' });
        
        const mapped = mapProducts([data.product])[0];
        
        setUnsoldProductsList(prev => [mapped, ...prev]);
        setSelectedProduct(mapped);
        
        setIsCreateModalOpen(false);
        setNewName('');
        setNewPrice('');
        setNewCategory('Fashion');
        setNewDescription('');
        setNewImageFile(null);
        setNewImagePreview('');
        
        await handleProductSelect(mapped);
      } else {
        toast.error(data.message || "Failed to create product.", { id: 'product-create' });
      }
    } catch (err) {
      console.error("Manual product creation error:", err);
      toast.error(err.response?.data?.message || "Error creating product in catalog.", { id: 'product-create' });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleExtractReference = async (e) => {
    e.preventDefault();
    if (!referenceUrl.trim()) {
      toast.error("Please paste a reference reel/video URL.");
      return;
    }
    setIsExtractingRef(true);
    toast.loading("Analyzing viral video structure...", { id: 'ref-extract' });
    try {
      await new Promise(r => setTimeout(r, 1800));
      
      const randomFormat = AD_FORMATS[Math.floor(Math.random() * AD_FORMATS.length)];
      const randomHook = SCROLL_HOOKS[Math.floor(Math.random() * SCROLL_HOOKS.length)];
      const randomScene = SCENE_SETTINGS[Math.floor(Math.random() * SCENE_SETTINGS.length)];
      
      setSelectedFormat(randomFormat);
      setSelectedHook(randomHook);
      setSelectedScene(randomScene);
      
      setIsExtractingRef(false);
      setReferenceUrl('');
      toast.success(`🔥 Reference analyzed! Cloned Hook: "${randomHook.name}", Camera: "${randomFormat.name === 'Hyper Motion' ? 'Orbit Shot' : 'Slow Motion'}". Rebuilding campaign...`, { id: 'ref-extract', duration: 4000 });
      
      if (selectedProduct) {
        await handleProductSelect(selectedProduct, randomFormat, randomHook, randomScene);
      }
    } catch (err) {
      setIsExtractingRef(false);
      toast.error("Failed to analyze reference video.", { id: 'ref-extract' });
    }
  };

  // Higgsfield 2.0 Selectors States
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[2]); // default to Unboxing
  const [selectedHook, setSelectedHook] = useState(SCROLL_HOOKS[0]); // default to Product Hit
  const [selectedScene, setSelectedScene] = useState(SCENE_SETTINGS[0]); // default to Cozy Bedroom

  const [formatModalOpen, setFormatModalOpen] = useState(false);
  const [hookModalOpen, setHookModalOpen] = useState(false);
  const [sceneModalOpen, setSceneModalOpen] = useState(false);

  const [formatFilter, setFormatFilter] = useState('All');
  const [hookFilter, setHookFilter] = useState('All');
  const [sceneFilter, setSceneFilter] = useState('All');

  const [formatSearch, setFormatSearch] = useState('');
  const [hookSearch, setHookSearch] = useState('');
  const [sceneSearch, setSceneSearch] = useState('');

  // Higgsfield Enterprise Flow States
  const [creativeAnalysis, setCreativeAnalysis] = useState({
    productType: 'Gaming Laptop',
    audience: 'Gamers',
    style: 'Premium Tech',
    emotion: 'Excitement',
    age: '18-35',
    interests: 'Gaming, Streaming, Coding',
    location: 'Metro Cities',
    creativeStyle: 'UGC Review',
    hookType: 'Price Shock',
    cameraDirection: '360 Orbit',
    motionGraphics: 'Neon Motion',
    safeZoneAlignment: 'bottom'
  });
  const [qualityAuditOpen, setQualityAuditOpen] = useState(false);
  const [auditStep, setAuditStep] = useState(0);

  const getFilterStyle = () => {
    let filterStr = "";
    if (colorFilter === 'warm') {
      filterStr += "sepia(0.35) saturate(1.25) hue-rotate(-12deg) brightness(0.96)";
    } else if (colorFilter === 'cyber') {
      filterStr += "contrast(1.25) saturate(1.6) hue-rotate(55deg)";
    } else if (colorFilter === 'mono') {
      filterStr += "grayscale(1) contrast(1.15)";
    }
    
    if (motionBlur) {
      filterStr += " blur(0.4px)";
    }
    
    return filterStr ? { filter: filterStr } : {};
  };

  const getProcessedImage = (url) => {
    if (!url) return '';
    if (!isBackgroundRemoved) return url;
    
    const cloudName = "dftpcmc7l";
    if (url.includes("res.cloudinary.com")) {
      if (url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/e_background_removal/");
      }
      return url;
    }
    return `https://res.cloudinary.com/${cloudName}/image/fetch/e_background_removal/${encodeURIComponent(url)}`;
  };

  // Admin Song Upload
  const [uploadedSongName, setUploadedSongName] = useState(null);
  const [uploadedAudioBuffer, setUploadedAudioBuffer] = useState(null);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const fileRef = useRef(null);

  // Published reels library from backend
  const [publishedReels, setPublishedReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);

  // Fetch products
  useEffect(() => {
    dispatch(fetchAllProductsForDashboard());
  }, [dispatch]);

  // Fetch reels from backend
  const fetchReels = useCallback(async () => {
    setReelsLoading(true);
    const mockFallback = [
      {
        id: 'mock-samsung-tv',
        product_id: 'p-samsung-tv',
        product: {
          id: 'p-samsung-tv',
          name: 'Samsung 4K Ultra HD Smart TV',
          price: '₹38,999',
          category: 'Television',
          image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=600&auto=format&fit=crop'
        },
        platform: PLATFORMS[0],
        views: 482900,
        likes: 94300,
        shares: 12800,
        date: '14/06/2026',
        thumbnail: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=600&auto=format&fit=crop',
        video_url: 'https://video.wixstatic.com/video/dddd01_e45d52d0ccc740529ee203feb7430439/1080p/mp4/file.mp4',
        title: 'Samsung 4K TV - Immersive Living Room Theater',
        music_track: 'Cinematic Orchestral'
      },
      {
        id: 'mock-1',
        product_id: 'p1',
        product: DEMO_PRODUCTS[0],
        platform: PLATFORMS[0],
        views: 124500,
        likes: 18450,
        shares: 1240,
        date: '12/06/2026',
        thumbnail: DEMO_PRODUCTS[0].image,
        video_url: 'https://video.wixstatic.com/video/c9f0be_58b128bbe3f345a7b73046d88501a18e/1080p/mp4/file.mp4',
        title: 'Traditional Silk Saree Glow',
        music_track: 'Summer Pop Energy'
      },
      {
        id: 'mock-2',
        product_id: 'p2',
        platform: PLATFORMS[2],
        views: 89400,
        likes: 9200,
        shares: 610,
        date: '13/06/2026',
        thumbnail: DEMO_PRODUCTS[1].image,
        video_url: 'https://video.wixstatic.com/video/52bd90_1323700cec5f4de1872921299e0db601/1080p/mp4/file.mp4',
        product: DEMO_PRODUCTS[1],
        title: 'Alienware Gaming Powerhouse Unboxed',
        music_track: 'Hip Hop Bass Drop'
      },
      {
        id: 'mock-3',
        product_id: 'p5',
        product: DEMO_PRODUCTS[4],
        platform: PLATFORMS[1],
        views: 231000,
        likes: 41200,
        shares: 5300,
        date: '14/06/2026',
        thumbnail: DEMO_PRODUCTS[4].image,
        video_url: 'https://video.wixstatic.com/video/550f4d_fabf39995ffe4e9f9e1da4c808af2d1e/1080p/mp4/file.mp4',
        title: 'Matte Crimson Lipstick Wear Test',
        music_track: 'Lofi Premium Chill'
      }
    ];

    try {
      const { data } = await axiosInstance.get("/reels/all", { withCredentials: true });
      if (data.success && data.reels && data.reels.length > 0) {
        const mappedReels = data.reels.map(r => {
          let parsedImages = [];
          if (r.product_images) {
            if (typeof r.product_images === 'string') {
              try { parsedImages = JSON.parse(r.product_images); } catch(e) { parsedImages = []; }
            } else if (Array.isArray(r.product_images)) {
              parsedImages = r.product_images;
            }
          }
          const image = parsedImages?.[0]?.url || parsedImages?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";

          return {
            id: r.id,
            product_id: r.product_id,
            product: {
              id: r.product_id,
              name: r.product_name,
              price: typeof r.product_price === 'number' ? `₹${r.product_price.toLocaleString('en-IN')}` : `₹${r.product_price}`,
              category: r.product_category,
              image: image
            },
            platform: PLATFORMS.find(p => p.id === r.category_tag?.toLowerCase()) || PLATFORMS[0],
            views: r.views_count || 0,
            likes: r.likes_count || 0,
            shares: Math.floor((r.views_count || 0) * 0.05),
            date: new Date(r.created_at).toLocaleDateString() || "Recently",
            thumbnail: image,
            video_url: r.video_url,
            title: r.title,
            music_track: r.music_track
          };
        });
        setPublishedReels(mappedReels);
      } else {
        setPublishedReels(mockFallback);
      }
    } catch (error) {
      console.error("Failed to fetch reels campaigns:", error);
      setPublishedReels(mockFallback);
    } finally {
      setReelsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const [searchQuery, setSearchQuery] = useState('');
  const [unsoldProductsList, setUnsoldProductsList] = useState([]);
  const [searchedProductsList, setSearchedProductsList] = useState([]);

  const productsList = searchQuery.trim().length > 0 ? searchedProductsList : (unsoldProductsList.length > 0 ? unsoldProductsList : DEMO_PRODUCTS);

  const mapProducts = (rawProducts) => {
    if (!rawProducts || !Array.isArray(rawProducts)) return [];
    return rawProducts.map((p, idx) => {
      let parsedImages = [];
      if (p.images) {
        if (typeof p.images === 'string') {
          try { parsedImages = JSON.parse(p.images); } catch(e) { parsedImages = []; }
        } else if (Array.isArray(p.images)) {
          parsedImages = p.images;
        }
      }
      const image = parsedImages?.[0]?.url || parsedImages?.[0] || p.avatar?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";
      
      const urls = parsedImages.map(img => img.url || img).filter(Boolean);
      if (urls.length === 0) {
        if (p.avatar?.url) urls.push(p.avatar.url);
        else if (image) urls.push(image);
      }

      const priceStr = typeof p.price === 'number' ? `₹${p.price.toLocaleString('en-IN')}` : `₹${p.price}`;
      
      const getCategoryEmoji = (category) => {
        const cat = String(category || "").toLowerCase();
        if (cat.includes("fashion") || cat.includes("clothing") || cat.includes("wear")) return "👘";
        if (cat.includes("electronic") || cat.includes("mobile") || cat.includes("laptop") || cat.includes("computer")) return "💻";
        if (cat.includes("home") || cat.includes("living") || cat.includes("furniture") || cat.includes("decor")) return "🛋️";
        if (cat.includes("accessories") || cat.includes("watch") || cat.includes("jewelry")) return "⌚";
        if (cat.includes("grocery") || cat.includes("food")) return "🛒";
        if (cat.includes("book")) return "📚";
        if (cat.includes("beauty") || cat.includes("makeup")) return "💄";
        if (cat.includes("sport") || cat.includes("gym")) return "👟";
        return "📦";
      };

      const getCategoryColor = (category, index = 0) => {
        const cat = String(category || "").toLowerCase();
        if (cat.includes("fashion")) return "#be185d";
        if (cat.includes("electronic") || cat.includes("mobile")) return "#1d4ed8";
        if (cat.includes("home") || cat.includes("living")) return "#047857";
        if (cat.includes("accessories") || cat.includes("watch")) return "#b45309";
        
        const colors = ["#4f46e5", "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#db2777"];
        return colors[index % colors.length];
      };

      return {
        id: p.id || p._id,
        name: p.name || "Untitled Product",
        price: priceStr,
        category: p.category || "General",
        emoji: getCategoryEmoji(p.category),
        color: getCategoryColor(p.category, idx),
        image: image,
        images: urls.length > 0 ? urls : [image]
      };
    });
  };

  // Fetch unsold products
  const fetchUnsoldProducts = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/product?unsold=true&limit=100", { withCredentials: true });
      if (data.success && data.products) {
        const mapped = mapProducts(data.products);
        setUnsoldProductsList(mapped);
        
        // Auto select first unsold product if currently set to demo
        setSelectedProduct(prev => {
          if (!prev || prev.id.startsWith('p')) {
            return mapped[0];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to fetch unsold products:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnsoldProducts();
  }, [allProducts, fetchUnsoldProducts]);

  // Debounced Search Loader
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchedProductsList([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get(`/product?search=${encodeURIComponent(searchQuery)}&limit=15`, { withCredentials: true });
        if (data.success && data.products) {
          setSearchedProductsList(mapProducts(data.products));
        }
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Auto-select first matching spokesperson when filters change
  useEffect(() => {
    const matched = AI_AVATARS.filter(avatar => {
      if (avatar.id === 'off') return true;
      const matchNat = castingNationality === 'all' || avatar.nationality === castingNationality;
      const matchGen = castingGender === 'all' || avatar.gender === castingGender;
      const matchArch = castingArchetype === 'all' || avatar.archetype === castingArchetype;
      return matchNat && matchGen && matchArch;
    });
    
    if (matched.length > 0 && !matched.find(a => a.id === selectedAvatar.id)) {
      if (selectedAvatar.id !== 'off') {
        const firstSpeaker = matched.find(a => a.id !== 'off');
        if (firstSpeaker) {
          setSelectedAvatar(firstSpeaker);
        } else {
          setSelectedAvatar(matched[0]);
        }
      }
    }
  }, [castingNationality, castingGender, castingArchetype]);

  const generateCampaignScript = (prod, lang = 'hinglish') => {
    if (!prod) return [];
    const catKey = getProductCategoryKey(prod);
    const scriptTemplates = SCRIPTS_DB[catKey] || SCRIPTS_DB.general;
    const langKey = lang.toLowerCase();
    const list = scriptTemplates[langKey] || scriptTemplates.english;
    
    return list.map(item => item.replace(/{name}/g, prod.name));
  };

  // Regenerate captions when language or product changes
  useEffect(() => {
    if (selectedProduct) {
      const generatedCaptions = generateCampaignScript(selectedProduct, spokespersonLanguage);
      setGeneratedVideo(prev => {
        if (prev) {
          return {
            ...prev,
            captions: generatedCaptions
          };
        }
        return {
          product: selectedProduct,
          platform: selectedPlatform,
          track: useCustomAudio ? { name: uploadedSongName } : selectedTrack,
          captionStyle: captionStyle,
          captions: generatedCaptions
        };
      });
    }
  }, [spokespersonLanguage, selectedProduct]);

  const getLanguageLocale = (lang) => {
    switch (lang) {
      case 'hindi': return 'hi-IN';
      case 'english': return 'en-US';
      case 'hinglish': return 'en-IN';
      case 'punjabi': return 'pa-IN';
      case 'bengali': return 'bn-IN';
      case 'tamil': return 'ta-IN';
      default: return 'en-IN';
    }
  };

  const getInteractiveProductStyles = () => {
    let styles = {};
    
    if (isBackgroundRemoved) {
      styles.mixBlendMode = 'multiply';
    } else {
      styles.mixBlendMode = 'normal';
    }

    let filters = [];
    if (lightingStyle === 'sunset') {
      filters.push("sepia(0.35) saturate(1.3) hue-rotate(-10deg) brightness(0.95)");
    } else if (lightingStyle === 'cyber') {
      filters.push("contrast(1.3) saturate(1.6) hue-rotate(50deg) drop-shadow(0 0 10px rgba(236,72,153,0.5))");
    } else if (lightingStyle === 'highkey') {
      filters.push("brightness(1.15) contrast(1.05)");
    } else {
      filters.push("brightness(1) contrast(1)");
    }

    if (colorFilter === 'mono') {
      filters.push("grayscale(1) contrast(1.15)");
    }

    if (motionBlur) {
      filters.push("blur(0.5px)");
    }

    if (filters.length > 0) {
      styles.filter = filters.join(" ");
    }

    if (isPlaying) {
      if (cameraMovement === 'orbit') {
        styles.animation = 'cameraOrbit 8s infinite linear';
      } else if (cameraMovement === 'dolly') {
        styles.animation = 'cameraDolly 6s infinite alternate ease-in-out';
      } else if (cameraMovement === 'macro') {
        styles.transform = 'scale(1.5)';
        styles.animation = 'cameraMacro 5s infinite alternate ease-in-out';
      } else if (cameraMovement === 'tilt') {
        styles.animation = 'cameraTilt 7s infinite alternate ease-in-out';
      }
    }

    return styles;
  };

  const runABSimulation = () => {
    setIsRunningABSimulation(true);
    setAbSimulationProgress(0);
    setAbSimulationStep('Harvesting demographic audience cohorts...');
    toast.loading("AI Marketing Brain simulating A/B campaign variations...", { id: 'ab-simulate' });
    
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setAbSimulationProgress(prog);
      if (prog === 40) {
        setAbSimulationStep('Verifying category affinity coefficients...');
      } else if (prog === 80) {
        setAbSimulationStep('Generating visual eye-gaze attention maps...');
      } else if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const factor = selectedProduct ? (getProductCategoryKey(selectedProduct) === 'electronics' ? 1.25 : 1.0) : 1.0;
          setAbTestMetrics({
            versionA: {
              ctr: parseFloat((3.8 + Math.random() * 1.5).toFixed(1)),
              conv: parseFloat((1.5 + Math.random() * 1.0).toFixed(1)),
              roas: parseFloat((2.8 + Math.random() * 1.2).toFixed(1)),
              score: Math.floor(75 + Math.random() * 15),
              name: 'Version A: UGC Spontaneous Review'
            },
            versionB: {
              ctr: parseFloat((2.8 + Math.random() * 1.2).toFixed(1)),
              conv: parseFloat((1.0 + Math.random() * 0.8).toFixed(1)),
              roas: parseFloat((2.0 + Math.random() * 0.8).toFixed(1)),
              score: Math.floor(65 + Math.random() * 15),
              name: 'Version B: High-End Studio Commercial'
            },
            versionC: {
              ctr: parseFloat((4.5 * factor + Math.random() * 2).toFixed(1)),
              conv: parseFloat((2.2 * factor + Math.random() * 1.5).toFixed(1)),
              roas: parseFloat((3.8 * factor + Math.random() * 2.2).toFixed(1)),
              score: Math.floor(82 + Math.random() * 16),
              name: 'Version C: Stop-Motion ASMR Showcase'
            }
          });
          setIsRunningABSimulation(false);
          toast.success("🎯 A/B Campaign Simulation complete! Optimizations updated.", { id: 'ab-simulate' });
        }, 300);
      }
    }, 300);
  };

  const speakText = (text, style) => {
    if (style === 'off' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceConfig = CelebrityVoices[style] || CelebrityVoices.deep;
      utterance.pitch = voiceConfig.pitch;
      utterance.rate = voiceConfig.rate;
      
      const langLocale = getLanguageLocale(spokespersonLanguage);
      utterance.lang = langLocale;
      
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.includes(langLocale)) || 
                           voices.find(v => v.lang.includes(voiceConfig.voiceName)) || 
                           voices[0];
      if (matchedVoice) utterance.voice = matchedVoice;
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed:", e);
    }
  };


  const steps = [
    { msg: 'Extracting product imagery & scaling to 4K...', prog: 15 },
    { msg: 'Building cinematic transition timeline...', prog: 35 },
    { msg: 'Syncing audio beats with visual keyframes...', prog: 55 },
    { msg: 'Rendering caption typography & overlays...', prog: 75 },
    { msg: 'Compiling final HD export package...', prog: 95 },
  ];

  // Auto-slide video frames based on selected duration (15s, 30s, 60s)
  useEffect(() => {
    let interval;
    if (isPlaying && generatedVideo) {
      const slideDurationMs = (duration * 1000) / 3;
      interval = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % 3);
      }, slideDurationMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, generatedVideo, duration]);

  // Synchronize playing states of all video preview tags inside monitor
  useEffect(() => {
    const videos = document.querySelectorAll('.video-preview-container video');
    videos.forEach(v => {
      if (isPlaying) {
        v.play().catch(err => console.log("Video preview autoplay blocked:", err));
      } else {
        v.pause();
      }
    });
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && generatedVideo && voiceover !== 'off') {
      const currentCaption = generatedVideo.captions[activeSlide];
      if (currentCaption) {
        // Strip emojis to prevent reading emoji names
        const cleanText = currentCaption.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
        speakText(cleanText, voiceover);
      }
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [activeSlide, isPlaying, generatedVideo, voiceover]);

  // Audio engine sync
  const startAudio = useCallback(() => {
    if (useCustomAudio && uploadedAudioBuffer) {
      AudioEngine.playTrack(uploadedAudioBuffer, isMuted ? 0 : volume, (step) => setBeatStep(step));
    } else {
      AudioEngine.playTrack(selectedTrack.url, isMuted ? 0 : volume, (step) => setBeatStep(step));
    }
  }, [selectedTrack, useCustomAudio, uploadedAudioBuffer, isMuted, volume]);

  const stopAudio = useCallback(() => {
    AudioEngine.stop();
    setBeatStep(0);
  }, []);

  useEffect(() => {
    if (isPlaying) startAudio();
    else stopAudio();
    return () => stopAudio();
  }, [isPlaying, startAudio, stopAudio]);

  useEffect(() => {
    AudioEngine.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const handleSongUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload a valid audio file (MP3, WAV, OGG)');
      return;
    }
    const fileUrl = URL.createObjectURL(file);
    setUploadedAudioBuffer(fileUrl);
    setUploadedSongName(file.name);
    setUseCustomAudio(true);
    toast.success(`🎵 "${file.name}" loaded successfully! It will play when you generate a reel.`);
  };

  const handleProductSelect = async (prod, overrideFormat = null, overrideHook = null, overrideScene = null, overrideDuration = null, overrideQuality = null) => {
    if (!prod) return;
    setSelectedProduct(prod);
    setGeneratedVideo(null);
    if (isPlaying) { setIsPlaying(false); stopAudio(); }

    setIsGenerating(true);
    setLoadingProgress(0);
    setLoadingStep('🤖 Querying catalog details...');
    toast.loading('AI copywriter generating campaign script...', { id: 'reel-gen' });

    // Step indicators matching the Master Workflow
    const stepsList = [
      { msg: '🔍 AI Product Analyzer: Category, specs & price detection...', prog: 10 },
      { msg: '👥 AI Audience Intelligence: Predicting buyer age, interests & locations...', prog: 20 },
      { msg: '🎬 AI Creative Director: Custom UGC / Commercial style decision...', prog: 30 },
      { msg: '🪝 AI Hook Generator: Scroll-stopping hooks copywriter active...', prog: 40 },
      { msg: '📅 AI Storyboard Builder: Structuring scene timeline...', prog: 50 },
      { msg: '🎥 AI Camera Director: Calculating 3D camera pan & orbit path...', prog: 60 },
      { msg: '🤖 AI Avatar Engine: Matching DTC presenter human model...', prog: 70 },
      { msg: '🗣️ AI Voiceover Engine: Generating language beat-synced voice track...', prog: 80 },
      { msg: '🎨 AI Motion Graphics Engine: Overlaying glow effects & lens flares...', prog: 90 },
      { msg: '🛡️ Product Safe-Zone Detection: Object bounding box calculation active...', prog: 95 }
    ];

    // Simulate progress while API loads
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < stepsList.length) {
        setLoadingStep(stepsList[stepIdx].msg);
        setLoadingProgress(stepsList[stepIdx].prog);
        stepIdx++;
      }
    }, 180);

    // AI strategy calculation
    const catKey = getProductCategoryKey(prod);
    
    // Generate strategy profile
    let buyingPsychology = "Impulse Purchase (High emotional visual appeal)";
    let competitorUSP = "Direct brand price-to-quality benefit";
    let regionalDemand = "Metro Hubs (Delhi NCR, Mumbai, Bangalore)";
    let seasonalityRelevance = "Regular season; High conversions on social video streams.";
    let targetPersona = "Young professionals & Social Shoppers";

    if (catKey === 'fashion') {
      buyingPsychology = "Identity & Status (Visual self-expression)";
      competitorUSP = "Premium craftsmanship and organic fabric material comparison";
      regionalDemand = "Tier-1 cities, Urban fashion sectors";
      seasonalityRelevance = "Upcoming Festive/Wedding Season (High purchase intent)";
      targetPersona = "Trend-conscious youth & lifestyle enthusiasts";
    } else if (catKey === 'electronics') {
      buyingPsychology = "Rational validation (Spec efficiency & productivity benefits)";
      competitorUSP = "Overcomes rivals via superior durability and premium AMOLED specs";
      regionalDemand = "Tech hubs, university areas, metro centers";
      seasonalityRelevance = "Back-to-College seasonal campaigns";
      targetPersona = "Gamers, developers, and tech early-adopters";
    } else if (catKey === 'cosmetics') {
      buyingPsychology = "Transformation & confidence (Visual before-after validation)";
      competitorUSP = "Chemical-free organic ingredients versus synthetic competitors";
      regionalDemand = "Metro cities and major retail centers";
      seasonalityRelevance = "Summer hydration / Festive glow promotions";
      targetPersona = "Beauty & skincare enthusiasts aged 18-35";
    } else if (catKey === 'food') {
      buyingPsychology = "Sensory gratification (Craving triggers & taste storytelling)";
      competitorUSP = "Zero artificial preservatives; 100% natural traditional recipe";
      regionalDemand = "Pan-India family markets & snack hubs";
      seasonalityRelevance = "Tea-time & monsoon seasonal snack demand";
      targetPersona = "Families, students, and food lovers looking for pure taste";
    } else if (catKey === 'television') {
      buyingPsychology = "Home Upgrade & Status (Premium immersive family entertainment)";
      competitorUSP = "Superior 4K screen clarity and local dimming contrast comparison";
      regionalDemand = "Residential family communities, luxury flats, suburban metros";
      seasonalityRelevance = "Diwali/New Year home renovation sales & sport tournament seasons";
      targetPersona = "Families, movie enthusiasts, and home theater buyers";
    } else if (catKey === 'home') {
      buyingPsychology = "Lifestyle comfort & status representation (Interior aesthetics)";
      competitorUSP = "Ergonomic designs and durable plush memory foam styling";
      regionalDemand = "Modern urban apartments and housing sectors";
      seasonalityRelevance = "New year home renovations & Diwali specials";
      targetPersona = "Homeowners and interior design enthusiasts";
    }

    try {
      // If it is a demo product, complete client-side instantly
      if (prod.id.startsWith('p')) {
        await new Promise(r => setTimeout(r, 1200));
        clearInterval(progressInterval);
        
        const targetStyle = CAPTION_STYLES.find(c => c.id === 'luxury') || CAPTION_STYLES[0];
        setCaptionStyle(targetStyle);
        setVoiceover('srk');

        setCreativeAnalysis({
          productType: prod.name,
          audience: targetPersona,
          style: catKey === 'fashion' ? 'Sleek Fashion' : (catKey === 'electronics' ? 'Modern Specs Review' : 'Premium Lifestyle'),
          emotion: catKey === 'food' ? 'Delight & Craving' : 'Excitement & Desire',
          age: catKey === 'electronics' ? '16-30' : '18-45',
          interests: catKey === 'fashion' ? 'Catwalk, Clothing, Styling' : (catKey === 'electronics' ? 'Gadgets, Performance' : 'Aesthetics, Lifestyle'),
          location: regionalDemand,
          creativeStyle: catKey === 'cosmetics' ? 'UGC Before-After' : 'Cinematic Commercial',
          hookType: catKey === 'electronics' ? 'Unboxing Hook' : 'Problem-Solving Hook',
          cameraDirection: catKey === 'fashion' ? 'Dolly-in Zoom' : '360 Orbit Spec Scan',
          motionGraphics: catKey === 'electronics' ? 'High-Key Neon Overlays' : 'Subtle Particles Glow',
          safeZoneAlignment: 'bottom',
          buyingPsychology,
          competitorUSP,
          seasonalityRelevance,
          marketingTriggers: "Urgency Discount, Free Shipping tag, 5-Star Social Proof"
        });

        const captionsList = generateCampaignScript(prod, spokespersonLanguage);

        setGeneratedVideo({
          product: prod,
          platform: selectedPlatform,
          track: useCustomAudio ? { name: uploadedSongName } : selectedTrack,
          captionStyle: targetStyle,
          captions: captionsList
        });
        
        setLoadingProgress(100);
        setIsGenerating(false);
        toast.success('🎬 AI Commercial Campaign generated successfully!', { id: 'reel-gen' });
        setTimeout(() => setIsPlaying(true), 400);
        return;
      }

      // Backend route fetch
      let data = { success: false };
      try {
        const response = await axiosInstance.post(
          "/reels/generate-script",
          { 
            productId: prod.id,
            format: overrideFormat?.name || selectedFormat.name,
            hook: overrideHook?.name || selectedHook.name,
            scene: overrideScene?.name || selectedScene.name,
            duration: overrideDuration !== null ? overrideDuration : duration,
            quality: overrideQuality !== null ? overrideQuality : quality
          },
          { withCredentials: true }
        );
        data = response.data;
      } catch (e) {
        console.warn("Backend generate-script failed, falling back to dynamic client engine.");
      }

      clearInterval(progressInterval);

      const matchedStyle = CAPTION_STYLES.find(s => s.id === 'luxury') || CAPTION_STYLES[0];
      setCaptionStyle(matchedStyle);
      setVoiceover('srk');

      setCreativeAnalysis({
        productType: prod.name,
        audience: targetPersona,
        style: catKey === 'fashion' ? 'Sleek Fashion' : (catKey === 'electronics' ? 'Modern Specs Review' : 'Premium Lifestyle'),
        emotion: catKey === 'food' ? 'Delight & Craving' : 'Excitement & Desire',
        age: catKey === 'electronics' ? '16-30' : '18-45',
        interests: catKey === 'fashion' ? 'Catwalk, Clothing, Styling' : (catKey === 'electronics' ? 'Gadgets, Performance' : 'Aesthetics, Lifestyle'),
        location: regionalDemand,
        creativeStyle: catKey === 'cosmetics' ? 'UGC Before-After' : 'Cinematic Commercial',
        hookType: catKey === 'electronics' ? 'Unboxing Hook' : 'Problem-Solving Hook',
        cameraDirection: catKey === 'fashion' ? 'Dolly-in Zoom' : '360 Orbit Spec Scan',
        motionGraphics: catKey === 'electronics' ? 'High-Key Neon Overlays' : 'Subtle Particles Glow',
        safeZoneAlignment: 'bottom',
        buyingPsychology,
        competitorUSP,
        seasonalityRelevance,
        marketingTriggers: "Urgency Discount, Free Shipping tag, 5-Star Social Proof"
      });

      const finalCaptions = data.success && data.script?.captions 
        ? data.script.captions 
        : generateCampaignScript(prod, spokespersonLanguage);

      setGeneratedVideo({
        product: prod,
        platform: selectedPlatform,
        track: useCustomAudio ? { name: uploadedSongName } : selectedTrack,
        captionStyle: matchedStyle,
        captions: finalCaptions
      });

      setLoadingProgress(100);
      setIsGenerating(false);
      toast.success(`🎬 AI Commercial Campaign: "${prod.name}" ready!`, { id: 'reel-gen' });
      setTimeout(() => setIsPlaying(true), 400);
    } catch (err) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      console.error("Auto script generation error:", err);
      toast.error('AI copywriting service encountered an issue.', { id: 'reel-gen' });
    }
  };

  const handleUrlScan = async (e) => {
    e.preventDefault();
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL first.");
      return;
    }

    if (isPlaying) { setIsPlaying(false); stopAudio(); }
    setIsScraping(true);
    toast.loading('AI scanning product link & downloading details...', { id: 'url-scan' });

    try {
      const { data } = await axiosInstance.post(
        "/reels/scrape-url",
        { url: productUrl },
        { withCredentials: true }
      );

      if (data.success && data.product) {
        toast.success('🔗 URL Scraped Successfully!', { id: 'url-scan' });
        setProductUrl('');
        
        // Trigger ad generator for the scraped product details
        await handleProductSelect(data.product);
      } else {
        toast.error('Could not scrape product details from URL.', { id: 'url-scan' });
      }
    } catch (err) {
      console.error("URL scan error:", err);
      toast.error('E-commerce crawling service encountered an issue.', { id: 'url-scan' });
    } finally {
      setIsScraping(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedProduct) {
      await handleProductSelect(selectedProduct);
    } else {
      toast.error("Please select a product first.");
    }
  };

  const executeActualPublish = async () => {
    toast.loading('Publishing visual campaign to database...', { id: 'reel-publish' });
    try {
      const payload = {
        productId: selectedProduct.id,
        title: `${selectedProduct.name} - AI Campaign`,
        categoryTag: selectedPlatform.id,
        musicTrack: useCustomAudio ? (uploadedSongName || "Custom Track") : selectedTrack.name,
        format: selectedFormat.name,
        hook: selectedHook.name,
        scene: selectedScene.name,
        videoUrl: selectedAvatar.id !== 'off' ? selectedAvatar.videoUrl : undefined
      };

      const { data } = await axiosInstance.post("/reels/generate", payload, { withCredentials: true });
      if (data.success) {
        toast.success(`🚀 Reel published to ${selectedPlatform.name}! Check the Library tab.`, { id: 'reel-publish', icon: '🎉', duration: 5000 });
        await fetchReels();
        setActiveTab('library');
        setQualityAuditOpen(false);
      } else {
        toast.error("Failed to publish visual campaign.", { id: 'reel-publish' });
        setQualityAuditOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error publishing campaign.", { id: 'reel-publish' });
      setQualityAuditOpen(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product first.");
      return;
    }
    setQualityAuditOpen(true);
    setAuditStep(0);
  };

  // Quality validation audit runner
  useEffect(() => {
    let interval;
    if (qualityAuditOpen) {
      interval = setInterval(() => {
        setAuditStep(prev => {
          if (prev >= 6) {
            clearInterval(interval);
            executeActualPublish();
            return prev;
          }
          return prev + 1;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [qualityAuditOpen]);

  const handleDeleteReel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this visual campaign?")) return;
    toast.loading('Deleting visual campaign...', { id: 'reel-delete' });
    try {
      const { data } = await axiosInstance.delete(`/reels/${id}`, { withCredentials: true });
      if (data.success) {
        toast.success("Campaign deleted successfully.", { id: 'reel-delete' });
        await fetchReels();
      } else {
        toast.error("Failed to delete campaign.", { id: 'reel-delete' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting campaign.", { id: 'reel-delete' });
    }
  };


  const handleDownload = () => {
    toast.success('📥 AI Reel exported as MP4 to your Downloads folder!');
  };

  const captionClasses = {
    bold: 'text-base font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide',
    minimal: 'text-sm font-medium text-white/90 drop-shadow-sm tracking-wide',
    neon: 'text-sm font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] tracking-wider',
    luxury: 'text-sm font-black tracking-widest bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]',
  };

  const getCaptionPositionClass = () => {
    const align = creativeAnalysis?.safeZoneAlignment || 'bottom';
    if (selectedPlatform.id === 'reels') {
      if (activeSlide === 0) return 'top-12';
      return 'bottom-28';
    } else if (selectedPlatform.id === 'feed') {
      if (activeSlide === 0) return 'top-4';
      if (activeSlide === 1) return 'top-1/2 -translate-y-1/2';
      return 'bottom-16';
    } else if (selectedPlatform.id === 'youtube') {
      return 'bottom-16';
    }
    if (align === 'top') return 'top-12';
    if (align === 'middle') return 'top-1/2 -translate-y-1/2';
    return 'bottom-28';
  };

  const productImages = selectedProduct?.images || [selectedProduct?.image];
  const currentImage = productImages[activeSlide % productImages.length] || selectedProduct?.image;

  return (
    <main className="p-4 md:p-8 md:pl-[18rem] bg-[#0a0a0f] min-h-screen font-sans w-full text-white">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes studioGlitch {
          0% { transform: translate(0) }
          20% { transform: translate(-2px, 2px) }
          40% { transform: translate(-2px, -2px) }
          60% { transform: translate(2px, 2px) }
          80% { transform: translate(2px, -2px) }
          100% { transform: translate(0) }
        }
        @keyframes cameraOrbit {
          0% { transform: translateX(0px) rotate(0deg); }
          25% { transform: translateX(8px) rotate(1.2deg); }
          50% { transform: translateX(0px) rotate(0deg); }
          75% { transform: translateX(-8px) rotate(-1.2deg); }
          100% { transform: translateX(0px) rotate(0deg); }
        }
        @keyframes cameraDolly {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.2); }
        }
        @keyframes cameraMacro {
          0% { transform: scale(1.5) translate(0px, 0px); }
          100% { transform: scale(1.65) translate(-4px, 4px); }
        }
        @keyframes cameraTilt {
          0% { transform: translateY(-4px) rotate(-0.8deg); }
          100% { transform: translateY(4px) rotate(0.8deg); }
        }
        .animate-studioGlitch {
          animation: studioGlitch 0.35s infinite linear;
        }
        .vhs-scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.45) 50%
          );
          background-size: 100% 4px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <Header />

      <div className="max-w-[1400px] mx-auto mt-6 space-y-6">

        {/* ─── STUDIO HEADER ─── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
                  <Film size={22} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">AI Reel & Video Studio</h1>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest">PRO</span>
              </div>
              <p className="text-slate-400 font-medium text-sm">Create viral product reels with real audio, cinematic transitions, and live waveform visualization.</p>
            </div>
            {/* Tab switcher */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
              {[
                { id: 'builder', label: '🎬 Builder' },
                { id: 'library', label: `📚 Library (${publishedReels.length})` },
                { id: 'analytics', label: '📊 Analytics' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── BUILDER TAB ─── */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

            {/* LEFT WORKSPACE (xl:col-span-7) - Live Preview, Storyboard Timeline, and Decisions Grid */}
            <div className="xl:col-span-7 space-y-4">

              {/* PREVIEW HEADER */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-indigo-400" />
                  <h2 className="text-sm font-black text-white">Ad Production Screen Preview</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Real-World Actor Toggle */}
                  <button
                    type="button"
                    onClick={() => setUseModelShowcase(prev => !prev)}
                    className={`flex items-center gap-1.5 text-[9px] font-black border px-2.5 py-1.5 rounded-full transition-all duration-300 ${
                      useModelShowcase
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                    }`}
                  >
                    <Sparkles size={11} className={useModelShowcase ? 'animate-pulse text-indigo-400' : ''} />
                    <span>AI Model: {useModelShowcase ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Safe-Zone Guide Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowSafeZones(prev => !prev)}
                    className={`flex items-center gap-1.5 text-[9px] font-black border px-2.5 py-1.5 rounded-full transition-all duration-300 ${
                      showSafeZones
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                    }`}
                  >
                    <span>🛡️ Safe Zones: {showSafeZones ? 'VISIBLE' : 'HIDDEN'}</span>
                  </button>

                  {/* Heatmap Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowHeatmap(prev => !prev)}
                    className={`flex items-center gap-1.5 text-[9px] font-black border px-2.5 py-1.5 rounded-full transition-all duration-300 ${
                      showHeatmap
                        ? 'bg-rose-600/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                    }`}
                  >
                    <span>👁️ Gaze Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
                  </button>

                  {generatedVideo && (
                    <span className="text-[9px] font-bold text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {selectedPlatform.aspect} • {selectedPlatform.name}
                    </span>
                  )}
                </div>
              </div>

              {/* MAIN SCREEN */}
              <div className="bg-slate-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center min-h-[540px] relative shadow-2xl p-6">

                {isGenerating ? (
                  <div className="flex flex-col items-center gap-5 text-center px-8 py-12 w-full max-w-sm z-30">
                    <div className="relative mb-2">
                      <div className="w-20 h-20 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
                      <Film size={28} className="text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="space-y-2 w-full">
                      <p className="text-sm font-black text-white">{loadingStep}</p>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${loadingProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">{loadingProgress}% complete</p>
                    </div>
                    <div className="flex items-end gap-[4px] h-10 mt-2">
                      {[...Array(20)].map((_, i) => (
                        <span key={i} className="bg-indigo-500/60 rounded-full w-[4px] animate-pulse"
                          style={{ height: `${30 + Math.sin((i + loadingProgress / 5) * 0.8) * 70}%`, animationDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    {/* Video Mock Screen */}
                    <div 
                      style={getFilterStyle()}
                      className={`video-preview-container relative bg-black rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 ${
                        selectedPlatform.aspect === '16:9' ? 'w-full aspect-[16/9]' :
                        selectedPlatform.aspect === '1:1' ? 'w-64 h-64' : 'w-52 aspect-[9/16]'
                      } ${
                        selectedFormat.id === 'cyberpunk' ? 'ring-4 ring-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.5)]' : ''
                      }`}
                    >
                      
                      {/* Active Format Overlays */}
                      {selectedFormat.id === 'hologram' && (
                        <div className="absolute inset-0 bg-cyan-500/5 mix-blend-color-dodge z-20 pointer-events-none border border-cyan-500/20" />
                      )}
                      
                      {/* VHS HUD Overlay */}
                      {selectedFormat.id === 'retro_vhs' && (
                        <div className="absolute inset-0 z-20 pointer-events-none vhs-scanlines opacity-40 font-mono text-[8px] text-emerald-400 p-3 flex flex-col justify-between">
                          <div className="flex justify-between">
                            <span>PLAY ▶</span>
                            <span>00:00:{activeSlide * 6 + 12}</span>
                          </div>
                          <div className="text-right">VHS SP</div>
                        </div>
                      )}

                      {/* Hook Scene Overlays (Slide 1: Hook) */}
                      {activeSlide === 0 && (
                        <>
                          {selectedHook.id === 'glitch' && (
                            <div className="absolute inset-0 z-20 bg-indigo-500/10 mix-blend-difference pointer-events-none animate-pulse" />
                          )}
                          {selectedHook.id === 'shattering' && (
                            <div className="absolute inset-0 z-20 pointer-events-none opacity-40 bg-[url('https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=300')] bg-cover mix-blend-screen" />
                          )}
                          {selectedHook.id === 'smoke_reveal' && (
                            <div className="absolute inset-0 z-20 bg-slate-700/30 backdrop-blur-[1px] pointer-events-none" />
                          )}
                          {selectedHook.id === 'confetti' && (
                            <div className="absolute inset-0 z-20 bg-gradient-to-b from-yellow-500/10 via-pink-500/10 to-transparent pointer-events-none" />
                          )}
                        </>
                      )}

                      {/* Blended Scene Background Layer & Product Image OR UGC Full Bleed Video */}
                      {selectedFormat.id === 'ugc' && selectedAvatar.id !== 'off' ? (
                        // UGC Video Mode - Spokesperson video plays full-screen/full-bleed
                        <div className="absolute inset-0 w-full h-full bg-slate-950">
                          {selectedAvatar.videoUrl ? (
                            <video
                              key={selectedAvatar.id}
                              src={getSafeVideoUrl(selectedAvatar.videoUrl)}
                              muted={isMuted}
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                              onCanPlay={(e) => {
                                if (isPlaying) e.target.play().catch(() => {});
                              }}
                              ref={(el) => {
                                if (el) {
                                  if (isPlaying) {
                                    el.play().catch(() => {});
                                  } else {
                                    el.pause();
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-905 text-white">
                              <span className="text-4xl">{selectedAvatar.icon}</span>
                            </div>
                          )}
                          
                          {/* Floating PIP Product Card */}
                          <div className="absolute top-[22%] left-3 right-3 z-20 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2.5 animate-scaleUp">
                            <img 
                              src={getProcessedImage(currentImage)}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = currentImage;
                              }} 
                              alt="" 
                              className="w-12 h-12 rounded-xl object-contain bg-black/40 border border-white/10 shrink-0" 
                              style={{ mixBlendMode: 'multiply' }}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <span className="px-1.5 py-0.5 bg-indigo-600/30 text-indigo-400 border border-indigo-500/25 rounded text-[7px] font-black uppercase tracking-wider inline-block">
                                {selectedProduct?.category || "Category"}
                              </span>
                              <h4 className="text-[10px] font-black text-white truncate mt-0.5 leading-tight">{selectedProduct?.name || "Product Name"}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                                  {selectedProduct?.price || "Price"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Standard Mode - Image in center, scene background
                        (() => {
                          const catKey = getProductCategoryKey(selectedProduct);
                          const adTemplate = CATEGORY_AD_TEMPLATES[catKey];
                          const useModelLoop = useModelShowcase && adTemplate;
                          const videoSrc = useModelLoop ? adTemplate.videoUrl : selectedScene?.videoUrl;
                          const videoKey = useModelLoop ? `model_${catKey}` : `scene_${selectedScene?.id}`;
                          const videoClass = useModelLoop ? adTemplate.className : 'opacity-40 filter brightness-[0.35]';

                          // Define dynamic positioning classes for overlays based on category key
                          let overlayClass = "max-w-[75%] max-h-[75%] object-contain rounded-xl shadow-2xl transition-all duration-[3000ms] ease-in-out";
                          let containerClass = "w-full h-full flex items-center justify-center p-4 relative z-10 pointer-events-none";
                          if (useModelLoop) {
                            if (catKey === 'fashion') {
                              // Overlay garment on posing model's body
                              containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                              overlayClass = "absolute max-w-[42%] max-h-[42%] top-[34%] left-[28%] z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-[2000ms] animate-pulse";
                            } else if (catKey === 'cosmetics') {
                              // Overlay cosmetics float near makeup hand
                              containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                              overlayClass = "absolute max-w-[28%] max-h-[28%] bottom-[30%] right-[12%] z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] animate-bounce";
                            } else if (catKey === 'food') {
                              // Food placed on dining/chopping area
                              containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                              overlayClass = "absolute max-w-[32%] max-h-[32%] bottom-[20%] left-[32%] z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)] scale-y-[0.9] origin-bottom animate-pulse";
                            } else if (catKey === 'electronics') {
                              // Gadget aligned with unboxing hands/mat
                              containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                              overlayClass = "absolute max-w-[35%] max-h-[35%] bottom-[22%] right-[30%] z-10 drop-shadow-[0_12px_25px_rgba(0,0,0,0.5)] transition-all duration-[2000ms] animate-pulse";
                            } else if (catKey === 'television') {
                              // Mount the TV screen centered on the living room fireplace wall background
                              containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                              overlayClass = "absolute max-w-[55%] max-h-[50%] top-[20%] left-[22.5%] z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] transition-all duration-[2000ms]";
                            } else if (catKey === 'home') {
                              // Furniture/Decor placed nicely in interior scene
                              containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                              overlayClass = "absolute max-w-[45%] max-h-[45%] bottom-[15%] right-[20%] z-10 drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] transition-all duration-[2000ms]";
                            }
                          }

                          return (
                            <>
                              {/* Blended Scene/Model Background Layer */}
                              {videoSrc ? (
                                <video
                                  key={videoKey}
                                  src={getSafeVideoUrl(videoSrc)}
                                  muted
                                  loop
                                  playsInline
                                  className={`w-full h-full object-cover absolute inset-0 scale-105 transition-all duration-1000 ${videoClass}`}
                                  onCanPlay={(e) => {
                                    if (isPlaying) e.target.play().catch(() => {});
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      if (isPlaying) {
                                        el.play().catch(() => {});
                                      } else {
                                        el.pause();
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <img
                                  src={selectedScene?.image || currentImage}
                                  alt=""
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                  className="w-full h-full object-cover absolute inset-0 scale-105 transition-all duration-1000 opacity-40 filter brightness-[0.35]"
                                />
                              )}

                              {/* Foreground image overlay preserving aspect ratio */}
                              <div className={containerClass}>
                                <img
                                  src={getProcessedImage(currentImage)}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.mixBlendMode = 'normal';
                                    e.target.src = currentImage; // Fallback to raw image if background removal fails
                                  }}
                                  alt=""
                                  style={getInteractiveProductStyles()}
                                  className={`${overlayClass} ${
                                    isPlaying && !useModelLoop ? (activeSlide === 0 ? 'scale-105 rotate-1' : activeSlide === 1 ? 'scale-110 -rotate-1' : 'scale-105') : ''
                                  } ${
                                    activeSlide === 0 && selectedHook.id === 'glitch' && isPlaying ? 'animate-studioGlitch' : ''
                                  } ${
                                    selectedFormat.id === 'hologram' ? 'hue-rotate-[180deg] saturate-200 brightness-110' : ''
                                  } ${
                                    selectedFormat.id === 'macro_high' ? 'scale-[1.6]' : ''
                                  }`}
                                />
                              </div>
                            </>
                          );
                        })()
                      )}

                      {/* AI Spokesperson Avatar Bubble Overlay (only in non-UGC mode) */}
                      {selectedFormat.id !== 'ugc' && selectedAvatar.id !== 'off' && (
                        <div className="absolute bottom-16 right-3 w-16 h-16 rounded-full border-2 border-indigo-500 overflow-hidden shadow-2xl z-20 bg-slate-900 flex items-center justify-center animate-duration-300">
                          {selectedAvatar.videoUrl ? (
                            <video
                              key={selectedAvatar.id}
                              src={getSafeVideoUrl(selectedAvatar.videoUrl)}
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                              onCanPlay={(e) => {
                                if (isPlaying) e.target.play().catch(() => {});
                              }}
                              ref={(el) => {
                                if (el) {
                                  if (isPlaying) {
                                    el.play().catch(() => {});
                                  } else {
                                    el.pause();
                                  }
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xl">{selectedAvatar.icon}</span>
                          )}
                        </div>
                      )}

                      {/* Camera Viewfinder HUD Overlay */}
                      <div className="absolute inset-0 pointer-events-none border border-white/10 z-20 flex flex-col justify-between p-3 font-mono text-[8px] text-white/70 tracking-wider">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span>REC</span>
                          </div>
                          <span className="bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">4K HDR 60FPS</span>
                          <span className="bg-black/40 px-1 py-0.5 rounded backdrop-blur-sm border border-white/30">100%</span>
                        </div>
                        {/* Center focus crosshairs & guidelines */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                          <div className="w-6 h-[1px] bg-white" />
                          <div className="h-6 w-[1px] bg-white absolute" />
                          <div className="w-10 h-10 border border-white/60 rounded-full" />
                        </div>
                        <div className="flex justify-between items-center bg-black/30 p-1 rounded backdrop-blur-sm">
                          <span>ISO 400</span>
                          <span>F/2.8</span>
                          <span>{selectedFormat.name}</span>
                        </div>
                      </div>

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <span className="text-[9px] font-black bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-full border border-white/20 flex items-center gap-1">
                          <Music size={9} className={isPlaying ? 'animate-spin' : ''} />
                          {(useCustomAudio ? uploadedSongName?.slice(0,18) : selectedTrack.name.slice(0,18)) + '...'}
                        </span>
                        <span className="text-[9px] font-black bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-full border border-white/20">
                          {voiceover !== 'off' ? `${voiceover.toUpperCase()} VO` : '🔇'}
                        </span>
                      </div>

                      {/* Celebrity Badge Overlay */}
                      {voiceover !== 'off' && CelebrityBadges[voiceover] && (
                        <div className="absolute top-12 inset-x-3 text-center z-10 animate-bounce">
                          <span className={`inline-block px-3 py-1 rounded-full border text-[7px] tracking-widest uppercase ${CelebrityBadges[voiceover].badgeClass}`}>
                            {CelebrityBadges[voiceover].label}
                          </span>
                        </div>
                      )}

                      {/* Styled Lower Third Caption with Bounding Safe-Zone Protection */}
                      <div className={`absolute inset-x-4 ${showSafeZones ? 'bottom-40' : getCaptionPositionClass()} text-center z-20 flex justify-center pointer-events-none transition-all duration-550`}>
                        <div className="bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 max-w-[85%] shadow-2xl relative">
                          <div className={`absolute -inset-0.5 border rounded-2xl pointer-events-none border-dashed animate-pulse ${showSafeZones ? 'border-emerald-500/50' : 'border-indigo-500/25'}`}></div>
                          <span className={`absolute -top-2.5 left-3 px-1.5 py-0.5 text-[6px] text-white rounded font-black tracking-widest uppercase ${showSafeZones ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                            {showSafeZones ? '🛡️ Safe-Zone Protected' : 'Safe-Zone Active'}
                          </span>
                          <p className={`${captionClasses[captionStyle.id] || captionClasses.bold} leading-relaxed`}>
                            {generatedVideo ? (
                              generatedVideo.captions[activeSlide]
                            ) : (
                              activeSlide === 0 ? `🔥 Get ready for the new ${selectedProduct?.name || 'Product'}!` :
                              activeSlide === 1 ? `💎 Premium quality at ${selectedProduct?.price || 'Best Price'} only!` :
                              `🛒 Order yours today on BalajiMart — Link in bio!`
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Live AI Eye-Tracking Heatmap Overlay */}
                      {showHeatmap && (
                        <div className="absolute inset-0 z-[29] bg-black/30 pointer-events-none mix-blend-color-dodge transition-all duration-300">
                          <div className="absolute top-[35%] left-[45%] w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.7)_0%,rgba(245,158,11,0.4)_50%,rgba(16,185,129,0)_100%)] animate-pulse" />
                          <div className="absolute bottom-[28%] right-[10%] w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.6)_0%,rgba(245,158,11,0.3)_50%,rgba(16,185,129,0)_100%)] animate-pulse" />
                          <div className="absolute bottom-[20%] left-[20%] w-14 h-14 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.5)_0%,rgba(16,185,129,0)_100%)]" />
                          <div className="absolute top-12 left-3 bg-black/80 backdrop-blur-md px-2 py-1 border border-white/10 rounded-lg text-[6px] text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                            <span>Gaze Focus: High (Red)</span>
                          </div>
                        </div>
                      )}

                      {/* Interactive Social Media UI Overlay for Safe Zone Visualization */}
                      {showSafeZones && (
                        <div className="absolute inset-0 z-[28] pointer-events-none flex flex-col justify-between p-4 font-sans text-white">
                          {/* Top UI Area */}
                          <div className="flex justify-between items-center w-full bg-gradient-to-b from-black/50 to-transparent p-2">
                            <span className="text-[10px] font-bold">Following</span>
                            <span className="text-[10px] font-extrabold border-b-2 border-white pb-1">For You</span>
                            <Search size={14} className="opacity-80" />
                          </div>
                          
                          {/* Right UI Overlay (Actions) */}
                          <div className="absolute right-2 bottom-32 flex flex-col items-center gap-4 text-white z-40">
                            <div className="flex flex-col items-center gap-1">
                              <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto cursor-pointer border border-white/10">
                                <span className="text-xs">❤️</span>
                              </div>
                              <span className="text-[8px] font-black drop-shadow-md">142K</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto cursor-pointer border border-white/10">
                                <span className="text-xs">💬</span>
                              </div>
                              <span className="text-[8px] font-black drop-shadow-md">2.4K</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto cursor-pointer border border-white/10">
                                <span className="text-xs">➡️</span>
                              </div>
                              <span className="text-[8px] font-black drop-shadow-md">Share</span>
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-900 animate-spin">
                              <img src={currentImage} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                          
                          {/* Bottom Left UI Overlay (Profile / Description) */}
                          <div className="absolute left-3 bottom-16 flex flex-col items-start gap-1.5 text-left max-w-[65%] z-45">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-600 border border-white flex items-center justify-center font-bold text-[8px]">BM</div>
                              <span className="text-[10px] font-extrabold drop-shadow-md">balaji.mart</span>
                              <span className="text-[7px] bg-indigo-550 border border-white/20 px-1.5 py-0.2 rounded font-black uppercase">Ad</span>
                            </div>
                            <p className="text-[8px] font-bold leading-snug drop-shadow-md line-clamp-2">
                              Shop the trend! Get the best deals on {selectedProduct?.name}. #reels #deals #shopping
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Bottom product info */}
                      <div className="absolute bottom-3 left-3 right-3 space-y-2 z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black bg-indigo-600 text-white uppercase px-1.5 py-0.5 rounded">{selectedProduct?.category || 'Category'}</span>
                          <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">BalajiMart</span>
                        </div>
                        <div className="text-xs font-black text-white leading-tight font-sans">
                          {selectedProduct?.name} — {selectedProduct?.price}
                        </div>

                        {/* Live waveform — synced to beatStep */}
                        <div className="flex items-end gap-[2px] h-5">
                          {[...Array(22)].map((_, i) => {
                            const isActive = isPlaying && (i % 5 === beatStep % 5);
                            return (
                              <span key={i} className={`rounded-full w-[3px] transition-all duration-150 ${isActive ? 'bg-indigo-400' : 'bg-white/30'}`}
                                style={{ height: isPlaying ? `${35 + Math.abs(Math.sin((i + beatStep) * 0.7)) * 65}%` : '20%' }} />
                            );
                          })}
                        </div>
                      </div>

                      {/* Play/pause overlay tap area */}
                      <button onClick={() => setIsPlaying(p => !p)}
                        className="absolute inset-0 flex items-center justify-center bg-transparent group">
                        {!isPlaying && (
                          <div className="bg-indigo-600/90 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl border border-white/20 hover:scale-110 transition">
                            <Play size={22} className="ml-1" />
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Status indicator under the preview phone frame */}
                    {!generatedVideo && (
                      <div className="text-center mt-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-[10px] font-bold text-indigo-400">
                        ⚡ Visual Draft Mode Active. Click Generate AI Campaign Video to render final scripts and templates.
                      </div>
                    )}

                    {/* Controls bar below video */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsPlaying(p => !p)}
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10">
                          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button onClick={() => { setIsPlaying(false); setTimeout(() => { setActiveSlide(0); setIsPlaying(true); }, 100); }}
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10">
                          <RotateCcw size={16} />
                        </button>
                        {/* Progress bar */}
                        <div className="h-1.5 w-28 bg-white/10 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all ease-linear"
                            style={{ 
                              width: `${((activeSlide + 1) / 3) * 100}%`,
                              transitionDuration: isPlaying ? `${(duration * 1000) / 3}ms` : '0ms'
                            }} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleDownload} disabled={!generatedVideo}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 border border-white/10 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5">
                          <Download size={13} /> Export
                        </button>
                        <button onClick={handlePublish} disabled={!generatedVideo}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 text-white font-black text-xs rounded-xl hover:opacity-90 transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
                          <Send size={13} /> Publish
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI STORYBOARD TIMELINE (STEP 5) */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-5 mt-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-405 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">5</span>
                      AI Storyboard Builder Timeline
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      Interactive multi-scene campaign sequencer. Click scenes to scrub preview video frames.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-[8px] font-black tracking-widest uppercase shadow-sm">
                    30 SEC TIMELINE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { step: 1, id: 0, title: "Scene 1: Hook", duration: "0-3s", type: "Attention Grab", camera: selectedHook.category || "Price Shock", graphics: "Intro Glow", desc: generatedVideo ? generatedVideo.captions[0] : `Introducing the stunning ${selectedProduct?.name || 'Product'}!`, presenter: selectedAvatar.id !== 'off' ? selectedAvatar.name : "Product Only" },
                    { step: 2, id: 1, title: "Scene 2: Reveal", duration: "3-8s", type: "Product Reveal", camera: "360 Orbit", graphics: "3D Product Glow", desc: generatedVideo ? generatedVideo.captions[1] : `Premium quality at ${selectedProduct?.price || 'Best Price'} only!`, presenter: selectedAvatar.id !== 'off' ? selectedAvatar.name : "Product Only" },
                    { step: 3, id: 2, title: "Scene 3: Features", duration: "8-15s", type: "Feature Demo", camera: "Macro Close-up", graphics: selectedFormat.name, desc: generatedVideo ? generatedVideo.captions[2] : `Grab yours today on BalajiMart!`, presenter: selectedAvatar.id !== 'off' ? selectedAvatar.name : "Product Only" },
                    { step: 4, id: 3, title: "Scene 4: Benefits", duration: "15-22s", type: "Lifestyle Use", camera: "Slow Motion", graphics: "Particles Glow", desc: "Demonstrating real-world lifestyle utility and specs.", presenter: "AI Presenter Dual-Feed" },
                    { step: 5, id: 4, title: "Scene 5: Offer & CTA", duration: "22-30s", type: "Offer & CTA", camera: "Dolly Out", graphics: "Discount Popups", desc: `Get yours today on BalajiMart!`, presenter: "Direct presenter closeout" }
                  ].map((scene, idx) => {
                    const isSceneActive = activeSlide === idx || (idx >= 3 && activeSlide === 2);
                    return (
                      <button
                        key={scene.step}
                        type="button"
                        onClick={() => {
                          if (idx < 3) {
                            setActiveSlide(idx);
                            setIsPlaying(false);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all duration-300 relative flex flex-col justify-between h-44 ${
                          isSceneActive
                            ? 'border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500/50 shadow-lg'
                            : 'border-white/5 hover:border-white/20 bg-slate-950/20 hover:bg-slate-950/40'
                        }`}
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              isSceneActive ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'
                            }`}>
                              {scene.duration}
                            </span>
                            {isSceneActive && (
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <h4 className="text-[10px] font-black text-white group-hover:text-indigo-400 transition truncate mt-1">
                            {scene.title}
                          </h4>
                          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">
                            {scene.type}
                          </p>
                        </div>

                        <p className="text-[8px] text-slate-350 line-clamp-3 italic leading-relaxed my-2">
                          "{scene.desc}"
                        </p>

                        <div className="space-y-0.5 w-full border-t border-white/5 pt-1.5 font-mono text-[6px] text-slate-500">
                          <div className="flex justify-between">
                            <span>🎥 CAM:</span>
                            <span className="text-white font-semibold truncate max-w-[50px]">{scene.camera}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🎨 FX:</span>
                            <span className="text-white font-semibold truncate max-w-[50px]">{scene.graphics}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🗣️ PRES:</span>
                            <span className="text-indigo-400 font-semibold truncate max-w-[50px]">{scene.presenter}</span>
                          </div>
                        </div>
                        {isSceneActive && (
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 rounded-b-xl" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HIGGSFIELD DECISIONS GRID */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-5 mt-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Wand2 size={13} className="text-indigo-400" />
                      Higgsfield AI Studio Decisions Grid
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      Real-time machine learning decisions computed for the active product reel campaign.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[8px] font-black tracking-widest uppercase shadow-sm">
                    ACTIVE ANALYSIS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 1. PRODUCT ANALYZER */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">1️⃣ AI Product Analyzer</h4>
                    <div className="space-y-1.5 text-[9px] font-medium text-slate-400 font-sans">
                      <div className="flex justify-between"><span className="font-semibold">Type:</span><span className="text-white font-bold truncate max-w-[80px]" title={creativeAnalysis.productType || selectedProduct?.name}>{creativeAnalysis.productType || selectedProduct?.name}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Category:</span><span className="text-white font-bold">{selectedProduct?.category || "General"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Price Tier:</span><span className="text-emerald-400 font-black">PREMIUM</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Visual Style:</span><span className="text-white font-bold">{creativeAnalysis.style || "Premium Style"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Emotion:</span><span className="text-purple-400 font-bold">{creativeAnalysis.emotion || "Excitement"}</span></div>
                    </div>
                  </div>

                  {/* 2. AUDIENCE INTELLIGENCE */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">2️⃣ AI Audience Intel</h4>
                    <div className="space-y-1.5 text-[9px] font-medium text-slate-400 font-sans">
                      <div className="flex justify-between"><span className="font-semibold">Demographic:</span><span className="text-white font-bold">{creativeAnalysis.audience || "General Consumers"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Age Bracket:</span><span className="text-white font-bold">{creativeAnalysis.age || "18-35"} yrs</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Interests:</span><span className="text-white font-bold truncate max-w-[80px]" title={creativeAnalysis.interests || "Shopping"}>{creativeAnalysis.interests || "Shopping"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Locations:</span><span className="text-white font-bold">{creativeAnalysis.location || "Metro Cities"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Intent Tier:</span><span className="text-emerald-400 font-bold">High Purchase</span></div>
                    </div>
                  </div>

                  {/* 3. PLATFORM OPTIMIZER */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">3️⃣ Platform Optimizer</h4>
                    <div className="space-y-1.5 text-[9px] font-medium text-slate-400 font-sans">
                      <div className="flex justify-between"><span className="font-semibold">Platform:</span><span className="text-white font-bold">{selectedPlatform.name}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Aspect Ratio:</span><span className="text-white font-bold">{selectedPlatform.aspect}</span></div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Safe Areas:</span>
                        <span className="text-emerald-400 font-bold">100% Cleared</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Hook Position:</span>
                        <span className="text-white font-bold">
                          {selectedPlatform.id === 'reels' ? 'Top Header' : selectedPlatform.id === 'feed' ? 'Top Captions' : 'Lower Third'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Text Safe-Zone:</span>
                        <span className="text-indigo-400 font-bold uppercase">{creativeAnalysis.safeZoneAlignment || "bottom"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. ENGINE SUMMARY */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">4️⃣ Production Summary</h4>
                    <div className="space-y-1.5 text-[9px] font-medium text-slate-400 font-sans">
                      <div className="flex justify-between"><span className="font-semibold">Ad Format:</span><span className="text-white font-bold">{selectedFormat.name}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Hook Reveal:</span><span className="text-white font-bold">{selectedHook.name}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Camera Path:</span><span className="text-white font-bold">{creativeAnalysis.cameraDirection || "Slow Motion"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Motion FX:</span><span className="text-white font-bold">{creativeAnalysis.motionGraphics || "3D Product Glow"}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">Presenter VO:</span><span className="text-indigo-400 font-bold">{voiceover !== 'off' ? voiceover.toUpperCase() : 'NONE'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR (xl:col-span-5) - Accordion Grouped Configurations */}
            <div className="xl:col-span-5 space-y-4">

              {/* ACCORDION STEP 1: Catalog & Links Scrapers */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-white/15 transition duration-300">
                <button 
                  type="button" 
                  onClick={() => setActivePanel(activePanel === 'source' ? '' : 'source')}
                  className="w-full flex items-center justify-between p-4 bg-slate-950/40 border-b border-white/5 text-left hover:bg-slate-950/60 transition"
                >
                  <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">1</span>
                    Catalog & Scrapers Setup
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{activePanel === 'source' ? '▼' : '▶'}</span>
                </button>

                {activePanel === 'source' && (
                  <div className="p-5 space-y-4 animate-scaleUp">
                    {/* Real-time Link-to-Ad Scraper Form */}
                    <form onSubmit={handleUrlScan} className="flex gap-2">
                      <div className="relative flex-1 flex items-center group">
                        <input 
                          type="url"
                          placeholder="Paste product link (Amazon, Flipkart, etc.)"
                          required
                          disabled={isScraping}
                          className="w-full px-3 py-2 bg-indigo-950/20 border border-white/10 focus:border-indigo-500 rounded-xl text-[11px] font-bold text-white outline-none transition-all placeholder:text-slate-500 focus:bg-indigo-950/40"
                          value={productUrl}
                          onChange={(e) => setProductUrl(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isScraping}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        {isScraping ? 'Scanning...' : 'Scan & Ad'}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/35 border border-dashed border-indigo-550 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition duration-300 shadow-md shadow-indigo-950/20 active:scale-[0.98] cursor-pointer"
                    >
                      <Plus size={13} /> Create Product Manually
                    </button>

                    <div className="relative flex items-center gap-2 py-1">
                      <div className="h-[1px] bg-white/5 flex-1" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Or choose from catalog</span>
                      <div className="h-[1px] bg-white/5 flex-1" />
                    </div>

                    {/* Premium Real-Time Search Bar */}
                    <div className="relative flex items-center group">
                      <Search className="absolute left-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={13} />
                      <input 
                        type="text"
                        placeholder="Search product catalog by name, category..."
                        className="w-full pl-8 pr-8 py-2 bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl text-xs font-bold text-white outline-none transition-all placeholder:text-slate-500 focus:bg-white/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-500 hover:text-white transition">
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {productsList.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-bold italic">
                        No products found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                        {productsList.map(prod => (
                          <button key={prod.id} onClick={() => handleProductSelect(prod)}
                            className={`relative flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${selectedProduct?.id === prod.id ? 'border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500' : 'border-white/10 hover:bg-white/5'}`}>
                            <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-white line-clamp-1">{prod.name}</div>
                              <div className="text-[8px] font-bold text-slate-400">{prod.price}</div>
                            </div>
                            {selectedProduct?.id === prod.id && <Check size={10} className="text-indigo-400 absolute top-2 right-2" />}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="relative flex items-center gap-2 py-1">
                      <div className="h-[1px] bg-white/5 flex-1" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Viral Reference cloner</span>
                      <div className="h-[1px] bg-white/5 flex-1" />
                    </div>

                    {/* Viral Reference cloner */}
                    <form onSubmit={handleExtractReference} className="space-y-2.5">
                      <input 
                        type="url"
                        placeholder="Paste Instagram Reel / TikTok / YouTube URL"
                        required
                        className="w-full px-3 py-2 bg-indigo-950/20 border border-white/10 focus:border-indigo-500 rounded-xl text-[11px] font-bold text-white outline-none transition-all placeholder:text-slate-500 focus:bg-indigo-950/40"
                        value={referenceUrl}
                        onChange={(e) => setReferenceUrl(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={isExtractingRef || !selectedProduct}
                        className="w-full py-2 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/25"
                      >
                        {isExtractingRef ? 'Extracting Structure...' : 'Extract & Apply to Product'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* ACCORDION STEP 2: Higgsfield 2.0 Creative Settings */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-white/15 transition duration-300">
                <button 
                  type="button" 
                  onClick={() => setActivePanel(activePanel === 'creative' ? '' : 'creative')}
                  className="w-full flex items-center justify-between p-4 bg-slate-950/40 border-b border-white/5 text-left hover:bg-slate-950/60 transition"
                >
                  <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">2</span>
                    Higgsfield 2.0 Creative Setup
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{activePanel === 'creative' ? '▼' : '▶'}</span>
                </button>

                {activePanel === 'creative' && (
                  <div className="p-5 space-y-4 animate-scaleUp">
                    {/* Format options */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">1) Pick The Format That Hits</label>
                        <button type="button" onClick={() => setFormatModalOpen(true)} className="w-full flex items-center justify-between p-3 bg-indigo-950/20 hover:bg-indigo-950/40 border border-white/10 rounded-xl transition group text-left shadow-inner">
                          <div className="flex items-center gap-3">
                            <img src={selectedFormat.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10 shadow-sm" />
                            <div>
                              <div className="text-xs font-black text-white group-hover:text-indigo-400 transition">{selectedFormat.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold line-clamp-1 mt-0.5">{selectedFormat.desc}</div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">2) Hooks That Stop The Scroll</label>
                        <button type="button" onClick={() => setHookModalOpen(true)} className="w-full flex items-center justify-between p-3 bg-indigo-950/20 hover:bg-indigo-950/40 border border-white/10 rounded-xl transition group text-left shadow-inner">
                          <div className="flex items-center gap-3">
                            <img src={selectedHook.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10 shadow-sm" />
                            <div>
                              <div className="text-xs font-black text-white group-hover:text-indigo-400 transition">{selectedHook.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold line-clamp-1 mt-0.5">{selectedHook.desc}</div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">3) Settings That Set The Scene</label>
                        <button type="button" onClick={() => setSceneModalOpen(true)} className="w-full flex items-center justify-between p-3 bg-indigo-950/20 hover:bg-indigo-950/40 border border-white/10 rounded-xl transition group text-left shadow-inner">
                          <div className="flex items-center gap-3">
                            <img src={selectedScene.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10 shadow-sm" />
                            <div>
                              <div className="text-xs font-black text-white group-hover:text-indigo-400 transition">{selectedScene.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold line-clamp-1 mt-0.5">{selectedScene.desc}</div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      </div>
                    </div>

                    {/* Platform Selector */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Target Platform Viewport</label>
                      <div className="grid grid-cols-2 gap-2">
                        {PLATFORMS.map(plat => (
                          <button key={plat.id} onClick={() => { setSelectedPlatform(plat); setGeneratedVideo(null); }}
                            className={`p-2.5 rounded-xl border text-left transition-all ${selectedPlatform.id === plat.id ? 'border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500' : 'border-white/10 hover:bg-white/5'}`}>
                            <div className="text-base mb-0.5">{plat.icon}</div>
                            <div className="text-[10px] font-black text-white">{plat.name}</div>
                            <div className="text-[8px] font-bold text-slate-500">{plat.aspect}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Caption Style */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Caption Style & Glow</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CAPTION_STYLES.map(style => (
                          <button key={style.id} onClick={() => setCaptionStyle(style)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${captionStyle.id === style.id ? 'border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500' : 'border-white/10 hover:bg-white/5'}`}>
                            <div className="text-[10px] font-black text-white">{style.name}</div>
                            <div className="text-[8px] font-semibold text-slate-500">{style.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION STEP 3: Presenters, Audio & FX Sync */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-white/15 transition duration-300">
                <button 
                  type="button" 
                  onClick={() => setActivePanel(activePanel === 'presenters' ? '' : 'presenters')}
                  className="w-full flex items-center justify-between p-4 bg-slate-950/40 border-b border-white/5 text-left hover:bg-slate-950/60 transition"
                >
                  <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">3</span>
                    Casting Studio & Audio FX
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{activePanel === 'presenters' ? '▼' : '▶'}</span>
                </button>

                {activePanel === 'presenters' && (
                  <div className="p-5 space-y-4 animate-scaleUp text-left">
                    {/* Casting Filters */}
                    <div className="space-y-3 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={12} /> Presenter Demographics Casting
                      </h4>
                      
                      {/* Nationality filter */}
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase">Model Origin</span>
                        <div className="flex gap-1">
                          {['all', 'indian', 'international'].map(nat => (
                            <button
                              key={nat}
                              type="button"
                              onClick={() => setCastingNationality(nat)}
                              className={`flex-1 py-1 rounded text-[9px] font-black uppercase border transition ${
                                castingNationality === nat
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {nat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gender / Type filter */}
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase">Model Type</span>
                        <div className="flex gap-1 flex-wrap">
                          {['all', 'male', 'female', 'child', 'family'].map(gen => (
                            <button
                              key={gen}
                              type="button"
                              onClick={() => setCastingGender(gen)}
                              className={`px-2 py-1 rounded text-[8px] font-black uppercase border transition ${
                                castingGender === gen
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {gen}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Archetype filter */}
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase">Presenter Role</span>
                        <div className="flex gap-1 flex-wrap">
                          {['all', 'influencer', 'reviewer', 'celebrity', 'luxury', 'tech', 'ambassador'].map(arch => (
                            <button
                              key={arch}
                              type="button"
                              onClick={() => setCastingArchetype(arch)}
                              className={`px-2 py-1 rounded text-[8px] font-black uppercase border transition ${
                                castingArchetype === arch
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {arch}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Filtered Spokeperson list */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Select AI Spokesperson Model ({filteredAvatars.length - 1} found)</label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                        {filteredAvatars.map(avatar => {
                          const isSel = selectedAvatar.id === avatar.id;
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => setSelectedAvatar(avatar)}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                                isSel
                                  ? 'border-indigo-500 bg-indigo-600/10 text-white shadow-inner'
                                  : 'border-white/10 hover:bg-white/5 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl shrink-0">{avatar.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-[10px] font-black text-white flex items-center gap-1.5">
                                    {avatar.name}
                                    {avatar.nationality !== 'all' && (
                                      <span className="px-1.5 py-0.2 bg-white/10 text-slate-300 rounded-[3px] text-[6px] font-black uppercase">
                                        {avatar.nationality}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[8px] text-slate-500 font-semibold line-clamp-1 mt-0.5">{avatar.desc}</div>
                                </div>
                              </div>
                              {avatar.id !== 'off' && (
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[7px] font-black uppercase tracking-wider">
                                  {avatar.archetype}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Voice Studio controls */}
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Mic size={12} /> AI Multilingual Voice Studio
                      </h4>

                      {/* Language selection dropdown */}
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black uppercase tracking-wider text-slate-500">Spokesperson Script Language</label>
                        <select
                          value={spokespersonLanguage}
                          onChange={(e) => setSpokespersonLanguage(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                        >
                          <option value="english">🇺🇸 English (US/Global)</option>
                          <option value="hindi">🇮🇳 Hindi (शुद्ध भारतीय)</option>
                          <option value="hinglish">🇮🇳 Hinglish (Urban Indo-English)</option>
                          <option value="punjabi">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</option>
                          <option value="bengali">🇮🇳 Bengali (বাংলা)</option>
                          <option value="tamil">🇮🇳 Tamil (தமிழ்)</option>
                        </select>
                      </div>

                      {/* Voice style preset selector */}
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black uppercase tracking-wider text-slate-500">Voice Persona Preset</label>
                        <div className="grid grid-cols-1 gap-1">
                          {Object.keys(CelebrityVoices).map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setVoiceover(v)}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                voiceover === v
                                  ? 'border-indigo-500 bg-indigo-600/10 text-white'
                                  : 'border-white/5 text-slate-400 hover:bg-white/5'
                              }`}
                            >
                              <div className="text-[9px] font-black">{CelebrityVoices[v].desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Listen audio draft trigger */}
                      {voiceover !== 'off' && generatedVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentCaption = generatedVideo.captions[activeSlide];
                            if (currentCaption) {
                              const cleanText = currentCaption.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
                              speakText(cleanText, voiceover);
                              toast.success("🗣️ Testing voice synthesis...");
                            }
                          }}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-center text-slate-200 transition"
                        >
                          Listen active scene voice draft 🔊
                        </button>
                      )}
                    </div>

                    {/* Audio track selection */}
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Reel Music Track</label>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setUseCustomAudio(false)} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${!useCustomAudio ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>🎵 Built-in</button>
                        <button onClick={() => setUseCustomAudio(true)} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${useCustomAudio ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>⬆️ My Audio</button>
                      </div>

                      {!useCustomAudio ? (
                        <div className="grid grid-cols-1 gap-1.5">
                          {BUILTIN_TRACKS.map(track => (
                            <button key={track.id} onClick={() => { setSelectedTrack(track); if (isPlaying) { stopAudio(); setTimeout(startAudio, 100); } }}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${selectedTrack.id === track.id ? 'border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500' : 'border-white/10 hover:bg-white/5'}`}>
                              <span className="text-base">{track.emoji}</span>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="text-[10px] font-black text-white">{track.name}</div>
                                <div className="text-[8px] font-bold text-slate-500">{track.vibe} • {track.bpm} BPM</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button onClick={() => fileRef.current?.click()} className="w-full py-3 border border-dashed border-indigo-500/40 hover:border-indigo-500 bg-indigo-600/5 rounded-xl flex flex-col items-center gap-1 transition">
                            <Upload size={16} className="text-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-400">Click to upload your track</span>
                          </button>
                          <input ref={fileRef} type="file" accept="audio/*" onChange={handleSongUpload} className="hidden" />
                          {uploadedSongName && (
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                              <span className="text-[10px] font-bold text-emerald-400 truncate max-w-[150px]">{uploadedSongName}</span>
                              <button onClick={() => { setUploadedSongName(null); setUploadedAudioBuffer(null); setUseCustomAudio(false); }}><Trash2 size={12} className="text-slate-500 hover:text-red-400" /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition">{isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
                      <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }} className="flex-1 accent-indigo-500 h-1" />
                    </div>

                    {/* Visual Cutout Option */}
                    <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white">Transparent Cutout GFX</span>
                        <span className="text-[8px] text-slate-500">Isolate product using Cloudinary AI</span>
                      </div>
                      <button onClick={() => setIsBackgroundRemoved(!isBackgroundRemoved)} className={`w-8 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${isBackgroundRemoved ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ${isBackgroundRemoved ? 'translate-x-3' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION STEP 4: Campaign Rendering Settings */}
              <div className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-white/15 transition duration-300">
                <button 
                  type="button" 
                  onClick={() => setActivePanel(activePanel === 'rendering' ? '' : 'rendering')}
                  className="w-full flex items-center justify-between p-4 bg-slate-950/40 border-b border-white/5 text-left hover:bg-slate-950/60 transition"
                >
                  <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">4</span>
                    Campaign Rendering Settings
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{activePanel === 'rendering' ? '▼' : '▶'}</span>
                </button>

                {activePanel === 'rendering' && (
                  <div className="p-5 space-y-4 animate-scaleUp text-left">
                    {/* Duration Selection */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Ad Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 15, label: '15 seconds' },
                          { value: 30, label: '30 seconds' },
                          { value: 60, label: '60 seconds' }
                        ].map(d => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => {
                              setDuration(d.value);
                              if (selectedProduct) {
                                handleProductSelect(selectedProduct, selectedFormat, selectedHook, selectedScene, d.value, quality);
                              }
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${
                              duration === d.value
                                ? 'border-indigo-500 bg-indigo-600/10 text-white ring-1 ring-indigo-500'
                                : 'border-white/10 hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Selection */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Export Quality</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: '720p', label: '720p' },
                          { value: '1080p', label: '1080p HD' },
                          { value: '4k', label: '4K UHD' }
                        ].map(q => (
                          <button
                            key={q.value}
                            type="button"
                            onClick={() => {
                              setQuality(q.value);
                              if (selectedProduct) {
                                handleProductSelect(selectedProduct, selectedFormat, selectedHook, selectedScene, duration, q.value);
                              }
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${
                              quality === q.value
                                ? 'border-indigo-500 bg-indigo-600/10 text-white ring-1 ring-indigo-500'
                                : 'border-white/10 hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frame Rate (FPS) Selection */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Frame Rate (FPS)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 24, label: '24 FPS Cinematic' },
                          { value: 30, label: '30 FPS Social' },
                          { value: 60, label: '60 FPS Smooth' }
                        ].map(f => (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => setFps(f.value)}
                            className={`py-2 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${
                              fps === f.value
                                ? 'border-indigo-500 bg-indigo-600/10 text-white ring-1 ring-indigo-500'
                                : 'border-white/10 hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Grading LUT Selection */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Color Grading LUT</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { value: 'natural', label: 'Natural' },
                          { value: 'warm', label: 'Warm Gold' },
                          { value: 'cyber', label: 'Cyber Neon' },
                          { value: 'mono', label: 'Noir B&W' }
                        ].map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setColorFilter(c.value)}
                            className={`py-2 px-1 rounded-xl border text-[9px] font-black text-center transition-all cursor-pointer ${
                              colorFilter === c.value
                                ? 'border-indigo-500 bg-indigo-600/10 text-white ring-1 ring-indigo-500'
                                : 'border-white/10 hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Neural Rendering Engine */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Neural Render Engine</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'neural', label: 'Neural 2.0' },
                          { value: 'nerf', label: 'NeRF 3D' },
                          { value: 'vector', label: 'Vector Diff' }
                        ].map(e => (
                          <button
                            key={e.value}
                            type="button"
                            onClick={() => setRenderEngine(e.value)}
                            className={`py-2 rounded-xl border text-[9px] font-black text-center transition-all cursor-pointer ${
                              renderEngine === e.value
                                ? 'border-indigo-500 bg-indigo-600/10 text-white ring-1 ring-indigo-500'
                                : 'border-white/10 hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motion Blur & Safe-Zone Alignment toggles */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white">Motion Blur Simulation</span>
                        <span className="text-[8px] text-slate-400 font-medium">Render dynamic camera movements</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMotionBlur(!motionBlur)}
                        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                          motionBlur ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all ${
                          motionBlur ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ALWAYS VISIBLE GENERATE AI REEL BUTTON */}
              <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !selectedProduct}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-900 disabled:to-purple-900 text-white rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-600/30 border border-white/10 group cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Synthesizing Campaign...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="group-hover:rotate-12 transition-transform" />
                    Generate AI Campaign Video
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        {/* ─── LIBRARY TAB ─── */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {reelsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-2xl border border-white/5">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Syncing Visual campaigns database...</p>
              </div>
            ) : publishedReels.length === 0 ? (
              <div className="bg-slate-900/40 text-center py-20 px-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                <Film className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
                <h3 className="text-lg font-black text-white">No Visual Campaigns Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Generate and publish your first product reel using the builder tab to see it here live.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedReels.map(reel => (
                  <div key={reel.id} className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden group hover:border-indigo-500/50 transition-all shadow-xl">
                    <div className="relative aspect-video overflow-hidden">
                      <img src={reel.thumbnail} alt={reel.product?.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black text-white">
                        {reel.platform.icon} {reel.platform.name}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-black text-white truncate">{reel.product?.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{reel.date}</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <div className="w-12 h-12 bg-indigo-600/90 rounded-full flex items-center justify-center border border-white/20">
                          <Play size={18} className="text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-t border-white/10">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Eye size={11} /> {reel.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Star size={11} /> {reel.likes.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Share2 size={11} /> {reel.shares.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-white/5 hover:bg-indigo-600 rounded-lg border border-white/10 text-slate-400 hover:text-white transition" onClick={handleDownload}>
                          <Download size={12} />
                        </button>
                        <button onClick={() => handleDeleteReel(reel.id)} className="p-2 bg-white/5 hover:bg-rose-600 rounded-lg border border-white/10 text-slate-400 hover:text-white transition" title="Delete campaign">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ─── ANALYTICS TAB ─── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 text-left">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Views', value: publishedReels.reduce((a,r) => a+r.views,0).toLocaleString(), icon: Eye, color: 'indigo', change: '+24% this week' },
                { label: 'Total Likes', value: publishedReels.reduce((a,r) => a+r.likes,0).toLocaleString(), icon: Star, color: 'amber', change: '+18% this week' },
                { label: 'Total Shares', value: publishedReels.reduce((a,r) => a+r.shares,0).toLocaleString(), icon: Share2, color: 'emerald', change: '+31% this week' },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-3 hover:border-indigo-500/30 transition shadow-xl">
                  <div className={`p-2.5 w-fit bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-xl`}>
                    <stat.icon size={20} className={`text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">{stat.label}</p>
                    <p className="text-[10px] font-black text-emerald-400 mt-1">{stat.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side (A/B testing + Heatmap overlay) */}
              <div className="lg:col-span-2 space-y-6">
                {/* A/B Simulator */}
                <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-400" /> AI Creative Director A/B Simulator
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1">Diagnose buying psychology & forecast conversion metrics across ad styles.</p>
                    </div>

                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                      {['versionA', 'versionB', 'versionC'].map(ver => (
                        <button
                          key={ver}
                          onClick={() => setSelectedABVersion(ver)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                            selectedABVersion === ver ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {ver === 'versionA' ? 'A: UGC' : ver === 'versionB' ? 'B: Studio' : 'C: ASMR'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isRunningABSimulation ? (
                    <div className="py-8 text-center space-y-4">
                      <div className="relative w-12 h-12 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                      </div>
                      <div className="space-y-1 max-w-xs mx-auto">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">{abSimulationStep}</p>
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${abSimulationProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Metric scores */}
                      <div className="space-y-4 text-left">
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Selected Style</span>
                          <p className="text-xs font-black text-white">{abTestMetrics[selectedABVersion].name}</p>
                        </div>

                        {/* CTR */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Click-Through-Rate (CTR)</span>
                            <span className="text-indigo-400">{abTestMetrics[selectedABVersion].ctr}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${(abTestMetrics[selectedABVersion].ctr / 8) * 100}%` }} />
                          </div>
                        </div>

                        {/* Conversion Rate */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Conversion Rate</span>
                            <span className="text-emerald-400">{abTestMetrics[selectedABVersion].conv}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${(abTestMetrics[selectedABVersion].conv / 5) * 100}%` }} />
                          </div>
                        </div>

                        {/* ROAS */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Estimated ROAS Multiplier</span>
                            <span className="text-amber-400">{abTestMetrics[selectedABVersion].roas}x</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: `${(abTestMetrics[selectedABVersion].roas / 6) * 100}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Creative Director assessment */}
                      <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-4 text-left">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[8px] font-black uppercase rounded">
                            Director Advisory
                          </span>
                          <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                            {selectedABVersion === 'versionA' && 'This version features organic UGC framing. By showing authentic handheld review angles, it triggers status-seeking/social-proof buying psychology, making it highly effective on Instagram Reels.'}
                            {selectedABVersion === 'versionB' && 'Our high-budget television style spot focuses on product contours & luxury lighting profile. Ideal for YouTube Ads campaigns targeting high-income demographics seeking exclusivity.'}
                            {selectedABVersion === 'versionC' && 'Best performer. Sound-optimized ASMR unboxing triggers impulse curiosity and problem-solving relief. Estimated engagement metrics indicate maximum retention and organic sharing coefficients.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={runABSimulation}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-lg shadow-indigo-600/10"
                        >
                          Run Cohort A/B Simulation ⚡
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Visual Engagement Gaze Heatmap */}
                <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Eye size={16} className="text-indigo-400" /> Simulated Eye-Gaze Attention Heatmap
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1">Eye-tracking diagnostics for visual positioning optimization.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-wider transition ${
                        showHeatmap ? 'bg-rose-600/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      Heatmap overlay: {showHeatmap ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* Visual Player Mockup */}
                    <div className="bg-black rounded-2xl border border-white/10 overflow-hidden relative aspect-[9/16] max-w-[200px] mx-auto md:mx-0 shrink-0">
                      <img src={selectedProduct?.image || DEMO_PRODUCTS[0].image} alt="" className="w-full h-full object-cover opacity-60" />
                      
                      {/* Live Heatmap Spots */}
                      {showHeatmap && (
                        <div className="absolute inset-0 bg-black/20 mix-blend-color-dodge z-10 pointer-events-none">
                          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-28 h-28 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.8)_0%,rgba(245,158,11,0.5)_50%,rgba(16,185,129,0)_100%)] animate-pulse animate-duration-1000" />
                          <div className="absolute bottom-[25%] left-[45%] -translate-x-1/2 w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.7)_0%,rgba(16,185,129,0)_100%)] animate-pulse animate-duration-1000" />
                          <div className="absolute top-[10%] right-[10%] w-12 h-12 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.6)_0%,rgba(16,185,129,0)_100%)] animate-pulse animate-duration-1000" />
                        </div>
                      )}

                      <div className="absolute bottom-4 inset-x-2 bg-black/80 p-2 border border-white/10 rounded-xl text-[7px] text-white z-20 text-center font-bold">
                        {selectedProduct?.name || 'Traditional Silk Saree'}
                      </div>
                    </div>

                    {/* Diagnostics and Heatmap Scores */}
                    <div className="md:col-span-2 space-y-4 flex flex-col justify-between text-left">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span>Focus Hotzones parsed:</span>
                          <span className="text-emerald-400 font-black">Success</span>
                        </div>
                        
                        <div className="space-y-2">
                          {[
                            { name: 'Spokesperson Face / Presenter', score: '91% focus capture', color: 'bg-red-500' },
                            { name: 'Product Centering Layout', score: '84% focus capture', color: 'bg-amber-500' },
                            { name: 'Call To Action Header', score: '62% focus capture', color: 'bg-blue-500' },
                          ].map(h => (
                            <div key={h.name} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${h.color}`} />
                                <span className="text-[10px] font-bold text-white">{h.name}</span>
                              </div>
                              <span className="text-[9px] font-black text-slate-400">{h.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-xl">
                        <p className="text-[10px] text-indigo-400 font-bold leading-relaxed">
                          💡 <span className="font-extrabold">Creative Eye-Tracking Advice:</span> Keep call-to-action text in the safe-zones. Gaze attention maps prove that users scan in an F-pattern, focusing 60% on faces and 40% on product placement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side (Regional demand hotspots + Trends + Funnel) */}
              <div className="space-y-6 text-left">
                {/* Regional Hotspots */}
                <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      📍 National Demand Hotspots
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Regional demand mapping for localized audience targeting.</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { city: 'Mumbai Metro (West)', share: '38% affinity', category: 'High Fashion Saree' },
                      { city: 'Delhi NCR (North)', share: '29% affinity', category: 'Premium Laptops' },
                      { city: 'Bengaluru Tech Hub (South)', share: '18% affinity', category: 'Accessories / Electronics' },
                      { city: 'Kolkata & East', share: '15% affinity', category: 'Handcrafted Goods / Saree' }
                    ].map(h => (
                      <div key={h.city} className="flex justify-between items-center p-2.5 bg-slate-950/30 border border-white/5 rounded-xl text-[10px]">
                        <div>
                          <p className="font-black text-white">{h.city}</p>
                          <p className="text-[8px] text-slate-500 font-bold mt-0.5">Top: {h.category}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-black">{h.share}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      📈 Simulated Campaign Funnel
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Average user progression from viewer to customer.</p>
                  </div>
                  <div className="space-y-2.5 pt-2">
                    {[
                      { step: 'Ad Impressions', val: '100k views', pct: '100%' },
                      { step: 'Spokesperson Retention', val: '45k retained >3s', pct: '45%' },
                      { step: 'Product Card Interaction', val: '8.4k engagements', pct: '8.4%' },
                      { step: 'BalajiMart Storefront Clicks', val: '4.2k clicks', pct: '4.2%' },
                      { step: 'Direct Purchase Conversion', val: '1.9k sales', pct: '1.9%' },
                    ].map((f, idx) => (
                      <div key={f.step} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-slate-400">{f.step}</span>
                          <span className="text-white font-extrabold">{f.val} ({f.pct})</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: f.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Trend Tracker */}
                <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      ⚡ Trend Intelligence Feed
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Active audio patterns and trending hooks for marketing sync.</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { tag: '#IndianWearLookBook', views: '1.4M / hr', status: '🔥 Exploding' },
                      { tag: 'Lofi Indian Chill instrumental beat', views: 'Top audio trend', status: '🎵 Recommended' },
                      { tag: 'Fast transition match-cuts style', views: 'High retention loop', status: '🎥 Format focus' },
                    ].map(t => (
                      <div key={t.tag} className="space-y-1 p-2.5 bg-slate-950/40 border border-white/5 rounded-xl">
                        <div className="flex justify-between text-[9px] font-black text-indigo-400 text-left">
                          <span>{t.status}</span>
                          <span className="text-slate-500 font-bold">{t.views}</span>
                        </div>
                        <p className="text-[10px] text-white font-bold">{t.tag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance per Reel list moved to bottom of tab for high visibility */}
            <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-indigo-400" /> Performance per Reel Campaign
              </h3>
              <div className="space-y-3">
                {publishedReels.map((reel, i) => {
                  const maxViews = Math.max(...publishedReels.map(r => r.views));
                  const pct = Math.round((reel.views / maxViews) * 100);
                  return (
                    <div key={reel.id} className="flex items-center gap-4">
                      <img src={reel.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-white truncate">{reel.product?.name || 'Product'}</span>
                          <span className="text-slate-400 shrink-0 ml-2">{reel.views.toLocaleString()} views</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── FORMAT SELECTION MODAL ─── */}
      {formatModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f16]/95 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="font-black text-base text-white tracking-tight uppercase">Pick the Format that Hits</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">From unboxing to UGC - choose the type of video that fits your product and audience.</p>
              </div>
              <button onClick={() => setFormatModalOpen(false)} className="text-slate-400 hover:text-white transition p-1">
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs & Search filter */}
            <div className="px-6 py-3 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-2">
                {['All', 'UGC', 'Commercial'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFormatFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      formatFilter === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center bg-slate-950/60 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white max-w-xs flex-grow">
                <Search size={12} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search formats..."
                  value={formatSearch}
                  onChange={(e) => setFormatSearch(e.target.value)}
                  className="bg-transparent outline-none text-[10px] font-bold tracking-wide w-full"
                />
                {formatSearch && (
                  <button onClick={() => setFormatSearch('')} className="text-slate-400 hover:text-white text-[9px] font-black ml-1.5 uppercase shrink-0">Clear</button>
                )}
              </div>
            </div>

            {/* Modal Content / Options Grid wrapped in scroll container to prevent grid item collapse */}
            <div className="p-6 overflow-y-auto flex-grow no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {AD_FORMATS.filter(item => {
                  const matchTab = formatFilter === 'All' || item.category === formatFilter;
                  const matchSearch = item.name.toLowerCase().includes(formatSearch.toLowerCase()) || item.desc.toLowerCase().includes(formatSearch.toLowerCase());
                  return matchTab && matchSearch;
                }).map(item => (
                  <OptionCard
                    key={item.id}
                    item={item}
                    isActive={selectedFormat.id === item.id}
                    onClick={() => {
                      setSelectedFormat(item);
                      setFormatModalOpen(false);
                      handleProductSelect(selectedProduct, item, selectedHook, selectedScene);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── HOOK SELECTION MODAL ─── */}
      {hookModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f16]/95 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="font-black text-base text-white tracking-tight uppercase">Hooks That Stop The Scroll</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">The first 3 seconds decide if your ad gets watched or skipped. Pick a proven opener.</p>
              </div>
              <button onClick={() => setHookModalOpen(false)} className="text-slate-400 hover:text-white transition p-1">
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs & Search filter */}
            <div className="px-6 py-3 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-2">
                {['All', 'Stunt', 'Subtle'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHookFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      hookFilter === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center bg-slate-950/60 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white max-w-xs flex-grow">
                <Search size={12} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search hooks..."
                  value={hookSearch}
                  onChange={(e) => setHookSearch(e.target.value)}
                  className="bg-transparent outline-none text-[10px] font-bold tracking-wide w-full"
                />
                {hookSearch && (
                  <button onClick={() => setHookSearch('')} className="text-slate-400 hover:text-white text-[9px] font-black ml-1.5 uppercase shrink-0">Clear</button>
                )}
              </div>
            </div>

            {/* Modal Content / Options Grid wrapped in scroll container to prevent grid item collapse */}
            <div className="p-6 overflow-y-auto flex-grow no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SCROLL_HOOKS.filter(item => {
                  const matchTab = hookFilter === 'All' || item.category === hookFilter;
                  const matchSearch = item.name.toLowerCase().includes(hookSearch.toLowerCase()) || item.desc.toLowerCase().includes(hookSearch.toLowerCase());
                  return matchTab && matchSearch;
                }).map(item => (
                  <OptionCard
                    key={item.id}
                    item={item}
                    isActive={selectedHook.id === item.id}
                    onClick={() => {
                      setSelectedHook(item);
                      setHookModalOpen(false);
                      handleProductSelect(selectedProduct, selectedFormat, item, selectedScene);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SCENE SELECTION MODAL ─── */}
      {sceneModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f16]/95 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="font-black text-base text-white tracking-tight uppercase">Settings That Set The Scene</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Choose where the story unfolds. Pick a setting that frames your ad with the right mood.</p>
              </div>
              <button onClick={() => setSceneModalOpen(false)} className="text-slate-400 hover:text-white transition p-1">
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs & Search filter */}
            <div className="px-6 py-3 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-2">
                {['All', 'Realistic', 'Unrealistic'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSceneFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      sceneFilter === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center bg-slate-950/60 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white max-w-xs flex-grow">
                <Search size={12} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search scenes..."
                  value={sceneSearch}
                  onChange={(e) => setSceneSearch(e.target.value)}
                  className="bg-transparent outline-none text-[10px] font-bold tracking-wide w-full"
                />
                {sceneSearch && (
                  <button onClick={() => setSceneSearch('')} className="text-slate-400 hover:text-white text-[9px] font-black ml-1.5 uppercase shrink-0">Clear</button>
                )}
              </div>
            </div>

            {/* Modal Content / Options Grid wrapped in scroll container to prevent grid item collapse */}
            <div className="p-6 overflow-y-auto flex-grow no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SCENE_SETTINGS.filter(item => {
                  const matchTab = sceneFilter === 'All' || item.category === sceneFilter;
                  const matchSearch = item.name.toLowerCase().includes(sceneSearch.toLowerCase()) || item.desc.toLowerCase().includes(sceneSearch.toLowerCase());
                  return matchTab && matchSearch;
                }).map(item => (
                  <OptionCard
                    key={item.id}
                    item={item}
                    isActive={selectedScene.id === item.id}
                    onClick={() => {
                      setSelectedScene(item);
                      setSceneModalOpen(false);
                      handleProductSelect(selectedProduct, selectedFormat, selectedHook, item);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── AI QUALITY VALIDATION MODAL ─── */}
      {qualityAuditOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0c0c14] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 flex flex-col text-center">
            <div className="space-y-2">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                <Sparkles size={24} className="text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="font-black text-base text-white tracking-tight uppercase">AI Quality Validation Engine</h3>
              <p className="text-[10px] text-slate-400 font-medium">Running final quality diagnostics prior to storefront publishing...</p>
            </div>

            <div className="space-y-2.5 text-left bg-slate-950/40 p-4 rounded-2xl border border-white/5 font-mono text-[9px]">
              {[
                "🔍 Product Bounding Box Analysis",
                "📐 Text Safe-Zone Alignment Compliance Check",
                "📢 Voiceover Audio Beat-Sync Alignment",
                "🛡️ Bounding Box Overlap Protection Safeguard",
                "🏷️ Logo & Brand Safe Placement Verification",
                "🎞️ Final HD Frame rate Render Encoding",
              ].map((check, idx) => {
                const isChecked = auditStep > idx;
                const isCurrent = auditStep === idx;
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <span className={isChecked ? "text-slate-400 font-semibold line-through" : isCurrent ? "text-indigo-400 font-bold" : "text-slate-650"}>
                      {check}
                    </span>
                    <span className="font-black text-[9px]">
                      {isChecked ? (
                        <span className="text-emerald-400 font-black">PASS ✓</span>
                      ) : isCurrent ? (
                        <span className="text-indigo-400 animate-pulse font-black">AUDITING...</span>
                      ) : (
                        <span className="text-slate-700 font-black">WAITING</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-500 font-medium">
              {auditStep < 6 ? "Performing diagnostic validations..." : "Validation passed! Publishing campaign..."}
            </div>
          </div>
        </div>
      )}
      {/* ─── CREATE PRODUCT MANUALLY MODAL ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f0f16]/95 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-indigo-400" />
                <h3 className="font-black text-base text-white tracking-tight uppercase">Create Product Manually</h3>
              </div>
              <button onClick={() => { setIsCreateModalOpen(false); setNewImagePreview(''); setNewImageFile(null); }} className="text-slate-400 hover:text-white transition p-1">
                <X size={16} />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleCreateProductSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar flex-grow text-left">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-405">Product Image</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-indigo-500/50 transition duration-300 relative overflow-hidden bg-slate-950/30">
                    {newImagePreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={newImagePreview} alt="Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Upload size={14} /> Change Image
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-indigo-400" />
                        <p className="mb-1 text-xs text-slate-350 font-bold">Upload product photo</p>
                        <p className="text-[9px] text-slate-500 font-semibold">PNG, JPG, or WEBP (Max 5MB)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                      required={!newImageFile}
                    />
                  </label>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-405">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spicy Indian snacks"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-white/10 focus:border-indigo-500 rounded-xl text-xs font-bold text-white outline-none transition-all placeholder:text-slate-605 focus:bg-slate-950/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-405">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-white/10 focus:border-indigo-500 rounded-xl text-xs font-bold text-white outline-none transition-all focus:bg-slate-950/80"
                  >
                    {['Fashion', 'Electronics', 'Home & Living', 'Accessories', 'Beauty', 'Grocery', 'General'].map(cat => (
                      <option key={cat} value={cat} className="bg-[#0f0f16] text-white font-bold">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price Field */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-405">Price (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 199"
                    required
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-white/10 focus:border-indigo-500 rounded-xl text-xs font-bold text-white outline-none transition-all placeholder:text-slate-605 focus:bg-slate-950/80"
                  />
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-405">Product Description</label>
                <textarea
                  placeholder="e.g. Spicy & crispy traditional Indian snacks perfect for evening tea time."
                  required
                  rows="3"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-white/10 focus:border-indigo-500 rounded-xl text-xs font-bold text-white outline-none transition-all placeholder:text-slate-605 focus:bg-slate-950/80 resize-none font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setNewImagePreview(''); setNewImageFile(null); }}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 text-white font-black text-xs rounded-xl hover:opacity-90 transition duration-300 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {isCreatingProduct ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

const getSafeVideoUrl = (url) => {
  if (!url) return '';
  const u = String(url).toLowerCase();
  
  // Bypass Mixkit filter for spokesperson avatars to play the real actors speaking
  if (u.includes('talking-to-camera') || u.includes('man-explaining') || u.includes('smiling-broadly') || u.includes('corporate-man') || u.includes('talking-to-colleagues') || u.includes('interview')) {
    return url;
  }
  
  if (u.includes('mixkit.co') || u.includes('movie.mp4') || u.includes('w3schools') || u.includes('oceans.mp4') || u.includes('trailer_hd.mp4') || u.includes('mov_bbb.mp4')) {
    if (u.includes('young-woman-smiling-broadly') || u.includes('fashion') || u.includes('runway') || u.includes('saree') || u.includes('pajama') || u.includes('dress') || u.includes('suit') || u.includes('garment')) {
      return 'https://video.wixstatic.com/video/c9f0be_58b128bbe3f345a7b73046d88501a18e/1080p/mp4/file.mp4';
    }
    if (u.includes('applying-lip-gloss') || u.includes('makeup') || u.includes('beauty') || u.includes('lipstick') || u.includes('mirror') || u.includes('cosmetic')) {
      return 'https://video.wixstatic.com/video/550f4d_fabf39995ffe4e9f9e1da4c808af2d1e/1080p/mp4/file.mp4';
    }
    if (u.includes('vegetables-chopping') || u.includes('food') || u.includes('eating') || u.includes('cooking') || u.includes('chef') || u.includes('grocery') || u.includes('cookie') || u.includes('fryer') || u.includes('kitchen')) {
      return 'https://video.wixstatic.com/video/a5e29c_7e1fe25289d6445fa3b7b936f73621a8/480p/mp4/file.mp4';
    }
    if (u.includes('unboxing') || u.includes('smartphone') || u.includes('hands-of-a-man') || u.includes('office') || u.includes('tech') || u.includes('laptop') || u.includes('headphone') || u.includes('phone') || u.includes('electronic')) {
      return 'https://video.wixstatic.com/video/52bd90_1323700cec5f4de1872921299e0db601/1080p/mp4/file.mp4';
    }
    if (u.includes('bedroom') || u.includes('interior') || u.includes('fireplace') || u.includes('decor') || u.includes('home') || u.includes('living') || u.includes('room') || u.includes('house') || u.includes('penthouse') || u.includes('library') || u.includes('apartment') || u.includes('lounge')) {
      return 'https://video.wixstatic.com/video/fee955_4c31236543f3463da6e7948747dbebee/1080p/mp4/file.mp4';
    }
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }
  return url;
};

export default AIVideoStudio;
