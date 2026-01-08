import React, { useEffect, useState, useRef } from 'react';
import { getProducts, registerSale } from './productsService';
import { 
  Plus, Minus, Search, ShoppingCart, Trash2, X, CreditCard, Banknote, 
  Edit, CheckCircle, ScanBarcode, Camera, ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from './BarcodeScanner'; // Asegúrate de tener este componente creado

const ProductList = () => {
  // --- ESTADOS DE DATOS ---
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE VENTA ---
  const [isSaleMode, setIsSaleMode] = useState(false); // ¿Estamos en "Modo Venta"?
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState(''); // Lo que escribe la pistola USB
  
  // --- ESTADOS DE MODALES ---
  const [productToSell, setProductToSell] = useState(null); // Modal manual de cantidad
  const [qtyInput, setQtyInput] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false); // Cámara del celular

  const barcodeInputRef = useRef(null); // Para mantener el foco siempre en el input
  const navigate = useNavigate();

  // Sonido de escaneo
  const playBeep = () => {
    new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3')
      .play()
      .catch(e => console.log("Audio play failed", e));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Mantener el foco en el input de pistola cuando estamos en modo venta
  useEffect(() => {
    if (isSaleMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isSaleMode, cart]); // Refocalizar cada vez que el carrito cambia

  const fetchProducts = async () => {
    const result = await getProducts();
    if (result.success) {
      setProducts(result.data);
      setFilteredProducts(result.data);
    }
    setLoading(false);
  };

  // --- LÓGICA DE ESCANEO (CÁMARA Y USB) ---
  
  // Función central: Recibe un código y busca el producto
  const processBarcode = (code) => {
    const product = products.find(p => p.codigoBarras === code);
    
    if (product) {
      if (product.stockActual <= 0) {
        alert(`⚠️ El producto "${product.nombre}" no tiene stock.`);
        return;
      }
      addToCartDirect(product, 1);
      playBeep(); // Feedback auditivo
      setBarcodeInput(''); // Limpiar input para el siguiente disparo
    } else {
      alert("Producto no encontrado con ese código.");
    }
  };

  // Manejador del Input USB (Detecta el Enter de la pistola)
  const handleUSBInput = (e) => {
    if (e.key === 'Enter') {
      if (barcodeInput.trim() !== '') {
        processBarcode(barcodeInput);
      }
    }
  };

  // --- LÓGICA DEL CARRITO ---

  // Agregar directo (para el escáner)
  const addToCartDirect = (product, qty = 1) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        // Si ya existe, sumamos cantidad
        if (existing.cantidadVenta + qty > product.stockActual) {
           alert("Stock insuficiente");
           return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, cantidadVenta: item.cantidadVenta + qty } : item
        );
      } else {
        // Si es nuevo
        return [...prevCart, { ...product, cantidadVenta: qty }];
      }
    });
  };

  // Agregar manual (desde el listado visual)
  const addToCartManual = () => {
    if (!productToSell) return;
    addToCartDirect(productToSell, qtyInput);
    setProductToSell(null);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Ajustar cantidad en el resumen (+ / -)
  const updateCartQty = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQty = item.cantidadVenta + delta;

    if (newQty > 0 && newQty <= item.stockActual) {
      item.cantidadVenta = newQty;
      setCart(newCart);
    }
  };

  const totalVenta = cart.reduce((acc, item) => acc + (item.precioVenta * item.cantidadVenta), 0);

  // --- COBRO ---
  const handleCobrar = async (metodo) => {
    if (cart.length === 0) return;
    const result = await registerSale(cart, totalVenta, metodo);
    if (result.success) {
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCart([]);
      setIsSaleMode(false); // Salir del modo venta
      fetchProducts();
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  // ------------------------------------------------------------------
  // INTERFAZ: MODO "VENTA ACTIVA" (POS)
  // ------------------------------------------------------------------
  if (isSaleMode) {
    return (
      <div className="min-h-screen bg-gray-100 pb-32">
        {/* Header Venta */}
        <div className="bg-blue-900 text-white p-4 sticky top-0 z-40 shadow-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSaleMode(false)} className="p-2 hover:bg-blue-800 rounded-full transition">
              <ArrowLeft />
            </button>
            <div>
              <h2 className="font-bold text-lg leading-tight">Nueva Venta</h2>
              <p className="text-xs text-blue-300">Escanea productos para agregar</p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase text-blue-300">Total Actual</span>
            <span className="font-bold text-2xl">${totalVenta}</span>
          </div>
        </div>

        {/* CÁMARA OVERLAY */}
        {showCamera && (
          <BarcodeScanner 
            onScanSuccess={(code) => { processBarcode(code); setShowCamera(false); }} 
            onClose={() => setShowCamera(false)} 
          />
        )}

        <div className="p-4 max-w-4xl mx-auto grid gap-6">
          
          {/* 1. SECCIÓN DE ESCANEO (INPUT GIGANTE) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex gap-2">
             <div className="relative flex-1">
                <ScanBarcode className="absolute left-4 top-4 text-gray-400" />
                <input 
                  ref={barcodeInputRef}
                  type="text" 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleUSBInput}
                  className="w-full pl-12 p-3 text-lg font-bold border-2 border-blue-200 rounded-lg focus:border-blue-600 outline-none transition"
                  placeholder="Dispara aquí con la pistola USB..."
                  autoComplete="off"
                />
             </div>
             <button 
                onClick={() => setShowCamera(true)}
                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 shadow-md"
             >
               <Camera size={28} />
             </button>
          </div>

          {/* 2. EL TICKET (LISTA DE PRODUCTOS) */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[300px]">
            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
              <span className="font-bold text-gray-600">Detalle ({cart.length} items)</span>
              <button onClick={() => setCart([])} className="text-red-500 text-xs hover:underline">Vaciar Carrito</button>
            </div>

            <div className="divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                  <ShoppingCart size={48} className="mb-2 opacity-20" />
                  <p>Escanea un producto para comenzar...</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center hover:bg-blue-50 transition">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{item.nombre}</h4>
                      <p className="text-xs text-gray-400">{item.codigoBarras}</p>
                      <div className="text-blue-600 font-bold">${item.precioVenta} x unidad</div>
                    </div>
                    
                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-3 mr-4">
                      <button onClick={() => updateCartQty(idx, -1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Minus size={16}/></button>
                      <span className="font-bold w-6 text-center">{item.cantidadVenta}</span>
                      <button onClick={() => updateCartQty(idx, 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Plus size={16}/></button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="font-bold text-lg">${item.precioVenta * item.cantidadVenta}</div>
                      <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 text-xs mt-1 flex items-center justify-end gap-1">
                        <Trash2 size={12}/> Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. BOTÓN CERRAR VENTA (FIXED BOTTOM) */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-lg z-50 flex justify-center">
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white w-full max-w-md py-4 rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-2 animate-bounce-short"
            >
              CERRAR VENTA (${totalVenta})
            </button>
          </div>
        )}

        {/* --- MODAL CONFIRMACIÓN DE VENTA --- */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Resumen de Cobro</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-white rounded-full shadow-sm"><X size={20}/></button>
              </div>

              {/* Body con Scroll: El detalle que pediste */}
              <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
                <div className="bg-white rounded-lg border p-3 shadow-sm mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Detalle de Productos</h3>
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0 border-dashed">
                      <span className="text-gray-600">{item.cantidadVenta} x {item.nombre}</span>
                      <span className="font-bold text-gray-800">${item.precioVenta * item.cantidadVenta}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-100">
                    <span className="font-bold text-gray-600 text-lg">TOTAL A PAGAR</span>
                    <span className="font-black text-blue-600 text-2xl">${totalVenta}</span>
                  </div>
                </div>

                <p className="text-center text-gray-500 text-sm mb-2">Seleccione medio de pago</p>
                
                <div className="grid gap-3">
                  <button onClick={() => handleCobrar('Efectivo')} className="flex items-center justify-between p-4 bg-green-100 border border-green-200 rounded-xl hover:bg-green-200 transition group">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 text-white p-2 rounded-lg"><Banknote size={24}/></div>
                      <span className="font-bold text-green-900 text-lg">Efectivo</span>
                    </div>
                    <div className="h-4 w-4 rounded-full border-2 border-green-400 group-hover:bg-green-600"></div>
                  </button>

                  <button onClick={() => handleCobrar('Mercado Pago')} className="flex items-center justify-between p-4 bg-blue-100 border border-blue-200 rounded-xl hover:bg-blue-200 transition group">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white p-2 rounded-lg"><CreditCard size={24}/></div>
                      <span className="font-bold text-blue-900 text-lg">Mercado Pago</span>
                    </div>
                    <div className="h-4 w-4 rounded-full border-2 border-blue-400 group-hover:bg-blue-600"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // INTERFAZ: MODO "CATÁLOGO" (LISTA NORMAL)
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen pb-24 relative">
      
      {/* BOTÓN GIGANTE PARA ABRIR CAJA */}
      <div className="p-4 bg-white sticky top-0 z-20 shadow-sm">
        <button 
          onClick={() => setIsSaleMode(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition transform active:scale-95"
        >
          <ScanBarcode size={28} />
          <div className="text-left">
            <span className="block font-black text-xl leading-none">ABRIR NUEVA VENTA</span>
            <span className="text-blue-200 text-xs">Modo Escáner / Caja Rápida</span>
          </div>
        </button>

        {/* Buscador Simple */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="🔍 Buscar producto en lista..." 
            className="w-full pl-10 p-3 rounded-lg border bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100"
            onChange={(e) => {
               const term = e.target.value.toLowerCase();
               setFilteredProducts(products.filter(p => p.nombre.toLowerCase().includes(term)));
            }}
          />
        </div>
      </div>

      {/* Lista Normal (Para ver precios o editar) */}
      <div className="px-4 py-2 space-y-3">
        {loading ? <p className="text-center text-gray-400 mt-10">Cargando...</p> : (
          filteredProducts.map((prod) => (
            <div key={prod.id} onClick={() => { setProductToSell(prod); setQtyInput(1); }} className="bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-300 transition">
              <div>
                <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                <p className="text-sm text-gray-500">Stock: {prod.stockActual}</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-blue-600 text-lg">${prod.precioVenta}</span>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/editar-producto/${prod.id}`); }} className="text-xs text-gray-300 hover:text-blue-500 mt-1 flex items-center justify-end gap-1">
                  <Edit size={12}/> Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Simple para agregar manual desde la lista */}
      {productToSell && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-xs shadow-2xl">
            <h3 className="font-bold text-lg mb-4">{productToSell.nombre}</h3>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button onClick={() => setQtyInput(Math.max(1, qtyInput - 1))} className="p-2 bg-gray-100 rounded"><Minus/></button>
              <span className="text-2xl font-bold">{qtyInput}</span>
              <button onClick={() => setQtyInput(qtyInput + 1)} className="p-2 bg-gray-100 rounded"><Plus/></button>
            </div>
            <button onClick={() => { addToCartDirect(productToSell, qtyInput); setProductToSell(null); setIsSaleMode(true); }} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
              Agregar y Abrir Caja
            </button>
            <button onClick={() => setProductToSell(null)} className="w-full mt-2 py-2 text-gray-500 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/90 backdrop-blur-md">
           <div className="text-center animate-bounce">
              <CheckCircle size={80} className="text-green-500 mx-auto mb-4"/>
              <h2 className="text-3xl font-black text-gray-800">¡Venta Registrada!</h2>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
