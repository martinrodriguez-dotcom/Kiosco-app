import React, { useState, useEffect } from 'react';
import { getProducts, updateProductStock } from './productsService';
import { calculateProductPricing } from './productLogic';

const RestockForm = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [newData, setNewData] = useState({
    costoBulto: '',
    cantidadBulto: '',
    cantidadComprada: '' // Esto son UNIDADES
  });

  useEffect(() => {
    const load = async () => {
      const res = await getProducts();
      if (res.success) setProducts(res.data);
    };
    load();
  }, []);

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigoBarras && p.codigoBarras.includes(searchTerm))
  );

  const handleSelect = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(''); 
    setNewData({
      costoBulto: prod.costoBulto,
      cantidadBulto: prod.cantidadBulto,
      cantidadComprada: '' // Reiniciamos para que el usuario ponga cuántas compró
    });
  };

  const handleReponer = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // LÓGICA CORREGIDA: Suma directa de unidades
    const unidadesIngresadas = parseInt(newData.cantidadComprada);
    const nuevoStockTotal = parseInt(selectedProduct.stockActual || 0) + unidadesIngresadas;

    // Recalcular precios (por si subió el costo del bulto)
    const preciosNuevos = calculateProductPricing({
      costoBulto: newData.costoBulto,
      cantidadBulto: newData.cantidadBulto,
      margenGanancia: selectedProduct.margenGanancia,
      tieneIVA: selectedProduct.tieneIVA
    });

    const updatePayload = {
      stockActual: nuevoStockTotal,
      costoBulto: parseFloat(newData.costoBulto),
      cantidadBulto: parseInt(newData.cantidadBulto),
      costoUnitario: parseFloat(preciosNuevos.costoUnitario),
      precioVenta: preciosNuevos.precioVenta
    };

    const result = await updateProductStock(selectedProduct.id, updatePayload);

    if (result.success) {
      alert(`Stock actualizado. Se sumaron ${unidadesIngresadas} unidades.`);
      setSelectedProduct(null); 
      setNewData({ costoBulto: '', cantidadBulto: '', cantidadComprada: '' });
    } else {
      alert("Error al actualizar");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Reponer Mercadería</h2>

      {!selectedProduct && (
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            className="w-full p-3 border rounded shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="bg-white border mt-1 rounded max-h-60 overflow-y-auto shadow-lg">
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => handleSelect(p)} className="p-3 hover:bg-green-50 cursor-pointer border-b flex justify-between">
                  <span className="font-bold text-gray-700">{p.nombre}</span>
                  <span className="text-gray-500 text-sm">Stock: {p.stockActual}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <form onSubmit={handleReponer} className="bg-white p-6 rounded-lg shadow-md space-y-4 border-t-4 border-green-500">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg text-gray-800">{selectedProduct.nombre}</h3>
            <button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-red-500 hover:underline">Cambiar producto</button>
          </div>

          <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-2">
            ⚠️ Ingresa los nuevos costos y las unidades que ingresan.
          </div>

          <div>
            <label className="block text-sm font-medium">Costo NUEVO del Bulto ($)</label>
            <input required type="number" value={newData.costoBulto} onChange={(e) => setNewData({...newData, costoBulto: e.target.value})} className="w-full border p-2 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Unidades x Bulto</label>
              <input required type="number" value={newData.cantidadBulto} onChange={(e) => setNewData({...newData, cantidadBulto: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Unidades Compradas</label>
              <input required type="number" placeholder="Ej: 10" value={newData.cantidadComprada} onChange={(e) => setNewData({...newData, cantidadComprada: e.target.value})} className="w-full border p-2 rounded border-green-300 focus:ring-green-500" />
            </div>
          </div>

          <div className="bg-gray-100 p-3 rounded text-sm text-center">
            Stock Actual ({selectedProduct.stockActual}) + Ingreso ({newData.cantidadComprada || 0}) <br/>
            <strong>Nuevo Stock Total: {parseInt(selectedProduct.stockActual || 0) + parseInt(newData.cantidadComprada || 0)}</strong>
          </div>

          <button type="submit" className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 shadow-md">
            Confirmar Reposición
          </button>
        </form>
      )}
    </div>
  );
};

export default RestockForm;
