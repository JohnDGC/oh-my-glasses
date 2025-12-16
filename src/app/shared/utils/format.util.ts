/**
 * Utilidades de formato reutilizables
 */
export class FormatUtils {
  /**
   * Formatea una fecha a formato local
   * Maneja correctamente las fechas sin conversión de zona horaria
   */
  static formatDate(dateString: string, locale: string = 'es-CO'): string {
    if (!dateString) return '-';

    // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    // Crear fecha local sin conversión de zona horaria
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(locale);
  }

  /**
   * Formatea un número a moneda
   */
  static formatCurrency(
    value: number,
    currency: string = 'COP',
    locale: string = 'es-CO'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Formatea un número de teléfono
   */
  static formatPhone(phone: string, countryCode: string = '+57'): string {
    if (!phone) return '-';
    return `${countryCode} ${phone}`;
  }

  /**
   * Capitaliza la primera letra de cada palabra
   */
  static capitalize(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Trunca un texto a una longitud máxima
   */
  static truncate(
    text: string,
    maxLength: number,
    suffix: string = '...'
  ): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }
}
