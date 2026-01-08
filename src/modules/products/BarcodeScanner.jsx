import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Configuración del escáner
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10, // Cuadros por segundo
      qrbox: { width: 250, height: 150 }, // El tamaño de la "caja" de lectura (rectangular para barras)
      aspectRatio: 1.0
    };

    // 2. Iniciar cámara trasera automáticamente
    html5QrCode.start(
      { facingMode: "environment" }, // "environment" fuerza la cámara trasera
      config,
      (decodedText) => {
        // Éxito al leer
        onScanSuccess(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Error de lectura (pasa mucho mientras buscas el código, lo ignoramos)
      }
    ).catch(err => {
      console.error("Error al iniciar cámara", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    });

    // Limpieza al salir
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
      }).catch(err => console.error("Error al detener", err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
      
      {/* Botón Cerrar (Arriba a la derecha) */}
      <button 
        onClick={() => { stopScanner(); onClose(); }}
        className="absolute top-6 right-6 z-50 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 backdrop-blur-md"
      >
        <X size={32} />
      </button>

      <div className="relative w-full max-w-md aspect-square overflow-hidden rounded-xl bg-black">
        
        {/* Aquí se inyecta el video de la cámara */}
        <div id="reader" className="w-full h-full object-cover"></div>

        {/* --- OVERLAY ESTILO MERCADOPAGO --- */}
        {/* Capa oscura semitransparente sobre el video */}
        <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none z-10 box-border rounded-xl"></div>
        
        {/* Marco Central (El área de escaneo) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-[250px] h-[150px] border-2 border-white/50 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            
            {/* Esquinas brillantes para dar efecto de "Mira" */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-4 border-t-4 border-green-500 -ml-1 -mt-1"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-r-4 border-t-4 border-green-500 -mr-1 -mt-1"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-green-500 -ml-1 -mb-1"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-green-500 -mr-1 -mb-1"></div>

            {/* LÍNEA ROJA (Efecto Láser) */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-600 shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse"></div>
            <p className="absolute -bottom-8 w-full text-center text-white text-sm font-semibold shadow-black drop-shadow-md">
              Apunta al código de barras
            </p>
          </div>
        </div>

      </div>

      {error && (
        <div className="absolute bottom-10 bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
