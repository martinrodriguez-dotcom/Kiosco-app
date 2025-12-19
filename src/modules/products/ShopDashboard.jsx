import React, { useState } from 'react';
import ProductList from './ProductList';
import SalesHistory from './SalesHistory';
import { ShoppingBag, DollarSign } from 'lucide-react';

const ShopDashboard = () => {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' = Venta, 'cashbox' = Caja

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* NAVEGACIÓN SUPERIOR (TABS) */}
      <div className="bg-white px-4 pt-4 shadow-sm">
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'pos' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShoppingBag size={18} />
            Punto de Venta
          </button>
          
          <button 
            onClick={() => setActiveTab('cashbox')}
            className={`flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'cashbox' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <DollarSign size={18} />
            Movimientos Caja
          </button>
        </div>
      </div>

      {/* CONTENIDO DE LA PESTAÑA */}
      <div className="p-4">
        {activeTab === 'pos' ? (
          <ProductList />
        ) : (
          <SalesHistory />
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;
