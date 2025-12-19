import { db } from "../../firebase/config";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "products";

/**
 * Guarda un nuevo producto en la base de datos
 */
export const createProduct = async (productData) => {
  try {
    // Preparamos los datos asegurando que los números sean números (no texto)
    const payload = {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      
      // Conversiones numéricas de seguridad
      costoBulto: parseFloat(productData.costoBulto),
      cantidadBulto: parseInt(productData.cantidadBulto),
      cantidadComprada: parseInt(productData.cantidadComprada), 
      margenGanancia: parseFloat(productData.margenGanancia),
      precioVenta: parseFloat(productData.precioVenta),
      costoUnitario: parseFloat(productData.costoUnitario),
      
      // Calculamos el stock total inicial (Bultos comprados * Unidades por bulto)
      stockActual: parseInt(productData.cantidadBulto) * parseInt(productData.cantidadComprada)
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar producto:", error);
    return { success: false, error };
  }
};

/**
 * Obtiene la lista completa de productos
 */
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    
    // Transformamos el formato extraño de Firebase a un array limpio de objetos
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,       // Recuperamos el ID del documento
      ...doc.data()     // Recuperamos el resto de los datos
    }));

    return { success: true, data: products };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return { success: false, error };
  }
};
