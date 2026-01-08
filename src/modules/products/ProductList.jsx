import React, { useEffect, useState, useRef } from 'react';
import { getProducts, registerSale } from './productsService';
import { 
  Plus, Minus, Search, ShoppingCart, Trash2, X, CreditCard, Banknote, 
  Edit, CheckCircle, ScanBarcode, Camera, ArrowLeft, Package 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from './BarcodeScanner';

const ProductList = () => {
  // --- ESTADOS DE DATOS ---
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // Para el modo catálogo
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE VENTA ---
  const [isSaleMode, setIsSaleMode] = useState(false);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Nuevo: Estado para la búsqueda manual dentro de la venta
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  
  // --- ESTADOS DE MODALES ---
  const [productToSell, setProductToSell] = useState(null);
  const [qtyInput, setQtyInput] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const barcodeInputRef = useRef(null);
  const navigate = useNavigate();

  const playBeep = () => {
    new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3')
      .play()
      .catch(e => console.log("Audio play failed", e));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Foco inteligente: Si no estás escribiendo en el buscador manual, vuelve al escáner
  useEffect(() => {
    if (isSaleMode && barcodeInputRef.current && manualSearchTerm === '') {
      barcodeInputRef.current.focus();
    }
  }, [isSaleMode, cart, manualSearchTerm]);

  const fetchProducts = async () => {
    const result = await getProducts();
    if (result.success) {
      setProducts(result.data);
      setFilteredProducts(result.data);
    }
    setLoading(false);
  };

  // --- LÓGICA DE ESCANEO ---
  const processBarcode = (code) => {
    const product = products.find(p => p.codigoBarras === code);
    if (product) {
      if (product.stockActual <= 0) {
        alert(`⚠️ El producto "${product.nombre}" no tiene stock.`);
        return;
      }
      addToCartDirect(product, 1);
      playBeep();
      setBarcodeInput('');
    } else {
      alert("Producto no encontrado con ese código.");
    }
  };

  const handleUSBInput = (e) => {
    if (e.key === 'Enter') {
      if (barcodeInput.trim() !== '') {
        processBarcode(barcodeInput);
      }
    }
  };

  // --- LÓGICA DEL CARRITO ---
  const addToCartDirect = (product, qty = 1) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidadVenta + qty > product.stockActual) {
           alert("Stock insuficiente");
           return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, cantidadVenta: item.cantidadVenta + qty } : item
        );
      } else {
        return [...prevCart, { ...product, cantidadVenta: qty }];
      }
    });
  };

  // Agregar desde Búsqueda Manual (Click)
  const handleManualSelect = (product) => {
    if (product.stockActual <= 0) {
        alert("Sin stock");
        return;
    }
    addToCartDirect(product, 1);
    setManualSearchTerm(''); // Limpiar buscador para volver al escáner
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

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

  const handleCobrar = async (metodo) => {
    if (cart.length === 0) return;
    const result = await registerSale(cart, totalVenta, metodo);
    if (result.success) {
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCart([]);
      setIsSaleMode(false);
      fetchProducts();
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  // Filtrado para búsqueda manual en venta
  const manualSearchResults = manualSearchTerm 
    ? products.filter(p => p.nombre.toLowerCase().includes(manualSearchTerm.toLowerCase()))
    : [];

  // ------------------------------------------------------------------
  // INTERFAZ: MODO "VENTA ACTIVA" (POS)
  // ------------------------------------------------------------------
  if (isSaleMode) {
    return (
      <div className="min-h-screen bg-gray-100 pb-40"> {/* pb aumentado para el footer fijo */}
        {/* Header Venta */}
        <div className="bg-blue-900 text-white p-4 sticky top-0 z-40 shadow-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSaleMode(false)} className="p-2 hover:bg-blue-800 rounded-full transition">
              <ArrowLeft />
            </button>
            <div>
              <h2 className="font-bold text-lg leading-tight">Caja Rápida</h2>
            </div>
          </div>
          <div className="text-right bg-blue-800 px-3 py-1 rounded-lg">
            <span className="block text-[10px] uppercase text-blue-200">Total Actual</span>
            <span className="font-bold text-xl">${totalVenta}</span>
          </div>
        </div>

        {showCamera && (
          <BarcodeScanner 
            onScanSuccess={(code) => { processBarcode(code); setShowCamera(false); }} 
            onClose={() => setShowCamera(false)} 
          />
        )}

        <div className="p-4 max-w-4xl mx-auto grid gap-4">
          
          {/* 1. SECCIÓN DE ESCANEO (INPUT GIGANTE) */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex gap-2 items-center">
             <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-3 text-gray-400" />
                <input 
                  ref={barcodeInputRef}
                  type="text" 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleUSBInput}
                  className="w-full pl-10 p-2 text-lg font-bold border-2 border-blue-100 rounded-lg focus:border-blue-600 outline-none transition placeholder-gray-300"
                  placeholder="Escáner listo..."
                  autoComplete="off"
                />
             </div>
             <button 
                onClick={() => setShowCamera(true)}
                className="bg-blue-100 text-blue-700 p-3 rounded-lg hover:bg-blue-200"
             >
               <Camera size={24} />
             </button>
          </div>

          {/* 2. NUEVO: BÚSQUEDA MANUAL RÁPIDA */}
          <div className="relative z-30">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    value={manualSearchTerm}
                    onChange={(e) => setManualSearchTerm(e.target.value)}
                    className="w-full pl-10 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none shadow-sm"
                    placeholder="¿No tiene código? Busca por nombre aquí..."
                />
                {manualSearchTerm && (
                    <button onClick={() => setManualSearchTerm('')} className="absolute right-2 top-2 text-gray-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Lista Desplegable de Resultados */}
            {manualSearchTerm && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-b-xl border border-gray-200 max-h-60 overflow-y-auto">
                    {manualSearchResults.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No se encontraron productos.</div>
                    ) : (
                        manualSearchResults.map(prod => (
                            <div 
                                key={prod.id} 
                                onClick={() => handleManualSelect(prod)}
                                className={`p-3 border-b flex justify-between items-center cursor-pointer hover:bg-orange-50 transition ${prod.stockActual <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-full"><Package size={16} /></div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{prod.nombre}</p>
                                        <p className="text-xs text-gray-400">Stock: {prod.stockActual}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-600">${prod.precioVenta}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
          </div>

          {/* 3. EL TICKET (LISTA DE PRODUCTOS) */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[300px] border border-gray-200">
            <div className="bg-gray-50 p-2 border-b flex justify-between items-center px-4">
              <span className="font-bold text-gray-600 text-sm">Ticket en curso ({cart.length})</span>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-red-500 text-xs hover:underline">Limpiar</button>}
            </div>

            <div className="divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                  <ShoppingCart size={48} className="mb-2 opacity-20" />
                  <p className="text-sm">Escanea o busca un producto...</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center hover:bg-blue-50 transition animate-fadeIn">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.nombre}</h4>
                      <div className="text-blue-600 font-bold text-xs mt-1">${item.precioVenta}</div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                      <button onClick={() => updateCartQty(idx, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={14}/></button>
                      <span className="font-bold w-4 text-center text-sm">{item.cantidadVenta}</span>
                      <button onClick={() => updateCartQty(idx, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={14}/></button>
                    </div>

                    <div className="text-right min-w-[60px] pl-2">
                      <div className="font-bold text-gray-800">${item.precioVenta * item.cantidadVenta}</div>
                      <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. BOTÓN CERRAR VENTA (FIXED BOTTOM) */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-[0_-5px_10px_rgba(0,0,0,0.1)] z-50 flex justify-center">
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white w-full max-w-md py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              COBRAR <span className="bg-green-800 px-2 py-0.5 rounded text-sm">${totalVenta}</span>
            </button>
          </div>
        )}

        {/* --- MODAL CONFIRMACIÓN --- */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Confirmar Venta</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-white rounded-full"><X size={20}/></button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-gray-50/30">
                <div className="bg-white rounded-lg border p-4 shadow-sm mb-4">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
                      <span className="text-gray-600">{item.cantidadVenta} x {item.nombre}</span>
                      <span className="font-bold">${item.precioVenta * item.cantidadVenta}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-100 text-lg">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-black text-blue-600">${totalVenta}</span>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <button onClick={() => handleCobrar('Efectivo')} className="flex items-center justify-between p-4 bg-green-100 border border-green-200 rounded-xl hover:bg-green-200 font-bold text-green-900">
                    <div className="flex items-center gap-2"><Banknote/> Efectivo</div>
                  </button>
                  <button onClick={() => handleCobrar('Mercado Pago')} className="flex items-center justify-between p-4 bg-blue-100 border border-blue-200 rounded-xl hover:bg-blue-200 font-bold text-blue-900">
                    <div className="flex items-center gap-2"><CreditCard/> Mercado Pago</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODO CATÁLOGO (Igual que antes)
  return (
    <div className="min-h-screen pb-24 relative">
      <div className="p-4 bg-white sticky top-0 z-20 shadow-sm">
        <button 
          onClick={() => setIsSaleMode(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition active:scale-95"
        >
          <ScanBarcode size={28} />
          <div className="text-left">
            <span className="block font-black text-xl leading-none">NUEVA VENTA</span>
            <span className="text-blue-200 text-xs">Modo Rápido</span>
          </div>
        </button>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="🔍 Buscar en catálogo..." 
            className="w-full pl-10 p-3 rounded-lg border bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100"
            onChange={(e) => {
               const term = e.target.value.toLowerCase();
               setFilteredProducts(products.filter(p => p.nombre.toLowerCase().includes(term)));
            }}
          />
        </div>
      </div>

      <div className="px-4 py-2 space-y-3">
        {loading ? <p className="text-center text-gray-400 mt-10">Cargando...</p> : (
          filteredProducts.map((prod) => (
            <div key={prod.id} onClick={() => { setProductToSell(prod); setQtyInput(1); }} className="bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-300">
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

      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/90 backdrop-blur-md">
           <div className="text-center animate-bounce">
              <CheckCircle size={80} className="text-green-500 mx-auto mb-4"/>
              <h2 className="text-3xl font-black text-gray-800">¡Venta Exitosa!</h2>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
