import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, ShoppingCart, Package, DollarSign, User, LogOut, 
  Trash2, Edit, X, TrendingUp, Truck, FileText, Scale, Hash, 
  CreditCard, QrCode, Banknote, ArrowUpCircle, ArrowDownCircle, 
  Calculator, Menu, BarChart2, AlertTriangle, ShieldAlert, Bell,
  History, Printer, Scan, ClipboardList, PackagePlus, Briefcase, Calendar, CheckCircle, Database, Lock, Minus, Key, UserPlus, RefreshCw, LogIn, ArrowLeft, Tag, CalendarDays
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  writeBatch,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  increment 
} from 'firebase/firestore';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDfniZVLGzatksiK1qBeO259XqpY46PbX0",
  authDomain: "kiosco-app-79b58.firebaseapp.com",
  projectId: "kiosco-app-79b58",
  storageBucket: "kiosco-app-79b58.firebasestorage.app",
  messagingSenderId: "610299820416",
  appId: "1:610299820416:web:a643e728ba5ee6d7a7e965"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const STORE_ID = 'mi-kiosco-principal';

// --- Componentes UI Básicos ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", icon: Icon, disabled = false, type = "button" }) => {
  const baseStyle = "flex items-center justify-center font-medium rounded-lg transition-all active:scale-95 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200",
    outline: "border-2 border-gray-200 text-gray-600 hover:border-gray-300",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

// --- Helpers de Fecha ---
const getDaysUntilExpiry = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  const expiry = new Date(dateString);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};

// --- App Principal ---

