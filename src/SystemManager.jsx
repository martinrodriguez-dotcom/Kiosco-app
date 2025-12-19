import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, FileText, 
  Settings, LogOut, Plus, Search, Trash2, Edit, AlertTriangle, 
  Check, X, DollarSign, Archive, TrendingUp, Menu, ChevronLeft,
  Calculator, Truck, ArrowRightLeft, RefreshCw
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, onSnapshot, writeBatch, 
  increment, deleteDoc, setDoc, updateDoc, query, where, getDocs 
} from 'firebase/firestore';

// --- CONFIGURACIÓN ---
const firebaseConfig = {
  apiKey: "AIzaSyDfniZVLGzatksiK1qBeO259XqpY46PbX0",
  authDomain: "kiosco-app-79b58.firebaseapp.com",
  projectId: "kiosco-app-79b58",
  storageBucket: "kiosco-app-79b58.firebasestorage.app",
  messagingSenderId: "610299820416",
  appId: "1:610299820416:web:a643e728ba5ee6d7a7e965"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const STORE_ID = 'mi-kiosco-principal';

// --- UTILS ---
const formatMoney = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

// --- COMPONENTES UI ---

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color} text-white shadow-lg`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

// --- VISTAS DEL SISTEMA ---

// 1. LOGIN
const LoginView = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // Nuevo campo para login simple
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        // Registro
        const q = query(collection(db, 'tiendas', STORE_ID, 'users'), where("username", "==", username));
        const snap = await getDocs(q);
        if(!snap.empty) throw new Error("El usuario ya existe");

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'tiendas', STORE_ID, 'users', cred.user.uid), {
          name, username, email, role: 'user', createdAt: new Date().toISOString()
        });
      } else {
        // Login con Username (Buscamos el email internamente)
        const q = query(collection(db, 'tiendas', STORE_ID, 'users'), where("username", "==", username));
        const snap = await getDocs(q);
        if(snap.empty) throw new Error("Usuario no encontrado");
        
        const targetEmail = snap.docs[0].data().email;
        await signInWithEmailAndPassword(auth, targetEmail, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-200">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Kiosco Pro</h1>
          <p className="text-slate-400">Sistema de Gestión Integral</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
             <>
              <input placeholder="Nombre Completo" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={name} onChange={e=>setName(e.target.value)} required />
              <input type="email" placeholder="Email (Recuperación)" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={email} onChange={e=>setEmail(e.target.value)} required />
             </>
          )}
          <input placeholder="Usuario (Ej: cajero1)" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={username} onChange={e=>setUsername(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={password} onChange={e=>setPassword(e.target.value)} required />
          
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-slate-400 text-sm hover:text-blue-600 transition-colors">
          {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
};

// 2. POS (PUNTO DE VENTA)
const PosView = ({ products, onCheckout }) => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return products;
    const lower = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lower) || p.barcode?.includes(lower));
  }, [search, products]);

  // Detector de Escáner USB (Enter automático)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && search) {
      const exactMatch = products.find(p => p.barcode === search);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearch('');
      }
    }
  };

  const addToCart = (p) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === p.id);
      if (exists) return prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="flex h-full gap-6">
      {/* Catálogo */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-2 sticky top-0 z-10">
          <Search className="text-slate-400" />
          <input 
            autoFocus
            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
            placeholder="Buscar por nombre o escanear código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
          {filtered.map(p => (
            <button 
              key={p.id} 
              onClick={() => addToCart(p)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <h3 className="font-bold text-slate-700 leading-tight group-hover:text-blue-600">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{p.barcode}</p>
              </div>
              <div className="mt-3 flex justify-between items-end">
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  Stock: {p.stock}
                </span>
                <span className="text-lg font-bold text-slate-800">${p.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Carrito Lateral */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" /> Ticket Actual
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Package size={48} className="mb-2 opacity-50"/>
              <p>Carrito vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group">
                <div>
                  <p className="font-bold text-slate-700 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">${item.price} x {item.qty}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">${item.price * item.qty}</span>
                  <button 
                    onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500">Total a cobrar</span>
            <span className="text-3xl font-bold text-slate-800">${total.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => setCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all flex justify-center gap-2"
          >
            <Banknote /> Cobrar
          </button>
        </div>
      </div>

      {/* Modal de Cobro */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-center mb-2">Confirmar Venta</h3>
            <p className="text-center text-3xl font-bold text-blue-600 mb-8">${total.toLocaleString()}</p>
            
            <div className="space-y-3">
              {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
                <button 
                  key={method}
                  onClick={() => { onCheckout(total, cart, method); setCheckoutModal(false); setCart([]); }}
                  className="w-full p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 font-bold text-slate-600 transition-all flex items-center gap-3"
                >
                  <Check size={18} /> {method}
                </button>
              ))}
            </div>
            
            <button onClick={() => setCheckoutModal(false)} className="w-full mt-4 text-slate-400 hover:text-slate-600 p-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. INVENTARIO (CON LÓGICA DE REPOSICIÓN BLINDADA)
const InventoryView = ({ products, user, onProductAction, onDelete }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE, EDIT, RESTOCK
  const [selectedId, setSelectedId] = useState(null);
  
  // Estado del Formulario
  const [form, setForm] = useState({
    name: '', barcode: '', category: 'Varios', 
    cost: '', price: '', margin: 50, stock: 0, minStock: 5,
    // Campos específicos para reposición
    packCost: '', packUnits: 1, quantityPurchased: ''
  });

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search));

  const openCreate = () => {
    setModalMode('CREATE');
    setForm({ name: '', barcode: '', category: 'Varios', cost: '', price: '', margin: 50, stock: 0, minStock: 5 });
    setModalOpen(true);
  };

  const openRestock = (p) => {
    setModalMode('RESTOCK');
    setSelectedId(p.id);
    // Solo cargamos datos visuales, no se pueden editar nombre/codigo aqui
    setForm({ 
      ...p, // Trae datos actuales para mostrar
      packCost: '', packUnits: 1, quantityPurchased: '' // Limpia campos de reposición
    });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setModalMode('EDIT');
    setSelectedId(p.id);
    setForm({ ...p });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (modalMode === 'CREATE' && !form.name) return alert("Falta nombre");
    if (modalMode === 'RESTOCK') {
       if (!form.packCost || !form.quantityPurchased) return alert("Complete costos y cantidad");
    }

    // Calcular Valores Finales
    let finalCost = Number(form.cost);
    let finalStock = Number(form.stock);

    if (modalMode === 'RESTOCK') {
        // Lógica: Costo Pack / Unidades Pack = Nuevo Unitario
        const newUnitCost = Number(form.packCost) / Number(form.packUnits);
        
        // Regla: "El mayor manda"
        const currentProd = products.find(p => p.id === selectedId);
        const oldCost = currentProd ? Number(currentProd.cost) : 0;
        finalCost = newUnitCost > oldCost ? newUnitCost : oldCost;

        // Stock: No calculamos total aquí, mandamos incremento al backend
    }

    // Precio Venta
    const finalPrice = Math.ceil(finalCost * (1 + (Number(form.margin) / 100)));

    onProductAction({
      mode: modalMode,
      id: selectedId,
      data: {
        ...form,
        cost: finalCost,
        price: finalPrice,
        stockIncrement: modalMode === 'RESTOCK' ? Number(form.quantityPurchased) : 0
      }
    });

    setModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <div className="bg-white p-2 rounded-lg border flex items-center w-96">
            <Search className="text-slate-400 mr-2" />
            <input className="outline-none w-full" placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} />
         </div>
         <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus size={20}/> Nuevo Producto</button>
       </div>

       <div className="flex-1 overflow-y-auto">
          <table className="w-full bg-white rounded-xl shadow-sm border border-slate-100">
            <thead className="bg-slate-50 text-slate-500 text-left text-sm uppercase">
               <tr>
                 <th className="p-4">Producto</th>
                 <th className="p-4">Categoría</th>
                 <th className="p-4">Costo</th>
                 <th className="p-4">Precio</th>
                 <th className="p-4">Stock</th>
                 <th className="p-4 text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filtered.map(p => (
                 <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">
                      <div>{p.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.barcode}</div>
                    </td>
                    <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-bold">{p.category}</span></td>
                    <td className="p-4 text-slate-500">${p.cost}</td>
                    <td className="p-4 font-bold text-green-600">${p.price}</td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded font-bold text-xs ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{p.stock} u.</span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                       <button onClick={() => openRestock(p)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Reponer Stock"><PackagePlus size={18}/></button>
                       <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-slate-600"><Edit size={18}/></button>
                       {user.role === 'admin' && <button onClick={() => onDelete(p.id)} className="p-2 text-red-300 hover:text-red-600"><Trash2 size={18}/></button>}
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
       </div>

       {/* MODAL UNIFICADO */}
       {modalOpen && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-xl text-slate-800">
                    {modalMode === 'CREATE' && 'Nuevo Producto'}
                    {modalMode === 'EDIT' && 'Editar Detalles'}
                    {modalMode === 'RESTOCK' && 'Reponer Stock'}
                 </h3>
                 <button onClick={() => setModalOpen(false)}><X className="text-slate-400"/></button>
               </div>

               <div className="space-y-4">
                  {/* Datos Básicos (Bloqueados en Restock) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                       <input className="w-full p-2 border rounded-lg bg-slate-50" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} disabled={modalMode === 'RESTOCK'} />
                    </div>
                    {modalMode !== 'RESTOCK' && (
                      <>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Código</label><input className="w-full p-2 border rounded-lg" value={form.barcode} onChange={e=>setForm({...form, barcode:e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Categoría</label><select className="w-full p-2 border rounded-lg bg-white" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}><option>Varios</option><option>Bebidas</option><option>Almacén</option></select></div>
                      </>
                    )}
                  </div>

                  <hr className="border-slate-100"/>

                  {/* Sección Reposición */}
                  {modalMode === 'RESTOCK' ? (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                         <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2"><Truck size={16}/> Datos de Factura/Compra</h4>
                         <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs text-blue-600 font-bold">Costo Pack/Bulto ($)</label><input type="number" className="w-full p-2 border border-blue-200 rounded" autoFocus value={form.packCost} onChange={e=>setForm({...form, packCost:e.target.value})} placeholder="$0.00"/></div>
                            <div><label className="text-xs text-blue-600 font-bold">Unidades del Pack</label><input type="number" className="w-full p-2 border border-blue-200 rounded" value={form.packUnits} onChange={e=>setForm({...form, packUnits:e.target.value})}/></div>
                            <div className="col-span-2"><label className="text-xs text-green-600 font-bold">Cantidad Comprada (Sueltas)</label><input type="number" className="w-full p-2 border-2 border-green-400 rounded font-bold text-lg" value={form.quantityPurchased} onChange={e=>setForm({...form, quantityPurchased:e.target.value})} placeholder="0"/></div>
                         </div>
                         <p className="text-[10px] text-blue-500 text-center">El sistema calculará el nuevo costo unitario automáticamente.</p>
                      </div>
                  ) : (
                      /* Sección Costos Normales (Create/Edit) */
                      <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Costo Unitario</label><input type="number" className="w-full p-2 border rounded-lg" value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})} /></div>
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Stock Inicial</label><input type="number" className="w-full p-2 border rounded-lg" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} /></div>
                      </div>
                  )}

                  {/* Margen y Precio Final (Siempre visibles) */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                     <div><label className="text-xs font-bold text-slate-500 uppercase">Margen %</label><input type="number" className="w-full p-2 border rounded-lg" value={form.margin} onChange={e=>setForm({...form, margin:e.target.value})} /></div>
                     <div><label className="text-xs font-bold text-slate-500 uppercase">Precio Venta</label><div className="w-full p-2 bg-green-50 text-green-700 font-bold text-center rounded-lg border border-green-200">${
                        // Previsualización simple del precio
                        Math.ceil((modalMode === 'RESTOCK' && form.packCost 
                           ? Math.max(Number(form.packCost)/Number(form.packUnits), Number(form.cost)) 
                           : Number(form.cost)) * (1 + Number(form.margin)/100))
                     }</div></div>
                  </div>

                  <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                    {modalMode === 'RESTOCK' ? 'Confirmar Ingreso' : 'Guardar Producto'}
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};


// 4. MAIN LAYOUT
export default function KioscoSystem() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('login');
  
  // Data
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  
  // Listeners
  useEffect(() => {
     const unsub = onAuthStateChanged(auth, async (u) => {
         if(u) {
             setUser(u);
             const docSnap = await getDoc(doc(db, 'tiendas', STORE_ID, 'users', u.uid));
             if(docSnap.exists()) setUserData(docSnap.data());
             else { // Autocreate if missing
                 const baseData = { name: u.email.split('@')[0], role: 'user', email: u.email };
                 await setDoc(doc(db, 'tiendas', STORE_ID, 'users', u.uid), baseData);
                 setUserData(baseData);
             }
             setView('pos');
         } else {
             setUser(null); setView('login');
         }
     });
     return () => unsub();
  }, []);

  useEffect(() => {
     if(!user) return;
     const unsubProd = onSnapshot(collection(db, 'tiendas', STORE_ID, 'products'), s => {
         setProducts(s.docs.map(d => ({id: d.id, ...d.data()})));
     });
     const unsubSale = onSnapshot(collection(db, 'tiendas', STORE_ID, 'sales'), s => {
         setSales(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>new Date(b.date)-new Date(a.date)));
     });
     return () => { unsubProd(); unsubSale(); };
  }, [user]);

  // Actions
  const handleProductAction = async ({ mode, id, data }) => {
    const batch = writeBatch(db);
    
    try {
        if (mode === 'CREATE') {
            const ref = doc(collection(db, 'tiendas', STORE_ID, 'products'));
            batch.set(ref, data);
        } else if (mode === 'EDIT') {
            const ref = doc(db, 'tiendas', STORE_ID, 'products', id);
            batch.update(ref, data);
        } else if (mode === 'RESTOCK') {
            const ref = doc(db, 'tiendas', STORE_ID, 'products', id);
            // LÓGICA CRÍTICA: SET con MERGE para evitar errores "No document"
            // y garantizar actualización atómica del stock.
            batch.set(ref, {
                ...data, // Datos base (nombre, etc) por si se recrea
                stock: increment(data.stockIncrement),
                // El costo y precio ya vienen calculados en 'data' según la lógica "Mayor Gana"
            }, { merge: true });
        }
        await batch.commit();
    } catch(e) { alert("Error: " + e.message); }
  };

  const handleDeleteProduct = async (id) => {
      if(window.confirm("¿Eliminar?")) await deleteDoc(doc(db, 'tiendas', STORE_ID, 'products', id));
  };

  const handleCheckout = async (total, items, method) => {
     const batch = writeBatch(db);
     const ref = doc(collection(db, 'tiendas', STORE_ID, 'sales'));
     batch.set(ref, { date: new Date().toISOString(), total, items, method, user: userData.name });
     items.forEach(i => {
         batch.update(doc(db, 'tiendas', STORE_ID, 'products', i.id), { stock: increment(-i.qty) });
     });
     await batch.commit();
  };

  if (!user) return <LoginView />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shadow-xl z-20">
         <div className="flex items-center gap-3 px-2 mb-8">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><Package size={24}/></div>
            <div><h1 className="font-bold text-lg leading-tight">Kiosco Pro</h1><p className="text-xs text-slate-400">v3.0 System</p></div>
         </div>
         
         <nav className="flex-1 space-y-2">
            <SidebarItem icon={ShoppingCart} label="Punto de Venta" active={view==='pos'} onClick={()=>setView('pos')} />
            <SidebarItem icon={Package} label="Inventario" active={view==='products'} onClick={()=>setView('products')} />
            <SidebarItem icon={History} label="Historial Ventas" active={view==='sales'} onClick={()=>setView('sales')} />
         </nav>

         <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">{userData?.name?.[0]}</div>
                <div className="overflow-hidden"><p className="text-sm font-bold truncate">{userData?.name}</p><p className="text-xs text-slate-400 capitalize">{userData?.role}</p></div>
            </div>
            <button onClick={()=>signOut(auth)} className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium"><LogOut size={16}/> Cerrar Sesión</button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
         {view === 'pos' && <PosView products={products} onCheckout={handleCheckout} />}
         {view === 'products' && <ProductManager products={products} user={userData} onProductAction={handleProductAction} onDelete={handleDeleteProduct} />}
         
         {/* Placeholder para otras vistas si se agregan luego */}
         {view === 'sales' && (
             <div className="p-8 overflow-y-auto h-full">
                 <h2 className="text-2xl font-bold mb-6">Historial de Ventas</h2>
                 <div className="space-y-3">
                     {sales.map(s => (
                         <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between">
                             <div>
                                 <p className="font-bold">Venta #{s.id.slice(0,5)}</p>
                                 <p className="text-xs text-slate-500">{new Date(s.date).toLocaleString()} • {s.method}</p>
                             </div>
                             <span className="font-bold text-green-600">${s.total}</span>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>
    </div>
  );
}
