/**
 * Calcula el precio unitario y el precio final de venta
 */
export const calculateProductPricing = (values) => {
  const {
    costoBulto,
    cantidadBulto,
    margenGanancia, // En porcentaje (ej: 30 para 30%)
    tieneIVA // Booleano
  } = values;

  // 1. Evitar división por cero
  if (!cantidadBulto || cantidadBulto <= 0) return { costoUnitario: 0, precioVenta: 0 };

  // 2. Calcular costo por unidad
  const costoUnitario = parseFloat(costoBulto) / parseFloat(cantidadBulto);

  // 3. Calcular Ganancia
  // Nota: El margen se aplica sobre el costo unitario
  const montoGanancia = costoUnitario * (parseFloat(margenGanancia) / 100);

  // 4. Calcular Base antes de impuestos
  const precioBase = costoUnitario + montoGanancia;

  // 5. Calcular IVA (21%) si aplica
  // Nota: Generalmente el IVA se agrega al final
  const montoIVA = tieneIVA ? (precioBase * 0.21) : 0;

  // 6. Precio Final
  const precioVenta = precioBase + montoIVA;

  return {
    costoUnitario: costoUnitario.toFixed(2), // Redondeamos a 2 decimales
    precioVenta: Math.ceil(precioVenta) // Redondeamos hacia arriba para no tener monedas chicas (opcional)
  };
};
