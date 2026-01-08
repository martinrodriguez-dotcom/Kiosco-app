import React, { useEffect, useState } from 'react';
import { getSales } from './productsService';
import { Calendar, CreditCard, Banknote, Download, X, FileText, Share2 } from 'lucide-react';
import { jsPDF } from "jspdf";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    const loadSales = async () => {
      const res = await getSales();
      if (res.success) setSales(res.data);
      setLoading(false);
    };
    loadSales();
  }, []);

  // --- LÓGICA DE FILTRADO (SOLO HOY) ---
  const todayDate = new Date().toLocaleDateString();
  
  // Filtramos solo las ventas que ocurrieron hoy para el cierre
  const todaySales = sales.filter(sale => {
    if (!sale.createdAt) return false;
    const saleDate = new Date(sale.createdAt.seconds * 1000).toLocaleDateString();
    return saleDate === todayDate;
  });

  const totalEfectivoHoy = todaySales
    .filter(s => s.metodoPago === 'Efectivo')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalMPHoy = todaySales
    .filter(s => s.metodoPago === 'Mercado Pago')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalGeneralHoy = totalEfectivoHoy + totalMPHoy;

  // --- GENERAR PDF ---
  const generatePDF = () => {
    const doc = new jsPDF();
    const lineHeight = 10;
    let y = 20;

    // Título
    doc.setFontSize(18);
    doc.text("Resumen de Cierre de Caja", 105, y, null, null, "center");
    y += lineHeight;

    doc.setFontSize(12);
    doc.text(`Fecha: ${todayDate}`, 105, y, null, null, "center");
    y += lineHeight * 2;

    // Cuadro de Totales
    doc.setFontSize(14);
    doc.text("TOTALES DEL DÍA:", 20, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.text(`- Efectivo en Caja: $${totalEfectivoHoy}`, 20, y);
    y += lineHeight;
    doc.text(`- Mercado Pago: $${totalMPHoy}`, 20, y);
    y += lineHeight;
    doc.setFont(undefined, 'bold');
    doc.text(`- TOTAL VENTAS: $${totalGeneralHoy}`, 20, y);
    doc.setFont(undefined, 'normal');
    y += lineHeight * 2;

    // Detalle de Movimientos
    doc.text("Detalle de movimientos:", 20, y);
    y += lineHeight;
    
    doc.setFontSize(10);
    todaySales.forEach((sale) => {
      const time = new Date(sale.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const itemsSummary = sale.items.map(i => `${i.cantidadVenta} ${i.nombre}`).join(", ");
      
      // Control de salto de página
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(`${time} - ${sale.metodoPago} - $${sale.total}`, 20, y);
      y += 5;
      doc.setTextColor(100);
      doc.text(`   (${itemsSummary})`, 20, y);
      doc.setTextColor(0);
      y += 7;
    });

    // Guardar
    doc.save(`Cierre_Caja_${todayDate.replace(/\//g, '-')}.pdf`);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando movimientos...</div>;

  return (
    <div className="animate-fadeIn pb-24">
      
      {/* HEADER CON BOTÓN DE CIERRE */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Movimientos de Caja</h2>
        <button 
          onClick={() => setShowCloseModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-red-700 transition flex items-center gap-2 text-sm"
        >
          <FileText size={18} /> CERRAR CAJA
        </button>
      </div>

      {/* RESUMEN VISUAL RÁPIDO (DEL DÍA) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Ventas de Hoy ({todayDate})</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Banknote size={16} /> <span className="font-bold text-xs uppercase">Efectivo</span>
            </div>
            <p className="text-xl font-black text-green-800">${totalEfectivoHoy}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <CreditCard size={16} /> <span className="font-bold text-xs uppercase">Mercado Pago</span>
            </div>
            <p className="text-xl font-black text-blue-800">${totalMPHoy}</p>
          </div>
        </div>
      </div>

      {/* LISTA DE MOVIMIENTOS (Historial Completo) */}
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm">
        <Calendar size={16}/> Historial Reciente
      </h3>

      <div className="space-y-3">
        {sales.map((sale) => (
          <div key={sale.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex justify-between items-start">
            <div>
               <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${sale.metodoPago === 'Efectivo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {sale.metodoPago}
                  </span>
                  <span className="text-xs text-gray-400">
                    {sale.createdAt?.seconds ? new Date(sale.createdAt.seconds * 1000).toLocaleString() : 'Reciente'}
                  </span>
               </div>
               <div className="mt-2 text-sm text-gray-600">
                  {sale.items.map((item, idx) => (
                    <span key={idx} className="block">• {item.cantidadVenta} x {item.nombre}</span>
                  ))}
               </div>
            </div>
            <p className="text-lg font-bold text-gray-800">${sale.total}</p>
          </div>
        ))}
        {sales.length === 0 && <p className="text-center text-gray-400 py-10">No hay ventas registradas.</p>}
      </div>

      {/* --- MODAL DE CIERRE DE CAJA --- */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
            
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg">Cierre de Caja del Día</h2>
              <button onClick={() => setShowCloseModal(false)}><X size={24}/></button>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-500 text-sm mb-4">Resumen del {todayDate}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-green-800 font-medium flex items-center gap-2"><Banknote size={18}/> Efectivo</span>
                  <span className="text-xl font-bold text-green-900">${totalEfectivoHoy}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-800 font-medium flex items-center gap-2"><CreditCard size={18}/> Mercado Pago</span>
                  <span className="text-xl font-bold text-blue-900">${totalMPHoy}</span>
                </div>

                <div className="border-t-2 border-dashed pt-4 flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-lg">TOTAL GENERAL</span>
                  <span className="font-black text-gray-900 text-2xl">${totalGeneralHoy}</span>
                </div>
              </div>

              <button 
                onClick={generatePDF}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-black transition flex items-center justify-center gap-2"
              >
                <Download size={20}/> DESCARGAR PDF
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-3">
                Descarga el PDF para compartirlo por WhatsApp
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
