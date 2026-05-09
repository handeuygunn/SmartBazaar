const FLASK_URL = "http://localhost:5001";
const PAGE_SIZE  = 12;

const mockProducts = [
  { product_id: 'prod001', product_category_name: 'perfumaria',            product_photos_qty: 5 },
  { product_id: 'prod002', product_category_name: 'artes',                 product_photos_qty: 3 },
  { product_id: 'prod003', product_category_name: 'esporte_lazer',         product_photos_qty: 4 },
  { product_id: 'prod004', product_category_name: 'bebes',                 product_photos_qty: 2 },
  { product_id: 'prod005', product_category_name: 'utilidades_domesticas', product_photos_qty: 6 },
  { product_id: 'prod006', product_category_name: 'instrumentos_musicais', product_photos_qty: 3 },
  { product_id: 'prod007', product_category_name: 'cool_stuff',            product_photos_qty: 5 },
  { product_id: 'prod008', product_category_name: 'moveis_decoracao',      product_photos_qty: 4 },
  { product_id: 'prod009', product_category_name: 'informatica_acessorios',product_photos_qty: 7 },
  { product_id: 'prod010', product_category_name: 'perfumaria',            product_photos_qty: 4 },
  { product_id: 'prod011', product_category_name: 'esporte_lazer',         product_photos_qty: 6 },
  { product_id: 'prod012', product_category_name: 'cool_stuff',            product_photos_qty: 3 },
  { product_id: 'prod013', product_category_name: 'artes',                 product_photos_qty: 5 },
  { product_id: 'prod014', product_category_name: 'bebes',                 product_photos_qty: 4 },
  { product_id: 'prod015', product_category_name: 'moveis_decoracao',      product_photos_qty: 2 },
  { product_id: 'prod016', product_category_name: 'utilidades_domesticas', product_photos_qty: 7 },
  { product_id: 'prod017', product_category_name: 'informatica_acessorios',product_photos_qty: 5 },
  { product_id: 'prod018', product_category_name: 'instrumentos_musicais', product_photos_qty: 4 },
  { product_id: 'prod019', product_category_name: 'esporte_lazer',         product_photos_qty: 3 },
  { product_id: 'prod020', product_category_name: 'perfumaria',            product_photos_qty: 6 },
  { product_id: 'prod021', product_category_name: 'cool_stuff',            product_photos_qty: 2 },
  { product_id: 'prod022', product_category_name: 'artes',                 product_photos_qty: 4 },
  { product_id: 'prod023', product_category_name: 'bebes',                 product_photos_qty: 5 },
  { product_id: 'prod024', product_category_name: 'moveis_decoracao',      product_photos_qty: 3 },
];

// Consistent hash so same product always gets same price/rating regardless of page
const hashId = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h);
};

const mockFallback = (endpoint) => {
  if (endpoint === 'categories') {
    return ['perfumaria','artes','esporte_lazer','bebes','utilidades_domesticas','instrumentos_musicais','cool_stuff','moveis_decoracao','informatica_acessorios'];
  }
  if (endpoint.startsWith('products')) {
    const qs       = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    const params   = new URLSearchParams(qs);
    const limit    = parseInt(params.get('limit')  || '10000', 10);
    const offset   = parseInt(params.get('offset') || '0',     10);
    const category = params.get('category') || '';
    let   data     = category ? mockProducts.filter(p => p.product_category_name === category) : mockProducts;
    return data.slice(offset, offset + limit);
  }
  return null;
};

const fetchFromProxy = async (endpoint) => {
  try {
    const res = await fetch(`${FLASK_URL}/api/${endpoint}`);
    if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
    const fallback = mockFallback(endpoint);
    if (fallback !== null) return fallback;
    throw error;
  }
};

const getCategoryImage = (category) => {
  const images = {
    'perfumaria':             'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80',
    'artes':                  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80',
    'esporte_lazer':          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80',
    'bebes':                  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
    'utilidades_domesticas':  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    'instrumentos_musicais':  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80',
    'cool_stuff':             'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    'moveis_decoracao':       'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
    'informatica_acessorios': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80',
  };
  return images[category] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
};

