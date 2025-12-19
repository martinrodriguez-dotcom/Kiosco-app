import React, { useEffect, useState } from 'react';
import { getProducts } from './productsService';
import { Plus } from 'lucide-react'; // Icono +
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const result = await getProducts();
      if (result.success) {
        setProducts(result.data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="p-4 pb-20"> {/* pb-20 para dar espacio al boton flotante */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Precios</h2>

      {loading ? (
        <p className="text-center text-gray-500">Cargando productos...</p>
      ) : (
        <div className="grid gap-3">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                <p className="text-sm text-gray-500">Stock: {prod.stockActual || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">${prod.precioVenta}</p>
                <p className="text-xs text-gray-400">Cod: {prod.codigoBarras || 'N/A'}</p>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <p className="text-center text-gray-400 mt-10">No hay productos cargados aún.</p>
          )}
        </div>
      )}

      {/* BOTÓN FLOTANTE (FAB) */}
      <button 
        onClick={() => navigate('/nuevo-producto')}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center z-50"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default ProductList;
