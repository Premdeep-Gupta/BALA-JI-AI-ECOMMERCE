// AI Shopping Brain - Local Behavior Tracker
// Tracks categories, tags, and price tiers the user interacts with to build a high-fidelity personalized buyer profile.

const PROFILE_KEY = "ai_shopping_profile";

const DEFAULT_PROFILE = {
  categories: {},
  tags: {},
  priceTier: "Premium", // "Budget" | "MidRange" | "Premium"
  budgetScore: 0,
  premiumScore: 0,
};

export const getShoppingProfile = () => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(data);
    return {
      categories: parsed.categories || {},
      tags: parsed.tags || {},
      priceTier: parsed.priceTier || "Premium",
      budgetScore: parsed.budgetScore || 0,
      premiumScore: parsed.premiumScore || 0,
    };
  } catch (err) {
    return { ...DEFAULT_PROFILE };
  }
};

export const saveShoppingProfile = (profile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save shopping profile", err);
  }
};

export const trackCategoryView = (category) => {
  if (!category) return;
  const profile = getShoppingProfile();
  
  profile.categories[category] = (profile.categories[category] || 0) + 1;
  saveShoppingProfile(profile);
};

export const trackProductInteraction = (product) => {
  if (!product) return;
  const profile = getShoppingProfile();
  
  // Track Category
  if (product.category) {
    profile.categories[product.category] = (profile.categories[product.category] || 0) + 1;
  }
  
  // Track Price Tier
  const price = Number(product.price || 0);
  if (price < 3000) {
    profile.budgetScore = (profile.budgetScore || 0) + 1;
  } else if (price >= 15000) {
    profile.premiumScore = (profile.premiumScore || 0) + 1;
  }
  
  // Calculate dominant price tier preference
  if (profile.budgetScore > profile.premiumScore * 1.5) {
    profile.priceTier = "Budget";
  } else if (profile.premiumScore > profile.budgetScore * 1.5) {
    profile.priceTier = "Premium";
  } else {
    profile.priceTier = "MidRange";
  }

  // Track Tags
  const tags = product.tags || [];
  tags.forEach(tag => {
    profile.tags[tag] = (profile.tags[tag] || 0) + 1;
  });
  
  saveShoppingProfile(profile);
};

export const getTopCategory = () => {
  const profile = getShoppingProfile();
  const categories = profile.categories;
  if (!categories || Object.keys(categories).length === 0) return null;
  return Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b);
};

export const getAIRecommendationDetails = () => {
  const profile = getShoppingProfile();
  const topCat = getTopCategory();
  
  let personaName = "Savvy Explorer";
  if (topCat === "Electronics" || topCat === "Mobiles") {
    personaName = profile.priceTier === "Premium" ? "Ultra Tech Enthusiast 💻" : "Value Gear Hunter 📱";
  } else if (topCat === "Fashion" || topCat === "Shoes") {
    personaName = profile.priceTier === "Premium" ? "Haute Couture Icon 👗" : "Smart Style Designer 👟";
  } else if (topCat === "Home") {
    personaName = "Interior Aesthetics Curator 🛋️";
  } else if (topCat === "Books") {
    personaName = "Avid Scholar & Bookworm 📚";
  }
  
  return {
    persona: personaName,
    topCategory: topCat || "All",
    pricePreference: profile.priceTier,
    profile,
  };
};
