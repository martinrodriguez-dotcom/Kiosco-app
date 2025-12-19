import { db } from "../../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "products";

export const createProduct = async (productData) => {
  try {
    // Limpiamos los datos antes de enviar y agregamos timestamps
    const payload = {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Aseguramos que los números se guarden como números y no strings
      costoBulto: parseFloat(productData.costoBulto),
      cantidadBulto: parseInt(productData.cantidadBulto),
      cantidadComprada: parseInt(productData.cantidadComprada), // Stock inicial
      margenGanancia: parseFloat(productData.margenGanancia),
      precioVenta: parseFloat(productData.precioVenta),
      stockActual: parseInt(productData.cantidadBulto) * parseInt(productData.cantidadComprada) // Calculamos stock total en unidades
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar producto:", error);
    return { success: false, error };
  }
};
