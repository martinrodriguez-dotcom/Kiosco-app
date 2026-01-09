import React from 'react';

const Loading = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4 animate-fadeIn">
      {/* Spinner Moderno */}
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-400 font-bold text-sm tracking-widest animate-pulse">CARGANDO...</p>
    </div>
  );
};

export default Loading;
