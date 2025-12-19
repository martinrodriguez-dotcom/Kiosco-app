import React, { useEffect, useState } from 'react';
import { getProducts, registerSale } from './productsService';
import { Plus, Minus, Search, ShoppingCart, Trash2, X, CreditCard, Banknote, Edit, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para Modales
  const [productToSell, setProductToSell] = useState(null); // Producto seleccionado para elegir cantidad
  const [qtyInput, setQtyInput] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filtrado en tiempo real
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = products.filter(p => 
      p.nombre.toLowerCase().includes(lowerTerm) || 
      (p.codigoBarras && p.codigoBarras.includes(lowerTerm))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    const result = await getProducts();
    if (result.success) {
      setProducts(result.data);
      setFilteredProducts(result.data);
    }
    setLoading(false);
  };

  // --- 1. ABRIR MODAL DE CANTIDAD ---
  const initiateSale = (product) => {
    setProductToSell(product);
    setQtyInput(1); // Resetear a 1
  };

  // --- 2. AGREGAR AL CARRITO (Desde el Modal) ---
  const addToCart = () => {
    if (!productToSell) return;
    const qty = parseInt(qtyInput);

    if (qty > productToSell.stockActual) {
      alert("⚠️ Stock insuficiente");
      return;
    }

    const existingItem = cart.find(item => item.id === productToSell.id);
    if (existingItem) {
      const newCart = cart.map(item => 
        item.id === productToSell.id ? { ...item, cantidadVenta: item.cantidadVenta + qty } : item
      );
      setCart(newCart);
    } else {
      setCart([...cart, { ...productToSell, cantidadVenta: qty }]);
    }
    
    setProductToSell(null); // Cerrar modal
    setSearchTerm(''); // Limpiar busqueda opcionalmente
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalVenta = cart.reduce((acc, item) => acc + (item.precioVenta * item.cantidadVenta), 0);

  // --- 3. COBRAR ---
  const handleCobrar = async (metodo) => {
    if (cart.length === 0) return;
    const result = await registerSale(cart, totalVenta, metodo);
    if (result.success) {
      setShowPaymentModal(false);
      setShowSuccessModal(true); // Mostrar éxito
      setCart([]);
      fetchProducts(); 
      setTimeout(() => setShowSuccessModal(false), 2000); // Ocultar éxito a los 2 seg
    }
  };

  return (
    <div className="relative min-h-[500px]">
      
      {/* BARRA DE TOTAL (Sticky: se pega arriba pero empuja el contenido) */}
      <div className={`sticky top-0 z-30 bg-white shadow-md border-b transition-all duration-300 ${cart.length > 0 ? 'translate-y-0' : '-translate-y-full absolute w-full'}`}>
        {cart.length > 0 && (
          <div className="p-4 flex justify-between items-center bg-blue-900 text-white">
            <div className="flex flex-col">
              <span className="text-xs text-blue-300 font-bold uppercase tracking-wide">Total a Cobrar</span>
              <span className="text-3xl font-bold">${totalVenta}</span>
              <span className="text-xs text-blue-200">{cart.length} productos</span>
            </div>
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition flex items-center gap-2"
            >
              <ShoppingCart size={20} /> COBRAR
            </button>
          </div>
        )}
      </div>

      {/* BUSCADOR */}
      <div className="p-4 bg-gray-50 sticky top-0 z-20"> 
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="🔍 Buscar producto..." 
            className="w-full pl-10 p-3 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div className="px-4 pb-24 space-y-3">
        {loading ? <p className="text-center mt-10 text-gray-400">Cargando catálogo...</p> : (
          filteredProducts.map((prod) => (
            <div 
              key={prod.id} 
              onClick={() => prod.stockActual > 0 && initiateSale(prod)}
              className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition active:bg-blue-50 cursor-pointer ${prod.stockActual <= 0 ? 'opacity-50 grayscale' : ''}`}
            >
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{prod.nombre}</h3>
                <p className={`text-sm ${prod.stockActual > 0 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
                  {prod.stockActual > 0 ? `${prod.stockActual} u. disponibles` : 'SIN STOCK'}
                </p>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-2xl font-bold text-blue-600">${prod.precioVenta}</span>
                 {/* Botón Editar Discreto */}
                 <button onClick={(e) => { e.stopPropagation(); navigate(`/editar-producto/${prod.id}`); }} className="text-gray-300 p-1 hover:text-blue-500"><Edit size={16}/></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL 1: SELECCIONAR CANTIDAD --- */}
      {productToSell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg truncate pr-2">{productToSell.nombre}</h3>
              <button onClick={() => setProductToSell(null)} className="p-1 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button onClick={() => qtyInput > 1 && setQtyInput(qtyInput - 1)} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300"><Minus/></button>
              <input 
                type="number" 
                className="w-20 text-center text-3xl font-bold border-none outline-none" 
                value={qtyInput} 
                onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button onClick={() => setQtyInput(qtyInput + 1)} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300"><Plus/></button>
            </div>

            <div className="text-center mb-6 text-gray-500">
              Subtotal: <span className="font-bold text-gray-800">${qtyInput * productToSell.precioVenta}</span>
            </div>

            <button onClick={addToCart} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg">
              Agregar al Carrito
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CONFIRMAR PAGO --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm p-6 pb-10 sm:pb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Método de Pago</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="text-center mb-8">
              <span className="text-gray-400 text-sm">Total a pagar</span>
              <div className="text-5xl font-black text-gray-900 mt-2">${totalVenta}</div>
            </div>

            <div className="grid gap-3">
              <button onClick={() => handleCobrar('Efectivo')} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition group">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 text-white p-2 rounded-lg"><Banknote size={24}/></div>
                  <span className="font-bold text-green-900 text-lg">Efectivo</span>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-green-300 group-hover:bg-green-500"></div>
              </button>

              <button onClick={() => handleCobrar('Mercado Pago')} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition group">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white p-2 rounded-lg"><CreditCard size={24}/></div>
                  <span className="font-bold text-blue-900 text-lg">Mercado Pago</span>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-blue-300 group-hover:bg-blue-500"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ÉXITO --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-md animate-fadeIn">
          <div className="text-center transform scale-110">
            <div className="bg-green-100 text-green-600 rounded-full p-6 inline-block mb-4 shadow-lg animate-bounce">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-3xl font-black text-gray-800">¡Venta Exitosa!</h2>
            <p className="text-gray-500 mt-2">Guardando en caja...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductList;
