import React, { useState, useEffect } from 'react';
import { calculateProductPricing } from './productLogic';
import { createProduct } from './productsService';

const AddProductForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigoBarras: '',
    costoBulto: 0,
    cantidadBulto: 1,
    cantidadComprada: 1,
    margenGanancia: 30,
    tieneIVA: true,
  });

  const [preciosCalculados, setPreciosCalculados] = useState({ costoUnitario: 0, precioVenta: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculos = calculateProductPricing(formData);
    setPreciosCalculados(calculos);
  }, [formData.costoBulto, formData.cantidadBulto, formData.margenGanancia, formData.tieneIVA]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSave = {
      ...formData,
      precioVenta: preciosCalculados.precioVenta,
      costoUnitario: preciosCalculados.costoUnitario
    };

    const result = await createProduct(dataToSave);
    
    if (result.success) {
      alert("¡Producto guardado correctamente!");
      setFormData({ ...formData, nombre: '', codigoBarras: '', costoBulto: 0 });
    } else {
      alert("Error al guardar");
    }
    setLoading(false);
  };

  // Clases de estilo reutilizables
  const inputClass = "w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">📦 Cargar Nuevo Producto</h2>
          <p className="text-blue-100 text-sm">Ingresa los datos del bulto y calcularemos el precio final.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Nombre del Producto</label>
              <input required type="text" name="nombre" placeholder="Ej: Coca Cola 2.25L" value={formData.nombre} onChange={handleChange} className={inputClass} />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Código de Barras</label>
              <input type="text" name="codigoBarras" placeholder="Escanear o tipear..." value={formData.codigoBarras} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Costo del Bulto ($)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input required type="number" name="costoBulto" value={formData.costoBulto} onChange={handleChange} className={`${inputClass} pl-7`} />
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Unidades por Bulto</label>
              <input required type="number" name="cantidadBulto" value={formData.cantidadBulto} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center text-sm">
            <span className="text-blue-800">Costo unitario real:</span>
            <span className="font-bold text-blue-900 text-lg">${preciosCalculados.costoUnitario}</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
              <label className={labelClass}>Stock (Bultos)</label>
              <input required type="number" name="cantidadComprada" value={formData.cantidadComprada} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Margen Ganancia (%)</label>
              <input required type="number" name="margenGanancia" value={formData.margenGanancia} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
            <input type="checkbox" name="tieneIVA" checked={formData.tieneIVA} onChange={handleChange} id="iva" className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="iva" className="text-sm font-medium text-gray-700">El precio incluye IVA (21%)</label>
          </div>

          {/* Tarjeta de Precio Final */}
          <div className="bg-green-50 p-6 rounded-xl border-2 border-green-100 flex flex-col items-center justify-center transform transition-all hover:scale-105">
            <span className="text-green-600 font-semibold uppercase tracking-wider text-xs">Precio de Venta Sugerido</span>
            <span className="text-5xl font-black text-green-700 mt-2">${preciosCalculados.precioVenta}</span>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-bold text-lg p-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition duration-150 shadow-lg disabled:opacity-50">
            {loading ? 'Guardando en la nube...' : '✅ Guardar Producto'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