export default function KioscoSystem() {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [userData, setUserData] = useState(null); 
  const [view, setView] = useState('login'); 
  
  // Estados de Datos
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]); 
  const [debts, setDebts] = useState([]); 
  const [closedShifts, setClosedShifts] = useState([]); 
  const [notifications, setNotifications] = useState([]); 
  
  // Estado de Turno Actual
  const [currentShiftData, setCurrentShiftData] = useState(() => {
    const saved = localStorage.getItem('kiosco_shift_data');
    return saved ? JSON.parse(saved) : null;
  });

  // UI
  const [cart, setCart] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [printData, setPrintData] = useState(null); 
  const [restockData, setRestockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null); 
  
  // Login Inputs
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showShiftStartModal, setShowShiftStartModal] = useState(false);

  // 1. Limpieza de Caché
  useEffect(() => { localStorage.clear(); }, []);

  // 2. Monitor Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        try {
            const docRef = doc(db, 'tiendas', STORE_ID, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({ uid: firebaseUser.uid, ...data });
                if (data.role === 'admin') {
                    setView('pos');
                    setCurrentShiftData(null); 
                } else {
                    if(!currentShiftData) setShowShiftStartModal(true);
                    else setView('pos');
                }
            } else {
                const safeName = firebaseUser.email ? firebaseUser.email.split('@')[0] : "Usuario";
                const newData = { name: safeName, role: 'user', email: firebaseUser.email || 'sin_email' };
                await setDoc(docRef, newData);
                setUserData({ uid: firebaseUser.uid, ...newData });
                setShowShiftStartModal(true);
            }
        } catch (e) {
            console.error("Error fetching user data:", e);
            if (e.code === 'permission-denied') setDbError("PERMISOS DENEGADOS: Configura las reglas en Firebase.");
        }
      } else {
        setFirebaseUser(null); setUserData(null); setView('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentShiftData]);

  useEffect(() => {
      if (currentShiftData) localStorage.setItem('kiosco_shift_data', JSON.stringify(currentShiftData));
      else localStorage.removeItem('kiosco_shift_data');
  }, [currentShiftData]);

  // 3. Sync Data
  useEffect(() => {
    if (!firebaseUser) return;
    const getPath = (col) => collection(db, 'tiendas', STORE_ID, col);
    const handleSnapshotError = (err) => { if (err.code === 'permission-denied') setDbError("PERMISOS DENEGADOS"); };

    const unsubProducts = onSnapshot(getPath('products'), (snap) => setProducts(snap.docs.map(d => ({ 
        id: d.id, ...d.data(), 
        stock: Number(d.data().stock||0), 
        minStock: Number(d.data().minStock||0), 
        cost: Number(d.data().cost||0), 
        price: Number(d.data().price||0) 
    }))), handleSnapshotError);
    const unsubSales = onSnapshot(getPath('sales'), (snap) => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.date)-new Date(a.date))), handleSnapshotError);
    const unsubPayments = onSnapshot(getPath('payments'), (snap) => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.date)-new Date(a.date))), handleSnapshotError);
    const unsubDebts = onSnapshot(getPath('debts'), (snap) => setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.date)-new Date(a.date))), handleSnapshotError);
    const unsubShifts = onSnapshot(getPath('shifts'), (snap) => setClosedShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.date)-new Date(a.date))), handleSnapshotError);
    const unsubNotifs = onSnapshot(getPath('notifications'), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))), handleSnapshotError);

    return () => { unsubProducts(); unsubSales(); unsubPayments(); unsubDebts(); unsubShifts(); unsubNotifs(); };
  }, [firebaseUser]);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return alert("Complete todos los campos");
    try {
        setLoading(true);
        const usersRef = collection(db, 'tiendas', STORE_ID, 'users');
        const q = query(usersRef, where("username", "==", loginUser.trim()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { setLoading(false); return alert("Usuario no encontrado."); }
        const userDoc = querySnapshot.docs[0].data();
        await signInWithEmailAndPassword(auth, userDoc.email, loginPass); 
    } catch (error) { console.error(error); setLoading(false); alert("Error de acceso: Credenciales inválidas."); }
  };

  const handleRegister = async (e) => {
      e.preventDefault();
      if (!regEmail || !regPass || !regName || !regUsername) return alert("Complete todos los campos");
      try {
          setLoading(true);
          const usersRef = collection(db, 'tiendas', STORE_ID, 'users');
          const q = query(usersRef, where("username", "==", regUsername.trim()));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) { setLoading(false); return alert("El nombre de usuario ya está en uso."); }
          const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPass);
          await setDoc(doc(db, 'tiendas', STORE_ID, 'users', userCredential.user.uid), {
              name: regName, username: regUsername.trim(), email: regEmail, role: 'user', createdAt: new Date().toISOString()
          });
          alert("Registrado con éxito.");
      } catch (error) { setLoading(false); alert("Error al registrar: " + error.message); }
  };

  const handleStartShift = (data) => { setCurrentShiftData(data); setShowShiftStartModal(false); setView('pos'); };
  const handleLogout = async () => { await signOut(auth); setUserData(null); setCurrentShiftData(null); localStorage.removeItem('kiosco_shift_data'); setView('login'); };
  const handleReopenShift = () => { setPrintData(null); setCurrentShiftData(null); setShowShiftStartModal(true); };
  const handleManualOpenShift = () => setShowShiftStartModal(true);
  const handleReloadData = () => window.location.reload();
  const seedDatabase = async () => { try { const b = writeBatch(db); [{name:'Coca Cola',price:1500,stock:10}].forEach(p=>b.set(doc(collection(db,'tiendas',STORE_ID,'products')),p)); await b.commit(); alert("Datos cargados"); } catch(e){alert(e);} };
  const handleFactoryReset = async () => { if(window.confirm("¿BORRAR TODO?")) { setLoading(true); try { await Promise.all(['products','sales','payments','debts','shifts','notifications'].map(async c => { const q=query(collection(db,'tiendas',STORE_ID,c)); const s=await getDocs(q); const b=writeBatch(db); s.forEach(d=>b.delete(d.ref)); await b.commit(); })); alert("Reset completo"); } catch(e){alert(e);} finally{setLoading(false);} } };

  // --- TRANSACCIONES BLINDADAS ---
  const handleProductTransaction = async (productData, financialData) => {
    const { isRestock, productId, addedStock } = productData;
    const { totalCost, paymentStatus } = financialData; 

    try {
      const batch = writeBatch(db);
      
      const dataToUpdate = {
        category: productData.category || 'Varios', 
        expiry: productData.expiry || '',
      };
      
      if (isRestock) {
        if (!productId) {
            alert("Error Crítico: ID de producto no encontrado.");
            return;
        }
        
        const productRef = doc(db, 'tiendas', STORE_ID, 'products', productId);
        
        // --- FIX DEL ERROR "No document to update" ---
        // Usamos set({ ... }, { merge: true }) en lugar de update.
        // Esto restaura el documento si no existía y actualiza si existe.
        // Le pasamos ...productData.fullObject para que tenga nombre y datos base si se recrea.
        batch.set(productRef, {
            ...productData.fullObject, // Datos base por seguridad (nombre, barcode)
            ...dataToUpdate,
            stock: increment(Number(addedStock)), // Suma atómica
            cost: Number(productData.newCost),
            price: Number(productData.newPrice)
        }, { merge: true });

      } else {
        // Create or Edit Details
        if (productId) {
             const productRef = doc(db, 'tiendas', STORE_ID, 'products', productId);
             batch.set(productRef, { ...productData.fullObject, ...dataToUpdate }, { merge: true });
        } else {
             const newProductRef = doc(collection(db, 'tiendas', STORE_ID, 'products'));
             batch.set(newProductRef, { ...productData.fullObject, ...dataToUpdate });
        }
      }

      // Lógica Financiera
      if (totalCost > 0) {
          const col = paymentStatus === 'PAID' ? 'payments' : 'debts';
          const ref = doc(collection(db, 'tiendas', STORE_ID, col));
          batch.set(ref, { 
              date: new Date().toISOString(), 
              amount: totalCost, 
              supplier: productData.supplierName || 'General', 
              note: isRestock ? `Reposición: ${productData.productName}` : `Carga Inicial`, 
              user: userData.name, 
              status: paymentStatus==='PAID'?'open':'PENDING', 
              ...(paymentStatus==='OWED' && {productName: productData.productName, qty: addedStock}) 
          });
      }
      
      await batch.commit();
      
    } catch (e) { 
        console.error(e);
        alert("Error en la operación: " + e.message); 
    }
  };

  const handleCheckout = async (total, items, method) => {
    try {
        const batch = writeBatch(db);
        const saleRef = doc(collection(db, 'tiendas', STORE_ID, 'sales'));
        batch.set(saleRef, { date: new Date().toISOString(), total, items, method, user: userData.name, status: 'open' });
        items.forEach(item => {
            const prodRef = doc(db, 'tiendas', STORE_ID, 'products', item.id);
            batch.update(prodRef, { stock: increment(-Number(item.qty)) });
        });
        await batch.commit();
        setCart([]);
    } catch (e) { alert("Error venta: " + e.message); }
  };

  const requestAuthorization = async (type, payload, description) => { try { await addDoc(collection(db, 'tiendas', STORE_ID, 'notifications'), { type, payload, description, requester: userData.name, timestamp: new Date().toISOString(), status: 'pending' }); alert("⛔ Solicitud enviada."); } catch (e) { console.error(e); } };
  const handleDeleteProduct = async (prodId) => { if (userData?.role !== 'admin') { alert("Acceso denegado: Solo el dueño puede borrar productos."); return; } if (window.confirm("⚠️ ¿Estás seguro de ELIMINAR este producto definitivamente?")) { try { await deleteDoc(doc(db, 'tiendas', STORE_ID, 'products', prodId)); console.log("Producto eliminado correctamente"); } catch (e) { console.error("Error eliminando:", e); alert("Error al borrar: " + e.message); } } };
  const handleDeleteSale = async (saleId, items) => { if (userData.role === 'admin') { if(window.confirm('¿Anular venta?')) executeDeleteSale(saleId, items); } else requestAuthorization('DELETE_SALE', { saleId }, `Solicita anular venta`); };
  const executeDeleteSale = async (saleId, items) => { const batch = writeBatch(db); batch.delete(doc(db, 'tiendas', STORE_ID, 'sales', saleId)); if (items) items.forEach(item => { const ref = doc(db, 'tiendas', STORE_ID, 'products', item.id); batch.update(ref, { stock: increment(Number(item.qty)) }); }); await batch.commit(); };
  const handleApproveRequest = async (req) => { if (req.type === 'DELETE_SALE') { const sale = sales.find(s => s.id === req.payload.saleId); if (sale) executeDeleteSale(sale.id, sale.items); } else if (req.type === 'PRODUCT_TRANSACTION' || req.type === 'EDIT_PRODUCT') await handleProductTransaction(req.payload.productData, req.payload.financialData); await deleteDoc(doc(db, 'tiendas', STORE_ID, 'notifications', req.id)); setShowNotifications(false); };
  const handleDenyRequest = async (id) => await deleteDoc(doc(db, 'tiendas', STORE_ID, 'notifications', id));

  const closeShift = async () => {
    const myOpenSales = sales.filter(s => s.user === userData.name && s.status === 'open');
    const myOpenPayments = payments.filter(p => p.user === userData.name && p.status === 'open');
    if (myOpenSales.length === 0 && myOpenPayments.length === 0 && currentShiftData?.initialChange === 0) return alert("Sin movimientos.");

    const report = {
      date: new Date().toISOString(), cashier: userData.name, initialData: currentShiftData || {initialChange:0, supplierFund:0}, sales: myOpenSales, payments: myOpenPayments,
      totals: {
        revenue: myOpenSales.reduce((acc, curr) => acc + curr.total, 0),
        expenses: myOpenPayments.reduce((acc, curr) => acc + curr.amount, 0),
        cash: myOpenSales.filter(s => s.method === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0),
        card: myOpenSales.filter(s => s.method === 'Tarjeta').reduce((acc, curr) => acc + curr.total, 0),
        transfer: myOpenSales.filter(s => s.method === 'Transferencia').reduce((acc, curr) => acc + curr.total, 0),
      }
    };
    try {
        const batch = writeBatch(db);
        const shiftRef = doc(collection(db, 'tiendas', STORE_ID, 'shifts'));
        batch.set(shiftRef, report);
        myOpenSales.forEach(s => batch.update(doc(db, 'tiendas', STORE_ID, 'sales', s.id), { status: 'closed', shiftId: shiftRef.id }));
        myOpenPayments.forEach(p => batch.update(doc(db, 'tiendas', STORE_ID, 'payments', p.id), { status: 'closed', shiftId: shiftRef.id }));
        await batch.commit();
        setPrintData({...report, id: shiftRef.id}); 
    } catch (e) { alert("Error cierre: " + e.message); }
  };

  const navigateTo = (newView) => { setView(newView); setIsMenuOpen(false); };

  // --- RENDERIZADO ---
  if (dbError) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="p-8 text-center"><Lock size={40} className="mx-auto text-red-600 mb-4"/><h1 className="text-xl font-bold">{dbError}</h1><Button onClick={handleReloadData} className="mt-4 w-full">Recargar</Button></Card></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Iniciando...</div>;
  if (printData) return <PrintableReport data={printData} onClose={handleReopenShift} />; 
  if (restockData) return <RestockList data={restockData} onClose={() => setRestockData(null)} />;

  if (!userData || showShiftStartModal) {
    if (userData && showShiftStartModal) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><ShiftStartModal onStart={handleStartShift} username={userData.name} onCancel={handleLogout} /></div>;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-8 text-center shadow-xl border border-gray-100">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-blue-200 shadow-lg"><Database size={32} /></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Kiosco Pro</h1>
            <p className="text-gray-400 text-sm mb-8">Gestión de Kiosco & Stock</p>
            {isRegistering ? (
                <form onSubmit={handleRegister} className="space-y-4 text-left animate-in">
                    <h3 className="text-sm font-bold text-blue-600 uppercase text-center mb-4">Crear Cuenta</h3>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Completo</label><input type="text" value={regName} onChange={e=>setRegName(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Juan Pérez" required /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuario (Login)</label><input type="text" value={regUsername} onChange={e=>setRegUsername(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. cajero1" required /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Email (Recuperación)</label><input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@ejemplo.com" required /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label><input type="password" value={regPass} onChange={e=>setRegPass(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" required /></div>
                    <Button type="submit" className="w-full py-3 mt-4">Registrarse</Button>
                    <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-center text-gray-500 text-sm mt-4 hover:underline">Volver al Login</button>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="space-y-4 text-left animate-in">
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuario</label><div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ingrese usuario" required /></div></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label><div className="relative"><Key className="absolute left-3 top-3 text-gray-400" size={18}/><input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" required /></div></div>
                    <Button type="submit" className="w-full py-3 mt-2">Iniciar Sesión</Button>
                    <div className="mt-6 text-center text-sm text-gray-500">¿No tienes cuenta? <button type="button" onClick={() => setIsRegistering(true)} className="text-blue-600 font-bold hover:underline">Regístrate</button></div>
                </form>
            )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0 relative overflow-x-hidden">
      {/* Menu & Header */}
      {isMenuOpen && <div className="fixed inset-0 z-50 flex animate-in"><div className="bg-black/50 absolute inset-0 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} /><div className="bg-white w-72 h-full relative z-10 shadow-2xl p-6 flex flex-col"><div className="flex items-center gap-3 mb-8 pb-4 border-b"><div className="bg-blue-600 text-white p-2 rounded-lg"><DollarSign size={20} /></div><div><h2 className="font-bold text-xl">Kiosco</h2><p className="text-xs text-gray-500">Cloud System</p></div></div><nav className="flex-1 space-y-2"><MenuLink icon={ShoppingCart} label="Punto de Venta" active={view === 'pos'} onClick={() => navigateTo('pos')} /><MenuLink icon={Package} label="Productos / Stock" active={view === 'products'} onClick={() => navigateTo('products')} /><MenuLink icon={FileText} label="Cierre de Caja" active={view === 'shift'} onClick={() => navigateTo('shift')} /><MenuLink icon={BarChart2} label="Estadísticas" active={view === 'stats'} onClick={() => navigateTo('stats')} />{userData.role === 'admin' && <><div className="my-4 border-t pt-4 text-xs font-bold text-gray-400 uppercase">Admin</div><MenuLink icon={Briefcase} label="Deudas Proveedores" active={view === 'debts'} onClick={() => navigateTo('debts')} /><MenuLink icon={History} label="Historial Cajas" active={view === 'history'} onClick={() => navigateTo('history')} /><button onClick={handleFactoryReset} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-600 hover:bg-red-50 mt-4"><RefreshCw size={20} />Restablecer de Fábrica</button></>}</nav><div className="mt-auto border-t pt-4"><button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full py-2 text-red-500 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100">Cerrar Sesión</button></div></div></div>}

      <div className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3"><button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Menu size={24} /></button><h1 className="font-bold text-gray-800 text-lg">{view === 'pos' ? 'Punto de Venta' : view === 'products' ? 'Inventario' : view === 'shift' ? 'Caja' : 'Gestión'}</h1></div>
        <div className="flex items-center gap-3">
          <button onClick={handleReloadData} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><RefreshCw size={18}/></button>
          {userData.role === 'admin' && (
             <div className="relative"><button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-gray-100 relative"><Bell size={20} className={notifications.length > 0 ? "text-blue-600" : "text-gray-400"} />{notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}</button>
               {showNotifications && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in"><div className="bg-gray-50 p-3 border-b text-sm font-bold text-gray-700">Solicitudes</div><div className="max-h-64 overflow-y-auto">{notifications.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">Sin novedades</div> : notifications.map(req => (<div key={req.id} className="p-3 border-b hover:bg-gray-50"><div className="flex items-center gap-2 mb-1"><ShieldAlert size={14} className="text-orange-500" /><span className="font-bold text-sm text-gray-800">{req.requester}</span></div><p className="text-xs text-gray-600 mb-2">{req.description}</p><div className="flex gap-2"><button onClick={() => handleApproveRequest(req)} className="flex-1 bg-green-100 text-green-700 text-xs py-1 rounded">Aprobar</button><button onClick={() => handleDenyRequest(req.id)} className="flex-1 bg-red-100 text-red-700 text-xs py-1 rounded">Rechazar</button></div></div>))}</div></div>
               )}
             </div>
          )}
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{userData.name.split(' ')[0]}</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {view === 'pos' && <POSView products={products} cart={cart} setCart={setCart} onCheckout={handleCheckout} onSeed={seedDatabase} />}
        {view === 'products' && (
            <ProductManager 
                products={products} 
                user={userData} 
                onRequestAuth={requestAuthorization} 
                onGenerateRestock={() => {
                    // SEPARACIÓN DE LISTAS
                }}
                onGenerateLowStock={() => {
                     const list = products.filter(p => p.stock <= p.minStock); 
                     if(list.length) setRestockData({items: list, title: '📉 Lista de Reposición (Stock Bajo)'}); 
                     else alert("Stock OK. No hace falta reponer nada."); 
                }}
                onGenerateExpiry={() => {
                     const list = products.filter(p => p.expiry && getDaysUntilExpiry(p.expiry) <= 15);
                     if(list.length) setRestockData({items: list, title: '⚠️ Productos por Vencer (15 días)'});
                     else alert("No hay productos próximos a vencer.");
                }}
                onProductTransaction={handleProductTransaction} 
                onDeleteProduct={handleDeleteProduct} 
            />
        )}
        {view === 'shift' && <ShiftManager sales={sales} payments={payments} user={userData} shiftData={currentShiftData} onCloseShift={closeShift} onDeleteSale={handleDeleteSale} onOpenShift={handleManualOpenShift} />}
        {view === 'stats' && <StatsView sales={closedShifts.flatMap(s => s.sales).concat(sales)} />}
        {view === 'history' && <HistoryView closedShifts={closedShifts} setPrintData={setPrintData} />}
        {view === 'debts' && <SuppliersDebtsView debts={debts} />}
      </div>

      {(view === 'pos' || view === 'products') && (
        <div className="fixed bottom-24 right-4 z-30">
          {showQuickActions && (
            <div className="absolute bottom-16 right-0 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <button onClick={() => { setShowQuickActions(false); setIsSupplierModalOpen(true); }} className="w-full text-left px-4 py-4 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 border-b"><Truck size={18} className="text-red-500" /><div><span className="font-bold block text-gray-800">Pago Proveedor</span><span className="text-xs text-gray-400">Registrar egreso</span></div></button>
              <button onClick={() => { setShowQuickActions(false); navigateTo('products'); }} className="w-full text-left px-4 py-4 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"><Package size={18} className="text-green-500" /><div><span className="font-bold block text-gray-800">Cargar Producto</span><span className="text-xs text-gray-400">Ingreso mercadería</span></div></button>
            </div>
          )}
          <button onClick={() => setShowQuickActions(!showQuickActions)} className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform ${showQuickActions ? 'bg-gray-800 rotate-45' : 'bg-blue-600 hover:scale-105'}`}><Plus size={28} className="text-white" /></button>
        </div>
      )}

      {isSupplierModalOpen && <SupplierPaymentModal onClose={() => setIsSupplierModalOpen(false)} onSave={handleSupplierPayment} />}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around z-20 pb-safe">
        <NavButton active={view === 'pos'} onClick={() => navigateTo('pos')} icon={ShoppingCart} label="Venta" />
        <NavButton active={view === 'products'} onClick={() => navigateTo('products')} icon={Package} label="Productos" />
        <NavButton active={view === 'shift'} onClick={() => navigateTo('shift')} icon={FileText} label="Caja" />
      </div>
      
      <style>{`.pb-safe { padding-bottom: env(safe-area-inset-bottom); } .animate-in { animation: fadeIn 0.2s ease-out forwards; } @media print { @page { margin: 0; size: auto; } body { background: white; } .no-print { display: none !important; } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// --- SUB-COMPONENTES ---

const MenuLink = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}><Icon size={20} />{label}</button>;
const NavButton = ({ active, onClick, icon: Icon, label }) => <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Icon size={24} strokeWidth={active ? 2.5 : 2} /><span className="text-[10px] font-medium mt-1">{label}</span></button>;

// --- SHIFT START MODAL ---
const ShiftStartModal = ({ onStart, username, onCancel }) => {
  const [initialChange, setInitialChange] = useState('');
  const [supplierFund, setSupplierFund] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onStart({ initialChange: parseFloat(initialChange) || 0, supplierFund: parseFloat(supplierFund) || 0 }); };
  return (
    <Card className="w-full max-w-sm p-6 shadow-2xl animate-in">
        <div className="text-center mb-6"><h2 className="text-xl font-bold text-gray-800">Apertura de Caja</h2><p className="text-sm text-gray-500">Hola, {username}. Por favor declara tu caja inicial.</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Saldo Inicial Cambio</label><div className="relative"><DollarSign className="absolute left-3 top-3 text-green-500" size={18}/><input type="number" autoFocus value={initialChange} onChange={e=>setInitialChange(e.target.value)} className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" placeholder="0.00" required /></div></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Fondo Proveedores</label><div className="relative"><Truck className="absolute left-3 top-3 text-orange-500" size={18}/><input type="number" value={supplierFund} onChange={e=>setSupplierFund(e.target.value)} className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" placeholder="0.00" /></div></div>
            <div className="pt-2 flex gap-2"><Button variant="secondary" className="flex-1" onClick={onCancel}>Salir</Button><Button type="submit" className="flex-[2]">Abrir Caja</Button></div>
        </form>
    </Card>
  );
};

const ShiftManager = ({ sales, payments, user, shiftData, onCloseShift, onDeleteSale, onOpenShift }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const mySales = sales.filter(s => s.user === user.name && s.status === 'open');
  const myPayments = payments.filter(p => p.user === user.name && p.status === 'open');
  const totalSales = mySales.reduce((acc, curr) => acc + curr.total, 0);
  const totalPayments = myPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const cashSales = mySales.filter(s => s.method === 'Efectivo').reduce((acc, c) => acc + c.total, 0);
  const cardSales = mySales.filter(s => s.method === 'Tarjeta').reduce((acc, c) => acc + c.total, 0);
  const transfSales = mySales.filter(s => s.method === 'Transferencia').reduce((acc, c) => acc + c.total, 0);
  const initial = shiftData ? (shiftData.initialChange + shiftData.supplierFund) : 0;
  const cashInDrawer = initial + cashSales - totalPayments;

  if (!shiftData && user.role === 'admin') {
      return (
          <div className="pb-20 text-center py-10">
              <h2 className="text-2xl font-bold text-gray-400 mb-4">Caja Cerrada</h2>
              <p className="text-gray-500 mb-6">El modo administrador permite ver datos sin abrir caja.</p>
              <Button onClick={onOpenShift} className="mx-auto w-48">Abrir Caja Ahora</Button>
          </div>
      )
  }

  return (
    <div className="pb-20 space-y-6 animate-in">
        <Card className="bg-gray-900 text-white p-5">
            <div className="text-sm opacity-80 mb-1">Efectivo en Caja (Teórico)</div>
            <div className="text-4xl font-bold mb-4">${cashInDrawer.toLocaleString()}</div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-700 pt-4 text-center">
                <div><div className="text-[10px] text-gray-400">Inicio</div><div className="text-gray-200 font-bold">${initial}</div></div>
                <div><div className="text-[10px] text-gray-400">Ventas Efec.</div><div className="text-green-400 font-bold">+${cashSales}</div></div>
                <div><div className="text-[10px] text-gray-400">Salidas</div><div className="text-red-400 font-bold">-${totalPayments}</div></div>
            </div>
        </Card>
        
        <Card className="p-4"><h3 className="font-bold text-sm text-gray-500 mb-3 uppercase">Total Ventas: ${totalSales.toLocaleString()}</h3><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm">Efectivo</span><div className="text-right"><div className="font-bold">${cashSales}</div><div className="text-xs text-gray-400">Billetes</div></div></div><div className="flex justify-between items-center"><span className="text-sm">Tarjeta</span><div className="text-right"><div className="font-bold">${cardSales}</div><div className="text-xs text-gray-400">Posnet</div></div></div><div className="flex justify-between items-center"><span className="text-sm">Transferencia</span><div className="text-right"><div className="font-bold">${transfSales}</div><div className="text-xs text-gray-400">MP / QR</div></div></div></div></Card>
        
        <div className="flex bg-gray-200 p-1 rounded-lg"><button onClick={()=>setActiveTab('summary')} className={`flex-1 py-2 text-sm rounded ${activeTab==='summary'?'bg-white shadow':''}`}>Resumen</button><button onClick={()=>setActiveTab('sales')} className={`flex-1 py-2 text-sm rounded ${activeTab==='sales'?'bg-white shadow':''}`}>Ventas</button><button onClick={()=>setActiveTab('payments')} className={`flex-1 py-2 text-sm rounded ${activeTab==='payments'?'bg-white shadow':''}`}>Pagos</button></div>
        
        {activeTab === 'sales' && <div className="space-y-2">{mySales.length === 0 ? <div className="text-center text-gray-400 py-4">Sin ventas</div> : mySales.map(s => (<div key={s.id} className="bg-white p-3 rounded border flex justify-between items-center"><div><div className="font-bold text-sm">#{s.id.toString().slice(-4)} • ${s.total}</div><div className="text-xs text-gray-500">{new Date(s.date).toLocaleTimeString()} ({s.method})</div></div><button onClick={()=>onDeleteSale(s.id, s.items)} className="p-2 text-red-300 hover:text-red-500 bg-red-50 rounded"><Trash2 size={16}/></button></div>))}</div>}
        {activeTab === 'payments' && <div className="space-y-2">{myPayments.length === 0 ? <div className="text-center text-gray-400 py-4">Sin pagos</div> : myPayments.map(p => (<div key={p.id} className="bg-white p-3 rounded border flex justify-between items-center"><div><div className="font-bold text-sm text-red-600">-${p.amount}</div><div className="text-xs text-gray-500">{p.supplier}</div></div><div className="text-xs text-gray-400">{p.note}</div></div>))}</div>}
        
        {activeTab === 'summary' && <div className="space-y-3"><div className="text-xs text-gray-500 text-center italic">Al cerrar la caja, se generará el reporte y podrás reabrirla inmediatamente.</div><Button onClick={onCloseShift} variant="danger" className="w-full h-12 text-lg"><Printer className="mr-2"/> Cerrar Caja e Imprimir</Button></div>}
    </div>
  );
};

// --- PRODUCT MANAGER (UPDATED: FIXED REPO LOGIC) ---
const ProductManager = ({ products, user, onRequestAuth, onGenerateLowStock, onGenerateExpiry, onProductTransaction, onDeleteProduct }) => {
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Agregados campos: category, expiry
  const [formData, setFormData] = useState({ name: '', barcode: '', inputCost: '', packageSize: '1', batchQty: '', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: '', category: 'Varios', expiry: '' });
  const [calculations, setCalculations] = useState({ unitBase: 0, unitFinal: 0, finalStock: 0 });

  useEffect(() => {
    const costTotal = parseFloat(formData.inputCost) || 0;
    const unitsPerPack = parseFloat(formData.packageSize) || 1;
    const qtyPurchased = parseFloat(formData.batchQty) || 0; // Unidades sueltas compradas
    
    // 1. Cálculo de Costo Unitario
    // Lógica pedida: "costo dividido las cantidad de unidades que trae"
    // Interpretación: Input "Costo Nuevo" se refiere al precio del Bulto/Caja Cerrada.
    
    let unitBase = 0;
    // Si estamos en REPOSICIÓN
    if (modalMode === 'RESTOCK' && costTotal > 0) {
        // Costo del Bulto / Unidades del Bulto = Costo Unitario real
        unitBase = costTotal / unitsPerPack;
    } 
    // Si estamos en CREATE o EDIT (sin bulto)
    else if (qtyPurchased > 0) {
        // Asumimos costo total / unidades para inicial
        unitBase = costTotal / qtyPurchased;
    } else if (modalMode === 'EDIT_DETAILS' && editingId) {
        const p = products.find(p => p.id === editingId);
        unitBase = p ? (p.hasIva ? p.cost : p.cost / 1.21) : 0;
    }

    const unitFinal = formData.hasIva ? unitBase : unitBase * 1.21;
    
    // Stock Proyectado (Solo visual)
    let finalStock = formData.currentStock;
    if (modalMode === 'RESTOCK' && editingId) {
        // Se suma lo que compré
        finalStock = (products.find(p=>p.id===editingId)?.stock || 0) + qtyPurchased;
    } else if (modalMode === 'CREATE') {
        finalStock = qtyPurchased;
    }

    setCalculations({ unitBase, unitFinal, finalStock });
  }, [formData.inputCost, formData.batchQty, formData.packageSize, formData.currentStock, formData.hasIva, modalMode, editingId]);

  const handleInitialSave = () => {
      if (!formData.name) return alert("Nombre requerido");
      // Validación extra para reposición
      if (modalMode === 'RESTOCK' && (!formData.inputCost || !formData.batchQty || !formData.packageSize)) return alert("Complete los datos de reposición.");
      
      if (modalMode === 'EDIT_DETAILS') { processTransaction('NO_COST'); return; }
      setShowPaymentModal(true);
  }

  const processTransaction = (paymentStatus) => { 
    // Lógica "El Mayor Manda" (Inflación)
    let newCost = parseFloat(calculations.unitFinal.toFixed(2));
    
    // Si es reposición, comparamos con el costo anterior
    if (modalMode === 'RESTOCK' && editingId) {
        const currentProd = products.find(p => p.id === editingId);
        if (currentProd) {
            const oldCost = Number(currentProd.cost);
            // Si el nuevo costo es menor, nos quedamos con el viejo (el mayor).
            if (newCost < oldCost) {
                newCost = oldCost;
            }
        }
    }

    const sellingPrice = Math.ceil(newCost * (1 + (formData.margin / 100)));
    const addedStock = parseFloat(formData.batchQty) || 0;
    const totalCost = parseFloat(formData.inputCost) || 0; // Este es el costo del bulto que pagué (si compré 1 bulto)
    
    const productData = { 
        isRestock: modalMode === 'RESTOCK', 
        productId: editingId, 
        addedStock, 
        newCost, 
        newPrice: sellingPrice, 
        productName: formData.name, 
        supplierName: formData.supplier,
        category: formData.category, 
        expiry: formData.expiry,
        fullObject: { 
            id: editingId || Date.now().toString(), 
            name: formData.name, 
            barcode: formData.barcode, 
            stock: modalMode === 'CREATE' ? addedStock : Number(formData.currentStock), 
            minStock: parseInt(formData.minStock) || 5, 
            cost: newCost, 
            price: sellingPrice, 
            hasIva: formData.hasIva, 
            margin: parseFloat(formData.margin),
            category: formData.category,
            expiry: formData.expiry
        } 
    };
    const financialData = { totalCost: paymentStatus === 'NO_COST' ? 0 : totalCost, paymentStatus };
    
    if (user.role !== 'admin') onRequestAuth('PRODUCT_TRANSACTION', { productData, financialData }, `Solicita ${modalMode === 'RESTOCK' ? 'ingreso' : 'edición'}: ${formData.name}`);
    else onProductTransaction(productData, financialData);
    
    setShowPaymentModal(false); 
    setIsFormOpen(false); 
    setFormData({ name: '', barcode: '', inputCost: '', packageSize: '1', batchQty: '', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: '', category: 'Varios', expiry: '' }); 
    setCalculations({ unitBase: 0, unitFinal: 0, finalStock: 0 });
  };

  const startCreate = () => { setEditingId(null); setModalMode('CREATE'); setFormData({ name: '', barcode: '', inputCost: '', batchQty: '', packageSize: '1', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: '', category: 'Varios', expiry: '' }); setIsFormOpen(true); };
  
  const startEditDetails = (p) => { 
    setEditingId(p.id); 
    setModalMode('EDIT_DETAILS'); 
    setFormData({ 
        name: p.name, 
        barcode: p.barcode || '', 
        inputCost: '', 
        batchQty: '', 
        packageSize: '1',
        currentStock: p.stock, 
        minStock: p.minStock || 5, 
        hasIva: p.hasIva, 
        margin: p.margin || 50, 
        supplier: '', 
        category: p.category || 'Varios', 
        expiry: p.expiry || '' 
    }); 
    setIsFormOpen(true); 
  };
  
  const startRestock = (p) => { 
    setEditingId(p.id); 
    setModalMode('RESTOCK'); 
    setFormData({ 
        name: p.name, 
        barcode: p.barcode, 
        inputCost: '', // Costo Bulto
        packageSize: '1', // Unidades Bulto
        batchQty: '', // Cantidad Comprada
        currentStock: p.stock, 
        minStock: p.minStock, 
        hasIva: p.hasIva, 
        margin: p.margin || 50, 
        supplier: '', 
        category: p.category || 'Varios', 
        expiry: p.expiry || '' 
    }); 
    setIsFormOpen(true); 
  }

  return (
    <div className="pb-20 animate-in">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
          <div className="flex gap-2">
            <Button onClick={onGenerateExpiry} variant="warning" icon={AlertTriangle}>Vencimientos</Button>
            <Button onClick={onGenerateLowStock} variant="secondary" icon={ClipboardList}>Faltantes</Button>
            <Button variant="primary" onClick={startCreate} icon={Plus}>Nuevo</Button>
          </div>
      </div>
      {isFormOpen ? (
        <Card className="p-4 relative z-10">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{modalMode === 'RESTOCK' ? 'Reponer Stock' : (modalMode === 'CREATE' ? 'Nuevo Producto' : 'Editar Detalles')}</h3><button onClick={() => setIsFormOpen(false)}><X size={20} /></button></div>
          <div className="space-y-4">
            {modalMode !== 'RESTOCK' && <><input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre" /><div className="flex gap-2"><input className="w-full p-2 border rounded bg-gray-50" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Código Barras" /><Scan className="text-gray-400 mt-2"/></div></>}
            
            {/* Categoría y Vencimiento */}
            <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs font-bold text-gray-500">Categoría</label><select className="w-full p-2 border rounded bg-white" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}><option>Varios</option><option>Bebidas</option><option>Golosinas</option><option>Almacén</option><option>Cigarrillos</option><option>Limpieza</option><option>Lácteos</option></select></div>
                <div className="flex-1"><label className="text-xs font-bold text-gray-500">Vencimiento</label><input type="date" className="w-full p-2 border rounded" value={formData.expiry} onChange={e=>setFormData({...formData, expiry:e.target.value})} /></div>
            </div>

            {/* Stock Actual visible solo para referencia */}
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between">
                 <span className="text-sm text-blue-800 font-bold">Stock Actual:</span>
                 <span className="text-sm text-blue-600 font-bold">{formData.currentStock} u.</span>
             </div>
             
             {modalMode !== 'RESTOCK' && (
                <div className="flex-1"><label className="text-xs text-red-500">Mínimo</label><input type="number" className="w-full p-1 text-right rounded border-red-200" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)||0})}/></div>
             )}

            <hr className="border-gray-100"/>

            {/* FORMULARIO DE REPOSICIÓN / COSTOS */}
            <div>
              <div className="flex items-center gap-2 mb-2"><Calculator size={16} className="text-blue-500"/><span className="text-sm font-bold text-blue-900 uppercase">{modalMode === 'RESTOCK' ? 'Datos de Reposición' : 'Datos Iniciales'}</span></div>
              
              <input className="w-full p-2 border rounded mb-2" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Proveedor (Opcional)" />
              
              <div className="grid grid-cols-2 gap-2">
                 <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{modalMode === 'RESTOCK' ? 'Costo del Bulto/Pack' : 'Costo Total'}</label>
                  <input type="number" className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.inputCost} onChange={e => setFormData({...formData, inputCost: e.target.value})} placeholder="$0.00" autoFocus={modalMode === 'RESTOCK'} />
                </div>
                 {modalMode === 'RESTOCK' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unidades del Bulto</label>
                      <input type="number" className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.packageSize} onChange={e => setFormData({...formData, packageSize: e.target.value})} placeholder="1" />
                    </div>
                 )}
              </div>
              
              <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{modalMode === 'RESTOCK' ? 'Cantidad a Agregar (Sueltas)' : 'Stock Inicial'}</label>
                  <input type="number" className="w-full p-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg" value={formData.batchQty} onChange={e => setFormData({...formData, batchQty: e.target.value})} placeholder="0" />
              </div>

              <div className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={formData.hasIva} onChange={e => setFormData({...formData, hasIva: e.target.checked})} /> Costo incluye IVA</div>
            </div>

            {/* Resultados Cálculos */}
            <div className="bg-blue-50 p-2 rounded text-center grid grid-cols-2 gap-2 mt-2">
                <div><div className="text-[10px] font-bold text-blue-600">Costo Unit. Nuevo</div><div className="font-bold">${calculations.unitFinal.toFixed(2)}</div></div>
                <div><div className="text-[10px] font-bold text-green-600">Stock Final</div><div className="font-bold">{calculations.finalStock}</div></div>
                {modalMode === 'RESTOCK' && calculations.unitFinal < (products.find(p=>p.id===editingId)?.cost||0) && (
                    <div className="col-span-2 text-[10px] text-amber-600 bg-amber-50 p-1 rounded">⚠️ Nuevo costo es menor. Se mantiene el anterior (${products.find(p=>p.id===editingId)?.cost}).</div>
                )}
            </div>

            {/* Precio Venta */}
            <div className="grid grid-cols-2 gap-2 border-t pt-2"><div><label className="text-xs">Margen %</label><input type="number" className="w-full p-1 border rounded" value={formData.margin} onChange={e => setFormData({...formData, margin: e.target.value})} /></div><div><label className="text-xs">Precio Venta</label><div className="w-full p-1 bg-green-100 font-bold text-center rounded">${Math.ceil((modalMode === 'RESTOCK' ? Math.max(calculations.unitFinal, (products.find(p=>p.id===editingId)?.cost||0)) : calculations.unitFinal) * (1 + (formData.margin / 100)))}</div></div></div>
            <Button className="w-full mt-2" onClick={handleInitialSave}>{modalMode === 'RESTOCK' ? 'Confirmar Reposición' : 'Guardar'}</Button>
          </div>
          {showPaymentModal && <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-4 rounded"><h3 className="font-bold mb-4">¿Estado del Pago?</h3><div className="space-y-3 w-full"><button onClick={() => processTransaction('PAID')} className="w-full p-3 border-green-500 border bg-green-50 rounded font-bold text-green-700">Se Pagó (Caja)</button><button onClick={() => processTransaction('OWED')} className="w-full p-3 border-red-500 border bg-red-50 rounded font-bold text-red-700">Se Debe (Cta. Cte.)</button></div><button onClick={() => setShowPaymentModal(false)} className="mt-4 text-gray-400">Cancelar</button></div>}
        </Card>
      ) : (
        <div className="space-y-2">{products.map(p => {
             const daysToExpiry = getDaysUntilExpiry(p.expiry);
             const isExpired = daysToExpiry !== null && daysToExpiry < 0;
             const isNearExpiry = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 15;
             return (
              <Card key={p.id} className={`p-3 flex justify-between ${p.stock<=p.minStock ? 'border-l-4 border-l-red-500' : ''} ${isExpired ? 'bg-red-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2"><div className="font-bold">{p.name}</div>{p.category && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{p.category}</span>}</div>
                  <div className="flex items-center gap-2 mt-1"><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>Stock: {p.stock}</span><span className="text-xs text-gray-400">Costo: ${p.cost}</span></div>
                  {(isExpired || isNearExpiry) && (<div className={`text-xs flex items-center gap-1 mt-1 font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}><AlertTriangle size={12}/> {isExpired ? 'VENCIDO' : `Vence en ${daysToExpiry} días`} ({p.expiry})</div>)}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="font-bold text-lg text-green-600">${p.price}</div>
                  <div className="flex gap-2">
                    <button onClick={()=>startRestock(p)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs flex gap-1"><PackagePlus size={12}/> +Stock</button>
                    <button onClick={()=>startEditDetails(p)} className="text-gray-400 p-1"><Edit size={14}/></button>
                    {user.role === 'admin' && <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-200"><Trash2 size={14}/></button>}
                  </div>
                </div>
              </Card>
             );
          })}</div>
      )}
    </div>
  );
};

const POSView = ({ products, cart, setCart, onCheckout, onSeed }) => {
  const [term, setTerm] = useState(''); const [selected, setSelected] = useState(null); const [qty, setQty] = useState(1); const [checkoutOpen, setCheckoutOpen] = useState(false); const [paymentAmount, setPaymentAmount] = useState('');
  const handleScan = (e) => { if (e.key === 'Enter' && term) { const p = products.find(i => i.barcode === term); if (p) { addToCart(p, 1); setTerm(''); } } };
  const filtered = useMemo(() => term ? products.filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || p.barcode?.includes(term)) : products, [term, products]);
  const addToCart = (p, q) => { const ex = cart.find(i => i.id === p.id); setCart(ex ? cart.map(i => i.id === p.id ? { ...i, qty: i.qty + q } : i) : [...cart, { ...p, qty: q }]); setSelected(null); setQty(1); };
  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const change = paymentAmount ? (parseFloat(paymentAmount) - total) : 0;
  
  if (products.length === 0) return <div className="flex flex-col items-center justify-center h-64 text-center p-4"><Database className="w-12 h-12 text-gray-300 mb-4"/><p className="text-gray-500 mb-4">Base de datos vacía.</p><Button onClick={onSeed}>Inicializar Base de Datos</Button></div>;

  return (
    <div className="pb-24 space-y-4">
      {cart.length > 0 && <Card className="bg-blue-900 text-white p-4 flex justify-between items-center sticky top-20 z-10 shadow-lg"><div><div className="text-xs text-blue-200">Total a Pagar</div><div className="text-3xl font-bold">${total.toLocaleString()}</div></div><Button variant="success" onClick={()=>setCheckoutOpen(true)} className="px-6 py-3">Cobrar</Button></Card>}
      <div className="bg-white rounded-xl border p-3 shadow-sm sticky top-0 z-20"><div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="🔍 Buscar o Escanear..." value={term} onChange={e => setTerm(e.target.value)} onKeyDown={handleScan} autoFocus /></div></div>
      <div className="grid grid-cols-1 gap-2">{filtered.map(p => (<div key={p.id} onClick={()=>setSelected(p)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer"><div><div className="font-bold text-gray-800 text-lg">{p.name}</div><div className="flex items-center gap-2 mt-1"><span className={`text-xs px-2 py-0.5 rounded font-bold ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>Stock: {p.stock}</span>{p.barcode && <span className="text-xs text-gray-400 flex items-center gap-1"><Scan size={10}/> {p.barcode}</span>}</div></div><div className="text-right"><div className="text-xl font-bold text-blue-600">${p.price}</div></div></div>))}</div>
      {selected && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in"><h3 className="font-bold text-xl mb-1 text-gray-800">{selected.name}</h3><p className="text-gray-500 mb-6">${selected.price} x unidad</p><div className="flex items-center justify-between bg-gray-100 rounded-xl p-2 mb-6"><button onClick={()=>setQty(Math.max(1, qty-1))} className="w-12 h-12 bg-white rounded-lg shadow font-bold text-2xl text-gray-600 active:bg-gray-200"><Minus size={20}/></button><input type="number" className="bg-transparent text-center text-3xl font-bold w-20 outline-none" value={qty} onChange={e=>setQty(parseFloat(e.target.value))} /><button onClick={()=>setQty(qty+1)} className="w-12 h-12 bg-blue-600 rounded-lg shadow font-bold text-2xl text-white active:bg-blue-700"><Plus size={20}/></button></div><div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={()=>setSelected(null)}>Cancelar</Button><Button onClick={()=>addToCart(selected, qty)}>Agregar</Button></div></div></div>}
      {cart.length > 0 && <div className="mt-8 border-t pt-4"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-500 uppercase text-sm">Ticket Actual ({cart.length})</h3><button onClick={()=>setCart([])} className="text-red-500 text-xs font-bold">Vaciar</button></div><div className="space-y-2">{cart.map(item => (<div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="bg-blue-50 text-blue-700 font-bold w-8 h-8 flex items-center justify-center rounded">{item.qty}</div><div><div className="font-bold text-sm text-gray-800">{item.name}</div><div className="text-xs text-gray-500">${item.price * item.qty} total</div></div></div><button onClick={()=>removeFromCart(item.id)} className="text-red-300 hover:text-red-500 p-2"><Trash2 size={18}/></button></div>))}</div></div>}
      {checkoutOpen && <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl">Confirmar Venta</h3><button onClick={()=>setCheckoutOpen(false)}><X size={24} className="text-gray-400"/></button></div><div className="bg-gray-50 p-4 rounded-xl mb-4 text-center"><div className="text-sm text-gray-500">Total a Cobrar</div><div className="text-4xl font-bold text-gray-800">${total.toLocaleString()}</div></div><div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Calculadora de Vuelto</label><div className="flex gap-2 mb-2"><input type="number" placeholder="Paga con..." className="flex-1 p-3 border rounded-lg font-bold text-lg" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} /></div>{paymentAmount && (<div className={`p-2 rounded-lg text-center font-bold ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{change >= 0 ? `Vuelto: $${change.toLocaleString()}` : `Faltan: $${Math.abs(change).toLocaleString()}`}</div>)}</div><div className="space-y-3"><button onClick={()=>{onCheckout(total,cart,'Efectivo');setCheckoutOpen(false)}} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-green-50 font-bold text-green-700 bg-green-50/50"><Banknote size={24}/> Efectivo</button><button onClick={()=>{onCheckout(total,cart,'Tarjeta');setCheckoutOpen(false)}} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-blue-50 font-bold text-blue-700 bg-blue-50/50"><CreditCard size={24}/> Tarjeta</button><button onClick={()=>{onCheckout(total,cart,'Transferencia');setCheckoutOpen(false)}} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-purple-50 font-bold text-purple-700 bg-purple-50/50"><QrCode size={24}/> Mercado Pago</button></div></div></div>}
    </div>
  );
};

const SuppliersDebtsView = ({ debts }) => {
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const debtsBySupplier = useMemo(() => {
    const grouped = {};
    debts.forEach(d => { if (!grouped[d.supplier]) grouped[d.supplier] = { name: d.supplier, total: 0, items: [] }; grouped[d.supplier].total += d.amount; grouped[d.supplier].items.push(d); });
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [debts]);
  return <div className="pb-20 space-y-4 animate-in"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Briefcase className="text-red-500" /> Cuentas Corrientes Proveedores</h2>{debtsBySupplier.length > 0 ? debtsBySupplier.map((sup, idx) => ( <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden"><div onClick={() => setExpandedSupplier(expandedSupplier === sup.name ? null : sup.name)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"><div className="flex items-center gap-3"><div className="bg-red-50 p-2 rounded-lg text-red-500 font-bold">{sup.items.length}</div><div><div className="font-bold">{sup.name}</div><div className="text-xs text-gray-500">Click para detalle</div></div></div><div className="text-right"><div className="text-xs text-gray-400 font-bold">Saldo</div><div className="text-xl font-bold text-red-600">${sup.total.toLocaleString()}</div></div></div>{expandedSupplier === sup.name && <div className="bg-gray-50 p-3 border-t"><table className="w-full text-sm"><tbody>{sup.items.map(i => <tr key={i.id} className="border-b last:border-0"><td className="py-2 text-xs text-gray-500">{new Date(i.date).toLocaleDateString()}</td><td className="py-2 font-medium">{i.productName} ({i.qty})</td><td className="py-2 text-right font-bold">${i.amount}</td></tr>)}</tbody></table></div>}</div> )) : <div className="text-center py-10 text-gray-400">Sin deudas registradas</div>}</div>;
};

const StatsView = ({ sales }) => {
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    return <div className="space-y-4"><Card className="bg-purple-600 text-white p-6"><h2 className="text-2xl font-bold">Ventas Mes</h2><p className="text-4xl font-bold mt-2">${totalRevenue.toLocaleString()}</p></Card><div className="text-center text-gray-500 py-10">Ranking detallado disponible en versión de escritorio</div></div>;
};

const HistoryView = ({ closedShifts, setPrintData }) => <div className="space-y-2 pb-20"><h2 className="font-bold mb-4">Cajas Cerradas</h2>{closedShifts.map(s => <Card key={s.id} className="p-4 flex justify-between"><div><div className="font-bold text-gray-800">{new Date(s.date).toLocaleDateString()}</div><div className="text-xs text-gray-500">{s.cashier}</div></div><div className="text-right"><div className="font-bold text-green-600">${s.totals.revenue}</div><Button onClick={()=>setPrintData(s)} className="text-xs py-1 px-2 h-auto mt-1">Ver PDF</Button></div></Card>)}</div>;
const SupplierPaymentModal = ({ onClose, onSave }) => { const [a, setA] = useState(''); const [s, setS] = useState(''); const [n, setN] = useState(''); return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded w-full max-w-sm space-y-4"><h3 className="font-bold">Pago Proveedor</h3><input placeholder="Monto" type="number" className="w-full border p-2 rounded" onChange={e=>setA(e.target.value)}/><input placeholder="Proveedor" className="w-full border p-2 rounded" onChange={e=>setS(e.target.value)}/><input placeholder="Nota" className="w-full border p-2 rounded" onChange={e=>setN(e.target.value)}/><div className="flex gap-2"><Button onClick={onClose} variant="secondary" className="flex-1">Cancelar</Button><Button onClick={()=>onSave(a,s,n)} variant="danger" className="flex-1">Registrar</Button></div></div></div> };
const PrintableReport = ({ data, onClose }) => { useEffect(()=>{setTimeout(()=>window.print(),500)},[]); return <div className="bg-white h-screen p-8 text-black"><Button onClick={onClose} className="no-print mb-4">Cerrar</Button><h1 className="text-2xl font-bold">Reporte Caja</h1><pre className="mt-4">{JSON.stringify(data.totals, null, 2)}</pre></div> };
const RestockList = ({ data, onClose }) => { useEffect(()=>{setTimeout(()=>window.print(),500)},[]); return <div className="bg-white h-screen p-8 text-black"><Button onClick={onClose} className="no-print mb-4">Cerrar</Button><h1 className="text-2xl font-bold">Lista Reposición</h1><ul className="mt-4 space-y-2">{data.map(p=><li key={p.id} className="border-b py-2 flex justify-between"><span>{p.name}</span><span className="font-bold text-red-600">Stock: {p.stock}</span></li>)}</ul></div> };
