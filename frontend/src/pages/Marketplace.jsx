import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { userService } from '../services/userService';
import { Search, MapPin, Star, ShoppingCart, ArrowRight, Truck, Clock, Leaf, Circle, Flower2, TreePine, Utensils } from 'lucide-react';

const categories = [
  { id: 1, name: 'Vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', gradient: 'from-green-500 to-emerald-600', count: 45 },
  { id: 2, name: 'Fruits', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop', gradient: 'from-orange-500 to-red-600', count: 32 },
  { id: 3, name: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop', gradient: 'from-emerald-500 to-teal-600', count: 28 },
  { id: 4, name: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop', gradient: 'from-amber-500 to-orange-600', count: 18 },
  { id: 5, name: 'Herbs', image: 'https://images.unsplash.com/photo-1599598345917-47b5e3591e1a?w=400&h=300&fit=crop', gradient: 'from-lime-500 to-green-600', count: 15 },
  { id: 6, name: 'Tubers', image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0d44?w=400&h=300&fit=crop', gradient: 'from-yellow-500 to-amber-600', count: 12 },
];

const deals = [
  { id: 1, title: 'Fresh Tomatoes', discount: '30% OFF', originalPrice: 120, newPrice: 84, image: 'https://images.unsplash.com/photo-1546470427-227c7369a9b5?w=400&h=300&fit=crop', gradient: 'from-red-500 to-red-600', expiry: '2 days' },
  { id: 2, title: 'Organic Spinach', discount: '25% OFF', originalPrice: 50, newPrice: 38, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop', gradient: 'from-green-500 to-emerald-600', expiry: '1 day' },
  { id: 3, title: 'Sweet Potatoes', discount: '20% OFF', originalPrice: 80, newPrice: 64, image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0d44?w=400&h=300&fit=crop', gradient: 'from-orange-500 to-amber-600', expiry: '3 days' },
];

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, vendorsRes] = await Promise.all([
        productService.getProducts(),
        userService.getVendors({ is_available: true }),
      ]);
      setProducts(productsRes.products);
      setVendors(vendorsRes.vendors);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        vendor_id: product.vendor_id,
        image: product.image
      }]);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !selectedLocation || 
      vendors.find(v => v.id === product.vendor_id)?.location?.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const getProductVendor = (vendorId) => {
    return vendors.find(v => v.id === vendorId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-green-800 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&h=800&fit=crop"
            alt="Fresh vegetables"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Fresh From Local Farms
              <span className="block text-primary-200">To Your Doorstep</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Connect with mama mboga vendors in your neighbourhood. Get fresh vegetables, fruits, and more delivered to you.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for tomatoes, onions, sukuma wiki..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
              >
                <option value="">All Locations</option>
                {[...new Set(vendors.map(v => v.location))].map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <button className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition flex items-center justify-center">
                Search
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 mt-10">
              <div className="flex items-center space-x-2 text-white">
                <Truck className="h-6 w-6" />
                <span className="font-medium">Free Delivery on orders over KSh 500</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Clock className="h-6 w-6" />
                <span className="font-medium">Same-day delivery available</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Leaf className="h-6 w-6" />
                <span className="font-medium">100% Fresh guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/categories" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View All <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-40 object-cover group-hover:scale-110 transition duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.className = `group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer bg-gradient-to-br ${category.gradient}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                  <p className="text-white/80 text-sm">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Deals Section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Hot Deals</h2>
            <Link to="/deals" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View All Deals <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deals.map(deal => (
              <div key={deal.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group">
                <div className="relative h-48">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.className = `relative h-48 bg-gradient-to-br ${deal.gradient} flex items-center justify-center`;
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                    {deal.discount}
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    Ends in {deal.expiry}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{deal.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary-600">KSh {deal.newPrice}</span>
                    <span className="text-gray-400 line-through">KSh {deal.originalPrice}</span>
                  </div>
                  <button className="mt-4 w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Vendors */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Vendors Near You</h2>
            <Link to="/vendors" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View All <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendors.slice(0, 4).map(vendor => (
              <Link
                key={vendor.id}
                to={`/vendor/${vendor.id}`}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group"
              >
                <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-4xl">
                    {vendor.business_name.charAt(0)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{vendor.business_name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {vendor.location}
                  </div>
                  {vendor.average_rating > 0 && (
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{vendor.average_rating.toFixed(1)}</span>
                      <span className="text-gray-600 ml-1">({vendor.total_reviews})</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Fresh Products</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View All <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const vendor = getProductVendor(product.vendor_id);
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group">
                    <div className="relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-2xl">
                            {product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        className="absolute bottom-4 right-4 bg-white text-primary-600 p-3 rounded-full shadow-lg hover:bg-primary-600 hover:text-white transition"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                      {vendor && (
                        <p className="text-sm text-gray-600 mb-2">{vendor.business_name}</p>
                      )}
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary-600">
                            KSh {product.price}
                          </span>
                          <span className="text-sm text-gray-600">/{product.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-primary-600 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Become a Vendor</h2>
            <p className="text-primary-100 mb-6">Join Mboga Connect and grow your business online</p>
            <Link
              to="/register"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition"
            >
              Start Selling Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
