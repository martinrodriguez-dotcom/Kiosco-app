import React, { useEffect, useState } from 'react';
import { getProducts, registerSale } from './productsService';
import { Plus, ShoppingCart, Truck, PackagePlus, X, Edit, Trash2, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // El carrito de venta
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const navigate = useNavigate();

  // Cargar productos
  const fetchProducts = async () => {
    const result = await getProducts();
    if (result.success) setProducts(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LÓGICA DEL CARRITO (POS) ---
  
  // Agregar producto al carrito
  const handleProductClick = (product) => {
    // Preguntar cantidad (UX Simple por ahora)
    const qtyStr = prompt(`¿Cuántas unidades de ${product.nombre} vendes?`, "1");
    if (!qtyStr) return; // Cancelado
    const qty = parseInt(qtyStr);

    if (qty > product.stockActual) {
      alert("⚠️ No tienes suficiente stock para esa cantidad.");
      return;
    }

    // Verificar si ya está en el carrito para sumar
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      const newCart = cart.map(item => 
        item.id === product.id ? { ...item, cantidadVenta: item.cantidadVenta + qty } : item
      );
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, cantidadVenta: qty }]);
    }
  };

  // Calcular Total
  const totalVenta = cart.reduce((acc, item) => acc + (item.precioVenta * item.cantidadVenta), 0);

  // Eliminar del carrito
  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // --- LÓGICA DE COBRO ---
  const handleCobrar = async (metodo) => {
    if (cart.length === 0) return;

    const result = await registerSale(cart, totalVenta, metodo);
    if (result.success) {
      alert(`✅ ¡Venta registrada con éxito en ${metodo}!`);
      setCart([]); // Limpiar carrito
      setShowPaymentModal(false);
      fetchProducts(); // Recargar productos para ver stock actualizado
    } else {
      alert("Error al registrar la venta");
    }
  };

  return (
    <div className="pb-32 bg-gray-100 min-h-screen">
      
      {/* 1. BARRA FIJA SUPERIOR (Totalizador de Venta) */}
      {cart.length > 0 && (
        <div className="fixed top-0 left-0 w-full bg-blue-900 text-white p-4 shadow-lg z-30 flex justify-between items-center transition-all animate-slideDown">
          <div>
            <span className="text-xs uppercase text-blue-300">Total Venta</span>
            <div className="text-2xl font-bold">${totalVenta}</div>
            <div className="text-xs">{cart.length} items cargados</div>
          </div>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full shadow-md transition transform hover:scale-105"
          >
            COBRAR
          </button>
        </div>
      )}

      {/* Espaciador si hay barra superior */}
      <div className={cart.length > 0 ? "h-24" : "h-4"}></div>

      <div className="px-4">
        {/* Lista de Items en el Carrito (Resumen rápido) */}
        {cart.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4 border border-blue-200">
            <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Detalle actual:</h3>
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b py-1 text-sm">
                <span>{item.cantidadVenta} x {item.nombre}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">${item.cantidadVenta * item.precioVenta}</span>
                  <button onClick={() => removeFromCart(idx)} className="text-red-500"><X size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-4">Productos (Toca para vender)</h2>

        {/* LISTA DE PRODUCTOS */}
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <div className="grid gap-3">
            {products.map((prod) => (
              <div 
                key={prod.id} 
                className={`bg-white p-4 rounded-lg shadow flex justify-between items-center cursor-pointer transition active:bg-blue-50 border-l-4 ${prod.stockActual <= 0 ? 'border-red-500 opacity-60' : 'border-green-500'}`}
              >
                {/* Click en el cuerpo para Vender */}
                <div className="flex-1" onClick={() => prod.stockActual > 0 && handleProductClick(prod)}>
                  <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                  <div className="flex gap-2 text-sm">
                    <span className={prod.stockActual > 0 ? "text-gray-500" : "text-red-500 font-bold"}>
                      Stock: {prod.stockActual}
                    </span>
                    {prod.codigoBarras && <span className="text-gray-400">| {prod.codigoBarras}</span>}
                  </div>
                </div>

                {/* Precio y Botón Editar (Solo Admin) */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-bold text-blue-900">${prod.precioVenta}</span>
                  {/* Botón Editar: Evita que se dispare el click de venta con stopPropagation */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/editar-producto/${prod.id}`); }} 
                    className="p-1 text-gray-400 hover:text-blue-600 border rounded"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE PAGO */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Confirmar Cobro</h3>
              <button onClick={() => setShowPaymentModal(false)}><X/></button>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-2">Total a cobrar</p>
              <p className="text-4xl font-bold text-gray-800 mb-8">${totalVenta}</p>
              
              <div className="grid gap-4">
                <button 
                  onClick={() => handleCobrar('Efectivo')}
                  className="flex items-center justify-center gap-3 bg-green-100 text-green-800 p-4 rounded-lg font-bold hover:bg-green-200 transition"
                >
                  <Banknote size={24} /> EFECTIVO
                </button>
                <button 
                  onClick={() => handleCobrar('Mercado Pago')}
                  className="flex items-center justify-center gap-3 bg-blue-100 text-blue-800 p-4 rounded-lg font-bold hover:bg-blue-200 transition"
                >
                  <CreditCard size={24} /> MERCADO PAGO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENÚ FLOTANTE (+, Reposición, etc) - Se mantiene igual que antes */}
      {/* ... (Pega aquí tu código del botón flotante anterior si quieres mantenerlo visible) ... */}
       <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        {showMenu && (
          <>
            <button onClick={() => navigate('/nuevo-producto')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-sm">Nuevo</span> <PackagePlus size={20} />
            </button>
            <button onClick={() => navigate('/reponer-stock')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-sm">Reponer</span> <ShoppingCart size={20} />
            </button>
            <button onClick={() => navigate('/pago-proveedores')} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-sm">Pago Prov.</span> <Truck size={20} />
            </button>
          </>
        )}
        <button onClick={() => setShowMenu(!showMenu)} className={`p-4 rounded-full shadow-2xl transition-all ${showMenu ? 'bg-red-500 rotate-90' : 'bg-blue-700 text-white'}`}>
          {showMenu ? <X size={28} /> : <Plus size={28} />}
        </button>
      </div>
    </div>
  );
};

export default ProductList;
