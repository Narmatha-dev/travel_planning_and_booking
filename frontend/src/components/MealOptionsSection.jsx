import { useState, useMemo } from 'react';

const MEAL_OPTIONS_DATA = [
  {
    id: 'meal_royal_thali',
    title: 'Royal Heritage Thali Feast',
    cuisine: 'North Indian & Rajasthani',
    category: 'thali',
    categoryLabel: '🍱 Royal Thali',
    dietType: 'veg',
    dietLabel: 'Pure Veg',
    dietIcon: '🌱',
    price: 450,
    rating: 4.9,
    reviewsCount: 1240,
    calories: '680 kcal',
    description:
      'Multi-course royal feast featuring Shahi Paneer, Dal Makhani, fragrant Jeera Pulao, tandoori butter rotis, raita & hot Gulab Jamun.',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    highlights: ['Multi-Course Spread', 'Clay-Oven Tandoori', 'Complimentary Dessert'],
  },
  {
    id: 'meal_coastal_seafood',
    title: 'Coastal Seafood Gourmet Platter',
    cuisine: 'Goan & Malabar Coastal',
    category: 'seafood',
    categoryLabel: '🌊 Coastal Gourmet',
    dietType: 'non_veg',
    dietLabel: 'Fresh Seafood',
    dietIcon: '🐟',
    price: 720,
    rating: 4.95,
    reviewsCount: 980,
    calories: '620 kcal',
    description:
      'Fresh catch Kingfish tava fry, Mangalorean ghee roast prawns, coconut fish curry served with steamed red rice and fluffy hot appams.',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    highlights: ['Fresh Catch of the Day', 'Cold-Pressed Coconut Oil', 'Authentic Coastal Spices'],
  },
  {
    id: 'meal_chettinad_spice',
    title: 'Authentic Chettinad Spice Journey',
    cuisine: 'South Indian Heritage',
    category: 'regional',
    categoryLabel: '🥘 Regional Special',
    dietType: 'non_veg',
    dietLabel: "Chef's Special",
    dietIcon: '⭐',
    price: 520,
    rating: 4.88,
    reviewsCount: 850,
    calories: '590 kcal',
    description:
      'Hand-ground Chettinad pepper roast, aromatic Kozhi Kuzhambu, crispy golden medu vada, lemon rice & tender coconut elaneer payasam.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    highlights: ['Stone-Ground Masalas', 'Served on Banana Leaf', 'Elaneer Payasam Included'],
  },
  {
    id: 'meal_continental_brunch',
    title: 'Continental Morning Bliss & Brunch',
    cuisine: 'European Continental',
    category: 'breakfast',
    categoryLabel: '🍳 Breakfast & Brunch',
    dietType: 'egg',
    dietLabel: 'All-Day Breakfast',
    dietIcon: '🥐',
    price: 380,
    rating: 4.85,
    reviewsCount: 1120,
    calories: '490 kcal',
    description:
      'Golden buttermilk pancakes with wild honey, herb-roasted potato wedges, grilled cherry tomatoes, warm butter croissants & artisanal filter coffee.',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
    highlights: ['Fresh Baked Croissants', 'Artisanal Brew Included', 'Custom Egg/Veg Prep'],
  },
  {
    id: 'meal_himalayan_organic',
    title: 'Himalayan Organic Farm Bowl',
    cuisine: 'Pahadi & Wellness',
    category: 'organic',
    categoryLabel: '🥗 Healthy & Organic',
    dietType: 'veg',
    dietLabel: '100% Organic',
    dietIcon: '🌿',
    price: 420,
    rating: 4.92,
    reviewsCount: 640,
    calories: '380 kcal',
    description:
      'Steamed buckwheat & paneer momos, organic valley tossed greens, slow-simmered wild thyme broth & stinging-nettle infused herbal mountain tea.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
    highlights: ['Zero Refined Sugar', 'High-Altitude Superfoods', 'Immunity Booster Herbs'],
  },
  {
    id: 'meal_mediterranean_mezze',
    title: 'Mediterranean Mezze & Skewers',
    cuisine: 'Greek & Middle Eastern',
    category: 'global',
    categoryLabel: '🫓 Mediterranean',
    dietType: 'veg',
    dietLabel: 'Plant Protein',
    dietIcon: '🫒',
    price: 650,
    rating: 4.87,
    reviewsCount: 730,
    calories: '540 kcal',
    description:
      'Velvety garlic hummus, smoky baba ganoush, crispy herb falafel patties, warm wood-fired zaatar pita & Kalamata olive feta salad.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    highlights: ['Extra Virgin Olive Oil', 'Stone-Oven Pita', 'Probiotic Greek Tzatziki'],
  },
  {
    id: 'meal_mughlai_biryani',
    title: 'Mughlai Dum Biryani Grandeur',
    cuisine: 'Hyderabadi & Awadhi',
    category: 'thali',
    categoryLabel: '👑 Signature Biryani',
    dietType: 'non_veg',
    dietLabel: 'Signature Dish',
    dietIcon: '🍲',
    price: 580,
    rating: 4.96,
    reviewsCount: 1890,
    calories: '710 kcal',
    description:
      'Slow-cooked sealed dum Basmati rice infused with Kashmiri saffron, hand-picked whole spices, served with Mirchi ka Salan and chilled Burani raita.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    highlights: ['Sealed Clay Handi Cooked', 'Pure Ghee & Saffron', 'Traditional Accompaniments'],
  },
  {
    id: 'meal_artisan_pasta',
    title: 'Artisan Italian Pasta & Pizza',
    cuisine: 'Classic Italian',
    category: 'global',
    categoryLabel: '🍕 Artisanal Italian',
    dietType: 'veg',
    dietLabel: 'Italian Classic',
    dietIcon: '🧀',
    price: 690,
    rating: 4.91,
    reviewsCount: 1040,
    calories: '630 kcal',
    description:
      'Handcrafted tagliatelle tossed in creamy black truffle sauce, paired with thin-crust Neapolitan Margherita topped with fresh buffalo mozzarella & sweet basil.',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
    highlights: ['Handmade Semolina Pasta', 'San Marzano Tomato Sauce', 'Aged Parmigiano Reggiano'],
  },
  {
    id: 'meal_street_fiesta',
    title: 'Pan-India Street Food Fiesta',
    cuisine: 'Street Food Heritage',
    category: 'regional',
    categoryLabel: '🍢 Street Bites',
    dietType: 'veg',
    dietLabel: 'Popular Street Snack',
    dietIcon: '🍧',
    price: 320,
    rating: 4.86,
    reviewsCount: 1450,
    calories: '450 kcal',
    description:
      'Hygienic artisanal street journey: crisp mint water Pani Puri shots, butter-toasted Mumbai Pav Bhaji, followed by rabri-drenched hot Jalebis.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    highlights: ['100% RO Mineral Water', 'Authentic Local Recipes', 'Dessert Duo Included'],
  },
];

