export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'DRIVER';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  pricePerLiter: number;
  unit: string;
  isAvailable: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  instructions?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  address: Address;
  driverId?: string;
  driver?: Driver;
  orderNumber: string;
  deliveryType: 'PRIVATE' | 'COMMERCIAL';
  status: 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'ONLINE' | 'CASH_ON_DELIVERY' | 'CARD_ON_DELIVERY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  totalAmount: number;
  fuelCost: number; // Total fuel cost (goes to gas company)
  companyMarkup: number; // 0.095% markup on fuel (goes to company)
  distance?: number; // Distance in miles
  deliveryFee: number; // Delivery fee based on distance (goes to company)
  tax: number; // Tax amount (goes to customer/government)
  tip: number; // Optional tip for driver
  deliveryDate?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  isAvailable: boolean;
  isActive: boolean;
}

export interface CreateOrderDto {
  addressId: string;
  deliveryType: 'PRIVATE' | 'COMMERCIAL';
  paymentMethod: 'ONLINE' | 'CASH_ON_DELIVERY' | 'CARD_ON_DELIVERY';
  deliveryDate?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
  tip?: number; // Optional tip for driver
}

