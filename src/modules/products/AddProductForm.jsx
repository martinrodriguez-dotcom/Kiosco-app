import React, { useState, useEffect } from 'react';
import { calculateProductPricing } from './productLogic';
import { createProduct } from './productsService';

const AddProductForm = () => {
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    codigoBarras: '',
    costoBulto: 0,
    cantidadBulto: 1,
    cantidadComprada: 1, // Cuantos bultos compramos
    margenGanancia: 30, // Default 30%
    tieneIVA: true,
  });

  const [preciosCalculados, setPreciosCalculados] = useState({ costoUnitario: 0, precioVenta: 0 });
  const [loading, setLoading] = useState(false);

  // Hook: Cada vez que cambian los datos numéricos, recalculamos el precio visualmente
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

    // Agregamos el precio calculado final al objeto que vamos a guardar
    const dataToSave = {
      ...formData,
      precioVenta: preciosCalculados.precioVenta,
      costoUnitario: preciosCalculados.costoUnitario
    };

    const result = await createProduct(dataToSave);
    
    if (result.success) {
      alert("Producto cargado con éxito");
      // Resetear form...
      setFormData({ ...formData, nombre: '', codigoBarras: '', costoBulto: 0 });
    } else {
      alert("Error al guardar");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cargar Nuevo Producto</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre y Código */}
        <div>
          <label className="block text-sm font-medium">Nombre del Producto</label>
          <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Código de Barras</label>
          <input type="text" name="codigoBarras" value={formData.codigoBarras} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Costo del Bulto ($)</label>
            <input required type="number" name="costoBulto" value={formData.costoBulto} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Unidades por Bulto</label>
            <input required type="number" name="cantidadBulto" value={formData.cantidadBulto} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        {/* Muestra cálculo automático del costo unitario */}
        <div className="bg-gray-100 p-2 rounded text-sm">
          Costo por unidad calculado: <strong>${preciosCalculados.costoUnitario}</strong>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-medium">Bultos Comprados (Stock)</label>
            <input required type="number" name="cantidadComprada" value={formData.cantidadComprada} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Margen Ganancia (%)</label>
            <input required type="number" name="margenGanancia" value={formData.margenGanancia} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input type="checkbox" name="tieneIVA" checked={formData.tieneIVA} onChange={handleChange} id="iva" />
          <label htmlFor="iva" className="text-sm font-medium">¿Aplica IVA (21%)?</label>
        </div>

        {/* Precio Final Resaltado */}
        <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
          <span className="block text-gray-600 text-sm">Precio de Venta Sugerido (x unidad)</span>
          <span className="block text-3xl font-bold text-green-700">${preciosCalculados.precioVenta}</span>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition">
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;
