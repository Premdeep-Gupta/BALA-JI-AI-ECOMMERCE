import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, Sparkles, Mic, MicOff, ShoppingCart,
  Volume2, VolumeX, Star, ChevronRight, Search, Zap, Heart, TrendingUp,
  Package, Tag, ArrowRight, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleCart } from '../../store/slices/popupSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSecureProductImage } from '../../utils/urlHelper';

// ─── VOICE RECOGNITION ENGINE ────────────────────────────────────────────────
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechAPI = !!SpeechRecognitionAPI;

// ─── TEXT-TO-SPEECH WITH DYNAMIC SCRIPT DETECTOR ────────────────────────────────
const detectTextLanguage = (text) => {
  if (!text) return 'en-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Devanagari (Hindi, Marathi, Sanskrit, Kashmiri, Nepali, Konkani, Dogri, Maithili, Bodo, Santali)
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali script (Bengali, Assamese, Manipuri)
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'; // Gurmukhi (Punjabi)
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or-IN'; // Odia
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-IN'; // Arabic/Perso-Arabic (Urdu, Kashmiri Arabic script)
  return 'en-IN'; // Default English-India
};

const speakText = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  // Clean text: strip action blocks, emojis, markdown formatting, and replace newlines with breathing pauses
  const clean = text
    .replace(/\[.*?\]/g, '')
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[*_~`#]/g, '')
    .replace(/\n+/g, '. ')
    .trim()
    .slice(0, 250);

  const utter = new SpeechSynthesisUtterance(clean);
  const detectedLang = detectTextLanguage(clean);
  utter.lang = detectedLang;
  utter.rate = 1.0;  // Normal speed for maximum clarity
  utter.pitch = 1.0; // Natural pitch
  utter.volume = 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.toLowerCase() === detectedLang.toLowerCase() || v.lang.startsWith(detectedLang.slice(0, 2)));
  if (preferredVoice) {
    utter.voice = preferredVoice;
  } else {
    const fallbackVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
    if (fallbackVoice) utter.voice = fallbackVoice;
  }
  window.speechSynthesis.speak(utter);
};

const detectLanguageCode = (text) => {
  if (!text) return 'en';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
  if (/[\u0600-\u06FF]/.test(text)) return 'ur';
  
  const lower = text.toLowerCase();
  if (/\b(dikhao|chahiye|hai|sasta|kam|mili|he|ko|se|ya|bhi|kuch|aur|nhi|sahi|hai|kar|diya|karein|karta|hai|namaste|lelo|juta|jute|sari|saree)\b/.test(lower)) {
    return 'hi_hinglish';
  }
  return 'en';
};

const LOCALIZED_RESPONSES = {
  en: {
    addToCartSuccess: (name) => `I have added **${name}** to your cart. Please open the cart to checkout! 🛒`,
    addToCartSpecify: "Which item would you like to add? Please specify the correct product name! 🛍️",
    budgetSuccess: (maxPrice) => `Here are the best matching products within your budget of **₹${maxPrice.toLocaleString()}**! 💰`,
    budgetNoMatch: (maxPrice) => `No exact matches found in the ₹${maxPrice.toLocaleString()} range, but feel free to explore our collections!`,
    compareSuccess: (n1, n2) => `I can check that! The comparison between **${n1}** and **${n2}** is ready. ⚖️`,
    compareSpecify: "Select specs to compare laptops or mobile devices. ⚖️",
    bestIntro: "These are the Top Rated and Highly Recommended premium products in our catalog! ⭐",
    searchSuccess: (name) => `I found matching products and recommendations for **${name}** in the catalog! 🚀`,
    welcome: `Welcome to Balaji Mart! You can ask to **"compare"**, search **"affordable products"**, or find **"laptops under ₹50,000"** and I will get instant results for you! 🤖`,
    voiceSearch: (count, text) => `${count} products found for "${text}". Check them out!`
  },
  bn: {
    addToCartSuccess: (name) => `আমি আপনার কার্টে **${name}** যোগ করেছি। চেকআউট করতে কার্ট খুলুন! 🛒`,
    addToCartSpecify: "আপনি কোন আইটেমটি যোগ করতে চান? সঠিক পণ্যটির নাম উল্লেখ করুন! 🛍️",
    budgetSuccess: (maxPrice) => `আপনার বাজেট **₹${maxPrice.toLocaleString()}** এর মধ্যে সেরা পণ্যগুলি এখানে রয়েছে! 💰`,
    budgetNoMatch: (maxPrice) => `₹${maxPrice.toLocaleString()} সীমার মধ্যে কোনো সঠিক মিল পাওয়া যায়নি, তবে আমাদের কালেকশন ঘুরে দেখতে পারেন!`,
    compareSuccess: (n1, n2) => `আমি এটি তুলনা করতে পারি! **${n1}** এবং **${n2}** এর মধ্যে তুলনা প্রস্তুত। ⚖️`,
    compareSpecify: "ল্যাপটপ বা মোবাইল ডিভাইস তুলনা করতে স্পেসিফিকেশন নির্বাচন করুন। ⚖️",
    bestIntro: "এগুলি আমাদের ক্যাটালগে সেরা রেটযুক্ত এবং অত্যন্ত প্রস্তাবিত প্রিমিয়াম পণ্য! ⭐",
    searchSuccess: (name) => `আমি ক্যাটালগে **${name}** এর জন্য মিল পাওয়া পণ্য এবং সুপারিশ খুঁজে পেয়েছি! 🚀`,
    welcome: `বালাজি মার্টে স্বাগতম! আপনি **"তুলনা করতে"** বলতে পারেন, **"সাশ্রয়ী পণ্য"** খুঁজতে পারেন অথবা **"₹৫০,০০০ এর নিচে ল্যাপটপ"** খুঁজতে পারেন এবং আমি তাত্ক্ষণিক ফলাফল দেব! 🤖`,
    voiceSearch: (count, text) => `"${text}" এর জন্য ${count}টি পণ্য পাওয়া গেছে। দেখে নিন!`
  },
  hi: {
    addToCartSuccess: (name) => `मैंने **${name}** को आपके कार्ट में जोड़ दिया है। चेकआउट करने के लिए कार्ट खोलें! 🛒`,
    addToCartSpecify: "आप कौन सा उत्पाद जोड़ना चाहते हैं? कृपया सही उत्पाद का नाम बताएं! 🛍️",
    budgetSuccess: (maxPrice) => `यहाँ आपके **₹${maxPrice.toLocaleString()}** के बजट के अंतर्गत सबसे बेहतरीन उत्पाद दिए गए हैं! 💰`,
    budgetNoMatch: (maxPrice) => `₹${maxPrice.toLocaleString()} की सीमा में कोई सटीक उत्पाद नहीं मिला, लेकिन आप हमारे संग्रह देख सकते हैं!`,
    compareSuccess: (n1, n2) => `मैं इसकी तुलना कर सकता हूँ! **${n1}** और **${n2}** के बीच तुलना तैयार है। ⚖️`,
    compareSpecify: "लैपटॉप या मोबाइल उपकरणों की तुलना करने के लिए विशिष्टताओं का चयन करें। ⚖️",
    bestIntro: "ये हमारे कैटलॉग में टॉप रेटेड और अत्यधिक अनुशंसित प्रीमियम उत्पाद हैं! ⭐",
    searchSuccess: (name) => `मुझे कैटलॉग में **${name}** के लिए मिलते-जुलते उत्पाद और सिफारिशें मिली हैं! 🚀`,
    welcome: `बालाजी मार्ट में आपका स्वागत है! आप **"तुलना"** करने के लिए कह सकते हैं, **"सस्ते उत्पाद"** खोज सकते हैं, या **"₹50,000 के तहत लैपटॉप"** ढूंढ सकते हैं और मैं तुरंत परिणाम दूंगा! 🤖`,
    voiceSearch: (count, text) => `"${text}" के लिए ${count} उत्पाद मिले। इन्हें देखें!`
  },
  hi_hinglish: {
    addToCartSuccess: (name) => `Maine **${name}** ko aapke cart me add kar diya hai. Checkout ke liye cart open karein! 🛒`,
    addToCartSpecify: "Aap kaun sa item add karna chahte hain? Please sahi product name batayein! 🛍️",
    budgetSuccess: (maxPrice) => `Ye rahe aapke budget **₹${maxPrice.toLocaleString()}** ke matching products! 💰`,
    budgetNoMatch: (maxPrice) => `₹${maxPrice.toLocaleString()} range me koi exact match nahi mila, par aap collections check kar sakte hain!`,
    compareSuccess: (n1, n2) => `Main check kar sakta hoon! **${n1}** aur **${n2}** ka comparison ready hai. ⚖️`,
    compareSpecify: "Laptops ya mobile compare karne ke liye details select karein. ⚖️",
    bestIntro: "Ye humare catalog ke Top Rated aur Highly Recommended premium products hain! ⭐",
    searchSuccess: (name) => `Mujhe catalog me **${name}** ke matching products aur recommendations mile hain! 🚀`,
    welcome: `Balaji Mart me aapka welcome hai! Aap **"compare"** karne ko bol sakte hain, **"affordable products"** search kar sakte hain, ya **"laptops under ₹50,000"** dhoond sakte hain! 🤖`,
    voiceSearch: (count, text) => `"${text}" ke liye ${count} products mile hain. Inhe check karein!`
  },
  ta: {
    addToCartSuccess: (name) => `நான் கார்ட்டில் **${name}** ஐச் சேர்த்துள்ளேன். செக்அவுட் செய்ய கார்ட்டைத் திறக்கவும்! 🛒`,
    addToCartSpecify: "எந்தப் பொருளை சேர்க்க விரும்புகிறீர்கள்? சரியான பொருளின் பெயரை குறிப்பிடவும்! 🛍️",
    budgetSuccess: (maxPrice) => `உங்கள் பட்ஜெட் **₹${maxPrice.toLocaleString()}** க்குள் சிறந்த தயாரிப்புகள் இதோ! 💰`,
    budgetNoMatch: (maxPrice) => `₹${maxPrice.toLocaleString()} வரம்பிற்குள் தயாரிப்புகள் எதுவும் இல்லை, ஆனால் எங்கள் சேகரிப்புகளைப் பார்க்கவும்!`,
    compareSuccess: (n1, n2) => `ஒப்பீடு தயாராக உள்ளது: **${n1}** மற்றும் **${n2}**. ⚖️`,
    compareSpecify: "ஒப்பிட தயாரிப்புகளைத் தேர்ந்தெடுக்கவும். ⚖️",
    bestIntro: "இவை சிறந்த மதிப்பீடு பெற்ற தயாரிப்புகள்! ⭐",
    searchSuccess: (name) => `**${name}** க்கான தயாரிப்புகள் க্যাটாலகில் கண்டறியப்பட்டன! 🚀`,
    welcome: `பாலாஜி மார்ட்டிற்கு வரவேற்கிறோம்! நீங்கள் தயாரிப்புகளை **"ஒப்பிடலாம்"**, **"மலிவான தயாரிப்புகள்"** தேடலாம். 🤖`,
    voiceSearch: (count, text) => `"${text}" க்கான ${count} தயாரிப்புகள் கண்டறியப்பட்டன. அவற்றைச் சரிபார்க்கவும்!`
  },
  te: {
    addToCartSuccess: (name) => `నేను కార్ట్‌లో **${name}** జోడించాను. చెకౌట్ చేయడానికి కార్ట్‌ని తెరవండి! 🛒`,
    addToCartSpecify: "ఏ ఉత్పత్తిని కార్ట్‌లో జోడించాలనుకుంటున్నారు? సరైన ఉత్పత్తి పేరు చెప్పండి! 🛍️",
    budgetSuccess: (maxPrice) => `మీ బడ్జెట్ **₹${maxPrice.toLocaleString()}** లోపు ఉన్న ఉత్పత్తులు ఇవి! 💰`,
    budgetNoMatch: (maxPrice) => `ఈ బడ్జెట్లో సరిపోలే ఉత్పత్తులు లేవు, మా ఇతర సేకరణలను చూడండి!`,
    compareSuccess: (n1, n2) => `**${n1}** మరియు **${n2}** పోలిక సిద్ధంగా ఉంది. ⚖️`,
    compareSpecify: "పరికరాలను పోల్చడానికి ఎంచుకోండి. ⚖️",
    bestIntro: "ఇవి మా కేటలాగ్‌లో అత్యుత్తమ ఉత్పత్తులు! ⭐",
    searchSuccess: (name) => `కేటలాగ్‌లో **${name}** కోసం ఉత్పత్తులు కనుగొనబడ్డాయి! 🚀`,
    welcome: `బాలాజీమార్ట్‌కు స్వాగతం! మీరు ఉత్పత్తులను **"పోల్చవచ్చు"** లేదా శోధించవచ్చు. 🤖`,
    voiceSearch: (count, text) => `"${text}" కోసం ${count} ఉత్పత్తులు కనుగొనబడ్డాయి. వాటిని చూడండి!`
  },
  kn: {
    addToCartSuccess: (name) => `ನಾನು ಕಾರ್ಟ್‌ಗೆ **${name}** ಸೇರಿಸಿದ್ದೇನೆ. ಜೆಕ್ಔಟ್ ಮಾಡಲು ಕಾರ್ಟ್ ತೆರೆಯಿರಿ! 🛒`,
    addToCartSpecify: "ನೀವು ಯಾವ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ? ಸರಿಯಾದ ಉತ್ಪನ್ನದ ಹೆಸರನ್ನು ತಿಳಿಸಿ! 🛍️",
    budgetSuccess: (maxPrice) => `ನಿಮ್ಮ ಬಜೆಟ್‌ಗೆ **₹${maxPrice.toLocaleString()}** ಹೊಂದಾಣಿಕೆಯಾಗುವ ಉತ್ಪನ್ನಗಳು! 💰`,
    budgetNoMatch: (maxPrice) => `ಈ ಬೆಲೆಯಲ್ಲಿ ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಲಭ್ಯವಿಲ್ಲ, ದಯವಿಟ್ಟು ಬೇರೆ ಉತ್ಪನ್ನ ನೋಡಿ!`,
    compareSuccess: (n1, n2) => `**${n1}** ಮತ್ತು **${n2}** ಹೋಲಿಕೆ ಸಿದ್ಧವಾಗಿದೆ. ⚖️`,
    compareSpecify: "ಹೋಲಿಸಲು ಉತ್ಪನ್ನಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ⚖️",
    bestIntro: "ಇವು ನಮ್ಮ ಅತ್ಯುತ್ತಮ ರೇಟ್ ಮಾಡಲಾದ ಉತ್ಪನ್ನಗಳು! ⭐",
    searchSuccess: (name) => `ಕೇಟಲಾಗ್‌ನಲ್ಲಿ **${name}** ಹೊಂದಾಣಿಕೆಯಾಗುವ ಉತ್ಪನ್ನಗಳು ಲಭ್ಯವಿವೆ! 🚀`,
    welcome: `ಬಾಲಾಜಿಮಾರ್ಟ್‌ಗೆ ಸುಸ್ವಾಗತ! ನೀವು ಉತ್ಪನ್ನಗಳನ್ನು **"ಹೋಲಿಸಬಹುದು"** ಅಥವಾ ಹುಡುಕಬಹುದು. 🤖`,
    voiceSearch: (count, text) => `"${text}" ಗಾಗಿ ${count} ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿವೆ. ಅವುಗಳನ್ನು ನೋಡಿ!`
  },
  ml: {
    addToCartSuccess: (name) => `ഞാൻ **${name}** നിങ്ങളുടെ കാർട്ടിൽ ചേർത്തു. ചെക്ക്ഔട്ട് ചെയ്യാൻ കാർട്ട് തുറക്കുക! 🛒`,
    addToCartSpecify: "നിങ്ങൾ ഏത് ഉൽപ്പന്നമാണ് കാർട്ടിൽ ചേർക്കാൻ ആഗ്രഹിക്കുന്നത്? ഉൽപ്പന്നത്തിന്റെ പേര് വ്യക്തമാക്കുക! 🛍️",
    budgetSuccess: (maxPrice) => `നിങ്ങളുടെ ബജറ്റായ **₹${maxPrice.toLocaleString()}** നുള്ളിലെ മികച്ച ഉൽപ്പന്നങ്ങൾ ഇതാ! 💰`,
    budgetNoMatch: (maxPrice) => `ഈ ബജറ്റിൽ ഉൽപ്പന്നങ്ങൾ ലഭ്യമല്ല, ഞങ്ങളുടെ മറ്റ് ശേഖരങ്ങൾ കാണുക!`,
    compareSuccess: (n1, n2) => `**${n1}** ഉം **${n2}** ഉം തമ്മിലുള്ള താരതമ്യം തയ്യാറാണ്. ⚖️`,
    compareSpecify: "താരതമ്യം ചെയ്യാൻ ഉപകരണങ്ങൾ തിരഞ്ഞെടുക്കുക. ⚖️",
    bestIntro: "ഇവ ഞങ്ങളുടെ മികച്ച ഉൽപ്പന്നങ്ങളാണ്! ⭐",
    searchSuccess: (name) => `**${name}** നുള്ള ഉൽപ്പന്നങ്ങൾ കാറ്റലോഗിൽ കണ്ടെത്തി! 🚀`,
    welcome: `ബാലാജിമാർട്ടിലേക്ക് സ്വാഗതം! നിങ്ങൾക്ക് ഉൽപ്പന്നങ്ങൾ **"താരതമ്യം"** ചെയ്യാം. 🤖`,
    voiceSearch: (count, text) => `"${text}" നായി ${count} ഉൽപ്പന്നങ്ങൾ കണ്ടെത്തി. അവ പരിശോധിക്കുക!`
  },
  gu: {
    addToCartSuccess: (name) => `મેં **${name}** ને તમારા કાર્ટમાં ઉમેરી દીધું છે. ચેકઆઉટ કરવા માટે કાર્ટ ખોલો! 🛒`,
    addToCartSpecify: "તમે કઈ પ્રોડક્ટ ઉમેરવા માંગો છો? કૃપા કરીને સાચું નામ જણાવો! 🛍️",
    budgetSuccess: (maxPrice) => `તમારા બજેટ **₹${maxPrice.toLocaleString()}** માટે શ્રેષ્ઠ પ્રોડક્ટ્સ અહીં છે! 💰`,
    budgetNoMatch: (maxPrice) => `આ બજેટમાં કોઈ પ્રોડક્ટ મળી નથી, પરંતુ અમારી અન્ય પ્રોડક્ટ્સ જુઓ!`,
    compareSuccess: (n1, n2) => `**${n1}** અને **${n2}** ની સરખામણી તૈયાર છે. ⚖️`,
    compareSpecify: "સરખામણી કરવા માટે પ્રોડક્ટ્સ પસંદ કરો. ⚖️",
    bestIntro: "આ અમારી સૌથી લોકપ્રિય પ્રોડક્ટ્સ છે! ⭐",
    searchSuccess: (name) => `કૅટેલોગમાં **${name}** માટે પ્રોડક્ટ્સ મળી છે! 🚀`,
    welcome: `બાલાજી માર્ટમાં તમારું સ્વાગત છે! તમે પ્રોડક્ટ્સની **"સરખામણી"** કરી શકો છો. 🤖`,
    voiceSearch: (count, text) => `"${text}" માટે ${count} પ્રોડક્ટ્સ મળી છે. તે જુઓ!`
  },
  pa: {
    addToCartSuccess: (name) => `ਮੈਂ **${name}** ਨੂੰ ਤੁਹਾਡੀ ਕਾਰਟ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ ਹੈ। ਚੈੱਕਆਉਟ ਲਈ ਕਾਰਟ ਖੋਲ੍ਹੋ! 🛒`,
    addToCartSpecify: "ਤੁਸੀਂ ਕਿਹੜਾ ਪ੍ਰੋਡਕਟ ਜੋੜਨਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਪ੍ਰੋਡਕਟ ਦਾ ਨਾਮ ਦੱਸੋ! 🛍️",
    budgetSuccess: (maxPrice) => `ਤੁਹਾਡੇ ਬਜਟ **₹${maxPrice.toLocaleString()}** ਲਈ ਪ੍ਰੋਡਕਟਸ ਹੇਠਾਂ ਦਿੱਤੇ ਗਏ ਹਨ! 💰`,
    budgetNoMatch: (maxPrice) => `ਇਸ ਬਜਟ ਵਿੱਚ ਕੋਈ ਮੇਲ ਖਾਂਦਾ ਪ੍ਰੋਡਕਟ ਨਹੀਂ ਮਿਲਿਆ, ਪਰ ਸਾਡੇ ਹੋਰ ਸੰਗ੍ਰਹਿ ਦੇਖੋ!`,
    compareSuccess: (n1, n2) => `**${n1}** ਅਤੇ **${n2}** ਦੀ ਤੁਲਨਾ ਤਿਆਰ ਹੈ। ⚖️`,
    compareSpecify: "ਤੁਲਨਾ ਕਰਨ ਲਈ ਪ੍ਰੋਡਕਟਸ ਦੀ ਚੋਣ ਕਰੋ। ⚖️",
    bestIntro: "ਇਹ ਸਾਡੇ ਸਭ ਤੋਂ ਵਧੀਆ ਰੇਟ ਕੀਤੇ ਪ੍ਰੋਡਕਟਸ ਹਨ! ⭐",
    searchSuccess: (name) => `ਕੈਟਾਲਾਗ ਵਿੱਚ **${name}** ਲਈ ਪ੍ਰۆਡਕਟਸ ਲੱਭੇ ਗਏ ਹਨ! 🚀`,
    welcome: `ਬਾਲਾਜੀ ਮਾਰਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ! ਤੁਸੀਂ ਪ੍ਰੋਡਕਟਸ ਦੀ **"ਤੁਲਨਾ"** ਕਰ ਸਕਦੇ ਹੋ। 🤖`,
    voiceSearch: (count, text) => `"${text}" ਲਈ ${count} ਉਤਪਾਦ ਮਿਲੇ ਹਨ। ਇਹਨਾਂ ਨੂੰ ਦੇਖੋ!`
  },
  or: {
    addToCartSuccess: (name) => `ମୁଁ ଆପଣଙ୍କ କାର୍ଟରେ **${name}** ଯୋଡି ଦେଇଛି। ଚେକଆଉଟ୍ ପାଇଁ କାର୍ଟ ଖୋଲନ୍ତୁ! 🛒`,
    addToCartSpecify: "ଆପଣ କେଉଁ ପ୍ରଡକ୍ଟ ଯୋଡିବାକୁ ଚାହୁଁଛନ୍ତି? ଦୟାକରି ସଠିକ୍ ପ୍ରଡକ୍ଟର ନାମ ଲେଖନ୍ତು! 🛍️",
    budgetSuccess: (maxPrice) => `ଆପଣଙ୍କ ବଜେଟ୍ **₹${maxPrice.toLocaleString()}** ପାଇଁ ଉପଯୁକ୍ତ ପ୍ରଡକ୍ଟଗୁଡ଼ିକ ଏଠାରେ ଅଛି! 💰`,
    budgetNoMatch: (maxPrice) => `ଏହି ବଜେଟ୍ ରେ କୌଣସି ପ୍ରଡକ୍ଟ ମିଳିଲା ନାହିଁ, ଆମର ଅନ୍ୟ ସଂଗ୍ରହ ଦେଖନ୍ତୁ!`,
    compareSuccess: (n1, n2) => `**${n1}** ଏବଂ **${n2}** ମଧ୍ୟରେ ତୁଳନା ପ୍ରସ୍ତୁତ ଅଛି। ⚖️`,
    compareSpecify: "ତୁଳନା ପାଇଁ ପ୍ରଡକ୍ଟ ଚୟନ କରନ୍ତୁ। ⚖️",
    bestIntro: "ଏଗୁଡ଼ିକ ଆମର ସର୍ବୋତ୍ତਮ ପ୍ରଡକ୍ଟ ଅଟେ! ⭐",
    searchSuccess: (name) => `କ୍ୟାଟାଲଗ୍ ରେ **${name}** ପାଇଁ ପ୍ରଡକ୍ଟ ମିଳିଛି! 🚀`,
    welcome: `ବାଲାଜୀମାର୍ଟରେ ଆପଣଙ୍କୁ ସ୍ୱାગତ! ଆପଣ ପ୍ରଡକ୍ଟକୁ **"ତୁଳନା"** କରିପାରିବେ। 🤖`,
    voiceSearch: (count, text) => `"${text}" ପାଇଁ ${count} ଟି ପ୍ରଡକ୍ଟ ମିଳିଛି। ଏହାକୁ ଦେଖନ୍ତು!`
  },
  ur: {
    addToCartSuccess: (name) => `میں نے **${name}** کو آپ کے کارٹ میں شامل کر دیا ہے۔ check out کے لیے کارٹ کھولیں! 🛒`,
    addToCartSpecify: "آپ کون سا پروڈکٹ شامل کرنا چاہتے ہیں؟ براہ کرم پروڈکٹ کا صحیح نام بتائیں! 🛍️",
    budgetSuccess: (maxPrice) => `آپ کے بجٹ **₹${maxPrice.toLocaleString()}** کے لیے بہترین پروڈکٹس یہ ہیں! 💰`,
    budgetNoMatch: (maxPrice) => `اس بجٹ میں کوئی پروڈکٹ نہیں ملی، لیکن آپ ہمارا کلیکشن دیکھ سکتے ہیں!`,
    compareSuccess: (n1, n2) => `**${n1}** اور **${n2}** کا موازنہ تیار ہے۔ ⚖️`,
    compareSpecify: "موازنہ کرنے کے لیے پروڈکٹس منتخب کریں۔ ⚖️",
    bestIntro: "یہ ہمارے بہترین پروڈکٹس ہیں! ⭐",
    searchSuccess: (name) => `کیٹلاگ میں **${name}** کے لیے مصنوعات مل گئیں! 🚀`,
    welcome: `بالاجی مارٹ میں خوش آمدید! آپ مصنوعات کا **"موازنہ"** کر سکتے ہیں۔ 🤖`,
    voiceSearch: (count, text) => `"${text}" کے لیے ${count} پروڈکٹس ملیں۔ انہیں دیکھیں!`
  }
};

// ─── QUICK SUGGESTION PILLS ───────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { label: '🔥 Best deals today', msg: 'Best deals dikhao aaj ke' },
  { label: '👟 Shoes under ₹2000', msg: 'Shoes under 2000 dikhao' },
  { label: '💻 Laptops', msg: 'Best laptops suggest karo' },
  { label: '💰 Budget sasta items', msg: 'Budget kam hai, sasta dikhao' },
  { label: '⭐ Top rated', msg: 'Top rated products dikhao' },
  { label: '🎁 Gift ideas', msg: 'Gift ideas suggest karo' },
];

// ─── EMOTION → UI STYLE MAP ───────────────────────────────────────────────────
const EMOTION_STYLES = {
  budget_conscious: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '💰 Budget Mode', border: 'border-amber-500/30' },
  frustrated: { color: 'text-red-400', bg: 'bg-red-500/10', label: '😤 Resolving', border: 'border-red-500/30' },
  excited: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '🎉 Excited!', border: 'border-emerald-500/30' },
  needs_guidance: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: '🧭 Guiding You', border: 'border-blue-500/30' },
  comparing: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: '⚖️ Comparing', border: 'border-purple-500/30' },
  ready_to_buy: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: '🛒 Ready to Buy', border: 'border-indigo-500/30' },
  neutral: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '💬 Chatting', border: 'border-slate-500/30' },
};

// ─── CANVAS VOICE WAVES VISUALIZER ───────────────────────────────────────────
const VoiceVisualizer = ({ isListening }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isListening) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw glowing background orb
      const radG = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 40);
      radG.addColorStop(0, "rgba(99, 102, 241, 0.25)");
      radG.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = radG;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw concentric wavy rings
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const baseRadius = 25 + i * 15;
        const pulse = Math.sin(time * 0.08 - i * 1.5) * 8;
        const r = baseRadius + pulse;
        
        ctx.arc(centerX, centerY, Math.max(r, 10), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.7 - i * 0.22})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      time += 1;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    />
  );
};

// ─── PRODUCT CARD (inline in chat) ───────────────────────────────────────────
const InlineProductCard = ({ product, onAddToCart }) => {
  const imgSrc = getSecureProductImage(product);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-2 bg-white/5 border border-white/15 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition group cursor-pointer"
    >
      <div className="p-3 flex items-center gap-3">
        <Link to={`/product/${product.id || product._id}`} className="flex flex-1 items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {imgSrc ? (
              <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={22} className="text-indigo-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">{product.name}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{product.category}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black text-indigo-300">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.ratings && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
                  <Star size={9} fill="currentColor" /> {Number(product.ratings).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </Link>
        <div className="flex flex-col gap-1.5 shrink-0 relative z-10">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/20"
            title="Add to Cart"
          >
            <ShoppingCart size={13} />
          </button>
          <Link
            to={`/product/${product.id || product._id}`}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center justify-center"
            title="View Product"
          >
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// ─── VOICE SEARCH RESULTS PANEL ───────────────────────────────────────────────
const VoiceResultsPanel = ({ results, intent, transcript, onAddToCart, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="ai-salesman-panel fixed bottom-24 right-6 w-[380px] bg-[#0d0d18] border border-indigo-500/30 rounded-3xl shadow-2xl z-50 overflow-hidden"
    style={{ boxShadow: '0 0 60px rgba(99,102,241,0.2)' }}
  >
    <div className="p-4 border-b border-white/10 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Mic size={12} className="text-white" />
          </div>
          <span className="text-xs font-black text-white">Voice Search Results</span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">"{transcript}"</p>
      </div>
      <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition shrink-0">
        <X size={14} />
      </button>
    </div>

    <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
      {results.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs font-medium">
          No products found matching your voice query. Try a different search!
        </div>
      ) : (
        results.map(product => {
          const imgSrc = getSecureProductImage(product);
          return (
            <div key={product.id || product._id} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {imgSrc ? (
                  <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={18} className="text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white line-clamp-1">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-black text-indigo-300">₹{Number(product.price).toLocaleString('en-IN')}</span>
                  {product.ratings && (
                    <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                      <Star size={9} fill="currentColor" /> {Number(product.ratings).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button
                  onClick={() => onAddToCart(product)}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                >
                  <ShoppingCart size={12} />
                </button>
                <Link to={`/product/${product.id || product._id}`} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
    <div className="p-3 border-t border-white/10 text-center">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
        View All Results <ChevronRight size={12} />
      </Link>
    </div>
  </motion.div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AISalesman = () => {
  const dispatch = useDispatch();
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  const { products = [] } = useSelector(state => state.product || {});

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'voice'
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 🙏 I am Salesman — your premium AI Shopping Assistant. I can help you find the right products, set price filters, and compare products. What would you like to buy today? 🛍️",
      sender: 'ai',
      emotion: 'neutral',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Voice Commerce State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResults, setVoiceResults] = useState(null);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // ── ADD TO CART ──
  const handleAddToCart = useCallback((product) => {
    const prodId = product.id || product._id;
    if (!prodId) return;
    dispatch(addToCart({ product: { ...product, id: prodId }, quantity: 1 }));
    dispatch(toggleCart());
    toast.success(`🛒 ${product.name} added to cart!`);
  }, [dispatch]);

  // ── AUTO COMPARISON QUEUE ──
  const autoQueueForComparison = useCallback((suggestedList) => {
    if (!suggestedList || suggestedList.length < 2) return;
    try {
      const existing = JSON.parse(localStorage.getItem("ai_compare_queue")) || [];
      let updated = [...existing];
      
      suggestedList.forEach(product => {
        const prodId = product.id || product._id;
        if (!prodId) return;
        const alreadyAdded = updated.some(p => p.id === prodId || p._id === prodId);
        if (!alreadyAdded) {
          const fullProd = products.find(p => String(p.id || p._id) === String(prodId)) || product;
          
          let firstImage = "/no-image.png";
          if (fullProd.images) {
            try {
              const imgs = typeof fullProd.images === "string" ? JSON.parse(fullProd.images) : fullProd.images;
              if (Array.isArray(imgs) && imgs.length > 0) {
                firstImage = imgs[0]?.url || imgs[0] || "/no-image.png";
              }
            } catch (_) {}
          } else if (fullProd.image) {
            firstImage = fullProd.image;
          }

          updated.push({
            id: prodId,
            name: fullProd.name,
            image: firstImage,
            price: fullProd.price,
            ratings: fullProd.ratings,
            category: fullProd.category,
            stock: fullProd.stock,
            offer_type: fullProd.offer_type,
          });
        }
      });

      // Limit to 3 max
      updated = updated.slice(0, 3);
      localStorage.setItem("ai_compare_queue", JSON.stringify(updated));
      toast.success("AI has automatically queued items for comparison! ⚖️");
    } catch (err) {
      console.warn("Auto compare queue synchronization failed:", err.message);
    }
  }, [products]);

  // ── VOICE RECOGNITION ──
  const startListening = useCallback(() => {
    if (!hasSpeechAPI) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => { setIsListening(true); setVoiceTranscript(''); };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setVoiceTranscript(transcript);

      if (e.results[e.results.length - 1].isFinal) {
        handleVoiceSearch(transcript);
      }
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      toast.error(`Mic error: ${e.error}`);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setRecognitionInstance(recognition);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
    }
  }, [recognitionInstance]);

  // VOICE SEARCH REASONING ENGINE (INTEGRATED WITH BACKEND ROUTE & LOCAL FALLBACK)
  const handleVoiceSearch = async (transcript) => {
    if (!transcript.trim()) return;
    setIsVoiceSearching(true);
    setVoiceTranscript(transcript);
    
    try {
      const res = await axiosInstance.post('/ai-salesman/voice-search', { transcript });
      if (res.data.success) {
        setVoiceResults({
          success: true,
          transcript,
          products: res.data.products || [],
          resultCount: res.data.resultCount || 0,
        });

        if (isSpeakerOn) {
          const count = res.data.products?.length || 0;
          const lang = detectLanguageCode(transcript);
          const voiceResp = LOCALIZED_RESPONSES[lang] || LOCALIZED_RESPONSES.en;
          speakText(voiceResp.voiceSearch(count, transcript));
        }
      }
    } catch (err) {
      console.warn("Backend voice search failed, falling back locally:", err.message);
      const query = transcript.toLowerCase();
      const matched = products.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        (p.tags && p.tags.some(t => query.includes(t.toLowerCase())))
      );
      
      setVoiceResults({
        success: true,
        transcript,
        products: matched.slice(0, 5),
        resultCount: matched.length,
      });

      if (isSpeakerOn) {
        const count = matched.length;
        const lang = detectLanguageCode(transcript);
        const voiceResp = LOCALIZED_RESPONSES[lang] || LOCALIZED_RESPONSES.en;
        speakText(voiceResp.voiceSearch(count, transcript));
      }
    } finally {
      setIsVoiceSearching(false);
    }
  };

  // ── SEND CHAT MESSAGE & LOCAL NLP ENGINE FALLBACK ──
  const handleSend = async (e, overrideMsg) => {
    if (e) e.preventDefault();
    const msgText = (overrideMsg || input).trim();
    if (!msgText) return;

    const userMsg = { id: Date.now(), text: msgText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = messages.slice(-8);
      const res = await axiosInstance.post('/ai-salesman/chat', {
        message: msgText,
        context,
        isVoiceQuery: false,
      });

      if (res.data.success) {
        const { reply, emotion, productCard, cartAction, suggestedProducts } = res.data;
        setCurrentEmotion(emotion || 'neutral');

        if (emotion === 'comparing' && suggestedProducts?.length >= 2) {
          autoQueueForComparison(suggestedProducts);
        }

        const aiMsg = {
          id: Date.now() + 1,
          text: reply,
          sender: 'ai',
          emotion,
          productCard,
          suggestedProducts,
        };
        setMessages(prev => [...prev, aiMsg]);

        if (isSpeakerOn) speakText(reply);

        // Handle cart action from AI
        if (cartAction?.type === 'add_to_cart' && cartAction.product_id) {
          const targetProduct = products.find(p => String(p.id || p._id) === String(cartAction.product_id));
          if (targetProduct) {
            setTimeout(() => handleAddToCart(targetProduct), 500);
          }
        }
        setIsLoading(false);
      }
    } catch (err) {
      const query = msgText.toLowerCase();
      const lang = detectLanguageCode(msgText);
      const resp = LOCALIZED_RESPONSES[lang] || LOCALIZED_RESPONSES.en;

      let reply = resp.welcome;
      let emotion = "neutral";
      let productCard = null;
      let suggestedProducts = [];
      let cartAction = null;
      
      const matched = products.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        (p.tags && p.tags.some(t => query.includes(t.toLowerCase())))
      );
      
      if (/(cart|add|put|insert|daal|dal|jod|যোগ|சேர்|జోడించు|సೇರಿಸಿ|ചേർക്കുക|ઉમેરો|ਜੋੜੋ|ଯୋଡ଼ନ୍ତು|شامل)/i.test(query)) {
        const target = products.find(p => query.includes(p.name?.toLowerCase()) || p.tags?.some(t => query.includes(t.toLowerCase())));
        if (target) {
          reply = resp.addToCartSuccess(target.name);
          emotion = "excited";
          cartAction = { type: "add_to_cart", product_id: target.id || target._id };
          productCard = target;
        } else {
          reply = resp.addToCartSpecify;
          emotion = "needs_guidance";
        }
      } else if (/(budget|discount|offer|under|cheap|price|coupon|sasta|kam|chhoot|बजेट|छাড়|কম দাম|மலிவான|தள்ளுபடி|பட்ஜெட்|తగ్గింపు|చౌక|ರಿಯಾಯಿತಿ|ಅಗ್ಗ|കിഴിവ്|വിലകുറഞ്ഞ|સસ્તું|ਛੋਟ|ਸਸਤਾ|ରିହାତି|ଶସ୍ତା|رعایت)/i.test(query)) {
        emotion = "budget_conscious";
        const numbers = query.match(/\d+/g);
        const maxPrice = numbers ? Number(numbers[0]) : 3000;
        const budgetMatches = products.filter(p => Number(p.price) <= maxPrice).slice(0, 3);
        
        if (budgetMatches.length > 0) {
          reply = resp.budgetSuccess(maxPrice);
          suggestedProducts = budgetMatches;
        } else {
          reply = resp.budgetNoMatch(maxPrice);
        }
      } else if (/(compare|vs|versus|difference|better|antar|farq|fark|tulna|বনাম|তুলনা|পার্থক্য|ஒப்பிடு|வித்தியாசம்|పోల్చండి|తేడా|ಹೋಲಿಸಿ|ವ್ಯತ್ಯಾಸ|താരതമ്യം|വ്യത്യാസം|સરખામણી|તફાવત|ਅੰਤਰ|ପାର୍ଥକ୍ୟ|موازنہ|فرق)/i.test(query)) {
        emotion = "comparing";
        const compareMatches = products.slice(0, 2);
        if (compareMatches.length >= 2) {
          reply = resp.compareSuccess(compareMatches[0].name, compareMatches[1].name);
          suggestedProducts = compareMatches;
        } else {
          reply = resp.compareSpecify;
        }
      } else if (/(best|top|star|recommended|highly rated|बढ़िया|अच्छा|সেরা|সবচেয়ে ভালো|சிறந்த|முதல்|ఉత్తమ|అత్యುತ್ತమ|മികച്ച|ശ്രേഷ്ഠ|ਵਧੀਆ|ਉੱਤਮ|ସର୍ବୋତ୍ତମ|بہترین)/i.test(query)) {
        emotion = "excited";
        const highRated = [...products].sort((a, b) => b.ratings - a.ratings).slice(0, 3);
        reply = resp.bestIntro;
        suggestedProducts = highRated;
      } else if (matched.length > 0) {
        emotion = "excited";
        reply = resp.searchSuccess(matched[0].name);
        productCard = matched[0];
        suggestedProducts = matched.slice(1, 3);
      } else {
        reply = resp.welcome;
      }
      
      setTimeout(() => {
        setCurrentEmotion(emotion);
        if (emotion === 'comparing' && suggestedProducts?.length >= 2) {
          autoQueueForComparison(suggestedProducts);
        }
        const aiMsg = {
          id: Date.now() + 1,
          text: reply,
          sender: "ai",
          emotion,
          productCard,
          suggestedProducts,
        };
        setMessages(prev => [...prev, aiMsg]);
        if (isSpeakerOn) speakText(reply);
        
        if (cartAction?.type === "add_to_cart" && cartAction.product_id) {
          const targetProduct = products.find(p => String(p.id || p._id) === String(cartAction.product_id));
          if (targetProduct) {
            handleAddToCart(targetProduct);
          }
        }
        setIsLoading(false);
      }, 700);
    }
  };

  // ── FORMAT AI TEXT (bold + clean) ──
  const formatText = (text) => {
    const bolded = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <span dangerouslySetInnerHTML={{ __html: bolded }} />;
  };

  const emotionStyle = EMOTION_STYLES[currentEmotion] || EMOTION_STYLES.neutral;

  return (
    <>
      {/* ── VOICE RESULTS PANEL (floating) ── */}
      <AnimatePresence>
        {voiceResults && !isOpen && (
          <VoiceResultsPanel
            results={voiceResults.products || []}
            transcript={voiceResults.transcript}
            onAddToCart={handleAddToCart}
            onClose={() => setVoiceResults(null)}
          />
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <div className="relative p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 hover:scale-110 border border-white/20">
              {/* Ping ring */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0d0d18] flex items-center justify-center">
                <span className="w-2 h-2 bg-emerald-350 rounded-full animate-ping absolute" />
              </div>
              <Bot size={24} />
            </div>
            {/* Tooltip */}
            <div className="absolute right-16 bottom-2 bg-slate-900 text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              🤖 Salesman — AI Assistant
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CHAT WINDOW ── */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag
              dragConstraints={constraintsRef}
              dragElastic={0}
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
              className="pointer-events-auto ai-salesman-panel fixed bottom-6 right-6 w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] h-[620px] max-h-[calc(100vh-48px)] flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #0d0d18 0%, #0f0f20 100%)',
                boxShadow: '0 0 80px rgba(99,102,241,0.15), 0 30px 60px rgba(0,0,0,0.8)',
              }}
            >
            {/* ── HEADER ── */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="relative p-4 flex items-center justify-between border-b border-white/10 overflow-hidden shrink-0 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/5 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-[#0d0d18] rounded-xl flex items-center justify-center">
                      <Bot size={20} className="text-purple-400" />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0d0d18]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm">Salesman</h3>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${emotionStyle.bg} ${emotionStyle.color} ${emotionStyle.border}`}>
                      {emotionStyle.label}
                    </span>
                  </div>
                  <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">AI Sales Agent • Online</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10" onPointerDown={(e) => e.stopPropagation()}>
                {/* Speaker toggle */}
                <button
                  onClick={() => setIsSpeakerOn(s => !s)}
                  className={`p-2 rounded-xl border transition ${isSpeakerOn ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  title="Toggle voice responses"
                >
                  {isSpeakerOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex bg-white/5 m-2 rounded-xl p-0.5 border border-white/10 shrink-0">
              <button
                onClick={() => { setActiveTab('chat'); stopListening(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Bot size={12} /> AI Salesman
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition ${activeTab === 'voice' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Mic size={12} /> Voice Commerce
              </button>
            </div>

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                  {/* Quick suggestions (shown only if first message) */}
                  {messages.length === 1 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Quick Suggestions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_SUGGESTIONS.map(s => (
                          <button
                            key={s.label}
                            onClick={() => handleSend(null, s.msg)}
                            className="text-[10px] font-bold text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/25 hover:border-indigo-500/50 px-2.5 py-1.5 rounded-full transition"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message list */}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shrink-0 flex items-center justify-center mt-0.5 shadow-lg">
                          <Bot size={13} className="text-white" />
                        </div>
                      )}

                      <div className="max-w-[82%] space-y-2">
                        <div className={`p-3 text-sm rounded-2xl leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-lg'
                            : 'bg-white/8 border border-white/12 text-slate-200 rounded-tl-sm'
                        }`}>
                          {formatText(msg.text)}
                        </div>

                        {/* Inline Product Card from AI */}
                        {msg.productCard && (
                          <InlineProductCard product={msg.productCard} onAddToCart={handleAddToCart} />
                        )}

                        {/* Suggested Products Grid */}
                        {msg.suggestedProducts?.length > 0 && (
                          <div className="space-y-1.5">
                            {msg.suggestedProducts.map((p, idx) => (
                              <InlineProductCard key={p.id || p._id || idx} product={p} onAddToCart={handleAddToCart} />
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/15 shrink-0 flex items-center justify-center mt-0.5">
                          <span className="text-xs">🙂</span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shrink-0 flex items-center justify-center">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-white/8 border border-white/12 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="text-[10px] text-slate-400 font-medium ml-1">Salesman is thinking...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input bar */}
                <div className="p-3 border-t border-white/10 shrink-0">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Kuch bhi poochho — sasta items, features, comparison..."
                        className="w-full bg-white/5 border border-white/15 focus:border-indigo-500/60 rounded-2xl py-3 pl-4 pr-4 text-sm outline-none text-white placeholder-slate-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-2xl transition shadow-lg shadow-indigo-600/20"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* ── VOICE COMMERCE TAB ── */}
            {activeTab === 'voice' && (
              <div className="flex-1 flex flex-col items-center justify-between p-5 overflow-y-auto">
                <div className="w-full space-y-4">
                  {/* Hero */}
                  <div className="text-center pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 border border-indigo-500/40 rounded-full mb-3">
                      <Zap size={10} className="text-indigo-400" />
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Voice Commerce AI</span>
                    </div>
                    <h3 className="text-lg font-black text-white mb-1">Bol ke Shopping Karo! 🎙️</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                      Apni baat Hindi/English mein bolein — AI samjhega aur best products select karega.
                    </p>
                  </div>

                  {/* How to use */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Try saying:</p>
                    {[
                      '"Mujhe budget laptop dikhao"',
                      '"Shoes under 3000 dikhao"',
                      '"Saree details match karo"',
                      '"High rated headsets kya hain"',
                    ].map(ex => (
                      <div key={ex} className="flex items-center gap-2 text-xs text-slate-300 font-medium font-mono">
                        <span className="text-indigo-400">▶</span> {ex}
                      </div>
                    ))}
                  </div>

                  {/* Transcript display */}
                  {voiceTranscript && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-3 text-center"
                    >
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">You said:</p>
                      <p className="text-sm font-bold text-white">"{voiceTranscript}"</p>
                    </motion.div>
                  )}

                  {/* Voice search results preview */}
                  {voiceResults && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {voiceResults.resultCount} Results Found
                        </p>
                        <button
                          onClick={() => setVoiceResults(null)}
                          className="text-[9px] font-bold text-slate-500 hover:text-white transition"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {(voiceResults.products || []).slice(0, 4).map((p, idx) => (
                          <div key={p.id || p._id || idx} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/40 transition group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 shrink-0 flex items-center justify-center">
                              <Package size={16} className="text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white line-clamp-1">{p.name}</p>
                              <p className="text-xs font-black text-indigo-300">₹{Number(p.price).toLocaleString('en-IN')}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition opacity-100 group-hover:scale-105 shrink-0"
                            >
                              <ShoppingCart size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Mic Visualizer and Button Container */}
                <div className="flex flex-col items-center gap-4 w-full mt-4">
                  {!hasSpeechAPI && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl text-center">
                      <AlertCircle size={13} />
                      Voice triggers require Chrome or Edge.
                    </div>
                  )}

                  <div className="relative flex items-center justify-center w-full h-32">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isVoiceSearching || !hasSpeechAPI}
                      className={`relative z-10 w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-2 font-black text-xs ${
                        isListening
                          ? 'bg-red-650 border-red-400 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110'
                          : isVoiceSearching
                          ? 'bg-indigo-900/50 border-indigo-500/30 text-indigo-400'
                          : 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400/50 text-white hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)]'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isVoiceSearching ? (
                        <RefreshCw size={28} className="animate-spin" />
                      ) : isListening ? (
                        <MicOff size={28} />
                      ) : (
                        <Mic size={28} />
                      )}
                      <span className="text-[10px]">
                        {isVoiceSearching ? 'Searching...' : isListening ? 'Listening...' : 'Tap to speak'}
                      </span>
                    </button>
                    {isListening && <VoiceVisualizer isListening={isListening} />}
                  </div>

                  {/* Manual trigger bar */}
                  <div className="w-full flex gap-2">
                    <div className="flex-1 relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={voiceTranscript}
                        onChange={e => setVoiceTranscript(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleVoiceSearch(voiceTranscript)}
                        placeholder="Ya type karke bolen..."
                        className="w-full bg-white/5 border border-white/15 focus:border-indigo-500/60 rounded-xl py-2.5 pl-8 pr-3 text-xs outline-none text-white placeholder-slate-500 transition"
                      />
                    </div>
                    <button
                      onClick={() => handleVoiceSearch(voiceTranscript)}
                      disabled={!voiceTranscript.trim() || isVoiceSearching}
                      className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                    >
                      <Search size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default AISalesman;
