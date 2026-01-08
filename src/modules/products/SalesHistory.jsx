import React, { useEffect, useState } from 'react';
import { getActiveSales, closeCashbox } from './productsService';
import { Calendar, CreditCard, Banknote, Download, X, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { jsPDF } from "jspdf";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showConfirmClose, setShowConfirmClose] = useState(false); // Pregunta: ¿Seguro?
  const [showFinalReport, setShowFinalReport] = useState(false);   // Reporte Final + PDF
  
  // Datos del Cierre (para mostrar en el reporte final estático)
  const [closingData, setClosingData] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const res = await getActiveSales(); // Usamos la función que trae solo lo NO cerrado
    if (res.success) setSales(res.data);
    setLoading(false);
  };

  // Cálculos actuales (en vivo)
  const totalEfectivo = sales.filter(s => s.metodoPago === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const totalMP = sales.filter(s => s.metodoPago === 'Mercado Pago').reduce((acc, curr) => acc + curr.total, 0);
  const totalGeneral = totalEfectivo + totalMP;

  // --- 1. GENERAR PDF (DISEÑO PRO) ---
  const generatePDF = (data = null) => {
    // Usamos los datos pasados o los actuales
    const efectivo = data ? data.efectivo : totalEfectivo;
    const mp = data ? data.mp : totalMP;
    const total = data ? data.total : totalGeneral;
    const items = data ? data.salesSnapshot : sales;
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();

    const doc = new jsPDF();

    // -- ENCABEZADO TIPO APP --
    doc.setFillColor(30, 58, 138); // Azul oscuro (blue-900)
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Kiosco App", 20, 20); // Nombre App
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Cierre de Caja", 20, 30);
    
    doc.text(`Fecha: ${fecha} - Hora: ${hora}`, 150, 25, null, null, "right");
    doc.text(`Usuario: Administrador`, 150, 33, null, null, "right"); // Placeholder usuario

    // -- TARJETAS DE TOTALES --
    let y = 55;
    
    // Caja Efectivo
    doc.setFillColor(220, 252, 231); // Verde claro
    doc.rect(20, y, 80, 25, 'F');
    doc.setTextColor(22, 101, 52); // Verde oscuro
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EFECTIVO", 25, y + 10);
    doc.setFontSize(18);
    doc.text(`$ ${efectivo}`, 25, y + 20);

    // Caja Mercado Pago
    doc.setFillColor(219, 234, 254); // Azul claro
    doc.rect(110, y, 80, 25, 'F');
    doc.setTextColor(30, 64, 175); // Azul oscuro
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("MERCADO PAGO", 115, y + 10);
    doc.setFontSize(18);
    doc.text(`$ ${mp}`, 115, y + 20);

    y += 40;

    // Total General
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("TOTAL RECAUDADO:", 20, y);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`$ ${total}`, 80, y);
    doc.line(20, y + 2, 190, y + 2); // Línea subrayado

    y += 15;

    // -- DETALLE DE MOVIMIENTOS --
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Ventas:", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Encabezados de tabla simple
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 5, 170, 8, 'F');
    doc.text("Hora", 22, y);
    doc.text("Método", 45, y);
    doc.text("Productos", 90, y);
    doc.text("Total", 170, y);
    y += 8;

    items.forEach((sale) => {
      const time = sale.createdAt?.seconds 
        ? new Date(sale.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        : '-';
      
      const itemsText = sale.items.map(i => `(${i.cantidadVenta}) ${i.nombre}`).join(", ");
      
      // Control de página
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(time, 22, y);
      doc.text(sale.metodoPago, 45, y);
      
      // Texto largo de productos cortado
      const splitTitle = doc.splitTextToSize(itemsText, 75);
      doc.text(splitTitle, 90, y);
      
      doc.setFont("helvetica", "bold");
      doc.text(`$${sale.total}`, 170, y);
      doc.setFont("helvetica", "normal");

      // Ajustar Y basado en líneas de productos
      y += (splitTitle.length * 5) + 3;
      doc.setDrawColor(230, 230, 230);
      doc.line(20, y-2, 190, y-2); // Línea separadora tenue
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Comprobante generado automáticamente por Kiosco App", 105, 290, null, null, "center");

    doc.save(`Cierre_Caja_${fecha.replace(/\//g, '-')}.pdf`);
  };

  // --- 2. LÓGICA DE CIERRE REAL ---
  const handleConfirmClose = async () => {
    if (sales.length === 0) return;

    // 1. Preparamos los datos finales antes de borrar
    const finalData = {
      efectivo: totalEfectivo,
      mp: totalMP,
      total: totalGeneral,
      salesSnapshot: [...sales], // Copia de seguridad local
      closedBy: "Admin", // Placeholder
      date: new Date()
    };

    // 2. Guardamos en Firebase y "Borramos" (Archivamos)
    const salesIds = sales.map(s => s.id);
    const res = await closeCashbox(salesIds, finalData);

    if (res.success) {
      setClosingData(finalData); // Guardamos para mostrar el modal final
      setSales([]); // Limpiamos la vista local inmediatamente
      setShowConfirmClose(false);
      setShowFinalReport(true); // Mostramos el éxito y opción de PDF
    } else {
      alert("Error al cerrar caja. Intente nuevamente.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando caja...</div>;

  return (
    <div className="animate-fadeIn pb-24">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Caja Actual</h2>
        {sales.length > 0 && (
          <button 
            onClick={() => setShowConfirmClose(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-red-700 transition flex items-center gap-2 text-sm"
          >
            <AlertTriangle size={18} /> CERRAR CAJA
          </button>
        )}
      </div>

      {/* RESUMEN ACTUAL (EN VIVO) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Banknote size={20} /> <span className="font-bold text-sm uppercase">Efectivo</span>
            </div>
            <p className="text-3xl font-black text-green-800">${totalEfectivo}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <CreditCard size={20} /> <span className="font-bold text-sm uppercase">Mercado Pago</span>
            </div>
            <p className="text-3xl font-black text-blue-800">${totalMP}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-gray-500 font-bold">Total Acumulado</span>
            <span className="text-2xl font-black text-gray-800">${totalGeneral}</span>
        </div>
      </div>

      {/* LISTA DE MOVIMIENTOS */}
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm">
        <Calendar size={16}/> Movimientos sin cerrar
      </h3>

      <div className="space-y-3">
        {sales.map((sale) => (
          <div key={sale.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
             <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mr-2 ${sale.metodoPago === 'Efectivo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {sale.metodoPago}
                </span>
                <span className="text-sm font-bold text-gray-700">${sale.total}</span>
                <p className="text-xs text-gray-400 mt-1">
                   {sale.items.length} productos • {sale.createdAt?.seconds ? new Date(sale.createdAt.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                </p>
             </div>
          </div>
        ))}
        {sales.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
             <p className="text-gray-400 font-bold">La caja está vacía o cerrada.</p>
             <p className="text-xs text-gray-400 mt-1">Realiza ventas para ver movimientos aquí.</p>
          </div>
        )}
      </div>

      {/* --- MODAL 1: PREGUNTA DE SEGURIDAD --- */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
              <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">¿Cerrar Caja definitivamente?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Esto archivará <b>{sales.length} ventas</b> y dejará el contador en cero. 
                <br/>Esta acción no se puede deshacer.
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setShowConfirmClose(false)} className="bg-gray-200 text-gray-700 py-3 rounded-lg font-bold">Cancelar</button>
                 <button onClick={handleConfirmClose} className="bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg">Sí, Cerrar</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL 2: ÉXITO + PDF --- */}
      {showFinalReport && closingData && (
        <div className="fixed inset-0 bg-blue-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center animate-bounce-short">
              <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                 <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-1">¡Caja Cerrada!</h3>
              <p className="text-gray-400 text-sm mb-6">Los movimientos se han guardado en el historial.</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 text-left">
                 <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Total Efectivo:</span>
                    <span className="font-bold text-gray-800">${closingData.efectivo}</span>
                 </div>
                 <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Total MP:</span>
                    <span className="font-bold text-gray-800">${closingData.mp}</span>
                 </div>
                 <div className="border-t pt-2 flex justify-between">
                    <span className="font-black text-blue-900">TOTAL FINAL:</span>
                    <span className="font-black text-blue-900">${closingData.total}</span>
                 </div>
              </div>

              <button 
                 onClick={() => generatePDF(closingData)} 
                 className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 mb-3"
              >
                 <Download size={20}/> Descargar PDF
              </button>
              
              <button 
                 onClick={() => setShowFinalReport(false)} 
                 className="text-gray-400 hover:text-gray-600 text-sm underline"
              >
                 Volver al inicio
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