const transformProduct = (p) => {
  const priceRange   = [29.99, 59.99, 120.00, 250.00, 15.50];
  const categoryName = p.product_category_name || 'general';
  const isAdmin      = /^[A-Z-]+$/.test(p.product_id);
  const h            = hashId(p.product_id);
  return {
    id:         p.product_id,
    title:      isAdmin
      ? p.product_id.replace(/-/g, ' ')
      : categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/_/g, ' ') + ` Item ${p.product_id.slice(0, 4)}`,
    price:      priceRange[h % priceRange.length],
    category:   categoryName,
    brand:      'SmartBazaar',
    image:      getCategoryImage(categoryName),
    stock:      p.product_photos_qty ? p.product_photos_qty * 5 : 10,
    rating:     4.0 + (h % 10) / 10,
    popularity: p.product_photos_qty || 1,
  };
};

const applyClientFilters = (products, filters) => {
  let r = products;
  if (filters.search)    { const q = filters.search.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(q)); }
  if (filters.minPrice)  r = r.filter(p => p.price >= parseFloat(filters.minPrice));
  if (filters.maxPrice)  r = r.filter(p => p.price <= parseFloat(filters.maxPrice));
  return r;
};

// Paginated fetch — used by Home page
// Returns { products, hasMore }
export const fetchProductsPage = async (filters = {}, page = 0) => {
  const limit  = PAGE_SIZE;
  const offset = page * PAGE_SIZE;

  const params = new URLSearchParams();
  params.set('limit',  limit + 1); // +1 to detect hasMore
  params.set('offset', offset);
  if (filters.category) params.set('category', filters.category);

  const data    = await fetchFromProxy(`products?${params}`);
  const hasMore = data.length > limit;
  const results = applyClientFilters(data.slice(0, limit).map(transformProduct), filters);

  return { products: results, hasMore };
};

// Full fetch — used by admin dashboard, recommendations
export const fetchProducts = async (filters = {}) => {
  const data    = await fetchFromProxy('products');
  let   results = data.map(transformProduct);
  if (filters.category) results = results.filter(p => p.category === filters.category);
  return applyClientFilters(results, filters);
};

export const fetchProductById = async (id) => {
  const data = await fetchFromProxy('products');
  const p    = data.find(p => p.product_id === id);
  if (!p) throw new Error('Product not found');
  const categoryName = p.product_category_name || 'general';
  return {
    id:          p.product_id,
    title:       categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/_/g, ' ') + ' Pro',
    price:       99.99,
    category:    categoryName,
    brand:       'SmartBazaar',
    image:       getCategoryImage(categoryName),
    stock:       10,
    rating:      4.5,
    description: `A quality ${categoryName} carefully selected for SmartBazaar customers.`,
  };
};

export const fetchRecommendations = async () => {
  const data = await fetchProducts();
  return data.sort((a, b) => b.popularity - a.popularity).slice(0, 3);
};

export const fetchCategories = async () => {
  const cats = await fetchFromProxy('categories');
  return cats.sort().slice(0, 12);
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${FLASK_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin', 'X-Admin-Token': 'admin' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Update failed');
  const result = await res.json();
  return result.product || { id, ...data };
};

export const createProduct = async (productData) => {
  const res = await fetch(`${FLASK_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin', 'X-Admin-Token': 'admin' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create product'); }
  return (await res.json()).product;
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${FLASK_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer admin', 'X-Admin-Token': 'admin' },
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to delete product'); }
  return res.json();
};

export const sendChatMessage = async () => {
  return { text: 'Chatbot logic is handled in Chatbot.jsx via our Python Flask API.' };
};

export const fetchProductsByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const data = await fetchFromProxy('products');
  let results = data.filter(p => ids.includes(p.product_id));
  return results.map(transformProduct);
};
