// Mock API implementation

const mockProducts = [
  { id: 1, title: 'Wireless Noise Cancelling Headphones', price: 299.99, category: 'Electronics', brand: 'Sony', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=80', stock: 15, rating: 4.8 },
  { id: 2, title: 'Minimalist Smartwatch', price: 199.99, category: 'Electronics', brand: 'Apple', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80', stock: 8, rating: 4.5 },
  { id: 3, title: 'Ergonomic Office Chair', price: 150.00, category: 'Furniture', brand: 'Herman Miller', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=400&q=80', stock: 2, rating: 4.9 },
  { id: 4, title: 'Organic Cotton T-Shirt', price: 25.00, category: 'Fashion', brand: 'Everlane', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', stock: 50, rating: 4.3 },
  { id: 5, title: 'Ceramic Coffee Mug', price: 18.50, category: 'Home', brand: 'Yeti', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=400&q=80', stock: 20, rating: 4.7 },
  { id: 6, title: 'Mechanical Gaming Keyboard', price: 120.00, category: 'Electronics', brand: 'Corsair', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=400&q=80', stock: 5, rating: 4.6 }
];

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchProducts = async (filters = {}) => {
  await delay(600);
  let results = [...mockProducts];
  
  if (filters.category) {
    results = results.filter(p => p.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }
  if (filters.minPrice) {
    results = results.filter(p => p.price >= filters.minPrice);
  }
  if (filters.maxPrice) {
    results = results.filter(p => p.price <= filters.maxPrice);
  }

  return results;
};

export const fetchProductById = async (id) => {
  await delay(400);
  const prod = mockProducts.find(p => p.id === parseInt(id));
  if (!prod) throw new Error('Product not found');
  return prod;
};

export const fetchRecommendations = async (userId) => {
  await delay(800);
  // Mock scikit-learn ML recommendation response
  // Just shuffle and return top 3
  const shuffled = [...mockProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

export const fetchCategories = async () => {
  await delay(300);
  const categories = [...new Set(mockProducts.map(p => p.category))];
  return categories;
};

// Admin Endpoints
export const updateProduct = async (id, data) => {
  await delay(500);
  const index = mockProducts.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    mockProducts[index] = { ...mockProducts[index], ...data };
    return mockProducts[index];
  }
  throw new Error('Product not found');
};

// Gemini Chatbot Mock
export const sendChatMessage = async (message) => {
  await delay(1000);
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('red shoes')) {
    return { text: "We don't have red shoes currently, but we have some amazing Electronics you might like. Would you like to see them?" };
  } else if (msgLower.includes('campaign') || msgLower.includes('discount')) {
    return { text: "Currently we are running a 20% discount on all Furniture! Use code 'COZY20' at checkout." };
  } else {
    return { text: "I'm your AI shopping assistant. I can help you find products, track orders, or inform you about our latest campaigns. What are you looking for today?" };
  }
};