const ITEMS_PER_PAGE = 3; // Clean, uncrowded 3-card display

export default function MealOptionsSection({ user, onSelectMeal }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);

  // Filter meals if user clicks category chips
  const filteredMeals = useMemo(() => {
    if (activeFilter === 'all') return MEAL_OPTIONS_DATA;
    if (activeFilter === 'veg') return MEAL_OPTIONS_DATA.filter((m) => m.dietType === 'veg');
    if (activeFilter === 'non_veg') return MEAL_OPTIONS_DATA.filter((m) => m.dietType === 'non_veg');
    return MEAL_OPTIONS_DATA.filter((m) => m.category === activeFilter);
  }, [activeFilter]);

  const totalPages = Math.ceil(filteredMeals.length / ITEMS_PER_PAGE);

  // Ensure valid current page upon filter switch
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));

  // Current batch of 3 cards to keep the UI clean and uncluttered
  const currentBatch = useMemo(() => {
    const start = safeCurrentPage * ITEMS_PER_PAGE;
    return filteredMeals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMeals, safeCurrentPage]);

  const handleNext = () => {
    if (safeCurrentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      // Loop back smoothly to beginning
      setCurrentPage(0);
    }
  };

  const handlePrev = () => {
    if (safeCurrentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    } else {
      setCurrentPage(totalPages - 1);
    }
  };

  const handleToggleSelect = (meal) => {
    if (selectedMealId === meal.id) {
      setSelectedMealId(null);
      setActionNotice(null);
    } else {
      setSelectedMealId(meal.id);
      setActionNotice(`Selected "${meal.title}" for your trip meal plan! 🍽️`);
      if (onSelectMeal) onSelectMeal(meal);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const startIndex = safeCurrentPage * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min((safeCurrentPage + 1) * ITEMS_PER_PAGE, filteredMeals.length);

  return (
    <section
      className="meal-options-3d-section"
      style={{
        padding: '2.5rem 0 1.5rem',
        position: 'relative',
      }}
    >
      <div className="container">
        {/* 3D Glassmorphism Master Container */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
            borderRadius: '28px',
            border: '1.5px solid rgba(226, 232, 240, 0.9)',
            padding: '2.25rem 2rem',
            boxShadow:
              '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle 3D Ambient Backdrop Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '240px',
              height: '240px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0) 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '-60px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(15, 118, 110, 0.1) 0%, rgba(15, 118, 110, 0) 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />

          {/* Section Header Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginBottom: '1.75rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  color: '#0369a1',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  boxShadow: '0 2px 6px rgba(3, 105, 161, 0.15)',
                }}
              >
                <span>🍽️</span> TRAVEL CULINARY DINING
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.75rem',
                  fontWeight: '900',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                Curated Travel Meal Packages
              </h2>
              <p
                style={{
                  margin: '0.35rem 0 0',
                  color: '#64748b',
                  fontSize: '0.92rem',
                }}
              >
                Enjoy hygienic, chef-crafted regional delicacies & gourmet dining tailored for your journey.
              </p>
            </div>

            {/* Quick Navigation Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                Showing <strong style={{ color: '#0f766e' }}>{startIndex}–{endIndex}</strong> of {filteredMeals.length}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '0.55rem 0.9rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  }}
                  title="Previous Meal Options"
                >
                  ⬅ Prev
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #0f766e 0%, #0284c7 100%)',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Next / View More Meal Options"
                >
                  <span>Next / View More</span>
                  <span style={{ fontSize: '1rem' }}>➔</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Dietary Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.75rem',
              marginBottom: '1.5rem',
              scrollbarWidth: 'none',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {[
              { id: 'all', label: 'All Options 🍲' },
              { id: 'veg', label: '🌱 Pure Veg' },
              { id: 'non_veg', label: '🐟 Seafood & Non-Veg' },
              { id: 'thali', label: '🍱 Royal Thalis' },
              { id: 'breakfast', label: '🥐 Breakfast & Brunch' },
              { id: 'organic', label: '🌿 Organic Farm' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id);
                  setCurrentPage(0);
                }}
                style={{
                  background: activeFilter === filter.id ? '#0f172a' : '#ffffff',
                  color: activeFilter === filter.id ? '#ffffff' : '#475569',
                  border: activeFilter === filter.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  borderRadius: '9999px',
                  padding: '5px 14px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: activeFilter === filter.id ? '0 4px 10px rgba(15, 23, 42, 0.15)' : 'none',
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Action Notice Alert */}
          {actionNotice && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                color: '#166534',
                border: '1px solid #86efac',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontWeight: '700',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <span>✅</span>
              <span>{actionNotice}</span>
            </div>
          )}

          {/* 3D Cards Grid (3 Cards Per View to prevent clutter) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {currentBatch.map((meal) => {
              const isSelected = selectedMealId === meal.id;

              return (
                <div
                  key={meal.id}
                  className="meal-card-3d"
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: isSelected ? '2px solid #0f766e' : '1.5px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isSelected
                      ? '0 20px 35px -8px rgba(15, 118, 110, 0.22), 0 0 0 1px #0f766e'
                      : '0 12px 28px -6px rgba(15, 23, 42, 0.06), 0 4px 10px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                  }}
                >
                  {/* Card Image Container with 3D Badges */}
                  <div
                    style={{
                      position: 'relative',
                      height: '190px',
                      overflow: 'hidden',
                      background: '#0f172a',
                    }}
                  >
                    <img
                      src={meal.image}
                      alt={meal.title}
                      onError={(e) => {
                        e.currentTarget.src = meal.fallbackImage;
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.65) 100%)',
                      }}
                    />

                    {/* Floating Category Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {meal.categoryLabel}
                    </div>

                    {/* Floating Diet Tag */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: meal.dietType === 'veg' ? '#166534' : '#991b1b',
                        color: '#ffffff',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      <span>{meal.dietIcon}</span>
                      <span>{meal.dietLabel}</span>
                    </div>

                    {/* Floating Rating & Price Strip */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(6px)',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <span style={{ color: '#fbbf24' }}>⭐ {meal.rating}</span>
                        <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>({meal.reviewsCount})</span>
                      </div>

                      <div
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          fontWeight: '900',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                        }}
                      >
                        ₹{meal.price}{' '}
                        <span style={{ fontSize: '0.68rem', fontWeight: '600', opacity: 0.9 }}>/ person</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body Content */}
                  <div
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        color: '#0f766e',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      📍 {meal.cuisine}
                    </span>

                    <h3
                      style={{
                        fontSize: '1.08rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        margin: '0.3rem 0 0.4rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {meal.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: '#64748b',
                        lineHeight: 1.45,
                        margin: '0 0 0.85rem',
                        flex: 1,
                      }}
                    >
                      {meal.description}
                    </p>

                    {/* Key Highlights */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {meal.highlights.map((h, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#475569',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(meal)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                        background: isSelected
                          ? 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)'
                          : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSelected ? (
                        <>
                          <span>✓ Selected for Trip</span>
                        </>
                      ) : (
                        <>
                          <span>+ Add to Meal Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Dots and Next View Indicator */}
          <div
            style={{
              marginTop: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Page Dots Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPage(idx)}
                  aria-label={`Go to page ${idx + 1}`}
                  style={{
                    width: safeCurrentPage === idx ? '28px' : '9px',
                    height: '9px',
                    borderRadius: '9999px',
                    background: safeCurrentPage === idx ? '#0f766e' : '#cbd5e1',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#64748b',
                  marginLeft: '0.5rem',
                }}
              >
                Page {safeCurrentPage + 1} of {totalPages}
              </span>
            </div>

            {/* Next / View More Button at Bottom */}
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-outline btn-sm"
              style={{
                fontWeight: '800',
                fontSize: '0.85rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '12px',
                borderColor: '#0f766e',
                color: '#0f766e',
              }}
            >
              {safeCurrentPage < totalPages - 1 ? 'Next / View More Meals ➔' : 'Back to First Meals ↺'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
