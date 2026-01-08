import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    // Configuración del escáner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // Rectángulo más ancho para códigos de barra
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    // Función que se ejecuta al detectar código
    const successCallback = (decodedText) => {
      onScanSuccess(decodedText);
      scanner.clear(); // Limpiamos la cámara al tener éxito
    };

    const errorCallback = (errorMessage) => {
      // Ignoramos errores de "no se detectó código" para no llenar la consola
    };

    scanner.render(successCallback, errorCallback);

    // Limpieza al desmontar el componente (cerrar cámara)
    return () => {
      scanner.clear().catch(error => console.error("Error al limpiar escáner", error));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl overflow-hidden p-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold z-10 hover:bg-red-100 hover:text-red-600"
        >
          Cancelar
        </button>
        
        <h3 className="text-center font-bold text-gray-700 mb-4">Escaneando Código...</h3>
        
        {/* Aquí la librería inyecta el video */}
        <div id="reader" className="w-full"></div>
        
        <p className="text-xs text-center text-gray-400 mt-4">
          Apunta la cámara al código de barras
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
