import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false); // Alternar entre Login y Registro
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Truco: Convertimos usuario simple a email falso para Firebase
  const emailFake = `${username.replace(/\s+/g, '').toLowerCase()}@kiosco.com`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // --- REGISTRO ---
        const userCredential = await createUserWithEmailAndPassword(auth, emailFake, password);
        const user = userCredential.user;
        
        // Guardamos el rol en Firestore (por defecto 'cajero')
        await setDoc(doc(db, "users", user.uid), {
          username: username,
          role: 'cajero', // Tú lo cambiarás a 'admin' en la base de datos manualmente
          email: emailFake
        });
        
        alert("Usuario creado. Rol inicial: CAJERO.");
      } else {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, emailFake, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
         setError('Usuario o contraseña incorrectos');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('Este usuario ya existe');
      } else if (err.code === 'auth/weak-password') {
         setError('La contraseña debe tener al menos 6 caracteres');
      } else {
         setError('Error al conectar con el servidor');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-800 p-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            {isRegistering ? 'Crear Usuario' : 'Bienvenido'}
          </h1>
          <p className="text-blue-200 text-sm mt-1">Sistema de Gestión Kiosco</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center font-bold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  placeholder="Ej: matias"
                  className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Procesando...' : (
                isRegistering ? <><UserPlus size={20}/> Registrarme</> : <><LogIn size={20}/> Ingresar</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes usuario? Regístrate aquí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
