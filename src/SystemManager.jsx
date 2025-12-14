import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, ShoppingCart, Package, DollarSign, User, LogOut, 
  Trash2, Edit, X, TrendingUp, Truck, FileText, Scale, Hash, 
  CreditCard, QrCode, Banknote, ArrowUpCircle, ArrowDownCircle, 
  Calculator, Menu, BarChart2, AlertTriangle, ShieldAlert, Bell,
  History, Printer, Scan, ClipboardList, PackagePlus, Briefcase, Calendar, CheckCircle, Database, Lock, Minus
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
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
  setDoc
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

// ID del Kiosco para la base de datos
const STORE_ID = 'mi-kiosco-principal';

// --- Componentes UI Básicos ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", icon: Icon, disabled = false }) => {
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
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

const USERS = [
  { id: 1, name: 'Dueño (Admin)', role: 'admin' },
  { id: 2, name: 'Empleado Mañana', role: 'user' },
  { id: 3, name: 'Empleado Tarde', role: 'user' },
];

// --- App Principal ---

export default function KioscoSystem() {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [view, setView] = useState('login'); 
  
  // Estados de Datos
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]); 
  const [debts, setDebts] = useState([]); 
  const [closedShifts, setClosedShifts] = useState([]); 
  const [notifications, setNotifications] = useState([]); 

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

  // 1. Autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
        setDbError("No se pudo conectar con el servicio de autenticación.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sincronización de Datos
  useEffect(() => {
    if (!firebaseUser) return;

    const getPath = (col) => collection(db, 'tiendas', STORE_ID, col);
    
    const handleSnapshotError = (err) => {
        console.error("Firestore Snapshot Error:", err);
        if (err.code === 'permission-denied') {
            setDbError("PERMISOS DENEGADOS: Ve a Firebase Console -> Firestore -> Reglas y configúralas a 'allow read, write: if true;'");
        } else {
            // Ignorar errores menores de conexión temporal
            console.warn(`Error de base de datos: ${err.message}`);
        }
    };

    const unsubProducts = onSnapshot(getPath('products'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
          const d = doc.data();
          // Forzar tipos numéricos para evitar errores de cálculo
          return { 
              id: doc.id, 
              ...d, 
              stock: Number(d.stock || 0), 
              minStock: Number(d.minStock || 0),
              cost: Number(d.cost || 0),
              price: Number(d.price || 0)
          };
      });
      setProducts(data);
    }, handleSnapshotError);

    const unsubSales = onSnapshot(getPath('sales'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, handleSnapshotError);

    const unsubPayments = onSnapshot(getPath('payments'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, handleSnapshotError);

    const unsubDebts = onSnapshot(getPath('debts'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, handleSnapshotError);

    const unsubShifts = onSnapshot(getPath('shifts'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClosedShifts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, handleSnapshotError);

    const unsubNotifs = onSnapshot(getPath('notifications'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, handleSnapshotError);

    return () => {
      unsubProducts(); unsubSales(); unsubPayments(); unsubDebts(); unsubShifts(); unsubNotifs();
    };
  }, [firebaseUser]);

  // --- ACTIONS ---

  const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);
        const demoProducts = [
            { name: 'Coca Cola 500ml', barcode: '7790895000997', stock: 24, minStock: 10, cost: 800, price: 1500, hasIva: true, margin: 50 },
            { name: 'Alfajor Jorgito', barcode: '7791234567890', stock: 5, minStock: 10, cost: 400, price: 800, hasIva: true, margin: 100 },
        ];
        demoProducts.forEach(p => {
            const ref = doc(collection(db, 'tiendas', STORE_ID, 'products'));
            batch.set(ref, p);
        });
        await batch.commit();
        alert("Productos de ejemplo cargados. Ya puedes vender.");
    } catch (e) {
        console.error(e);
        alert("Error al cargar ejemplos: " + e.message);
    }
  };

  const handleProductTransaction = async (productData, financialData) => {
    const { isRestock, productId, addedStock, supplierName } = productData;
    const { totalCost, paymentStatus } = financialData; 

    try {
      const batch = writeBatch(db);

      if (isRestock) {
        const productRef = doc(db, 'tiendas', STORE_ID, 'products', productId);
        const currentProd = products.find(p => p.id === productId);
        
        if (currentProd) {
            // CORRECCIÓN: Usar set con merge: true evita el error "No document to update"
            // si el documento no existe por alguna razón (ej: borrado externo).
            batch.set(productRef, {
                stock: Number(currentProd.stock) + Number(addedStock),
                cost: Number(productData.newCost),
                price: Number(productData.newPrice)
            }, { merge: true });
        } else {
            alert("El producto no se encuentra en la base de datos.");
            return;
        }
      } else {
        if (productId) {
             const productRef = doc(db, 'tiendas', STORE_ID, 'products', productId);
             batch.set(productRef, productData.fullObject, { merge: true });
        } else {
             const newProductRef = doc(collection(db, 'tiendas', STORE_ID, 'products'));
             batch.set(newProductRef, productData.fullObject);
        }
      }

      if (totalCost > 0) {
        if (paymentStatus === 'PAID') {
            const paymentRef = doc(collection(db, 'tiendas', STORE_ID, 'payments'));
            batch.set(paymentRef, {
                date: new Date().toISOString(),
                amount: totalCost,
                supplier: supplierName || 'Proveedor General',
                note: isRestock ? `Reposición: ${productData.productName}` : `Carga Inicial: ${productData.productName}`,
                user: appUser.name,
                status: 'open' 
            });
        } else {
            const debtRef = doc(collection(db, 'tiendas', STORE_ID, 'debts'));
            batch.set(debtRef, {
                date: new Date().toISOString(),
                amount: totalCost,
                supplier: supplierName || 'Sin Proveedor',
                productName: productData.productName,
                qty: addedStock,
                user: appUser.name,
                status: 'PENDING'
            });
        }
      }

      await batch.commit();
    } catch (e) {
      console.error("Error transaction:", e);
      alert("Error al guardar: " + e.message);
    }
  };

  const handleCheckout = async (total, items, method) => {
    try {
        const batch = writeBatch(db);
        const saleRef = doc(collection(db, 'tiendas', STORE_ID, 'sales'));
        batch.set(saleRef, {
            date: new Date().toISOString(),
            total,
            items,
            method,
            user: appUser.name,
            status: 'open'
        });

        items.forEach(item => {
            const prodRef = doc(db, 'tiendas', STORE_ID, 'products', item.id);
            const currentProd = products.find(p => p.id === item.id);
            if (currentProd) {
                const newStock = Number(currentProd.stock) - Number(item.qty);
                // Usamos set con merge para evitar fallos si el doc desapareció
                batch.set(prodRef, { stock: newStock }, { merge: true });
            }
        });

        await batch.commit();
        setCart([]);
    } catch (e) {
        console.error("Error checkout:", e);
        alert("Error al procesar la venta: " + e.message);
    }
  };

  const requestAuthorization = async (type, payload, description) => {
    try {
        await addDoc(collection(db, 'tiendas', STORE_ID, 'notifications'), {
            type, payload, description,
            requester: appUser.name,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        alert("⛔ Solicitud enviada al dueño.");
    } catch (e) { console.error(e); }
  };

  const handleApproveRequest = async (req) => {
    try {
        const batch = writeBatch(db);
        
        if (req.type === 'DELETE_SALE') {
            const saleId = req.payload.saleId;
            const saleToDelete = sales.find(s => s.id === saleId);
            const saleRef = doc(db, 'tiendas', STORE_ID, 'sales', saleId);
            batch.delete(saleRef);

            if (saleToDelete && saleToDelete.items) {
                saleToDelete.items.forEach(item => {
                    const prodRef = doc(db, 'tiendas', STORE_ID, 'products', item.id);
                    const currentProd = products.find(p => p.id === item.id);
                    if (currentProd) {
                        batch.set(prodRef, { stock: Number(currentProd.stock) + Number(item.qty) }, { merge: true });
                    }
                });
            }
        } else if (req.type === 'PRODUCT_TRANSACTION') {
            await handleProductTransaction(req.payload.productData, req.payload.financialData);
        }

        const notifRef = doc(db, 'tiendas', STORE_ID, 'notifications', req.id);
        batch.delete(notifRef);

        await batch.commit();
        setShowNotifications(false);
    } catch (e) { console.error(e); }
  };

  const handleDenyRequest = async (id) => {
      await deleteDoc(doc(db, 'tiendas', STORE_ID, 'notifications', id));
  };

  const closeShift = async () => {
    const myOpenSales = sales.filter(s => s.user === appUser.name && s.status === 'open');
    const myOpenPayments = payments.filter(p => p.user === appUser.name && p.status === 'open');
    
    if (myOpenSales.length === 0 && myOpenPayments.length === 0) {
        alert("No hay movimientos para cerrar.");
        return;
    }

    const report = {
      date: new Date().toISOString(),
      cashier: appUser.name,
      sales: myOpenSales, 
      payments: myOpenPayments,
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
    } catch (e) {
        console.error("Error closing shift:", e);
        alert("Error al cerrar caja: " + e.message);
    }
  };

  const navigateTo = (newView) => { setView(newView); setIsMenuOpen(false); };

  // --- PANTALLA DE ERROR DE PERMISOS ---
  if (dbError) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
              <Card className="w-full max-w-lg p-8 text-center border-red-100 shadow-xl">
                  <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600"><Lock size={40} /></div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Base de Datos Bloqueada</h1>
                  <p className="text-gray-600 mb-6">{dbError}</p>
                  <Button onClick={() => window.location.reload()} className="w-full">Recargar Aplicación</Button>
              </Card>
          </div>
      );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Conectando con la nube...</div>;

  if (printData) return <PrintableReport data={printData} onClose={() => { setPrintData(null); setAppUser(null); setView('login'); }} />;
  if (restockData) return <RestockList data={restockData} onClose={() => setRestockData(null)} />;

  if (!appUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><Database size={32} /></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kiosco Cloud</h1>
          <p className="text-gray-500 mb-6">Sistema de Gestión Online</p>
          <div className="space-y-3">
            {USERS.map(u => (
              <button key={u.id} onClick={() => { setAppUser(u); setView('pos'); }} className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 transition-colors flex justify-between items-center group">
                <span className="font-medium text-gray-700 group-hover:text-blue-700">{u.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded group-hover:bg-blue-200 group-hover:text-blue-800">{u.role === 'admin' ? 'Dueño' : 'Cajero'}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0 relative overflow-x-hidden">
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in">
          <div className="bg-black/50 absolute inset-0 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="bg-white w-72 h-full relative z-10 shadow-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b">
              <div className="bg-blue-600 text-white p-2 rounded-lg"><DollarSign size={20} /></div>
              <div><h2 className="font-bold text-xl">Kiosco</h2><p className="text-xs text-gray-500">Cloud System</p></div>
            </div>
            <nav className="flex-1 space-y-2">
              <MenuLink icon={ShoppingCart} label="Punto de Venta" active={view === 'pos'} onClick={() => navigateTo('pos')} />
              <MenuLink icon={Package} label="Productos / Stock" active={view === 'products'} onClick={() => navigateTo('products')} />
              <MenuLink icon={FileText} label="Cierre de Caja" active={view === 'shift'} onClick={() => navigateTo('shift')} />
              <MenuLink icon={BarChart2} label="Estadísticas" active={view === 'stats'} onClick={() => navigateTo('stats')} />
              {appUser.role === 'admin' && (
                <>
                  <div className="my-4 border-t pt-4 text-xs font-bold text-gray-400 uppercase">Admin</div>
                  <MenuLink icon={Briefcase} label="Deudas Proveedores" active={view === 'debts'} onClick={() => navigateTo('debts')} />
                  <MenuLink icon={History} label="Historial Cajas" active={view === 'history'} onClick={() => navigateTo('history')} />
                </>
              )}
            </nav>
            <div className="mt-auto border-t pt-4"><button onClick={() => { setAppUser(null); setIsMenuOpen(false); }} className="w-full py-2 text-red-500 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100">Cerrar Turno</button></div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Menu size={24} /></button>
          <h1 className="font-bold text-gray-800 text-lg">{view === 'pos' ? 'Venta' : view === 'products' ? 'Inventario' : view === 'shift' ? 'Caja' : 'Gestión'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {appUser.role === 'admin' && (
             <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-gray-100 relative">
                 <Bell size={20} className={notifications.length > 0 ? "text-blue-600" : "text-gray-400"} />
                 {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
               </button>
               {showNotifications && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in">
                   <div className="bg-gray-50 p-3 border-b text-sm font-bold text-gray-700">Solicitudes</div>
                   <div className="max-h-64 overflow-y-auto">
                     {notifications.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">Sin novedades</div> : notifications.map(req => (
                         <div key={req.id} className="p-3 border-b hover:bg-gray-50">
                           <div className="flex items-center gap-2 mb-1"><ShieldAlert size={14} className="text-orange-500" /><span className="font-bold text-sm text-gray-800">{req.requester}</span></div>
                           <p className="text-xs text-gray-600 mb-2">{req.description}</p>
                           <div className="flex gap-2"><button onClick={() => handleApproveRequest(req)} className="flex-1 bg-green-100 text-green-700 text-xs py-1 rounded">Aprobar</button><button onClick={() => handleDenyRequest(req.id)} className="flex-1 bg-red-100 text-red-700 text-xs py-1 rounded">Rechazar</button></div>
                         </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
          )}
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{appUser.name.split(' ')[0]}</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {view === 'pos' && <POSView products={products} cart={cart} setCart={setCart} onCheckout={handleCheckout} onSeed={seedDatabase} />}
        {view === 'products' && <ProductManager products={products} user={appUser} onRequestAuth={requestAuthorization} onGenerateRestock={() => { const list = products.filter(p=>p.stock<=p.minStock); if(list.length) setRestockData(list); else alert("Stock OK"); }} onProductTransaction={handleProductTransaction} />}
        {view === 'shift' && <ShiftManager sales={sales} payments={payments} user={appUser} onCloseShift={closeShift} onDeleteSale={(id) => requestAuthorization('DELETE_SALE', {saleId: id}, 'Eliminar venta')} />}
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

// --- SUB-COMPONENTES Y VISTAS ---

const MenuLink = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}><Icon size={20} />{label}</button>;
const NavButton = ({ active, onClick, icon: Icon, label }) => <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Icon size={24} strokeWidth={active ? 2.5 : 2} /><span className="text-[10px] font-medium mt-1">{label}</span></button>;

// --- POS VIEW MEJORADA Y PROFESIONAL ---
const POSView = ({ products, cart, setCart, onCheckout, onSeed }) => {
  const [term, setTerm] = useState(''); 
  const [selected, setSelected] = useState(null); 
  const [qty, setQty] = useState(1); 
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  // Estados para calculadora de vuelto
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const handleScan = (e) => { if (e.key === 'Enter' && term) { const p = products.find(i => i.barcode === term); if (p) { addToCart(p, 1); setTerm(''); } } };
  const filtered = useMemo(() => term ? products.filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || p.barcode?.includes(term)) : products, [term, products]);
  const addToCart = (p, q) => { const ex = cart.find(i => i.id === p.id); setCart(ex ? cart.map(i => i.id === p.id ? { ...i, qty: i.qty + q } : i) : [...cart, { ...p, qty: q }]); setSelected(null); setQty(1); };
  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const change = paymentAmount ? (parseFloat(paymentAmount) - total) : 0;
  
  if (products.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Database className="w-12 h-12 text-gray-300 mb-4"/>
              <p className="text-gray-500 mb-4">Base de datos vacía.</p>
              <Button onClick={onSeed}>Inicializar Base de Datos</Button>
          </div>
      )
  }

  return (
    <div className="pb-24 space-y-4">
      {cart.length > 0 && <Card className="bg-blue-900 text-white p-4 flex justify-between items-center sticky top-20 z-10 shadow-lg"><div><div className="text-xs text-blue-200">Total a Pagar</div><div className="text-3xl font-bold">${total.toLocaleString()}</div></div><Button variant="success" onClick={()=>setCheckoutOpen(true)} className="px-6 py-3">Cobrar</Button></Card>}
      
      <div className="bg-white rounded-xl border p-3 shadow-sm sticky top-0 z-20">
          <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
              <input className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="🔍 Buscar o Escanear..." value={term} onChange={e => setTerm(e.target.value)} onKeyDown={handleScan} autoFocus />
          </div>
      </div>
      
      {/* Lista Productos */}
      <div className="grid grid-cols-1 gap-2">
        {filtered.map(p => (
            <div key={p.id} onClick={()=>setSelected(p)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer">
                <div>
                    <div className="font-bold text-gray-800 text-lg">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>Stock: {p.stock}</span>
                        {p.barcode && <span className="text-xs text-gray-400 flex items-center gap-1"><Scan size={10}/> {p.barcode}</span>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">${p.price}</div>
                </div>
            </div>
        ))}
      </div>
      
      {/* Modal Agregar Cantidad */}
      {selected && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in">
                <h3 className="font-bold text-xl mb-1 text-gray-800">{selected.name}</h3>
                <p className="text-gray-500 mb-6">${selected.price} x unidad</p>
                <div className="flex items-center justify-between bg-gray-100 rounded-xl p-2 mb-6">
                    <button onClick={()=>setQty(Math.max(1, qty-1))} className="w-12 h-12 bg-white rounded-lg shadow font-bold text-2xl text-gray-600 active:bg-gray-200"><Minus size={20}/></button>
                    <input type="number" className="bg-transparent text-center text-3xl font-bold w-20 outline-none" value={qty} onChange={e=>setQty(parseFloat(e.target.value))} />
                    <button onClick={()=>setQty(qty+1)} className="w-12 h-12 bg-blue-600 rounded-lg shadow font-bold text-2xl text-white active:bg-blue-700"><Plus size={20}/></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={()=>setSelected(null)}>Cancelar</Button>
                    <Button onClick={()=>addToCart(selected, qty)}>Agregar</Button>
                </div>
            </div>
          </div>
      )}

      {/* Cart Review inside POS if items exist */}
      {cart.length > 0 && (
          <div className="mt-8 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-500 uppercase text-sm">Ticket Actual ({cart.length})</h3>
                  <button onClick={()=>setCart([])} className="text-red-500 text-xs font-bold">Vaciar</button>
              </div>
              <div className="space-y-2">
                  {cart.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                          <div className="flex gap-3 items-center">
                              <div className="bg-blue-50 text-blue-700 font-bold w-8 h-8 flex items-center justify-center rounded">{item.qty}</div>
                              <div>
                                  <div className="font-bold text-sm text-gray-800">{item.name}</div>
                                  <div className="text-xs text-gray-500">${item.price * item.qty} total</div>
                              </div>
                          </div>
                          <button onClick={()=>removeFromCart(item.id)} className="text-red-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Checkout Modal Completo con Vuelto */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">Confirmar Venta</h3>
                    <button onClick={()=>setCheckoutOpen(false)}><X size={24} className="text-gray-400"/></button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl mb-4 text-center">
                    <div className="text-sm text-gray-500">Total a Cobrar</div>
                    <div className="text-4xl font-bold text-gray-800">${total.toLocaleString()}</div>
                </div>

                <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Calculadora de Vuelto (Opcional)</label>
                    <div className="flex gap-2 mb-2">
                        <input type="number" placeholder="Paga con..." className="flex-1 p-3 border rounded-lg font-bold text-lg" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} />
                    </div>
                    {paymentAmount && (
                        <div className={`p-2 rounded-lg text-center font-bold ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {change >= 0 ? `Vuelto: $${change.toLocaleString()}` : `Faltan: $${Math.abs(change).toLocaleString()}`}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button onClick={()=>{onCheckout(total,cart,'Efectivo');setCheckoutOpen(false)}} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-green-50 font-bold text-green-700 bg-green-50/50"><Banknote size={24}/> Efectivo</button>
                    <button onClick={()=>{onCheckout(total,cart,'Tarjeta');setCheckoutOpen(false)}} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-blue-50 font-bold text-blue-700 bg-blue-50/50"><CreditCard size={24}/> Tarjeta</button>
                    <button onClick={()=>{onCheckout(total,cart,'Transferencia');setCheckoutOpen(false)}} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-purple-50 font-bold text-purple-700 bg-purple-50/50"><QrCode size={24}/> Mercado Pago</button>
                </div>
            </div>
        </div>
      )}
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
  return <div className="pb-20 space-y-4 animate-in"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Briefcase className="text-red-500" /> Cuentas Corrientes</h2>{debtsBySupplier.length > 0 ? debtsBySupplier.map((sup, idx) => ( <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden"><div onClick={() => setExpandedSupplier(expandedSupplier === sup.name ? null : sup.name)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"><div className="flex items-center gap-3"><div className="bg-red-50 p-2 rounded-lg text-red-500 font-bold">{sup.items.length}</div><div><div className="font-bold">{sup.name}</div><div className="text-xs text-gray-500">Click para detalle</div></div></div><div className="text-right"><div className="text-xs text-gray-400 font-bold">Saldo</div><div className="text-xl font-bold text-red-600">${sup.total.toLocaleString()}</div></div></div>{expandedSupplier === sup.name && <div className="bg-gray-50 p-3 border-t"><table className="w-full text-sm"><tbody>{sup.items.map(i => <tr key={i.id} className="border-b last:border-0"><td className="py-2 text-xs text-gray-500">{new Date(i.date).toLocaleDateString()}</td><td className="py-2 font-medium">{i.productName} ({i.qty})</td><td className="py-2 text-right font-bold">${i.amount}</td></tr>)}</tbody></table></div>}</div> )) : <div className="text-center py-10 text-gray-400">Sin deudas registradas</div>}</div>;
};

const ShiftManager = ({ sales, payments, user, onCloseShift, onDeleteSale }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const mySales = sales.filter(s => s.user === user.name && s.status === 'open');
  const myPayments = payments.filter(p => p.user === user.name && p.status === 'open');
  const totalSales = mySales.reduce((acc, curr) => acc + curr.total, 0);
  const totalPayments = myPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const netTotal = totalSales - totalPayments;
  const cash = mySales.filter(s => s.method === 'Efectivo').reduce((acc, c) => acc + c.total, 0);
  const card = mySales.filter(s => s.method === 'Tarjeta').reduce((acc, c) => acc + c.total, 0);
  const transf = mySales.filter(s => s.method === 'Transferencia').reduce((acc, c) => acc + c.total, 0);
  return (
    <div className="pb-20 space-y-6 animate-in">
        <Card className="bg-gray-900 text-white p-5"><div className="text-sm opacity-80 mb-1">Caja Actual ({user.name})</div><div className="text-4xl font-bold mb-4">${netTotal.toLocaleString()}</div><div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4"><div><div className="text-xs text-gray-400">Ventas</div><div className="text-green-500 font-bold">${totalSales}</div></div><div><div className="text-xs text-gray-400">Pagos</div><div className="text-red-500 font-bold">-${totalPayments}</div></div></div></Card>
        <Card className="p-4"><h3 className="font-bold text-sm text-gray-500 mb-3 uppercase">Medios de Pago</h3><div className="space-y-2"><div className="flex justify-between"><span>Efectivo</span><span className="font-bold">${cash}</span></div><div className="w-full bg-gray-100 h-1 rounded"><div className="bg-green-500 h-1 rounded" style={{width: totalSales ? `${(cash/totalSales)*100}%` : '0%'}}></div></div><div className="flex justify-between"><span>Tarjeta</span><span className="font-bold">${card}</span></div><div className="w-full bg-gray-100 h-1 rounded"><div className="bg-blue-500 h-1 rounded" style={{width: totalSales ? `${(card/totalSales)*100}%` : '0%'}}></div></div><div className="flex justify-between"><span>MP/QR</span><span className="font-bold">${transf}</span></div><div className="w-full bg-gray-100 h-1 rounded"><div className="bg-purple-500 h-1 rounded" style={{width: totalSales ? `${(transf/totalSales)*100}%` : '0%'}}></div></div></div></Card>
        <div className="flex bg-gray-200 p-1 rounded-lg"><button onClick={()=>setActiveTab('summary')} className={`flex-1 py-2 text-sm rounded ${activeTab==='summary'?'bg-white shadow':''}`}>Resumen</button><button onClick={()=>setActiveTab('sales')} className={`flex-1 py-2 text-sm rounded ${activeTab==='sales'?'bg-white shadow':''}`}>Movimientos</button></div>
        {activeTab === 'sales' && <div className="space-y-2">{mySales.map(s => <div key={s.id} className="bg-white p-3 rounded border flex justify-between"><div><div className="font-bold text-sm">Venta #{s.id.toString().slice(-4)}</div><div className="text-xs text-gray-500">{new Date(s.date).toLocaleTimeString()}</div></div><div className="flex gap-3 items-center"><span className="font-bold text-green-600">${s.total}</span><button onClick={()=>onDeleteSale(s.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button></div></div>)}</div>}
        {activeTab === 'summary' && <Button onClick={onCloseShift} variant="danger" className="w-full h-12 text-lg"><Printer className="mr-2"/> Cerrar Caja</Button>}
    </div>
  );
};

const ProductManager = ({ products, user, onRequestAuth, onGenerateRestock, onProductTransaction }) => {
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', barcode: '', inputCost: '', batchQty: '', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: '' });
  const [calculations, setCalculations] = useState({ unitBase: 0, unitFinal: 0, finalStock: 0 });

  const resetForm = () => { setFormData({ name: '', barcode: '', inputCost: '', batchQty: '', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: '' }); setCalculations({ unitBase: 0, unitFinal: 0, finalStock: 0 }); };

  useEffect(() => {
    const costTotal = parseFloat(formData.inputCost) || 0;
    const qtyLote = parseFloat(formData.batchQty) || 0; 
    const stockActual = parseFloat(formData.currentStock) || 0;
    let unitBase = qtyLote > 0 ? costTotal / qtyLote : (modalMode === 'EDIT_DETAILS' && editingId ? (products.find(p=>p.id===editingId)?.cost || 0) : 0);
    let unitFinal = formData.hasIva ? unitBase : unitBase * 1.21;
    const finalStock = modalMode === 'RESTOCK' ? stockActual + qtyLote : (modalMode === 'CREATE' ? qtyLote : stockActual); 
    setCalculations({ unitBase, unitFinal, finalStock });
  }, [formData.inputCost, formData.batchQty, formData.currentStock, formData.hasIva, modalMode, editingId]);

  const handleInitialSave = () => {
      if (!formData.name) return alert("Nombre requerido");
      if (modalMode === 'EDIT_DETAILS') { processTransaction('NO_COST'); return; }
      setShowPaymentModal(true);
  }

  const processTransaction = (paymentStatus) => { 
    const newCost = parseFloat(calculations.unitFinal.toFixed(2));
    const sellingPrice = Math.ceil(newCost * (1 + (formData.margin / 100)));
    const addedStock = parseFloat(formData.batchQty) || 0;
    const totalCost = parseFloat(formData.inputCost) || 0;

    const productData = { isRestock: modalMode === 'RESTOCK', productId: editingId, addedStock, newCost, newPrice: sellingPrice, productName: formData.name, supplierName: formData.supplier, fullObject: { id: editingId || Date.now().toString(), name: formData.name, barcode: formData.barcode, stock: modalMode === 'CREATE' ? calculations.finalStock : formData.currentStock, minStock: parseInt(formData.minStock) || 5, cost: newCost, price: sellingPrice, hasIva: formData.hasIva, margin: parseFloat(formData.margin) } };
    const financialData = { totalCost: paymentStatus === 'NO_COST' ? 0 : totalCost, paymentStatus };

    if (user.role !== 'admin') onRequestAuth('PRODUCT_TRANSACTION', { productData, financialData }, `Solicita ${modalMode === 'RESTOCK' ? 'ingreso' : 'edición'}: ${formData.name}`);
    else onProductTransaction(productData, financialData);

    setShowPaymentModal(false); setIsFormOpen(false); resetForm();
  };

  const startCreate = () => { setEditingId(null); setModalMode('CREATE'); resetForm(); setIsFormOpen(true); };
  const startEditDetails = (p) => { setEditingId(p.id); setModalMode('EDIT_DETAILS'); setFormData({ name: p.name, barcode: p.barcode || '', inputCost: '', batchQty: '', currentStock: p.stock, minStock: p.minStock || 5, hasIva: p.hasIva, margin: p.margin || 50, supplier: '' }); setIsFormOpen(true); };
  const startRestock = (p) => { setEditingId(p.id); setModalMode('RESTOCK'); setFormData({ name: p.name, barcode: p.barcode, inputCost: '', batchQty: '', currentStock: p.stock, minStock: p.minStock, hasIva: p.hasIva, margin: p.margin || 50, supplier: '' }); setIsFormOpen(true); }

  return (
    <div className="pb-20 animate-in">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">Inventario</h2><div className="flex gap-2"><Button onClick={onGenerateRestock} variant="secondary" icon={ClipboardList}>Faltantes</Button><Button variant="primary" onClick={startCreate} icon={Plus}>Nuevo</Button></div></div>
      {isFormOpen ? (
        <Card className="p-4 relative z-10">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{modalMode === 'RESTOCK' ? 'Reponer Stock' : 'Producto'}</h3><button onClick={() => setIsFormOpen(false)}><X size={20} /></button></div>
          <div className="space-y-4">
            {modalMode !== 'RESTOCK' && <><input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre" /><div className="flex gap-2"><input className="w-full p-2 border rounded bg-gray-50" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Código Barras" /><Scan className="text-gray-400 mt-2"/></div></>}
            <div className="bg-gray-100 p-2 rounded flex gap-2"><div className="flex-1"><label className="text-xs">Stock Real</label><input type="number" className="w-full p-1 text-right rounded" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value)||0})} disabled={modalMode==='RESTOCK'}/></div><div className="flex-1"><label className="text-xs text-red-500">Mínimo</label><input type="number" className="w-full p-1 text-right rounded border-red-200" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)||0})}/></div></div>
            <hr/>
            <div className="flex items-center gap-2 mb-2"><Calculator size={16} className="text-blue-500"/><span className="text-sm font-bold text-blue-900 uppercase">{modalMode === 'RESTOCK' ? 'Factura Proveedor' : 'Costos'}</span></div>
            <input className="w-full p-2 border rounded mb-2" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Proveedor (Opcional)" />
            <div className="grid grid-cols-2 gap-2"><input type="number" className="p-2 border rounded" placeholder="Costo Total $" value={formData.inputCost} onChange={e => setFormData({...formData, inputCost: e.target.value})} /><input type="number" className="p-2 border rounded" placeholder="Cant. Unidades" value={formData.batchQty} onChange={e => setFormData({...formData, batchQty: e.target.value})} /></div>
            <div className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={formData.hasIva} onChange={e => setFormData({...formData, hasIva: e.target.checked})} /> Costo incluye IVA</div>
            <div className="bg-blue-50 p-2 rounded text-center grid grid-cols-2 gap-2 mt-2"><div><div className="text-[10px] font-bold text-blue-600">Costo Unit.</div><div className="font-bold">${calculations.unitFinal.toFixed(2)}</div></div><div><div className="text-[10px] font-bold text-green-600">Stock Final</div><div className="font-bold">{calculations.finalStock}</div></div></div>
            <div className="grid grid-cols-2 gap-2 border-t pt-2"><div><label className="text-xs">Margen %</label><input type="number" className="w-full p-1 border rounded" value={formData.margin} onChange={e => setFormData({...formData, margin: e.target.value})} /></div><div><label className="text-xs">Precio Venta</label><div className="w-full p-1 bg-green-100 font-bold text-center rounded">${Math.ceil((calculations.unitFinal) * (1 + (formData.margin / 100)))}</div></div></div>
            <Button className="w-full mt-2" onClick={handleInitialSave}>{modalMode === 'RESTOCK' ? 'Procesar' : 'Guardar'}</Button>
          </div>
          {showPaymentModal && <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-4 rounded"><h3 className="font-bold mb-4">¿Estado del Pago?</h3><div className="space-y-3 w-full"><button onClick={() => processTransaction('PAID')} className="w-full p-3 border-green-500 border bg-green-50 rounded font-bold text-green-700">Se Pagó (Caja)</button><button onClick={() => processTransaction('OWED')} className="w-full p-3 border-red-500 border bg-red-50 rounded font-bold text-red-700">Se Debe (Cta. Cte.)</button></div><button onClick={() => setShowPaymentModal(false)} className="mt-4 text-gray-400">Cancelar</button></div>}
        </Card>
      ) : (
        <div className="space-y-2">{products.map(p => <Card key={p.id} className={`p-3 flex justify-between ${p.stock<=p.minStock?'border-l-4 border-l-red-500':''}`}><div><div className="font-bold">{p.name}</div><div className="text-xs text-gray-500">Stock: {p.stock}</div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-green-600">${p.price}</span><div className="flex gap-1"><button onClick={()=>startRestock(p)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs flex gap-1"><PackagePlus size={12}/> +Stock</button><button onClick={()=>startEditDetails(p)} className="text-gray-400 p-1"><Edit size={14}/></button></div></div></Card>)}</div>
      )}
    </div>
  );
};

const StatsView = ({ sales }) => {
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    return <div className="space-y-4"><Card className="bg-purple-600 text-white p-6"><h2 className="text-2xl font-bold">Ventas Mes</h2><p className="text-4xl font-bold mt-2">${totalRevenue.toLocaleString()}</p></Card><div className="text-center text-gray-500 py-10">Ranking detallado disponible en versión de escritorio</div></div>;
};

const HistoryView = ({ closedShifts, setPrintData }) => <div className="space-y-2 pb-20"><h2 className="font-bold mb-4">Cajas Cerradas</h2>{closedShifts.map(s => <Card key={s.id} className="p-4 flex justify-between"><span>{new Date(s.date).toLocaleDateString()}</span><Button onClick={()=>setPrintData(s)} className="text-xs">Ver PDF</Button></Card>)}</div>;
const SupplierPaymentModal = ({ onClose, onSave }) => { const [a, setA] = useState(''); const [s, setS] = useState(''); const [n, setN] = useState(''); return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded w-full max-w-sm space-y-4"><h3 className="font-bold">Pago Proveedor</h3><input placeholder="Monto" type="number" className="w-full border p-2 rounded" onChange={e=>setA(e.target.value)}/><input placeholder="Proveedor" className="w-full border p-2 rounded" onChange={e=>setS(e.target.value)}/><input placeholder="Nota" className="w-full border p-2 rounded" onChange={e=>setN(e.target.value)}/><div className="flex gap-2"><Button onClick={onClose} variant="secondary" className="flex-1">Cancelar</Button><Button onClick={()=>onSave(a,s,n)} variant="danger" className="flex-1">Registrar</Button></div></div></div> };
const PrintableReport = ({ data, onClose }) => { useEffect(()=>{setTimeout(()=>window.print(),500)},[]); return <div className="bg-white h-screen p-8 text-black"><Button onClick={onClose} className="no-print mb-4">Cerrar</Button><h1 className="text-2xl font-bold">Reporte Caja</h1><pre className="mt-4">{JSON.stringify(data.totals, null, 2)}</pre></div> };
const RestockList = ({ data, onClose }) => { useEffect(()=>{setTimeout(()=>window.print(),500)},[]); return <div className="bg-white h-screen p-8 text-black"><Button onClick={onClose} className="no-print mb-4">Cerrar</Button><h1 className="text-2xl font-bold">Lista Reposición</h1><ul className="mt-4 space-y-2">{data.map(p=><li key={p.id} className="border-b py-2 flex justify-between"><span>{p.name}</span><span className="font-bold">Stock: {p.stock}</span></li>)}</ul></div> };
