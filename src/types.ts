export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'lanches' | 'combos' | 'bebidas';
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'customer';
}

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}
