import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, ShoppingCart, Package, DollarSign, User, LogOut, 
  Trash2, Edit, X, TrendingUp, Truck, FileText, Scale, Hash, 
  CreditCard, QrCode, Banknote, ArrowUpCircle, ArrowDownCircle, 
  Calculator, Menu, BarChart2, AlertTriangle, ShieldAlert, Bell,
  History, Printer, Scan, ClipboardList, PackagePlus, Briefcase, Calendar, CheckCircle
} from 'lucide-react';

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

// --- Datos Iniciales ---
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Coca Cola 500ml', barcode: '7790895000997', stock: 24, minStock: 10, cost: 800, price: 1500, hasIva: true, margin: 50 },
  { id: 2, name: 'Alfajor Jorgito', barcode: '7791234567890', stock: 5, minStock: 10, cost: 400, price: 800, hasIva: true, margin: 100 },
];

const USERS = [
  { id: 1, name: 'Dueño (Admin)', role: 'admin' },
  { id: 2, name: 'Empleado Mañana', role: 'user' },
  { id: 3, name: 'Empleado Tarde', role: 'user' },
];

// --- App Principal ---

export default function KioscoSystem() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  
  // Datos Transaccionales
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]); // Pagos realizados (Salidas de caja)
  const [debts, setDebts] = useState([]); // Deudas pendientes (Cta Cte Proveedores)
  const [closedShifts, setClosedShifts] = useState([]); 
  const [notifications, setNotifications] = useState([]); 

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [printData, setPrintData] = useState(null); 
  const [restockData, setRestockData] = useState(null);

  // Efecto Carga
  useEffect(() => {
    const savedProds = localStorage.getItem('kiosco_products');
    const savedSales = localStorage.getItem('kiosco_sales');
    const savedPayments = localStorage.getItem('kiosco_payments');
    const savedDebts = localStorage.getItem('kiosco_debts');
    const savedShifts = localStorage.getItem('kiosco_shifts');
    const savedNotifs = localStorage.getItem('kiosco_notifications');
    
    if (savedProds) setProducts(JSON.parse(savedProds));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedDebts) setDebts(JSON.parse(savedDebts));
    if (savedShifts) setClosedShifts(JSON.parse(savedShifts));
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
  }, []);

  // Efecto Guardado
  useEffect(() => {
    localStorage.setItem('kiosco_products', JSON.stringify(products));
    localStorage.setItem('kiosco_sales', JSON.stringify(sales));
    localStorage.setItem('kiosco_payments', JSON.stringify(payments));
    localStorage.setItem('kiosco_debts', JSON.stringify(debts));
    localStorage.setItem('kiosco_shifts', JSON.stringify(closedShifts));
    localStorage.setItem('kiosco_notifications', JSON.stringify(notifications));
  }, [products, sales, payments, debts, closedShifts, notifications]);

  // --- LÓGICA DE ACTUALIZACIÓN DE PRODUCTOS Y PAGOS ---
  const handleProductTransaction = (productData, financialData) => {
    const { isRestock, productId, addedStock, supplierName } = productData;
    const { totalCost, paymentStatus } = financialData; 

    // 1. Actualizar Inventario
    if (isRestock) {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return { 
                    ...p, 
                    stock: p.stock + addedStock, 
                    cost: productData.newCost, 
                    price: productData.newPrice 
                };
            }
            return p;
        }));
    } else {
        // Creación o Edición Completa
        if (productId) {
             setProducts(prev => prev.map(p => p.id === productId ? productData.fullObject : p));
        } else {
             setProducts(prev => [...prev, productData.fullObject]);
        }
    }

    // 2. Registrar Movimiento Financiero (Si aplica)
    if (totalCost > 0) {
        if (paymentStatus === 'PAID') {
            // Se resta de la caja actual (Shift Payments)
            const newPayment = {
                id: Date.now(),
                date: new Date().toISOString(),
                amount: totalCost,
                supplier: supplierName || 'Proveedor General',
                note: isRestock ? `Reposición: ${productData.productName}` : `Carga Inicial: ${productData.productName}`,
                user: user.name
            };
            setPayments(prev => [newPayment, ...prev]);
        } else {
            // Se agrega a DEUDAS
            const newDebt = {
                id: Date.now(),
                date: new Date().toISOString(),
                amount: totalCost,
                supplier: supplierName || 'Sin Proveedor',
                productName: productData.productName,
                qty: addedStock,
                user: user.name,
                status: 'PENDING'
            };
            setDebts(prev => [newDebt, ...prev]);
        }
    }
  };

  // --- LÓGICA DE AUTORIZACIÓN ---
  const requestAuthorization = (type, payload, description) => {
    const newRequest = {
      id: Date.now(),
      type, 
      payload,
      description,
      requester: user.name,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setNotifications([...notifications, newRequest]);
    alert("⛔ ACCIÓN BLOQUEADA: Se requiere autorización del dueño.");
  };

  const handleApproveRequest = (req) => {
    if (req.type === 'DELETE_SALE') {
      const saleToDelete = sales.find(s => s.id === req.payload.saleId);
      if (saleToDelete) {
         setSales(sales.filter(s => s.id !== req.payload.saleId));
         const updatedProducts = [...products];
         saleToDelete.items.forEach(item => {
            const prodIndex = updatedProducts.findIndex(p => p.id === item.id);
            if(prodIndex > -1) updatedProducts[prodIndex].stock += item.qty;
         });
         setProducts(updatedProducts);
      }
    } else if (req.type === 'PRODUCT_TRANSACTION') {
        handleProductTransaction(req.payload.productData, req.payload.financialData);
        alert("✅ Transacción de producto APROBADA.");
    }
    setNotifications(notifications.filter(n => n.id !== req.id));
    setShowNotifications(false);
  };

  const handleDenyRequest = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // --- FUNCIONES CORE ---
  const handleSupplierPayment = (amount, supplierName, note) => {
    const newPayment = {
      id: Date.now(),
      date: new Date().toISOString(),
      amount: parseFloat(amount),
      supplier: supplierName,
      note: note,
      user: user.name
    };
    setPayments([newPayment, ...payments]);
    setIsSupplierModalOpen(false);
  };

  const closeShift = () => {
    const mySales = sales.filter(s => s.user === user.name);
    const myPayments = payments.filter(p => p.user === user.name);
    
    const report = {
      id: Date.now(),
      date: new Date().toISOString(),
      cashier: user.name,
      sales: mySales,
      payments: myPayments,
      totals: {
        revenue: mySales.reduce((acc, curr) => acc + curr.total, 0),
        expenses: myPayments.reduce((acc, curr) => acc + curr.amount, 0),
        cash: mySales.filter(s => s.method === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0),
        card: mySales.filter(s => s.method === 'Tarjeta').reduce((acc, curr) => acc + curr.total, 0),
        transfer: mySales.filter(s => s.method === 'Transferencia').reduce((acc, curr) => acc + curr.total, 0),
      }
    };

    setClosedShifts([report, ...closedShifts]);
    setSales(sales.filter(s => s.user !== user.name));
    setPayments(payments.filter(p => p.user !== user.name));
    setPrintData(report);
  };

  const generateRestockList = () => {
    const itemsToRestock = products.filter(p => p.stock <= p.minStock);
    if (itemsToRestock.length === 0) {
      alert("¡Todo en orden! No hay productos con stock bajo.");
      return;
    }
    setRestockData(itemsToRestock);
  };

  const navigateTo = (newView) => {
    setView(newView);
    setIsMenuOpen(false);
  };

  // --- RENDERIZADO DE REPORTES PDF ---
  if (printData) return <PrintableReport data={printData} onClose={() => { setPrintData(null); setUser(null); setView('login'); }} />;
  if (restockData) return <RestockList data={restockData} onClose={() => setRestockData(null)} />;

  // --- LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kiosco System</h1>
          <p className="text-gray-500 mb-6">Inicie sesión para abrir caja</p>
          <div className="space-y-3">
            {USERS.map(u => (
              <button
                key={u.id}
                onClick={() => { setUser(u); setView('pos'); }}
                className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex justify-between items-center group"
              >
                <span className="font-medium text-gray-700 group-hover:text-blue-700">{u.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded group-hover:bg-blue-200 group-hover:text-blue-800">
                  {u.role === 'admin' ? 'Propietario' : 'Cajero'}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0 relative overflow-x-hidden">
      
      {/* Sidebar Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in">
          <div className="bg-black/50 absolute inset-0 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="bg-white w-72 h-full relative z-10 shadow-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b">
              <div className="bg-blue-600 text-white p-2 rounded-lg"><DollarSign size={20} /></div>
              <div>
                <h2 className="font-bold text-xl">Kiosco</h2>
                <p className="text-xs text-gray-500">Gestión Integral</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              <MenuLink icon={ShoppingCart} label="Punto de Venta" active={view === 'pos'} onClick={() => navigateTo('pos')} />
              <MenuLink icon={Package} label="Productos / Stock" active={view === 'products'} onClick={() => navigateTo('products')} />
              <MenuLink icon={FileText} label="Cierre de Caja" active={view === 'shift'} onClick={() => navigateTo('shift')} />
              <MenuLink icon={BarChart2} label="Ranking y Estadísticas" active={view === 'stats'} onClick={() => navigateTo('stats')} />
              
              {user.role === 'admin' && (
                <>
                  <div className="my-4 border-t border-gray-100 pt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Administración</div>
                  <MenuLink icon={Briefcase} label="Deudas Proveedores" active={view === 'debts'} onClick={() => navigateTo('debts')} />
                  <MenuLink icon={History} label="Historial de Cajas" active={view === 'history'} onClick={() => navigateTo('history')} />
                </>
              )}
            </nav>

            <div className="mt-auto border-t pt-4">
              <button 
                onClick={() => { setUser(null); setIsMenuOpen(false); }} 
                className="w-full py-2 text-red-500 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu size={24} />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight text-lg">
              {view === 'pos' && 'Punto de Venta'}
              {view === 'products' && 'Inventario'}
              {view === 'shift' && 'Cierre de Caja'}
              {view === 'stats' && 'Estadísticas'}
              {view === 'history' && 'Historial'}
              {view === 'debts' && 'Deudas Prov.'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notificaciones Admin */}
          {user.role === 'admin' && (
             <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-gray-100 relative">
                 <Bell size={20} className={notifications.length > 0 ? "text-blue-600" : "text-gray-400"} />
                 {notifications.length > 0 && (
                   <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                 )}
               </button>
               
               {showNotifications && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in">
                   <div className="bg-gray-50 p-3 border-b text-sm font-bold text-gray-700">Solicitudes Pendientes</div>
                   <div className="max-h-64 overflow-y-auto">
                     {notifications.length === 0 ? (
                       <div className="p-4 text-center text-gray-400 text-sm">No hay notificaciones</div>
                     ) : (
                       notifications.map(req => (
                         <div key={req.id} className="p-3 border-b hover:bg-gray-50">
                           <div className="flex items-center gap-2 mb-1">
                             <ShieldAlert size={14} className="text-orange-500" />
                             <span className="font-bold text-sm text-gray-800">{req.requester}</span>
                           </div>
                           <p className="text-xs text-gray-600 mb-2">{req.description}</p>
                           <div className="flex gap-2">
                             <button onClick={() => handleApproveRequest(req)} className="flex-1 bg-green-100 text-green-700 text-xs py-1 rounded hover:bg-green-200">Aprobar</button>
                             <button onClick={() => handleDenyRequest(req.id)} className="flex-1 bg-red-100 text-red-700 text-xs py-1 rounded hover:bg-red-200">Rechazar</button>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>
          )}
          
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            {user.name.split(' ')[0]}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        
        {view === 'pos' && (
          <POSView 
            products={products} 
            setProducts={setProducts} 
            cart={cart} 
            setCart={setCart} 
            onCheckout={(total, items, method) => {
              const newSale = {
                id: Date.now(),
                date: new Date().toISOString(),
                total,
                items,
                method, 
                user: user.name
              };
              setSales([newSale, ...sales]);
              const newProducts = products.map(p => {
                const soldItem = items.find(i => i.id === p.id);
                if (soldItem) {
                  return { ...p, stock: p.stock - soldItem.qty };
                }
                return p;
              });
              setProducts(newProducts);
              setCart([]);
            }}
          />
        )}

        {view === 'products' && (
          <ProductManager 
            products={products} 
            user={user} 
            onRequestAuth={requestAuthorization} 
            onGenerateRestock={generateRestockList}
            onProductTransaction={handleProductTransaction}
          />
        )}

        {view === 'shift' && (
          <ShiftManager 
            sales={sales} 
            payments={payments} 
            user={user} 
            onCloseShift={closeShift}
            setSales={setSales}
            onRequestAuth={requestAuthorization}
          />
        )}

        {view === 'stats' && (
          <StatsView sales={closedShifts.flatMap(s => s.sales).concat(sales)} products={products} />
        )}

        {view === 'history' && (
          <HistoryView closedShifts={closedShifts} setPrintData={setPrintData} />
        )}

        {view === 'debts' && (
          <SuppliersDebtsView debts={debts} />
        )}

      </div>

      {(view === 'pos' || view === 'products') && (
        <div className="fixed bottom-24 right-4 z-30">
          {showQuickActions && (
            <div className="absolute bottom-16 right-0 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <button 
                  onClick={() => { setShowQuickActions(false); setIsSupplierModalOpen(true); }}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 border-b"
              >
                <Truck size={18} className="text-red-500" /> 
                <div>
                  <span className="font-bold block text-gray-800">Pago Proveedor</span>
                  <span className="text-xs text-gray-400">Registrar egreso</span>
                </div>
              </button>
              <button 
                  onClick={() => { setShowQuickActions(false); navigateTo('products'); }}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
              >
                <Package size={18} className="text-green-500" />
                  <div>
                  <span className="font-bold block text-gray-800">Cargar Producto</span>
                  <span className="text-xs text-gray-400">Ingreso mercadería</span>
                </div>
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform ${showQuickActions ? 'bg-gray-800 rotate-45' : 'bg-blue-600 hover:scale-105'}`}
          >
            <Plus size={28} className="text-white" />
          </button>
        </div>
      )}

      {isSupplierModalOpen && (
        <SupplierPaymentModal 
          onClose={() => setIsSupplierModalOpen(false)} 
          onSave={handleSupplierPayment} 
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around z-20 pb-safe">
        <NavButton active={view === 'pos'} onClick={() => navigateTo('pos')} icon={ShoppingCart} label="Venta" />
        <NavButton active={view === 'products'} onClick={() => navigateTo('products')} icon={Package} label="Productos" />
        <NavButton active={view === 'shift'} onClick={() => navigateTo('shift')} icon={FileText} label="Caja" />
      </div>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.2s ease-out forwards; }
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// --- VISTA: Deudas Proveedores ---
const SuppliersDebtsView = ({ debts }) => {
  const [expandedSupplier, setExpandedSupplier] = useState(null);

  const debtsBySupplier = useMemo(() => {
    const grouped = {};
    debts.forEach(d => {
        if (!grouped[d.supplier]) {
            grouped[d.supplier] = { name: d.supplier, total: 0, items: [] };
        }
        grouped[d.supplier].total += d.amount;
        grouped[d.supplier].items.push(d);
    });
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [debts]);

  return (
    <div className="space-y-4 animate-in pb-20">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Briefcase className="text-red-500" /> Cuentas Corrientes Proveedores
      </h2>
      
      {debtsBySupplier.length > 0 ? (
        debtsBySupplier.map((sup, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
                onClick={() => setExpandedSupplier(expandedSupplier === sup.name ? null : sup.name)}
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-lg text-red-500 font-bold">{sup.items.length}</div>
                    <div>
                        <div className="font-bold text-gray-800">{sup.name}</div>
                        <div className="text-xs text-gray-500">Click para ver detalle</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase font-bold">Saldo Deudor</div>
                    <div className="text-xl font-bold text-red-600">${sup.total.toLocaleString()}</div>
                </div>
            </div>
            
            {expandedSupplier === sup.name && (
                <div className="bg-gray-50 p-3 border-t border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 border-b border-gray-200">
                                <th className="pb-2 font-normal">Fecha</th>
                                <th className="pb-2 font-normal">Producto</th>
                                <th className="pb-2 font-normal">Usuario</th>
                                <th className="pb-2 text-right font-normal">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sup.items.map(item => (
                                <tr key={item.id} className="border-b border-gray-100 last:border-0">
                                    <td className="py-2 text-gray-500 text-xs">
                                        {new Date(item.date).toLocaleDateString()}<br/>
                                        {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="py-2 font-medium">
                                        {item.productName} <span className="text-gray-400">({item.qty}u)</span>
                                    </td>
                                    <td className="py-2 text-gray-500 text-xs">{item.user}</td>
                                    <td className="py-2 text-right font-bold text-gray-700">${item.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <CheckCircle className="mx-auto text-green-300 mb-2" size={48} />
            <p className="text-gray-500">¡Excelente! No tienes deudas registradas con proveedores.</p>
        </div>
      )}
    </div>
  );
};

// --- PRODUCT MANAGER ---
const ProductManager = ({ products, user, onRequestAuth, onGenerateRestock, onProductTransaction }) => {
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', barcode: '', inputCost: '', batchQty: '', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: ''
  });
  const [calculations, setCalculations] = useState({ unitBase: 0, unitFinal: 0, finalStock: 0 });

  const resetForm = () => {
    setFormData({ name: '', barcode: '', inputCost: '', batchQty: '', currentStock: 0, minStock: 5, hasIva: true, margin: 50, supplier: '' });
    setCalculations({ unitBase: 0, unitFinal: 0, finalStock: 0 });
  };

  useEffect(() => {
    const costTotal = parseFloat(formData.inputCost) || 0;
    const qtyLote = parseFloat(formData.batchQty) || 0; 
    const stockActual = parseFloat(formData.currentStock) || 0;
    
    let unitBase = 0;
    if (qtyLote > 0) {
      unitBase = costTotal / qtyLote;
    } else if (modalMode === 'EDIT_DETAILS' && editingId) {
        const p = products.find(p => p.id === editingId);
        unitBase = p ? (p.hasIva ? p.cost : p.cost / 1.21) : 0;
    }

    let unitFinal = formData.hasIva ? unitBase : unitBase * 1.21;
    const finalStock = modalMode === 'RESTOCK' ? stockActual + qtyLote : (modalMode === 'CREATE' ? qtyLote : stockActual); 

    setCalculations({ unitBase, unitFinal, finalStock });
  }, [formData.inputCost, formData.batchQty, formData.currentStock, formData.hasIva, modalMode, editingId]);

  const handleInitialSave = () => {
      if (!formData.name) return alert("Nombre requerido");
      if (modalMode === 'EDIT_DETAILS') {
          processTransaction('NO_COST');
          return;
      }
      setShowPaymentModal(true);
  }

  const processTransaction = (paymentStatus) => { 
    const newCost = parseFloat(calculations.unitFinal.toFixed(2));
    const sellingPrice = Math.ceil(newCost * (1 + (formData.margin / 100)));
    const addedStock = parseFloat(formData.batchQty) || 0;
    const totalCost = parseFloat(formData.inputCost) || 0;

    const productData = {
        isRestock: modalMode === 'RESTOCK',
        productId: editingId,
        addedStock,
        newCost,
        newPrice,
        productName: formData.name,
        supplierName: formData.supplier,
        fullObject: { 
            id: editingId || Date.now(),
            name: formData.name,
            barcode: formData.barcode,
            stock: modalMode === 'CREATE' ? calculations.finalStock : formData.currentStock,
            minStock: parseInt(formData.minStock) || 5,
            cost: newCost,
            price: sellingPrice,
            hasIva: formData.hasIva,
            margin: parseFloat(formData.margin)
        }
    };

    const financialData = {
        totalCost: paymentStatus === 'NO_COST' ? 0 : totalCost,
        paymentStatus
    };

    if (user.role !== 'admin') {
       const actionText = modalMode === 'RESTOCK' ? 'ingresar mercadería' : 'modificar producto';
       onRequestAuth('PRODUCT_TRANSACTION', { productData, financialData }, `Solicita ${actionText}: ${formData.name}`);
    } else {
       onProductTransaction(productData, financialData);
    }

    setShowPaymentModal(false);
    setIsFormOpen(false);
    resetForm();
  };

  const startCreate = () => { setEditingId(null); setModalMode('CREATE'); resetForm(); setIsFormOpen(true); };
  const startEditDetails = (p) => {
    setEditingId(p.id); setModalMode('EDIT_DETAILS');
    setFormData({ name: p.name, barcode: p.barcode || '', inputCost: '', batchQty: '', currentStock: p.stock, minStock: p.minStock || 5, hasIva: p.hasIva, margin: p.margin || 50, supplier: '' });
    setIsFormOpen(true);
  };
  const startRestock = (p) => {
    setEditingId(p.id); setModalMode('RESTOCK');
    setFormData({ name: p.name, barcode: p.barcode, inputCost: '', batchQty: '', currentStock: p.stock, minStock: p.minStock, hasIva: p.hasIva, margin: p.margin || 50, supplier: '' });
    setIsFormOpen(true);
  }

  return (
    <div className="pb-20 animate-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
        <div className="flex gap-2">
          <Button onClick={onGenerateRestock} variant="secondary" icon={ClipboardList}>Lista Compras</Button>
          <Button variant="primary" onClick={startCreate} icon={Plus}>Nuevo</Button>
        </div>
      </div>

      {isFormOpen && (
        <Card className="p-4 animate-in relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">
                {modalMode === 'CREATE' && 'Alta de Producto'}
                {modalMode === 'EDIT_DETAILS' && 'Editar Detalles'}
                {modalMode === 'RESTOCK' && 'Ingreso Mercadería'}
            </h3>
            <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
          </div>
          
          <div className="space-y-4">
            {modalMode !== 'RESTOCK' && (
                <>
                <input className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre del Producto" />
                <div className="flex gap-2">
                    <input className="w-full p-2 border rounded-lg bg-gray-50" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Código de Barras" />
                    <div className="p-2 bg-gray-100 rounded text-gray-500"><Scan size={20}/></div>
                </div>
                </>
            )}
            
            {modalMode === 'RESTOCK' && (
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                     <h4 className="font-bold text-blue-800">{formData.name}</h4>
                     <p className="text-sm text-blue-600">Stock Actual: {formData.currentStock} unidades</p>
                 </div>
            )}

            {modalMode !== 'RESTOCK' && (
                <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center gap-2">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Stock Real</label>
                    <input type="number" className="w-full p-2 text-right border rounded bg-white font-bold text-gray-700" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-red-600 mb-1">Stock Mínimo</label>
                    <input type="number" className="w-full p-2 text-right border border-red-200 rounded bg-white font-bold text-red-700" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})} />
                </div>
                </div>
            )}

            <hr className="border-gray-100"/>

            {/* Sección Lote */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={16} className="text-blue-500"/>
                <span className="text-sm font-bold text-blue-900 uppercase">
                    {modalMode === 'RESTOCK' ? 'Datos del Nuevo Pedido' : 'Datos del Costo'}
                </span>
              </div>
              <input className="w-full p-2 border rounded-lg mb-2" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Nombre del Proveedor (Opcional)" />
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Costo TOTAL ($)</label>
                  <input type="number" className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.inputCost} onChange={e => setFormData({...formData, inputCost: e.target.value})} placeholder="0.00" autoFocus={modalMode === 'RESTOCK'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad Unidades</label>
                  <input type="number" className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.batchQty} onChange={e => setFormData({...formData, batchQty: e.target.value})} placeholder="0" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input type="checkbox" id="ivaCheck" className="w-4 h-4 text-blue-600 rounded" checked={formData.hasIva} onChange={e => setFormData({...formData, hasIva: e.target.checked})} />
                <label htmlFor="ivaCheck" className="text-sm text-gray-600">¿El costo incluye IVA?</label>
              </div>
            </div>

            {/* Resultados Cálculos */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 grid grid-cols-2 gap-4 text-center">
              <div><div className="text-[10px] text-blue-600 uppercase font-bold">Nuevo Costo Unitario</div><div className="text-xl font-bold text-blue-800">${calculations.unitFinal.toFixed(2)}</div></div>
              <div><div className="text-[10px] text-green-600 uppercase font-bold">Stock Final</div><div className="text-xl font-bold text-green-700">{calculations.finalStock}</div></div>
            </div>

            {/* Precio Venta */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
               <div><label className="block text-sm font-medium text-gray-700 mb-1">Margen (%)</label><input type="number" className="w-full p-2 border rounded-lg" value={formData.margin} onChange={e => setFormData({...formData, margin: e.target.value})} /></div>
               <div><label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label><div className="w-full p-2 bg-green-100 border border-green-200 text-green-800 font-bold rounded-lg text-lg text-center">${Math.ceil((calculations.unitFinal || (editingId ? products.find(p => p.id === editingId)?.cost : 0) || 0) * (1 + (formData.margin / 100)))}</div></div>
            </div>

            <Button variant="primary" className="w-full mt-2" onClick={handleInitialSave}>
              {modalMode === 'RESTOCK' ? 'Procesar Ingreso' : 'Guardar Cambios'}
            </Button>
          </div>

          {/* Modal interno para selección de pago */}
          {showPaymentModal && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 rounded-xl animate-in fade-in">
                  <div className="bg-white shadow-2xl p-6 rounded-2xl border border-gray-200 w-full max-w-sm text-center">
                      <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><DollarSign size={32}/></div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">¿Cómo se pagó esto?</h3>
                      <p className="text-gray-500 text-sm mb-6">Total a registrar: <span className="font-bold text-gray-800">${formData.inputCost}</span></p>
                      
                      <div className="space-y-3">
                          <button onClick={() => processTransaction('PAID')} className="w-full p-4 border border-green-200 bg-green-50 rounded-xl flex items-center gap-3 hover:bg-green-100 text-green-800 transition-colors">
                              <div className="bg-green-200 p-2 rounded-full"><CheckCircle size={20}/></div>
                              <div className="text-left"><div className="font-bold">Se Pagó (Caja)</div><div className="text-xs">Descontar dinero ahora</div></div>
                          </button>
                          
                          <button onClick={() => processTransaction('OWED')} className="w-full p-4 border border-red-200 bg-red-50 rounded-xl flex items-center gap-3 hover:bg-red-100 text-red-800 transition-colors">
                              <div className="bg-red-200 p-2 rounded-full"><Briefcase size={20}/></div>
                              <div className="text-left"><div className="font-bold">Se Debe (Cta. Cte.)</div><div className="text-xs">Anotar en deuda proveedor</div></div>
                          </button>
                      </div>
                      <button onClick={() => setShowPaymentModal(false)} className="mt-6 text-gray-400 text-sm hover:text-gray-600">Cancelar</button>
                  </div>
              </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
             const isLowStock = p.stock <= (p.minStock || 5);
             return (
              <Card key={p.id} className={`p-4 flex justify-between items-center ${isLowStock ? 'border-l-4 border-l-red-500' : ''}`}>
                <div>
                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                       Stock: {p.stock} {isLowStock && '(Bajo)'}
                     </span>
                     <span className="text-xs text-gray-400">Costo: ${p.cost}</span>
                  </div>
                  {p.barcode && <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Scan size={10}/> {p.barcode}</div>}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="font-bold text-lg text-green-600">${p.price}</div>
                  <div className="flex gap-2">
                    <button onClick={() => startRestock(p)} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-md flex items-center gap-1 hover:bg-blue-200">
                        <PackagePlus size={14} /> Reponer
                    </button>
                    <button onClick={() => startEditDetails(p)} className="text-gray-400 hover:text-gray-600 p-1">
                        <Edit size={16} />
                    </button>
                  </div>
                </div>
              </Card>
             );
          })}
        </div>
      )}
    </div>
  );
};

// --- POS VIEW (SCANNER SUPPORT) ---
const POSView = ({ products, cart, setCart, onCheckout }) => {
  const [term, setTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [manualMode, setManualMode] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && term) {
      const scannedProduct = products.find(p => p.barcode === term);
      if (scannedProduct) {
        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3'); 
        audio.play().catch(e => console.log('Audio play failed', e));
        const existing = cart.find(item => item.id === scannedProduct.id);
        if (existing) setCart(cart.map(item => item.id === scannedProduct.id ? { ...item, qty: item.qty + 1 } : item));
        else setCart([...cart, { ...scannedProduct, qty: 1 }]);
        setTerm(''); 
        e.preventDefault();
      }
    }
  };

  const filteredProducts = useMemo(() => {
    if (!term) return products;
    return products.filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || (p.barcode && p.barcode.includes(term)));
  }, [term, products]);

  const addToCart = () => {
    if (!selectedProduct) return;
    const quantity = parseFloat(qty);
    if (isNaN(quantity) || quantity <= 0) return;
    const existing = cart.find(item => item.id === selectedProduct.id);
    if (existing) setCart(cart.map(item => item.id === selectedProduct.id ? { ...item, qty: item.qty + quantity } : item));
    else setCart([...cart, { ...selectedProduct, qty: quantity }]);
    setSelectedProduct(null); setTerm(''); setQty(1); setManualMode(false);
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const handlePaymentSelection = (method) => { onCheckout(total, cart, method); setIsCheckoutOpen(false); };

  return (
    <div className="space-y-4 pb-24 animate-in">
      {cart.length > 0 && (
        <Card className="bg-blue-900 text-white border-none p-4 shadow-lg mb-4 sticky top-20 z-10">
          <div className="flex justify-between items-center">
            <div><div className="text-xs text-blue-200">Total</div><div className="text-3xl font-bold">${total.toFixed(0)}</div></div>
            <Button variant="success" onClick={() => setIsCheckoutOpen(true)} className="px-6 shadow-none border border-white/20">Cobrar</Button>
          </div>
           <div className="mt-2 text-xs text-blue-200 border-t border-blue-800 pt-2 flex justify-between">
            <span>{cart.length} items</span><button onClick={() => setCart([])} className="text-red-300 hover:text-red-100">Vaciar</button>
          </div>
        </Card>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50 sticky top-0">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={handleKeyDown} placeholder="🔍 Buscar o Escanear..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none text-base" autoFocus />
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className="p-4 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium ${p.stock <= p.minStock ? 'text-red-600' : 'text-gray-500'}`}>Stock: {p.stock}</span>
                      {p.stock <= p.minStock && <span className="bg-red-100 text-red-600 px-1 rounded font-bold">Bajo</span>}
                    </div>
                  </div>
                  <div className="font-bold text-blue-600">${p.price}</div>
                </div>
            ))
          ) : <div className="p-8 text-center text-gray-500">Sin productos</div>}
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-2xl animate-in">
            <div className="flex justify-between items-start mb-4">
               <div><h3 className="text-lg font-bold text-gray-800 leading-tight">{selectedProduct.name}</h3><p className="text-gray-500 text-sm">${selectedProduct.price} x un/kg</p></div>
               <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
              {manualMode ? (
                <div className="flex flex-col gap-2"><label className="text-xs text-gray-500 font-bold uppercase">Cantidad / Peso</label><div className="flex items-center gap-2"><input type="number" step="0.001" className="w-full text-3xl font-bold p-2 text-center bg-white border border-blue-200 rounded-lg outline-none text-blue-600" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /><span className="text-gray-400 font-medium">kg/u</span></div></div>
              ) : (
                <div className="flex items-center justify-between"><button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 font-bold text-2xl active:bg-gray-100">-</button><span className="text-3xl font-bold text-gray-800">{qty}</span><button onClick={() => setQty(parseInt(qty) + 1)} className="w-12 h-12 bg-blue-600 text-white rounded-lg shadow-md font-bold text-2xl active:bg-blue-700">+</button></div>
              )}
            </div>
            <div className="flex justify-center mb-6"><button onClick={() => { setManualMode(!manualMode); setQty(manualMode ? 1 : ''); }} className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${manualMode ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`}>{manualMode ? <Hash size={16}/> : <Scale size={16}/>}{manualMode ? 'Volver a Unidades' : 'Venta por Peso / Manual'}</button></div>
            <div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setSelectedProduct(null)}>Cancelar</Button><Button variant="primary" onClick={addToCart}>Agregar</Button></div>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl p-6 animate-in shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Venta</h3>
            <div className="space-y-3 mb-6">
              <button onClick={() => handlePaymentSelection('Efectivo')} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-green-50 font-bold text-green-700"><Banknote size={24}/> Efectivo</button>
              <button onClick={() => handlePaymentSelection('Tarjeta')} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-blue-50 font-bold text-blue-700"><CreditCard size={24}/> Tarjeta</button>
              <button onClick={() => handlePaymentSelection('Transferencia')} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-purple-50 font-bold text-purple-700"><QrCode size={24}/> Mercado Pago</button>
            </div>
            <Button variant="secondary" onClick={() => setIsCheckoutOpen(false)} className="w-full">Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SHIFT MANAGER ---
const ShiftManager = ({ sales, payments, user, onCloseShift, setSales, onRequestAuth }) => {
  const [activeTab, setActiveTab] = useState('summary'); 
  const mySales = sales.filter(s => s.user === user.name);
  const myPayments = payments.filter(p => p.user === user.name);
  const totalSales = mySales.reduce((acc, curr) => acc + curr.total, 0);
  const totalPayments = myPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const netTotal = totalSales - totalPayments;

  const cashSales = mySales.filter(s => s.method === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const cardSales = mySales.filter(s => s.method === 'Tarjeta').reduce((acc, curr) => acc + curr.total, 0);
  const transferSales = mySales.filter(s => s.method === 'Transferencia').reduce((acc, curr) => acc + curr.total, 0);

  const handleDeleteSale = (saleId) => {
    if (user.role === 'admin') {
      if(window.confirm('¿Eliminar esta venta?')) setSales(sales.filter(s => s.id !== saleId));
    } else {
      onRequestAuth('DELETE_SALE', { saleId }, `Solicita eliminar venta #${saleId.toString().slice(-4)}`);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in">
      <Card className="bg-gray-900 text-white border-none p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={100} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 opacity-80 text-sm"><User size={16} /> <span className="font-medium uppercase tracking-wider">{user.name}</span><span>•</span><span>{new Date().toLocaleDateString()}</span></div>
          <div className="text-sm text-gray-400 mb-1">Caja Final (Ingresos - Pagos)</div>
          <div className={`text-4xl font-bold tracking-tight mb-4 ${netTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>${netTotal.toLocaleString()}</div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            <div><div className="text-xs text-gray-400 flex items-center gap-1"><ArrowUpCircle size={12} className="text-green-500"/> Total Ventas</div><div className="font-semibold text-lg text-green-500">${totalSales.toLocaleString()}</div></div>
             <div><div className="text-xs text-gray-400 flex items-center gap-1"><ArrowDownCircle size={12} className="text-red-500"/> Total Pagos</div><div className="font-semibold text-lg text-red-500">-${totalPayments.toLocaleString()}</div></div>
          </div>
        </div>
      </Card>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Ingresos por Medio de Pago</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded text-green-600"><Banknote size={18}/></div><span className="text-gray-700 font-medium">Efectivo</span></div><span className="font-bold text-gray-900">${cashSales.toLocaleString()}</span></div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-green-500 h-full rounded-full" style={{ width: `${(cashSales/totalSales)*100 || 0}%` }}></div></div>
          <div className="flex justify-between items-center mt-2"><div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded text-blue-600"><CreditCard size={18}/></div><span className="text-gray-700 font-medium">Posnet / Tarjeta</span></div><span className="font-bold text-gray-900">${cardSales.toLocaleString()}</span></div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${(cardSales/totalSales)*100 || 0}%` }}></div></div>
          <div className="flex justify-between items-center mt-2"><div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded text-purple-600"><QrCode size={18}/></div><span className="text-gray-700 font-medium">Mercado Pago</span></div><span className="font-bold text-gray-900">${transferSales.toLocaleString()}</span></div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-purple-500 h-full rounded-full" style={{ width: `${(transferSales/totalSales)*100 || 0}%` }}></div></div>
        </div>
      </div>

      <div className="flex mb-4 bg-gray-200 p-1 rounded-lg">
          <button onClick={() => setActiveTab('summary')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Resumen</button>
          <button onClick={() => setActiveTab('sales')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Ventas</button>
          <button onClick={() => setActiveTab('payments')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'payments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Pagos</button>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-3 animate-in">
             {mySales.length > 0 ? mySales.map(sale => (
               <div key={sale.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                 <div>
                   <div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${sale.method === 'Efectivo' ? 'bg-green-500' : sale.method === 'Tarjeta' ? 'bg-blue-500' : 'bg-purple-500'}`}>{sale.method ? sale.method.substring(0,1) : 'E'}</span><span className="text-gray-800 font-medium">Venta #{sale.id.toString().slice(-4)}</span></div>
                   <div className="text-xs text-gray-400 mt-1">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {sale.items.length} items</div>
                 </div>
                 <div className="flex items-center gap-3"><div className="font-bold text-green-600">+${sale.total.toLocaleString()}</div><button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div>
               </div>
             )) : <p className="text-center text-gray-400 py-4">Sin ventas aún</p>}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-3 animate-in">
             {myPayments.length > 0 ? myPayments.map(pay => (
               <div key={pay.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                 <div>
                   <div className="font-medium text-gray-800 flex items-center gap-2"><Truck size={14} className="text-red-400" />{pay.supplier}</div>
                   <div className="text-xs text-gray-400 mt-1">{pay.note && <span className="mr-2 italic">{pay.note}</span>}{new Date(pay.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                 </div>
                 <div className="font-bold text-red-500">-${pay.amount.toLocaleString()}</div>
               </div>
             )) : <p className="text-center text-gray-400 py-4">Sin pagos registrados</p>}
        </div>
      )}

      {activeTab === 'summary' && (
        <Button variant="danger" className="w-full mt-4 h-12 text-lg" onClick={() => { if(window.confirm('¿Confirmar cierre de caja y generar reporte?')) onCloseShift(); }}><Printer className="mr-2"/> Cerrar Caja e Imprimir</Button>
      )}
    </div>
  );
};

// --- STATS & HISTORY VIEWS ---
const StatsView = ({ sales }) => {
  const topProducts = useMemo(() => {
    const salesCount = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
          if (!salesCount[item.id]) salesCount[item.id] = { name: item.name, qty: 0, totalRevenue: 0 };
          salesCount[item.id].qty += item.qty;
          salesCount[item.id].totalRevenue += (item.qty * item.price);
      });
    });
    return Object.values(salesCount).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [sales]);

  return (
    <div className="space-y-6 animate-in">
      <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-none p-6">
        <div className="flex items-center gap-3 mb-2 opacity-80"><BarChart2 size={24} /><span className="font-medium uppercase tracking-wider">Ranking Mensual</span></div>
        <h2 className="text-3xl font-bold">Top Ventas</h2>
      </Card>
      <div className="space-y-3">
        {topProducts.length > 0 ? topProducts.map((p, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 relative overflow-hidden">
               <div className="absolute -left-2 -bottom-4 text-6xl font-black text-gray-100 z-0">{index + 1}</div>
               <div className="relative z-10 flex-1 flex justify-between items-center pl-6">
                 <div><div className="font-bold text-gray-800 text-lg">{p.name}</div><div className="text-xs text-gray-500 font-medium">Ingresos: <span className="text-green-600">${p.totalRevenue.toLocaleString()}</span></div></div>
                 <div className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm">{p.qty % 1 === 0 ? p.qty : p.qty.toFixed(2)} u.</div>
               </div>
            </div>
          )) : <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300"><p className="text-gray-500">Sin datos este mes.</p></div>}
      </div>
    </div>
  );
};

const HistoryView = ({ closedShifts, setPrintData }) => (
  <div className="space-y-4 animate-in pb-20">
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><History /> Historial de Cajas</h2>
    {closedShifts.length > 0 ? (
      closedShifts.map(shift => (
        <Card key={shift.id} className="p-4 flex justify-between items-center">
          <div><div className="font-bold text-gray-800">{new Date(shift.date).toLocaleDateString()}</div><div className="text-sm text-gray-500">{new Date(shift.date).toLocaleTimeString()} • {shift.cashier}</div></div>
          <div className="text-right"><div className="font-bold text-lg mb-1">${(shift.totals.revenue - shift.totals.expenses).toLocaleString()}</div><button onClick={() => setPrintData(shift)} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1 ml-auto"><Printer size={12}/> Ver Reporte</button></div>
        </Card>
      ))
    ) : <div className="text-center py-10 text-gray-400">No hay historial disponible</div>}
  </div>
);

// --- COMPONENTES AUXILIARES ---
const MenuLink = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}><Icon size={20} />{label}</button>;
const NavButton = ({ active, onClick, icon: Icon, label }) => <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Icon size={24} strokeWidth={active ? 2.5 : 2} /><span className="text-[10px] font-medium mt-1">{label}</span></button>;
const SupplierPaymentModal = ({ onClose, onSave }) => {
  const [amount, setAmount] = useState(''); const [supplier, setSupplier] = useState(''); const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Truck className="text-red-500" /> Registrar Pago</h3>
        <div className="space-y-4"><input type="number" autoFocus className="w-full p-3 border border-gray-300 rounded-lg text-lg font-bold" placeholder="Monto ($)" value={amount} onChange={e => setAmount(e.target.value)} /><input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Proveedor" value={supplier} onChange={e => setSupplier(e.target.value)} /><input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nota" value={note} onChange={e => setNote(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3 mt-6"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="danger" disabled={!amount || !supplier} onClick={() => onSave(amount, supplier, note)}>Registrar</Button></div>
      </div>
    </div>
  );
};
const PrintableReport = ({ data, onClose }) => {
  useEffect(() => { setTimeout(() => window.print(), 500); }, []);
  return (
    <div className="min-h-screen bg-white text-black p-8 relative"><div className="no-print fixed top-4 right-4 flex gap-4"><Button onClick={() => window.print()} variant="primary" icon={Printer}>Imprimir / Guardar PDF</Button><Button onClick={onClose} variant="secondary">Cerrar y Salir</Button></div><div className="max-w-2xl mx-auto border border-gray-300 p-8 shadow-none print:border-none print:p-0"><div className="text-center border-b pb-4 mb-6"><h1 className="text-2xl font-bold uppercase tracking-wider">Reporte de Cierre de Caja</h1><p className="text-sm text-gray-500">ID: #{data.id}</p></div><div className="grid grid-cols-2 gap-8 mb-6"><div><p className="text-xs font-bold text-gray-400 uppercase">Cajero</p><p className="text-lg font-bold">{data.cashier}</p></div><div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase">Fecha</p><p className="text-lg">{new Date(data.date).toLocaleString()}</p></div></div><div className="mb-6"><h3 className="text-sm font-bold bg-gray-100 p-2 mb-2 uppercase">Balance</h3><div className="flex justify-between items-center py-2 border-b"><span>Ventas</span><span className="font-bold text-green-600">+${data.totals.revenue.toLocaleString()}</span></div><div className="flex justify-between items-center py-2 border-b"><span>Pagos</span><span className="font-bold text-red-600">-${data.totals.expenses.toLocaleString()}</span></div><div className="flex justify-between items-center py-4 text-xl font-bold"><span>Caja Neta</span><span>${(data.totals.revenue - data.totals.expenses).toLocaleString()}</span></div></div><div className="mb-6"><h3 className="text-sm font-bold bg-gray-100 p-2 mb-2 uppercase">Detalle Medios de Pago</h3><div className="grid grid-cols-3 gap-4 text-center"><div className="border p-2 rounded"><div className="text-xs text-gray-500">Efectivo</div><div className="font-bold">${data.totals.cash.toLocaleString()}</div></div><div className="border p-2 rounded"><div className="text-xs text-gray-500">Tarjeta</div><div className="font-bold">${data.totals.card.toLocaleString()}</div></div><div className="border p-2 rounded"><div className="text-xs text-gray-500">MP / QR</div><div className="font-bold">${data.totals.transfer.toLocaleString()}</div></div></div></div><div><h3 className="text-sm font-bold bg-gray-100 p-2 mb-2 uppercase">Firma</h3><div className="h-20 border-b border-gray-300 mt-8"></div><p className="text-center text-xs text-gray-400 mt-1">Firma Responsable</p></div></div></div>
  );
};
const RestockList = ({ data, onClose }) => {
  useEffect(() => { setTimeout(() => window.print(), 500); }, []);
  return (
    <div className="min-h-screen bg-white text-black p-8 relative"><div className="no-print fixed top-4 right-4 flex gap-4"><Button onClick={() => window.print()} variant="primary" icon={Printer}>Imprimir Lista</Button><Button onClick={onClose} variant="secondary">Cerrar</Button></div><div className="max-w-2xl mx-auto border border-gray-300 p-8 shadow-none print:border-none print:p-0"><div className="text-center border-b pb-4 mb-6"><h1 className="text-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"><ClipboardList/> Lista de Reposición</h1><p className="text-sm text-gray-500">Fecha: {new Date().toLocaleDateString()}</p></div><table className="w-full text-left"><thead><tr className="border-b-2 border-gray-800"><th className="py-2">Producto</th><th className="py-2 text-right">Stock Actual</th><th className="py-2 text-right">Mínimo</th><th className="py-2 text-center">Check</th></tr></thead><tbody>{data.map(p => (<tr key={p.id} className="border-b border-gray-200"><td className="py-3 font-medium">{p.name}</td><td className="py-3 text-right text-red-600 font-bold">{p.stock}</td><td className="py-3 text-right text-gray-500">{p.minStock}</td><td className="py-3 text-center"><div className="w-4 h-4 border border-gray-400 rounded inline-block"></div></td></tr>))}</tbody></table><div className="mt-8 text-sm text-gray-500 italic">Generado automáticamente por sistema de control de stock.</div></div></div>
  );
};


