import React, { useEffect, useState } from 'react';
import { getSales } from './productsService';
import { Calendar, CreditCard, Banknote } from 'lucide-react';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      const res = await getSales();
      if (res.success) setSales(res.data);
      setLoading(false);
    };
    loadSales();
  }, []);

  // Calcular totales simples
  const totalEfectivo = sales.filter(s => s.metodoPago === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const totalMP = sales.filter(s => s.metodoPago === 'Mercado Pago').reduce((acc, curr) => acc + curr.total, 0);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando movimientos de caja...</div>;

  return (
    <div className="animate-fadeIn">
      {/* Resumen de Caja */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 text-green-800 mb-1">
            <Banknote size={20} /> <span className="font-bold text-sm">EFECTIVO</span>
          </div>
          <p className="text-2xl font-bold text-green-900">${totalEfectivo}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800 mb-1">
            <CreditCard size={20} /> <span className="font-bold text-sm">MERCADO PAGO</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">${totalMP}</p>
        </div>
      </div>

      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <Calendar size={18}/> Últimos Movimientos
      </h3>

      <div className="space-y-3 pb-20">
        {sales.map((sale) => (
          <div key={sale.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${sale.metodoPago === 'Efectivo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {sale.metodoPago}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {sale.createdAt?.seconds ? new Date(sale.createdAt.seconds * 1000).toLocaleString() : 'Reciente'}
                </p>
              </div>
              <p className="text-xl font-bold text-gray-800">${sale.total}</p>
            </div>
            
            {/* Detalle de items (Acordeón simple o lista) */}
            <div className="text-sm text-gray-600 border-t pt-2 mt-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.cantidadVenta}x {item.nombre}</span>
                  <span className="text-gray-400">${item.precioVenta * item.cantidadVenta}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sales.length === 0 && <p className="text-center text-gray-400">No hay ventas registradas.</p>}
      </div>
    </div>
  );
};

export default SalesHistory;
