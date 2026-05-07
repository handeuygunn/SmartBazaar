const FLASK_URL = "http://localhost:5001";

// Mock data for fallback
const mockProducts = [
  { product_id: 'prod001', product_category_name: 'perfumaria', product_photos_qty: 5 },
  { product_id: 'prod002', product_category_name: 'artes', product_photos_qty: 3 },
  { product_id: 'prod003', product_category_name: 'esporte_lazer', product_photos_qty: 4 },
  { product_id: 'prod004', product_category_name: 'bebes', product_photos_qty: 2 },
  { product_id: 'prod005', product_category_name: 'utilidades_domesticas', product_photos_qty: 6 },
  { product_id: 'prod006', product_category_name: 'instrumentos_musicais', product_photos_qty: 3 },
  { product_id: 'prod007', product_category_name: 'cool_stuff', product_photos_qty: 5 },
  { product_id: 'prod008', product_category_name: 'moveis_decoracao', product_photos_qty: 4 },
  { product_id: 'prod009', product_category_name: 'informatica_acessorios', product_photos_qty: 7 }
];

const fetchFromProxy = async (endpoint) => {
  try {
    const res = await fetch(`${FLASK_URL}/api/${endpoint}`);
    if (!res.ok) {
      throw new Error(`Proxy fetch failed: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    // Fallback to mock data on error
    console.warn('API unavailable, using mock data:', error);
    if (endpoint === 'products') {
      return mockProducts;
    } else if (endpoint === 'categories') {
      return ['perfumaria', 'artes', 'esporte_lazer', 'bebes', 'utilidades_domesticas', 'instrumentos_musicais', 'cool_stuff', 'moveis_decoracao', 'informatica_acessorios'];
    }
    throw error;
  }
};

const getCategoryImage = (category) => {
  const images = {
    'perfumaria': 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80',
    'artes': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80',
    'esporte_lazer': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80',
    'bebes': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
    'utilidades_domesticas': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    'instrumentos_musicais': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80',
    'cool_stuff': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    'moveis_decoracao': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
    'informatica_acessorios': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80'
  };
  return images[category] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
};

export const fetchProducts = async (filters = {}) => {
  const data = await fetchFromProxy('products');
  
  let results = data.map((p, index) => {
    const categoryName = p.product_category_name || 'general';
    const priceRange = [29.99, 59.99, 120.00, 250.00, 15.50];
    
    // Detect admin-added products by uppercase ID pattern
    const isAdminProduct = /^[A-Z\-]+$/.test(p.product_id);
    let title;
    
    if (isAdminProduct) {
      // For admin products, use the product_id as title (replace dashes with spaces)
      title = p.product_id.replace(/-/g, ' ');
    } else {
      // For default products, use category + ID pattern
      title = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/_/g, ' ') + ` Item ${p.product_id.slice(0,4)}`;
    }
    
    return {
      id: p.product_id,
      title: title,
      price: priceRange[index % priceRange.length],
      category: categoryName,
      brand: 'SmartBazaar',
      image: getCategoryImage(categoryName),
      stock: p.product_photos_qty ? p.product_photos_qty * 5 : 10,
      rating: 4.0 + (Math.random() * 0.9),
      popularity: p.product_photos_qty || 1 // Using photos_qty as a proxy for popularity/quality
    };
  });
  
  if (filters.category) {
    results = results.filter(p => p.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(q));
  }
  if (filters.minPrice) {
    results = results.filter(p => p.price >= parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    results = results.filter(p => p.price <= parseFloat(filters.maxPrice));
  }

  return results;
};

export const fetchProductById = async (id) => {
  const data = await fetchFromProxy(`products`);
  const products = data.filter(p => p.product_id === id);
  if (!products || products.length === 0) throw new Error('Product not found');
  const p = products[0];
  const categoryName = p.product_category_name || 'general';
  
  return {
    id: p.product_id,
    title: categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/_/g, ' ') + ` Pro`,
    price: 99.99,
    category: categoryName,
    brand: 'SmartBazaar',
    image: getCategoryImage(categoryName),
    stock: 10,
    rating: 4.5,
    description: `A quality ${categoryName} carefully selected for SmartBazaar customers. This product features high quality materials and excellent design.`
  };
};

export const fetchRecommendations = async (userId) => {
  // Use ML-informed logic: prioritize items with more photos/info
  const data = await fetchProducts();
  const sorted = data.sort((a, b) => b.popularity - a.popularity);
  return sorted.slice(0, 3);
};

export const fetchCategories = async () => {
  const cats = await fetchFromProxy('categories');
  return cats.sort().slice(0, 12);
};

export const updateProduct = async (id, data) => {
  try {
    const user = JSON.parse(localStorage.getItem('smartbazaar_user') || '{}');
    const res = await fetch(`${FLASK_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin',
        'X-Admin-Token': user.role === 'admin' ? 'admin' : ''
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Update failed');
    const result = await res.json();
    return result.product || { id, ...data };
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const user = JSON.parse(localStorage.getItem('smartbazaar_user') || '{}');
    if (user.role !== 'admin') {
      throw new Error('Only admins can create products');
    }
    
    const res = await fetch(`${FLASK_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin',
        'X-Admin-Token': 'admin'
      },
      body: JSON.stringify(productData)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create product');
    }
    
    const result = await res.json();
    return result.product;
  } catch (error) {
    console.error('Create product error:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const user = JSON.parse(localStorage.getItem('smartbazaar_user') || '{}');
    if (user.role !== 'admin') {
      throw new Error('Only admins can delete products');
    }
    
    const res = await fetch(`${FLASK_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer admin',
        'X-Admin-Token': 'admin'
      }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Delete product error:', error);
    throw error;
  }
};


export const sendChatMessage = async (message) => {
  return { text: "Chatbot logic is handled in Chatbot.jsx via our Python Flask API." };
};
