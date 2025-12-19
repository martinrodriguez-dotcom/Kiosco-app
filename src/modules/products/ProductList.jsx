import React, { useEffect, useState } from 'react';
import { getProducts } from './productsService';
import { Plus, ShoppingCart, Truck, PackagePlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false); // Estado para abrir/cerrar menú
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const result = await getProducts();
      if (result.success) setProducts(result.data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleNavigation = (path) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Precios</h2>

      {loading ? (
        <p className="text-center text-gray-500">Cargando...</p>
      ) : (
        <div className="grid gap-3">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                <p className="text-sm text-gray-500">Stock: {prod.stockActual} u.</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-700">${prod.precioVenta}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MENÚ FLOTANTE */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        
        {/* Opciones del menú (se muestran si showMenu es true) */}
        {showMenu && (
          <>
            <button onClick={() => handleNavigation('/nuevo-producto')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105">
              <span className="font-bold text-sm">Nuevo Producto</span> <PackagePlus size={20} />
            </button>

            <button onClick={() => handleNavigation('/reponer-stock')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 transition transform hover:scale-105">
              <span className="font-bold text-sm">Reponer Stock</span> <ShoppingCart size={20} />
            </button>

            <button onClick={() => handleNavigation('/pago-proveedores')} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-orange-600 transition transform hover:scale-105">
              <span className="font-bold text-sm">Pago Proveedor</span> <Truck size={20} />
            </button>
          </>
        )}

        {/* Botón Principal (Toggle) */}
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${showMenu ? 'bg-red-500 rotate-90' : 'bg-blue-700'}`}
        >
          {showMenu ? <X size={28} color="white" /> : <Plus size={28} color="white" />}
        </button>
      </div>
    </div>
  );
};

export default ProductList;
