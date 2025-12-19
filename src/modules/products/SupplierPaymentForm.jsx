import React, { useState } from 'react';
import { createSupplierPayment } from './productsService';

const SupplierPaymentForm = () => {
  const [formData, setFormData] = useState({
    proveedor: '',
    monto: '',
    detalle: ''
  });

  // Lista de proveedores sugeridos (Esto podría venir de la BD en el futuro)
  const proveedoresComunes = ["Coca Cola", "Arcor", "Quilmes", "Pepsi", "Proveedor Local"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createSupplierPayment(formData);
    if (res.success) {
      alert("Pago registrado correctamente");
      setFormData({ proveedor: '', monto: '', detalle: '' });
    } else {
      alert("Error al registrar pago");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-orange-500 p-4">
          <h2 className="text-xl font-bold text-white">💸 Registrar Pago a Proveedor</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Proveedor</label>
            <input 
              required 
              list="proveedores-list" 
              type="text" 
              className="w-full border p-2 rounded focus:ring-orange-500 focus:border-orange-500"
              value={formData.proveedor}
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
              placeholder="Escribe para buscar..."
            />
            {/* El datalist hace la magia de sugerir mientras escribes */}
            <datalist id="proveedores-list">
              {proveedoresComunes.map((prov, index) => (
                <option key={index} value={prov} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monto Abonado ($)</label>
            <input 
              required 
              type="number" 
              className="w-full border p-2 rounded text-xl font-bold text-gray-800"
              value={formData.monto}
              onChange={(e) => setFormData({...formData, monto: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Detalle / Nota (Opcional)</label>
            <textarea 
              rows="3"
              className="w-full border p-2 rounded"
              value={formData.detalle}
              onChange={(e) => setFormData({...formData, detalle: e.target.value})}
              placeholder="Ej: Pago parcial fact. 1234"
            ></textarea>
          </div>

          <button type="submit" className="w-full bg-orange-600 text-white p-3 rounded font-bold hover:bg-orange-700 transition">
            Registrar Pago
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupplierPaymentForm;
