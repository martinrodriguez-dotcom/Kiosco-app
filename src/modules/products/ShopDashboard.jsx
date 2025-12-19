import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductList from './ProductList';
import SalesHistory from './SalesHistory';
import { 
  ShoppingBag, 
  DollarSign, 
  Plus, 
  X, 
  PackagePlus, 
  ShoppingCart, 
  Truck 
} from 'lucide-react';

const ShopDashboard = () => {
  // Estado para las pestañas (Venta vs Caja)
  const [activeTab, setActiveTab] = useState('pos'); 
  // Estado para el menú flotante
  const [showMenu, setShowMenu] = useState(false);
  
  const navigate = useNavigate();

  // Función para navegar desde el menú flotante
  const handleNavigation = (path) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      
      {/* 1. BARRA SUPERIOR DIVIDIDA (TABS) */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex w-full">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-all duration-200 border-b-4 ${
              activeTab === 'pos' 
                ? 'border-blue-600 bg-blue-50 text-blue-700' 
                : 'border-transparent text-gray-400 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">Punto de Venta</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('cashbox')}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-all duration-200 border-b-4 ${
              activeTab === 'cashbox' 
                ? 'border-green-600 bg-green-50 text-green-700' 
                : 'border-transparent text-gray-400 hover:bg-gray-50'
            }`}
          >
            <DollarSign size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">Caja / Ventas</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="p-0">
        {activeTab === 'pos' ? (
          /* Aquí se carga la lista de productos y el buscador */
          <ProductList />
        ) : (
          /* Aquí se carga el historial de ventas */
          <div className="p-4">
             <SalesHistory />
          </div>
        )}
      </div>

      {/* 3. MENÚ FLOTANTE RECUPERADO (Siempre visible) */}
      {/* Capa oscura de fondo cuando el menú está abierto */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[1px]"
          onClick={() => setShowMenu(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        {showMenu && (
          <div className="flex flex-col gap-3 animate-fadeIn mb-2">
            {/* Botón: Nuevo Producto */}
            <button 
              onClick={() => handleNavigation('/nuevo-producto')} 
              className="flex items-center justify-between gap-3 bg-blue-600 text-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
            >
              <span className="font-bold text-sm">Nuevo Producto</span> 
              <div className="bg-white/20 p-1 rounded-full"><PackagePlus size={18} /></div>
            </button>

            {/* Botón: Reponer Stock */}
            <button 
              onClick={() => handleNavigation('/reponer-stock')} 
              className="flex items-center justify-between gap-3 bg-green-600 text-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-green-700 transition transform hover:scale-105"
            >
              <span className="font-bold text-sm">Reponer Stock</span> 
              <div className="bg-white/20 p-1 rounded-full"><ShoppingCart size={18} /></div>
            </button>

            {/* Botón: Pago Proveedor */}
            <button 
              onClick={() => handleNavigation('/pago-proveedores')} 
              className="flex items-center justify-between gap-3 bg-orange-500 text-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-orange-600 transition transform hover:scale-105"
            >
              <span className="font-bold text-sm">Pago Proveedor</span> 
              <div className="bg-white/20 p-1 rounded-full"><Truck size={18} /></div>
            </button>
          </div>
        )}

        {/* Botón Principal (+ / X) */}
        <button 
          onClick={() => setShowMenu(!showMenu)} 
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform ${
            showMenu ? 'bg-red-500 rotate-90 scale-110' : 'bg-blue-700 hover:bg-blue-800 scale-100'
          }`}
        >
          {showMenu ? <X size={28} color="white" /> : <Plus size={28} color="white" />}
        </button>
      </div>

    </div>
  );
};

export default ShopDashboard;
