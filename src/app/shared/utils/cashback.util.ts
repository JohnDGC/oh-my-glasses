export interface CashbackInfo {
  monto: number;
  montoFormateado: string;
  rangoCompra: string;
}

/**
 * Calcula el cashback según el rango de precio de la compra
 * - $0 - $300.000: $10.000
 * - $300.000 - $600.000: $15.000
 * - $600.000 - $1.000.000: $20.000
 * - $1.000.000 - $1.500.000: $25.000
 * - $1.500.000 en adelante: $30.000
 */
export function calcularCashback(rangoPrecio: string): CashbackInfo {
  const valores = rangoPrecio.replace(/[\$\.]/g, '').match(/\d+/g);
  const valorMaximo = valores ? parseInt(valores[valores.length - 1]) : 0;
  const esRangoAlto = rangoPrecio.toLowerCase().includes('adelante');
  let monto: number;
  let rangoCompra: string;

  if (valorMaximo <= 300000 && !esRangoAlto) {
    monto = 10000;
    rangoCompra = '$0 - $300.000';
  } else if (valorMaximo <= 600000 && !esRangoAlto) {
    monto = 15000;
    rangoCompra = '$300.000 - $600.000';
  } else if (valorMaximo <= 1000000 && !esRangoAlto) {
    monto = 20000;
    rangoCompra = '$600.000 - $1.000.000';
  } else if (valorMaximo <= 1500000 && !esRangoAlto) {
    monto = 25000;
    rangoCompra = '$1.000.000 - $1.500.000';
  } else {
    monto = 30000;
    rangoCompra = '$1.500.000 o más';
  }

  return {
    monto,
    montoFormateado: `$${monto.toLocaleString('es-CO')}`,
    rangoCompra,
  };
}
