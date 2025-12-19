import React from 'react';
// Asegúrate de que la ruta coincida con donde guardaste el formulario
import AddProductForm from './modules/products/AddProductForm';

function App() {
  return (
    <div className="App">
      <h1 className="text-3xl font-bold text-center my-4">Sistema de Gestión Kiosco</h1>
      {/* Aquí mostramos el componente que creamos antes */}
      <AddProductForm />
    </div>
  );
}

export default App;
