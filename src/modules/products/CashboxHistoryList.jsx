import React, { useEffect, useState } from 'react';
import { getClosedSessions } from './productsService';
import { Clock, Download, X, ChevronRight, FileText, Truck } from 'lucide-react';
import { jsPDF } from "jspdf";

const CashboxHistoryList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getClosedSessions();
    if (res.success) setSessions(res.data);
    setLoading(false);
  };

  const generatePDF = (session) => {
    const data = session.finalSummary;
    const doc = new jsPDF();
    const fecha = new Date(session.createdAt.seconds * 1000).toLocaleDateString();
    
    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Historial Cierre", 105, 20, null, null, "center");
    
    doc.setTextColor(0, 0, 0);
    let y = 60;
    
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("BALANCE DE EFECTIVO", 20, y); y += 10;
    
    doc.setFontSize(12); doc.setFont("helvetica", "normal");
    doc.text(`(+) Cambio Inicial: $${data.inicioCaja}`, 20, y); y += 8;
    doc.text(`(+) Reserva Inicial: $${data.reservadoInicial || 0}`, 20, y); y += 8;
    doc.text(`(+) Ventas Efectivo: $${data.efectivoVentas}`, 20, y); y += 8;
    
    doc.setTextColor(220, 38, 38); 
    doc.text(`(-) Pagos Proveedores: $${data.pagosRealizados || 0}`, 20, y); y += 12;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`(=) TOTAL EN CAJÓN: $${data.totalFisicoEsperado}`, 20, y); 
    
    doc.save(`Historial_${fecha.replace(/\//g,'-')}.pdf`);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Cargando historial...</div>;

  return (
    <div className="pb-24 animate-fadeIn">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 p-2">
         <div className="bg-blue-100 p-3 rounded-full text-blue-700">
            <FileText size={24} />
         </div>
         <div>
            <h2 className="text-2xl font-bold text-gray-800">Historial de Cajas</h2>
            <p className="text-sm text-gray-500">Consulta los cierres pasados</p>
         </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
            const fecha = new Date(session.createdAt.seconds * 1000).toLocaleDateString();
            const total = session.finalSummary?.totalVentas || 0;

            return (
                <div 
                    key={session.id} 
                    onClick={() => setSelectedSession(session)}
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center group"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center min-w-[60px] border border-gray-100">
                            <span className="block text-lg font-black text-blue-900">{fecha.split('/')[0]}</span>
                            <span className="block text-xs font-bold text-blue-900">{fecha.split('/')[1]}</span>
                        </div>
                        
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">Cierre Ventas</span>
                            <p className="text-xl font-bold text-gray-800">${total}</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300"/>
                </div>
            );
        })}

        {sessions.length === 0 && (
            <div className="text-center p-10 text-gray-400 bg-white rounded-xl border border-dashed">
                No hay cajas cerradas en el historial.
            </div>
        )}
      </div>

      {/* MODAL DE DETALLE */}
      {selectedSession && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                  
                  {/* Header Modal */}
                  <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Detalle de Cierre</h3>
                      <button onClick={() => setSelectedSession(null)} className="bg-blue-800 p-1 rounded hover:bg-blue-700"><X size={20}/></button>
                  </div>

                  {/* Body Scrollable */}
                  <div className="p-6 overflow-y-auto">
                      <div className="text-center mb-6">
                          <p className="text-gray-500 text-sm">Fecha</p>
                          <p className="text-2xl font-black text-gray-800">
                             {new Date(selectedSession.createdAt.seconds * 1000).toLocaleDateString()}
                          </p>
                      </div>

                      {/* Tarjeta de Resumen */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200 space-y-2 text-sm">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">Dinero Físico (Cajón)</h4>
                          
                          <div className="flex justify-between">
                              <span className="text-gray-600">Cambio Inicial</span>
                              <span className="font-bold">${selectedSession.finalSummary.inicioCaja}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-600">Reserva Inicial</span>
                              <span className="font-bold">${selectedSession.finalSummary.reservadoInicial || 0}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-600">Ventas Efectivo</span>
                              <span className="font-bold">${selectedSession.finalSummary.efectivoVentas}</span>
                          </div>
                          
                          <div className="flex justify-between text-red-600 bg-red-50 p-1 rounded font-medium">
                              <span>Pagos Proveedores</span>
                              <span>-${selectedSession.finalSummary.pagosRealizados || 0}</span>
                          </div>

                          <div className="flex justify-between text-lg font-black text-blue-900 border-t border-gray-200 pt-2 mt-2">
                              <span>Total en Cajón</span>
                              <span>${selectedSession.finalSummary.totalFisicoEsperado}</span>
                          </div>
                      </div>

                      {/* LISTA DE PAGOS GUARDADA EN EL HISTORIAL */}
                      {selectedSession.finalSummary.paymentsSnapshot && selectedSession.finalSummary.paymentsSnapshot.length > 0 && (
                          <div className="mb-6">
                             <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                <Truck size={12}/> Detalle de Pagos
                             </h4>
                             <div className="bg-orange-50 border border-orange-100 rounded-lg overflow-hidden">
                                {selectedSession.finalSummary.paymentsSnapshot.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 border-b border-orange-100 last:border-0 text-xs text-gray-700">
                                        <span>{p.proveedor}</span>
                                        <span className="font-bold text-red-500">-${p.monto}</span>
                                    </div>
                                ))}
                             </div>
                          </div>
                      )}

                      <button 
                        onClick={() => generatePDF(selectedSession)}
                        className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition"
                      >
                          <Download size={18}/> Re-imprimir Reporte
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CashboxHistoryList;
