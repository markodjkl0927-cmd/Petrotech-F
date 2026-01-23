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

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full bg-gray-300 h-96 md:h-[450px] lg:h-[450px] flex items-center">
        <div className="absolute inset-0 bg-gray-400">
          <Image src="/assets/products.jpg" alt="Petrotech" fill className="object-cover" />
        </div>
        {/* Temporary gray background - will be replaced with image */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-red-600 opacity-70">
              PETROTECH
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl text-white opacity-70">
              Choose from our wide range of high-quality fuel products
            </p>
          </div>
        </div>
      </section>

      {/* Products Content */}
      <div className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${Object.keys(selectedProducts).length > 0 ? 'pb-24' : ''}`}>
        <div className="px-4 py-6 sm:px-0">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-300 transition-all duration-300 overflow-hidden flex flex-col animate-fadeInUp hover:shadow-lg hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Product Image Section - Light gray background with rounded corners */}
                <div className="p-4 flex items-center justify-center min-h-[220px]">
                  <div className="relative w-full h-52 bg-white rounded-md overflow-hidden group">
                    <Image 
                      src={getProductImage(product.name)} 
                      alt={product.name} 
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Product Information Section */}
                <div className="p-6 flex flex-col flex-grow space-y-4">
                  {/* Product Name */}
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h3>
                  
                  {/* Description */}
                  {product.description && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(product.pricePerLiter)}
                  </p>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(product.id, (selectedProducts[product.id] || 0) - 1)}
                      disabled={!selectedProducts[product.id] || selectedProducts[product.id] === 0}
                      className="w-10 h-10 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 font-bold text-xl leading-none active:scale-95 hover:scale-105"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={selectedProducts[product.id] || 0}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-10 px-2 border border-gray-300 rounded-md text-center text-gray-900 font-medium text-base focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(product.id, (selectedProducts[product.id] || 0) + 1)}
                      className="w-10 h-10 rounded-md bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center transition-all duration-200 font-bold text-xl leading-none active:scale-95 hover:scale-105"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available at the moment.</p>
            </div>
          )}

          {Object.keys(selectedProducts).length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 animate-slideInUp">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="animate-fadeIn">
                  <p className="text-sm text-gray-600">Total Items: {Object.keys(selectedProducts).length}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPrice())}</p>
                </div>
                <button
                  onClick={handleOrder}
                  className="bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

