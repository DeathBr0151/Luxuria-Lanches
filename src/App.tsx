import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, addDoc, serverTimestamp, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { cn } from './lib/utils';
import { Product, CartItem, Order } from './types';

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

const WHATSAPP_NUMBER = "5567998344262"; // Novo número solicitado

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'lanches' | 'combos' | 'bebidas'>('lanches');
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'lanches',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  const isAdmin = user?.email === "pinheiro0151@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
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
        console.error("Error fetching products:", error);
        setProducts(MOCK_PRODUCTS);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user && isHistoryOpen) {
      const fetchOrders = async () => {
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          setOrders(ordersData);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      };
      fetchOrders();
    }
  }, [user, isHistoryOpen]);

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
      alert("Por favor, faça login com o Google para finalizar seu pedido.");
      signInWithGoogle();
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
    } catch (e) {
      console.error("Error saving order:", e);
    }

    // Generate WhatsApp message
    const message = `*Novo Pedido - Luxuria Lanches*\n\n` +
      `*Cliente:* ${user.displayName}\n` +
      `*Itens:*\n` +
      cart.map(item => `- ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`).join('\n') +
      `\n\n*Total: R$ ${cartTotal.toFixed(2)}*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  const handleSupport = () => {
    const message = `Olá! Gostaria de suporte com o Luxuria Lanches.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  const handleImageUpload = (file: File) => {
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage in Firestore
      alert("A imagem é muito grande. Por favor, escolha uma imagem menor que 1MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, {
          name: newProduct.name,
          description: newProduct.description,
          price: Number(newProduct.price),
          category: newProduct.category,
          imageUrl: newProduct.imageUrl
        });
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...newProduct } as Product : p));
      } else {
        const docRef = await addDoc(collection(db, 'products'), {
          ...newProduct,
          price: Number(newProduct.price),
          createdAt: serverTimestamp()
        });
        setProducts(prev => [...prev, { id: docRef.id, ...newProduct } as Product]);
      }
      setEditingProduct(null);
      setNewProduct({ name: '', description: '', price: 0, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' });
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto. Verifique as permissões.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin || !confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const filteredProducts = products.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Utensils className="text-white w-6 h-6" />
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
                <button onClick={logout} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
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
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Painel de <span className="text-orange-500">Gerenciamento</span></h2>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({ name: '', description: '', price: 0, category: 'lanches', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' });
                }}
                className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Novo Lanche
              </button>
            </div>

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
          <div className="flex items-center justify-between mb-10">
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
            <p className="hidden md:block text-neutral-500 text-sm font-medium">
              {filteredProducts.length} itens disponíveis
            </p>
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
              <li className="flex justify-between"><span>Segunda - Quinta:</span> <span>18:00 - 23:30</span></li>
              <li className="flex justify-between"><span>Sexta - Sábado:</span> <span>18:00 - 01:00</span></li>
              <li className="flex justify-between"><span>Domingo:</span> <span>18:00 - 23:00</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-orange-500">Contato</h4>
            <p className="text-sm text-neutral-400">Rua Abilio de Mattos Pedrosso, 1177</p>
            <p className="text-sm text-neutral-400">(67) 99834-4262</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-600 text-xs uppercase tracking-widest font-bold">
          © 2026 Luxuria Lanches. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
