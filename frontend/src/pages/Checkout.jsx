import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { MapPin, CreditCard, Truck } from 'lucide-react';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    delivery_option: 'collection',
    delivery_address: '',
    special_instructions: '',
    payment_method: 'cash',
  });

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const cartItems = JSON.parse(saved);
      setCart(cartItems);
      
      // Get unique vendor IDs
      const vendorIds = [...new Set(cartItems.map(item => item.vendor_id))];
      
      // Fetch vendor details
      if (vendorIds.length > 0) {
        fetchVendors(vendorIds);
      }
    } else {
      navigate('/');
    }
  }, []);

  const fetchVendors = async (vendorIds) => {
    try {
      const vendorPromises = vendorIds.map(id => userService.getVendorProfile(id));
      const vendorData = await Promise.all(vendorPromises);
      setVendors(vendorData.map(v => v.data || v));
      
      // Auto-select first vendor if only one
      if (vendorIds.length === 1) {
        setSelectedVendor(vendorIds[0]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'radio' ? e.target.value : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    setLoading(true);
    
    try {
      // Filter cart items for selected vendor
      const vendorCartItems = cart.filter(item => item.vendor_id === parseInt(selectedVendor));
      
      const orderData = {
        vendor_id: parseInt(selectedVendor),
        items: vendorCartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        delivery_option: formData.delivery_option,
        delivery_address: formData.delivery_option === 'delivery' ? formData.delivery_address : '',
        special_instructions: formData.special_instructions,
        payment_method: formData.payment_method,
      };

      await orderService.createOrder(orderData);
      
      // Clear cart
      localStorage.removeItem('cart');
      setCart([]);
      
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const vendorItems = cart.filter(item => item.vendor_id === parseInt(selectedVendor));
    return vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDeliveryCharge = () => {
    if (formData.delivery_option === 'collection') return 0;
    const vendor = vendors.find(v => v.id === parseInt(selectedVendor));
    return vendor?.offers_delivery ? vendor.delivery_charge : 0;
  };

  const getVendorById = (vendorId) => {
    return vendors.find(v => v.id === parseInt(vendorId));
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor Selection */}
            {[...new Set(cart.map(item => item.vendor_id))].length > 1 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Vendor</h2>
                <div className="space-y-3">
                  {[...new Set(cart.map(item => item.vendor_id))].map(vendorId => {
                    const vendor = getVendorById(vendorId);
                    const vendorItems = cart.filter(item => item.vendor_id === vendorId);
                    return (
                      <label
                        key={vendorId}
                        className={`block p-4 border rounded-lg cursor-pointer transition ${
                          selectedVendor === vendorId ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vendor"
                          value={vendorId}
                          checked={selectedVendor === vendorId}
                          onChange={(e) => setSelectedVendor(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">
                              {vendor?.business_name || `Vendor #${vendorId}`}
                            </p>
                            <p className="text-sm text-gray-600">{vendorItems.length} items</p>
                          </div>
                          <p className="font-semibold text-primary-600">
                            KSh {vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Option */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Option</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="delivery_option"
                    value="collection"
                    checked={formData.delivery_option === 'collection'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600"
                  />
                  <Truck className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Self Collection</p>
                    <p className="text-sm text-gray-600">Pick up your order from the vendor</p>
                  </div>
                </label>
                
                {getVendorById(selectedVendor)?.offers_delivery && (
                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="delivery_option"
                      value="delivery"
                      checked={formData.delivery_option === 'delivery'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600"
                    />
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Home Delivery</p>
                      <p className="text-sm text-gray-600">
                        Delivery charge: KSh {getVendorById(selectedVendor)?.delivery_charge || 0}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {formData.delivery_option === 'delivery' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your full delivery address..."
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={formData.payment_method === 'cash'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600"
                  />
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery/Collection</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="mpesa"
                    disabled
                    className="h-4 w-4 text-primary-600"
                  />
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">M-Pesa</p>
                    <p className="text-sm text-gray-600">Coming soon</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Instructions</h2>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Any special requests for the vendor..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {selectedVendor && (
                <div className="space-y-3 mb-4">
                  {cart.filter(item => item.vendor_id === parseInt(selectedVendor)).map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium">KSh {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>KSh {calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>KSh {calculateDeliveryCharge().toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>KSh {(calculateTotal() + calculateDeliveryCharge()).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedVendor}
                className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
