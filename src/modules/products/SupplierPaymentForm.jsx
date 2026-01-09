import React, { useState, useEffect } from 'react';
import { createSupplierPayment, checkActiveSession } from './productsService'; // Importamos checkActiveSession
import { Truck, DollarSign, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const SupplierPaymentForm = () => {
  const [formData, setFormData] = useState({
    proveedor: '',
    monto: '',
    concepto: '',
    metodo: 'Efectivo'
  });
  const [sessionId, setSessionId] = useState(null); // ID de la caja actual
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Al cargar, revisamos si hay caja abierta
  useEffect(() => {
    const checkSession = async () => {
        const res = await checkActiveSession();
        if (res.isOpen) {
            setSessionId(res.data.id);
        }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Enviamos el pago con el ID de sesión (si existe)
    const result = await createSupplierPayment(formData, sessionId);

    if (result.success) {
      setSuccess(true);
      setFormData({ proveedor: '', monto: '', concepto: '', metodo: 'Efectivo' });
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Error al registrar el pago");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto animate-fadeIn pb-20">
      <div className="flex items-center gap-3 mb-6 p-2">
         <div className="bg-orange-100 p-3 rounded-full text-orange-700">
            <Truck size={24} />
         </div>
         <div>
            <h2 className="text-2xl font-bold text-gray-800">Pago a Proveedores</h2>
            <p className="text-sm text-gray-500">Registrar salida de dinero</p>
         </div>
      </div>

      {sessionId ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
            <CheckCircle size={16}/> Caja Abierta: El pago se descontará de la caja actual.
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
            <AlertTriangle size={16}/> Caja Cerrada: Este pago quedará registrado pero no afectará ninguna caja.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        {/* ... (Formulario Igual que antes, solo cambio la lógica interna) ... */}
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Proveedor</label>
          <div className="relative">
            <Truck className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              required
              placeholder="Ej: Coca Cola"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.proveedor}
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto a Pagar</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="number"
              required
              placeholder="0.00"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-lg"
              value={formData.monto}
              onChange={(e) => setFormData({...formData, monto: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Concepto / Detalle</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Ej: Bajada de mercadería semana 4"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.concepto}
              onChange={(e) => setFormData({...formData, concepto: e.target.value})}
            />
          </div>
        </div>

        <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pago</label>
             <select 
                className="w-full p-3 border rounded-xl outline-none bg-gray-50"
                value={formData.metodo}
                onChange={(e) => setFormData({...formData, metodo: e.target.value})}
             >
                 <option value="Efectivo">Efectivo (Descuenta de Caja)</option>
                 <option value="Transferencia">Transferencia (Banco)</option>
             </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
        >
           {loading ? 'Registrando...' : 'Registrar Pago'}
        </button>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-xl text-center font-bold animate-pulse">
             ¡Pago registrado correctamente!
          </div>
        )}
      </form>
    </div>
  );
};

export default SupplierPaymentForm;
