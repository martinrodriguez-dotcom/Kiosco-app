import React, { useEffect, useState } from 'react';
import { getSupplierPayments } from './productsService';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupplierAccount = () => {
  const [payments, setPayments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const res = await getSupplierPayments();
      if (res.success) setPayments(res.data);
    };
    load();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Cuenta Corriente Proveedores</h2>
      </div>

      <div className="space-y-3">
        {payments.length === 0 && <p className="text-gray-500 text-center">No hay pagos registrados.</p>}
        
        {payments.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-800">{p.proveedor}</h3>
                <p className="text-xs text-gray-500">
                  {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha N/A'}
                </p>
                {p.detalle && <p className="text-sm text-gray-600 mt-1 italic">"{p.detalle}"</p>}
              </div>
              <span className="text-lg font-bold text-red-600">-${p.monto}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierAccount;
