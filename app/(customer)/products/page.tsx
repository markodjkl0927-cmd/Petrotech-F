'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Product } from '@/types';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts();
    
    // Load previously selected products from sessionStorage if they exist
    // This allows users to edit their order and see what they already selected
    const savedItems = sessionStorage.getItem('orderItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // Convert array of {productId, quantity} to Record<string, number>
        const selectedProductsMap: Record<string, number> = {};
        parsedItems.forEach((item: { productId: string; quantity: number }) => {
          selectedProductsMap[item.productId] = item.quantity;
        });
        setSelectedProducts(selectedProductsMap);
        console.log('Loaded previously selected products:', selectedProductsMap);
      } catch (error) {
        console.error('Failed to load selected products:', error);
      }
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 0) return;
    if (quantity === 0) {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    } else {
      setSelectedProducts({
        ...selectedProducts,
        [productId]: quantity,
      });
    }
  };

  const handleOrder = () => {
    // Check authentication first
    if (!isAuthenticated) {
      // Store the current path and order items for redirect after login
      const items = Object.entries(selectedProducts)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({
          productId,
          quantity,
        }));
      
      if (items.length > 0) {
        sessionStorage.setItem('orderItems', JSON.stringify(items));
        sessionStorage.setItem('fromProducts', 'true');
      }
      
      sessionStorage.setItem('redirectAfterLogin', '/orders/new');
      router.push('/login');
      return;
    }

    const items = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0) // Only include products with quantity > 0
      .map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

    if (items.length === 0) {
      alert('Please select at least one product');
      return;
    }

    // Store selected items in sessionStorage and redirect to order placement
    const itemsJson = JSON.stringify(items);
    console.log('Saving order items to sessionStorage:', items); // Debug log
    console.log('JSON string:', itemsJson); // Debug log
    
    // Set flag first, then items (to ensure flag is set before navigation)
    sessionStorage.setItem('fromProducts', 'true');
    sessionStorage.setItem('orderItems', itemsJson);
    
    // Verify it was saved
    const verify = sessionStorage.getItem('orderItems');
    console.log('Verified saved items:', verify); // Debug log
    
    router.push('/orders/new');
  };

  const getTotalPrice = () => {
    return products.reduce((total, product) => {
      const quantity = selectedProducts[product.id] || 0;
      return total + product.pricePerLiter * quantity;
    }, 0);
  };

  // Map product names to their corresponding images
  const getProductImage = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('diesel')) {
      return '/assets/diesel-product.jpg';
    } else if (name.includes('gasoline') || name.includes('petrol')) {
      return '/assets/Gasoline.jpg';
    } else if (name.includes('kerosene')) {
      return '/assets/Kerosene.jpg';
    } else if (name.includes('lpg') || name.includes('gas')) {
      return '/assets/lpg-gsd.jpg';
    }
    // Default fallback image
    return '/assets/products.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  const totalItems = Object.keys(selectedProducts).reduce((sum, id) => {
    return sum + (selectedProducts[id] || 0);
  }, 0);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative w-full h-80 md:h-96 lg:h-[450px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="/assets/products.jpg" 
            alt="Petrotech Products" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
          <div className="text-left max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fadeInUp">
              Our Products
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              Choose from our wide range of high-quality fuel products delivered right to your doorstep
            </p>
          </div>
        </div>
      </section>

      {/* Products Content */}
      <div className={`max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 ${Object.keys(selectedProducts).length > 0 ? 'pb-32' : ''}`}>
        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {products.map((product, index) => {
              const quantity = selectedProducts[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden flex flex-col transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                >
                  {/* Product Image */}
                  <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
                    <div className="absolute inset-0 p-4 flex items-center justify-center">
                      <div className="relative w-full h-full max-w-[200px] bg-white rounded-lg overflow-hidden shadow-sm">
                        <Image 
                          src={getProductImage(product.name)} 
                          alt={product.name} 
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      </div>
                    </div>
                    {/* Badge for selected items */}
                    {quantity > 0 && (
                      <div className="absolute top-4 right-4 bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg animate-scaleIn z-10">
                        {quantity}
                      </div>
                    )}
                  </div>

                  {/* Product Information */}
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    {/* Product Name */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-2xl font-bold text-primary-600">
                        {formatCurrency(product.pricePerLiter)}
                        <span className="text-sm font-normal text-gray-500 ml-1">/liter</span>
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="pt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, quantity - 1)}
                          disabled={quantity === 0}
                          className="w-10 h-10 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 font-bold text-xl leading-none active:scale-95 hover:scale-105 disabled:hover:scale-100"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 h-10 px-2 border-2 border-gray-300 rounded-md text-center text-gray-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, quantity + 1)}
                          className="w-10 h-10 rounded-md bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center transition-all duration-300 font-bold text-xl leading-none active:scale-95 hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (quantity === 0) {
                          handleQuantityChange(product.id, 1);
                        }
                      }}
                      className={`mt-auto w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-300 ${
                        quantity > 0
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {quantity > 0 ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Added to Cart
                        </span>
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
            <p className="text-gray-500">Check back later for our latest fuel products.</p>
          </div>
        )}

        {/* Fixed Checkout Bar */}
        {Object.keys(selectedProducts).length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 animate-slideInUp">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Items</p>
                      <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                    <div className="h-12 w-px bg-gray-300"></div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Price</p>
                      <p className="text-2xl font-bold text-primary-600">{formatCurrency(getTotalPrice())}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleOrder}
                  className="w-full sm:w-auto bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 font-semibold transition-all duration-500 ease-out hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-w-[200px]"
                >
                  <span>Proceed to Checkout</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

