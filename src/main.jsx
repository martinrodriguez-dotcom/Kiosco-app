import React from 'react'
import ReactDOM from 'react-dom/client'
import KioscoSystem from './SystemManager.jsx' // <--- Fíjate que busca en la misma carpeta

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KioscoSystem />
  </React.StrictMode>,
)
