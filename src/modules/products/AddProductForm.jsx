import React, { useState, useEffect } from 'react';
import { calculateProductPricing } from './productLogic';
import { createProduct } from './productsService';

const AddProductForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigoBarras: '',
    costoBulto: 0,
    cantidadBulto: 1,     // Unidades que trae el bulto (para calcular precio)
    cantidadComprada: 0,  // Unidades TOTALES que ingresan al stock
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
      setFormData({ ...formData, nombre: '', codigoBarras: '', costoBulto: 0, cantidadComprada: 0 });
    } else {
      alert("Error al guardar");
    }
    setLoading(false);
  };

  const inputClass = "w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">📦 Cargar Nuevo Producto</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Nombre y Código */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Nombre del Producto</label>
              <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={inputClass} placeholder="Ej: Galletitas Oreo" />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Código de Barras</label>
              <input type="text" name="codigoBarras" value={formData.codigoBarras} onChange={handleChange} className={inputClass} />
            </div>

            {/* SECCIÓN COSTOS (Para definir el precio unitario) */}
            <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-3 text-sm uppercase">Definición de Costos</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Costo del Bulto ($)</label>
                        <input required type="number" name="costoBulto" value={formData.costoBulto} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Unidades que trae el Bulto</label>
                        <input required type="number" name="cantidadBulto" value={formData.cantidadBulto} onChange={handleChange} className={inputClass} />
                        <p className="text-xs text-gray-500 mt-1">Se usa para calcular el costo x unidad.</p>
                    </div>
                </div>
                <div className="mt-3 text-right">
                    <span className="text-blue-800 text-sm">Costo por unidad calculado: </span>
                    <span className="font-bold text-blue-900">${preciosCalculados.costoUnitario}</span>
                </div>
            </div>

            {/* SECCIÓN STOCK (Lo que realmente entra) */}
            <div>
              <label className={labelClass}>Unidades Totales Compradas (Stock)</label>
              <input required type="number" name="cantidadComprada" value={formData.cantidadComprada} onChange={handleChange} className={inputClass} placeholder="Ej: 24" />
              <p className="text-xs text-gray-500 mt-1">Cantidad física de unidades que ingresan al kiosco.</p>
            </div>

            <div>
              <label className={labelClass}>Margen Ganancia (%)</label>
              <input required type="number" name="margenGanancia" value={formData.margenGanancia} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
            <input type="checkbox" name="tieneIVA" checked={formData.tieneIVA} onChange={handleChange} id="iva" className="h-5 w-5 text-blue-600" />
            <label htmlFor="iva" className="text-sm font-medium text-gray-700">El precio incluye IVA (21%)</label>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border-2 border-green-100 flex flex-col items-center justify-center">
            <span className="text-green-600 font-semibold uppercase tracking-wider text-xs">Precio de Venta Sugerido</span>
            <span className="text-5xl font-black text-green-700 mt-2">${preciosCalculados.precioVenta}</span>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-bold text-lg p-4 rounded-xl hover:bg-blue-700 transition shadow-lg">
            {loading ? 'Guardando...' : '✅ Guardar Producto'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
