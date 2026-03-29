import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { 
  ShoppingBag, 
  Menu as MenuIcon, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  ArrowLeft,
  Utensils,
  Zap,
  Coffee,
  ShoppingBasket,
  Settings,
  PlusCircle,
  Save,
  Edit,
  History,
  MessageCircle,
  Clock,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { auth, signInWithGoogle, logout, db, handleFirestoreError, OperationType, testConnection, uploadImage } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, addDoc, serverTimestamp, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { cn } from './lib/utils';
import { Product, CartItem, Order, BusinessInfo, UserProfile } from './types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

const ErrorBoundary: any = class extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error) {
          errorMessage = `Erro no Firestore: ${parsedError.error} (${parsedError.operationType} em ${parsedError.path})`;
        }
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/50 p-8 rounded-3xl max-w-md w-full text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase italic mb-4">Ops! Algo deu errado</h2>
            <p className="text-neutral-400 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock data for initial setup if Firestore is empty
const MOCK_PRODUCTS: Product[] = [
  // Lanches
  { id: 'l1', name: 'X-salada', description: 'Alface, tomate, hambúrguer, presunto, muçarela e batata palha.', price: 17.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' },
  { id: 'l2', name: 'X-salada especial', description: 'Alface, tomate, hambúrguer, presunto, muçarela e batata palha, ovo, catupiry.', price: 19.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80' },
  { id: 'l3', name: 'X-bacon', description: 'Alface, tomate, hambúrguer, presunto, muçarela e bacon.', price: 23.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7443b?w=800&q=80' },
  { id: 'l4', name: 'X-frango', description: 'Alface, tomate, hambúrguer, presunto, muçarela, frango e batata palha.', price: 22.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1513185158878-8d8c196b7c8c?w=800&q=80' },
  { id: 'l5', name: 'X-frango especial', description: 'Alface, tomate, hambúrguer, presunto, muçarela, frango, ovo, catupiry e batata palha.', price: 26.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1525164286253-04e68b9d942a?w=800&q=80' },
  { id: 'l6', name: 'X-calabresa', description: 'Alface, tomate, hambúrguer, presunto, muçarela, calabresa e batata palha.', price: 25.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80' },
  { id: 'l7', name: 'X-calabresa especial', description: 'Alface, tomate, hambúrguer, presunto, muçarela, calabresa, ovo, catupiry e batata palha.', price: 27.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80' },
  { id: 'l8', name: 'X-tudo', description: 'Alface, tomate, hambúrguer, presunto, muçarela, calabresa, frango, bacon, salsicha, ovo, catupiry e batata palha.', price: 30.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80' },
  { id: 'l9', name: 'X-luxuria', description: 'Alface, tomate, 2 hambúrguer, 2 presunto, 2 muçarela, calabresa, frango, bacon, 2 salsicha, 2 ovo, catupiry e batata palha.', price: 42.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800&q=80' },
  { id: 'l10', name: 'X-bacon especial', description: 'Alface, tomate, hambúrguer, presunto, muçarela e bacon, ovo, batata palha, catupiry.', price: 27.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?w=800&q=80' },
  { id: 'l11', name: 'X-modinha da casa', description: 'Alface, tomate, presunto, muçarela e bacon, filé de frango, abacaxi grelhado, milho, batata palha.', price: 25.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1547584385-8cdbb3777080?w=800&q=80' },
  { id: 'l12', name: 'X-especial', description: 'Alface, tomate, cenoura, cebola, hambúrguer, presunto, muçarela, calabresa, batata palha, catupiry.', price: 28.00, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80' },
  // Bebidas
  { id: 'b1', name: 'Refrigerante Lata', description: '350ml.', price: 6.00, category: 'bebidas', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80' },
  { id: 'b2', name: 'Refrigerante 1 Litro', description: 'Gelado.', price: 9.00, category: 'bebidas', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
  { id: 'b3', name: 'Refrigerante 2 Litros', description: 'Gelado.', price: 12.00, category: 'bebidas', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80' },
  { id: 'b4', name: 'Suco Natural', description: 'Laranja ou Limão.', price: 8.00, category: 'bebidas', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80' },
  { id: 'b5', name: 'Água Mineral', description: 'Com ou sem gás.', price: 4.00, category: 'bebidas', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80' },
  // Combos
  { id: 'c1', name: 'Combo Luxuria', description: 'X-Luxuria + Refrigerante 2L + Batata Grande.', price: 55.00, category: 'combos', imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&q=80' },
  { id: 'c2', name: 'Combo Casal', description: '2 X-Salada + Refrigerante 1L + Batata Média.', price: 45.00, category: 'combos', imageUrl: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?w=800&q=80' },
  { id: 'c3', name: 'Combo Kids', description: 'X-Burguer + Suco + Batata Pequena + Brinde.', price: 30.00, category: 'combos', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
];

const WHATSAPP_NUMBER_DEFAULT = "5567998344262";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'lanches' | 'combos' | 'bebidas'>('lanches');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'high'>('all');
  const [adminOrderTab, setAdminOrderTab] = useState<'all' | 'pending' | 'completed' | 'cancelled' | 'today'>('today');
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    openingHours: {
      monThu: '18:00 - 23:30',
      friSat: '18:00 - 01:00',
      sun: '18:00 - 23:00'
    },
    address: 'Rua Abilio de Mattos Pedrosso, 1177',
    phone: '(67) 99834-4262',
    whatsappNumber: WHATSAPP_NUMBER_DEFAULT
  });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'lanches',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const isAdmin = userRole === 'admin' || user?.email === "pinheiro0151@gmail.com";

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Create user profile if it doesn't exist
            const newUser: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || '',
              photoURL: u.photoURL || '',
              role: u.email === "pinheiro0151@gmail.com" ? 'admin' : 'customer'
            };
            await setDoc(doc(db, 'users', u.uid), newUser);
            setUserRole(newUser.role);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        if (productsData.length === 0) {
          setProducts(MOCK_PRODUCTS);
        } else {
          setProducts(productsData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'products');
        setProducts(MOCK_PRODUCTS);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'info'));
        if (docSnap.exists()) {
          setBusinessInfo(docSnap.data() as BusinessInfo);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/info');
      }
    };
    fetchBusinessInfo();
  }, []);

  useEffect(() => {
    if (user && isHistoryOpen) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      });
      return () => unsubscribe();
    }
  }, [user, isHistoryOpen]);

  useEffect(() => {
    if (user && isAdmin && isAdminView && adminTab === 'orders') {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        // Play sound if there's a new order
        if (adminOrders.length > 0 && ordersData.length > adminOrders.length) {
          const newOrder = ordersData[0];
          if (newOrder.status === 'pending') {
            audioRef.current?.play().catch(e => console.error("Error playing sound:", e));
          }
        }
        
        setAdminOrders(ordersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      });
      return () => unsubscribe();
    }
  }, [user, isAdmin, isAdminView, adminTab, adminOrders.length]);

  useEffect(() => {
    if (user && isAdmin && isAdminView && adminTab === 'settings') {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const adminsData = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
        setAdminUsers(adminsData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });
      return () => unsubscribe();
    }
  }, [user, isAdmin, isAdminView, adminTab]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !adminEmailInput.trim()) return;
    setAdminActionError(null);

    try {
      setIsManagingAdmins(true);
      // Find user by email
      const q = query(collection(db, 'users'), where('email', '==', adminEmailInput.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setAdminActionError("Usuário não encontrado. O usuário deve ter feito login pelo menos uma vez para ser promovido.");
        setIsManagingAdmins(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
      setAdminEmailInput('');
      // Success
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setIsManagingAdmins(false);
    }
  };

  const handleRemoveAdmin = async (uid: string, email: string) => {
    if (!isAdmin) return;
    setAdminActionError(null);
    if (email === "pinheiro0151@gmail.com") {
      setAdminActionError("O administrador principal não pode ser removido.");
      return;
    }

    try {
      setIsManagingAdmins(true);
      await updateDoc(doc(db, 'users', uid), { role: 'customer' });
      // Success
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setIsManagingAdmins(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const handleCheckout = async () => {
    if (!user) {
      handleLogin();
      return;
    }

    if (cart.length === 0) return;

    // Save order to Firestore (optional history)
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: cart,
        total: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Clear cart after successful order
      setCart([]);
      setIsCartOpen(false);
      setIsHistoryOpen(true); // Open history to show the new order
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
      return;
    }

    // Generate WhatsApp message
    const message = `*Novo Pedido - Luxuria Lanches*\n\n` +
      `*Cliente:* ${user.displayName}\n` +
      `*Itens:*\n` +
      cart.map(item => `- ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`).join('\n') +
      `\n\n*Total: R$ ${cartTotal.toFixed(2)}*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${businessInfo.whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleSupport = () => {
    const message = `Olá! Gostaria de suporte com o Luxuria Lanches.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${businessInfo.whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setNewProduct(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'logos');
      setBusinessInfo(prev => ({ ...prev, logoUrl: url }));
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const scrollToMenu = () => {
    setActiveCategory('lanches');
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'cancelled' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (orders.find(o => o.id === orderId)) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        category: newProduct.category,
        imageUrl: newProduct.imageUrl
      };

      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        
        // Check if it's a mock product (doesn't exist in Firestore yet)
        const docSnap = await getDoc(productRef);
        
        if (docSnap.exists()) {
          await updateDoc(productRef, productData);
        } else {
          // It's a mock product or deleted, create it
          await setDoc(productRef, {
            ...productData,
            createdAt: serverTimestamp()
          });
        }
        
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } as Product : p));
      } else {
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
        setProducts(prev => [...prev, { id: docRef.id, ...productData } as Product]);
      }
      setEditingProduct(null);
      setNewProduct({ name: '', description: '', price: 0, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' });
      toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar produto. Verifique sua conexão.");
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, editingProduct ? `products/${editingProduct.id}` : 'products');
    }
  };

  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      await setDoc(doc(db, 'settings', 'info'), businessInfo);
      setIsEditingInfo(false);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
      handleFirestoreError(error, OperationType.WRITE, 'settings/info');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produto excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir produto.");
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer login.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sessão encerrada.");
    } catch (error) {
      toast.error("Erro ao sair.");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceFilter === 'all' ? true : 
                        priceFilter === 'low' ? p.price < 25 : 
                        p.price >= 25;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const dailyOrders = adminOrders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate?.() || Date.now());
    const today = new Date();
    return orderDate.getDate() === today.getDate() &&
           orderDate.getMonth() === today.getMonth() &&
           orderDate.getFullYear() === today.getFullYear();
  });

  const dailyRevenue = dailyOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const filteredAdminOrders = adminOrders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate?.() || Date.now());
    const today = new Date();
    const isToday = orderDate.getDate() === today.getDate() &&
                    orderDate.getMonth() === today.getMonth() &&
                    orderDate.getFullYear() === today.getFullYear();

    if (adminOrderTab === 'all') return true;
    if (adminOrderTab === 'today') return isToday;
    
    // The user requested today's orders in each section
    return order.status === adminOrderTab && isToday;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <ErrorBoundary>
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/20 overflow-hidden">
              <img 
                src={businessInfo.logoUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=64&h=64&q=80"} 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Luxuria <span className="text-orange-500">Lanches</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
            <button 
              onClick={() => { setActiveCategory('lanches'); menuRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className={cn("transition-colors hover:text-orange-500", activeCategory === 'lanches' && "text-orange-500")}
            >
              Lanches
            </button>
            <button 
              onClick={() => { setActiveCategory('combos'); menuRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className={cn("transition-colors hover:text-orange-500", activeCategory === 'combos' && "text-orange-500")}
            >
              Combos
            </button>
            <button 
              onClick={() => { setActiveCategory('bebidas'); menuRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className={cn("transition-colors hover:text-orange-500", activeCategory === 'bebidas' && "text-orange-500")}
            >
              Bebidas
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSupport}
              className="hidden sm:flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold text-sm transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Suporte
            </button>

            <button 
              onClick={() => setIsCartOpen(true)}
              className={cn(
                "relative p-2 hover:bg-neutral-800 rounded-full transition-colors",
                cart.length > 0 && "animate-pulse"
              )}
            >
              <ShoppingBag className={cn("w-6 h-6", cart.length > 0 && "text-orange-500")} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-950">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-neutral-800">
                <button 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isHistoryOpen ? "bg-orange-600 text-white" : "hover:bg-neutral-800 text-neutral-400"
                  )}
                  title="Meus Pedidos"
                >
                  <History className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAdminView(!isAdminView)}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isAdminView ? "bg-orange-600 text-white" : "hover:bg-neutral-800 text-neutral-400"
                    )}
                    title={isAdminView ? "Voltar para o Site" : "Painel Admin"}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-neutral-700" />
                <button onClick={handleLogout} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {isHistoryOpen ? (
          <section className="space-y-12">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-4xl font-black uppercase italic">Meus <span className="text-orange-500">Pedidos</span></h2>
            </div>

            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="bg-neutral-900 p-12 rounded-3xl border border-neutral-800 text-center">
                  <Clock className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">Nenhum pedido encontrado</h3>
                  <p className="text-neutral-500">Você ainda não realizou nenhum pedido conosco.</p>
                  <button 
                    onClick={() => { setIsHistoryOpen(false); menuRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="mt-6 bg-orange-600 text-white px-8 py-3 rounded-full font-bold"
                  >
                    Ver Cardápio
                  </button>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="text-orange-500 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-neutral-500">Pedido #{order.id?.slice(-6)}</p>
                          <p className="font-bold">{new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase text-neutral-500">Status</p>
                          <span className={cn(
                            "text-xs font-black uppercase px-3 py-1 rounded-full",
                            order.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" : 
                            order.status === 'completed' ? "bg-green-500/10 text-green-500" : 
                            "bg-red-500/10 text-red-500"
                          )}>
                            {order.status === 'pending' ? 'Pendente' : order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase text-neutral-500">Total</p>
                          <p className="text-xl font-black text-orange-500">R$ {order.total.toFixed(2)}</p>
                        </div>
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => handleCancelOrder(order.id!)}
                            className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                            title="Cancelar Pedido"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-6 bg-neutral-950/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-xs font-bold text-orange-500">
                              {item.quantity}x
                            </span>
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : isAdminView && isAdmin ? (
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-4xl font-black uppercase italic">Painel de <span className="text-orange-500">Gerenciamento</span></h2>
              <div className="flex flex-wrap gap-2 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
                <button 
                  onClick={() => setAdminTab('products')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    adminTab === 'products' ? "bg-orange-600 text-white" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Produtos
                </button>
                <button 
                  onClick={() => setAdminTab('orders')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    adminTab === 'orders' ? "bg-orange-600 text-white" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Pedidos
                </button>
                <button 
                  onClick={() => setAdminTab('settings')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    adminTab === 'settings' ? "bg-orange-600 text-white" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Configurações
                </button>
              </div>
            </div>

            {adminTab === 'settings' ? (
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    Informações do Rodapé e Contato
                  </h3>
                  <form onSubmit={handleSaveBusinessInfo} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-orange-500">Horários</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Segunda - Quinta</label>
                          <input 
                            type="text" 
                            value={businessInfo.openingHours.monThu}
                            onChange={e => setBusinessInfo({...businessInfo, openingHours: {...businessInfo.openingHours, monThu: e.target.value}})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Sexta - Sábado</label>
                          <input 
                            type="text" 
                            value={businessInfo.openingHours.friSat}
                            onChange={e => setBusinessInfo({...businessInfo, openingHours: {...businessInfo.openingHours, friSat: e.target.value}})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Domingo</label>
                          <input 
                            type="text" 
                            value={businessInfo.openingHours.sun}
                            onChange={e => setBusinessInfo({...businessInfo, openingHours: {...businessInfo.openingHours, sun: e.target.value}})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-orange-500">Contato</h4>
                      <div>
                        <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Endereço</label>
                        <input 
                          type="text" 
                          value={businessInfo.address}
                          onChange={e => setBusinessInfo({...businessInfo, address: e.target.value})}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Telefone Exibição</label>
                        <input 
                          type="text" 
                          value={businessInfo.phone}
                          onChange={e => setBusinessInfo({...businessInfo, phone: e.target.value})}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">WhatsApp (Somente Números)</label>
                        <input 
                          type="text" 
                          value={businessInfo.whatsappNumber}
                          onChange={e => setBusinessInfo({...businessInfo, whatsappNumber: e.target.value})}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                          placeholder="Ex: 5567998344262"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                      <Save className="w-5 h-5" /> Salvar Informações
                    </button>
                  </form>
                </div>

                <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-orange-500" />
                    Logo do Site
                  </h3>
                  <div className="space-y-6">
                    <div className="aspect-square w-48 mx-auto bg-neutral-950 rounded-3xl border border-neutral-800 overflow-hidden flex items-center justify-center relative group">
                      <img 
                        src={businessInfo.logoUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&q=80"} 
                        alt="Logo Preview" 
                        className="w-full h-full object-cover"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block text-center">Alterar Logo</label>
                      <label className="w-full bg-neutral-950 border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800/50 rounded-xl px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all group">
                        <Upload className="w-5 h-5 text-neutral-500 group-hover:text-orange-500 transition-colors" />
                        <span className="text-sm font-bold text-neutral-400 group-hover:text-white transition-colors">Fazer Upload</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        />
                      </label>
                      {businessInfo.logoUrl && (
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-3 rounded-xl">
                          <ImageIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                          <p className="text-[10px] text-neutral-500 truncate flex-1">{businessInfo.logoUrl}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 text-center italic">
                      Dica: Use uma imagem quadrada para melhores resultados.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-neutral-900 p-8 rounded-3xl border border-neutral-800">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-orange-500" />
                    Gerenciar Administradores
                  </h3>
                  
                  <form onSubmit={handleAddAdmin} className="mb-8">
                    <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Adicionar por E-mail</label>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        required
                        value={adminEmailInput}
                        onChange={e => setAdminEmailInput(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                      />
                      <button 
                        type="submit" 
                        disabled={isManagingAdmins}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-800 text-white px-6 rounded-xl font-bold transition-all flex items-center gap-2"
                      >
                        {isManagingAdmins ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div> : <Plus className="w-4 h-4" />}
                        Adicionar
                      </button>
                    </div>
                    {adminActionError && (
                      <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">
                        {adminActionError}
                      </p>
                    )}
                    <p className="text-[10px] text-neutral-500 mt-2 italic">
                      O usuário já deve ter acessado o site pelo menos uma vez para ser promovido.
                    </p>
                  </form>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-500">Administradores Atuais</h4>
                    <div className="space-y-2">
                      {adminUsers.map(admin => (
                        <div key={admin.uid} className="flex items-center justify-between bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                          <div className="flex items-center gap-3">
                            <img src={admin.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-neutral-800" />
                            <div>
                              <p className="font-bold text-sm">{admin.displayName || 'Sem Nome'}</p>
                              <p className="text-xs text-neutral-500">{admin.email}</p>
                            </div>
                          </div>
                          {admin.email !== "pinheiro0151@gmail.com" && (
                            <button 
                              onClick={() => handleRemoveAdmin(admin.uid, admin.email)}
                              disabled={isManagingAdmins}
                              className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Remover Acesso Admin"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : adminTab === 'orders' ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">Gestão de Pedidos</h3>
                    <p className="text-neutral-500 text-sm">Acompanhe e gerencie as vendas do dia</p>
                  </div>
                  <div className="bg-orange-600/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                      <Zap className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Ganhos de Hoje</p>
                      <p className="text-2xl font-black">R$ {dailyRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <button 
                    onClick={() => setAdminOrderTab('today')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      adminOrderTab === 'today' ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Hoje ({dailyOrders.length})
                  </button>
                  <button 
                    onClick={() => setAdminOrderTab('pending')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      adminOrderTab === 'pending' ? "bg-yellow-600 text-white shadow-lg shadow-yellow-600/20" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Andamento Hoje ({adminOrders.filter(o => {
                      const orderDate = new Date(o.createdAt?.toDate?.() || Date.now());
                      const today = new Date();
                      const isToday = orderDate.getDate() === today.getDate() &&
                                      orderDate.getMonth() === today.getMonth() &&
                                      orderDate.getFullYear() === today.getFullYear();
                      return o.status === 'pending' && isToday;
                    }).length})
                  </button>
                  <button 
                    onClick={() => setAdminOrderTab('completed')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      adminOrderTab === 'completed' ? "bg-green-600 text-white shadow-lg shadow-green-600/20" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Finalizados Hoje ({adminOrders.filter(o => {
                      const orderDate = new Date(o.createdAt?.toDate?.() || Date.now());
                      const today = new Date();
                      const isToday = orderDate.getDate() === today.getDate() &&
                                      orderDate.getMonth() === today.getMonth() &&
                                      orderDate.getFullYear() === today.getFullYear();
                      return o.status === 'completed' && isToday;
                    }).length})
                  </button>
                  <button 
                    onClick={() => setAdminOrderTab('cancelled')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      adminOrderTab === 'cancelled' ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Cancelados Hoje ({adminOrders.filter(o => {
                      const orderDate = new Date(o.createdAt?.toDate?.() || Date.now());
                      const today = new Date();
                      const isToday = orderDate.getDate() === today.getDate() &&
                                      orderDate.getMonth() === today.getMonth() &&
                                      orderDate.getFullYear() === today.getFullYear();
                      return o.status === 'cancelled' && isToday;
                    }).length})
                  </button>
                  <button 
                    onClick={() => setAdminOrderTab('all')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      adminOrderTab === 'all' ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Todos ({adminOrders.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {filteredAdminOrders.length === 0 ? (
                    <div className="bg-neutral-900 p-12 rounded-3xl border border-neutral-800 text-center">
                      <p className="text-neutral-500 italic">Nenhum pedido encontrado nesta seção.</p>
                    </div>
                  ) : (
                    filteredAdminOrders.map(order => (
                      <div key={order.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center">
                              <ShoppingBag className="text-orange-500 w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase text-neutral-500">Pedido #{order.id?.slice(-6)}</p>
                              <p className="font-bold">{new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs font-bold uppercase text-neutral-500">Status Atual</p>
                              <span className={cn(
                                "text-xs font-black uppercase px-3 py-1 rounded-full",
                                order.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" : 
                                order.status === 'completed' ? "bg-green-500/10 text-green-500" : 
                                "bg-red-500/10 text-red-500"
                              )}>
                                {order.status === 'pending' ? 'Pendente' : order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(order.id!, 'completed')}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors"
                                  >
                                    Concluir
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(order.id!, 'cancelled')}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-neutral-950/50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-bold uppercase text-neutral-500 mb-3">Itens do Pedido</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-neutral-900/50 p-2 rounded-xl border border-neutral-800/50">
                                    <span className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-xs font-bold text-orange-500">
                                      {item.quantity}x
                                    </span>
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex flex-col justify-center items-center text-center">
                              <p className="text-xs font-bold uppercase text-neutral-500 mb-1">Total do Pedido</p>
                              <p className="text-3xl font-black text-orange-500">R$ {order.total.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Form */}
                <div className="lg:col-span-1 bg-neutral-900 p-8 rounded-3xl border border-neutral-800 h-fit sticky top-24">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    {editingProduct ? <Edit className="w-5 h-5 text-orange-500" /> : <PlusCircle className="w-5 h-5 text-orange-500" />}
                    {editingProduct ? "Editar Produto" : "Adicionar Produto"}
                  </h3>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Nome</label>
                      <input 
                        type="text" 
                        required
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Categoria</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                      >
                        <option value="lanches">Lanches</option>
                        <option value="combos">Combos</option>
                        <option value="bebidas">Bebidas</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Preço (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Descrição</label>
                      <textarea 
                        rows={3}
                        value={newProduct.description}
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Imagem do Produto</label>
                      <div className="space-y-4">
                        {newProduct.imageUrl && (
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800">
                            <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500"></div>
                              </div>
                            )}
                          </div>
                        )}
                        <label 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            isDragging ? "border-orange-500 bg-orange-500/10" : "border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800/50"
                          )}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className={cn("w-8 h-8 mb-2 transition-colors", isDragging ? "text-orange-500" : "text-neutral-500")} />
                            <p className="text-sm text-neutral-500 font-bold">Arraste ou clique para upload</p>
                            <p className="text-xs text-neutral-600 uppercase tracking-tighter">PNG, JPG ou WEBP (Max. 1MB)</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                        <Save className="w-5 h-5" /> {editingProduct ? "Salvar Alterações" : "Criar Produto"}
                      </button>
                      {editingProduct && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingProduct(null);
                            setNewProduct({ name: '', description: '', price: 0, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' });
                          }}
                          className="bg-neutral-800 text-white px-6 rounded-2xl font-bold"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xl font-bold mb-6">Produtos Cadastrados</h3>
                  <div className="space-y-4">
                    {products.map(product => (
                      <div key={product.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-neutral-700 transition-colors">
                        <img src={product.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                              {product.category}
                            </span>
                            <h4 className="font-bold">{product.name}</h4>
                          </div>
                          <p className="text-neutral-500 text-xs truncate max-w-xs">{product.description}</p>
                        </div>
                        <div className="text-right pr-4">
                          <p className="font-black text-orange-500">R$ {product.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setNewProduct(product);
                            }}
                            className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-3 bg-neutral-800 hover:bg-red-600/20 text-neutral-400 hover:text-red-500 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Hero */}
        <section className="mb-20 relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent z-10" />
          <img 
            src="https://picsum.photos/seed/luxuria-hero/1200/600" 
            alt="Delicious burger" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-20 p-8 md:p-16 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-orange-600/20 text-orange-500 text-xs font-bold uppercase tracking-widest rounded-full mb-4 border border-orange-600/30">
              O sabor da luxúria
            </span>
            <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none mb-6">
              O Melhor <br /> <span className="text-orange-500">Burger</span> da <br /> Cidade
            </h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-md">
              Ingredientes selecionados, carne artesanal e aquele sabor que você só encontra aqui. Peça agora e receba em casa!
            </p>
            <button 
              onClick={scrollToMenu}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
            >
              Ver Cardápio <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Categories Mobile */}
        <div className="flex md:hidden overflow-x-auto gap-4 mb-8 pb-2 no-scrollbar">
          {(['lanches', 'combos', 'bebidas'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all",
                activeCategory === cat ? "bg-orange-600 text-white" : "bg-neutral-900 text-neutral-400 border border-neutral-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Section */}
        <section ref={menuRef}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800">
                {activeCategory === 'lanches' && <Utensils className="text-orange-500" />}
                {activeCategory === 'combos' && <Zap className="text-orange-500" />}
                {activeCategory === 'bebidas' && <Coffee className="text-orange-500" />}
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tight">
                Nossos <span className="text-orange-500">{activeCategory}</span>
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar no cardápio..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-12 py-3 focus:border-orange-500 outline-none transition-all text-sm"
                />
                <MenuIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              </div>
              <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
                <button 
                  onClick={() => setPriceFilter('all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    priceFilter === 'all' ? "bg-orange-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setPriceFilter('low')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    priceFilter === 'low' ? "bg-orange-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  Até R$25
                </button>
                <button 
                  onClick={() => setPriceFilter('high')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    priceFilter === 'high' ? "bg-orange-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  R$25+
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/10"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-full text-orange-500 font-bold text-sm border border-neutral-800">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">{product.name}</h4>
                    <p className="text-neutral-500 text-sm line-clamp-2 mb-6 h-10">
                      {product.description}
                    </p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-neutral-800 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
          </>
        )}
      </main>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-neutral-900 z-50 shadow-2xl border-l border-neutral-800 flex flex-col"
            >
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBasket className="text-orange-500 w-6 h-6" />
                  <h2 className="text-xl font-black uppercase italic">Seu Carrinho</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Carrinho Vazio</h3>
                      <p className="text-neutral-500 text-sm">Adicione alguns lanches deliciosos!</p>
                    </div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-neutral-800">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold truncate pr-4">{item.name}</h4>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-neutral-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-orange-500 font-bold text-sm mb-3">R$ {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-neutral-800 rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-neutral-700 rounded-md transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-neutral-700 rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-neutral-950 border-t border-neutral-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Subtotal</span>
                    <span className="text-xl font-black">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    Finalizar no WhatsApp <ChevronRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => { setIsCartOpen(false); menuRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="w-full bg-transparent border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Continuar Comprando
                  </button>
                  <p className="text-center text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                    Taxa de entrega calculada no WhatsApp
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                <Utensils className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">
                Luxuria <span className="text-orange-500">Lanches</span>
              </h1>
            </div>
            <p className="text-neutral-500 text-sm">
              Sua lanchonete favorita, agora com pedidos online rápidos e fáceis.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-orange-500">Horário de Funcionamento</h4>
            <ul className="text-sm text-neutral-400 space-y-2">
              <li className="flex justify-between"><span>Segunda - Quinta:</span> <span>{businessInfo.openingHours.monThu}</span></li>
              <li className="flex justify-between"><span>Sexta - Sábado:</span> <span>{businessInfo.openingHours.friSat}</span></li>
              <li className="flex justify-between"><span>Domingo:</span> <span>{businessInfo.openingHours.sun}</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-orange-500">Contato</h4>
            <p className="text-sm text-neutral-400">{businessInfo.address}</p>
            <p className="text-sm text-neutral-400">{businessInfo.phone}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-600 text-xs uppercase tracking-widest font-bold">
          © 2026 Luxuria Lanches. Todos os direitos reservados.
        </div>
      </footer>
    </div>
    </ErrorBoundary>
    </>
  );
}
