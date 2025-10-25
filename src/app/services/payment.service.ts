import { Injectable } from '@angular/core';

export interface WompiCheckoutConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl?: string;
  customerData?: {
    email: string;
    fullName: string;
    phoneNumber: string;
    phoneNumberPrefix: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  // Clave pública de prueba de Wompi (reemplazar con la tuya)
  private readonly PUBLIC_KEY_TEST = 'pub_test_XXXXXXXXXXXXXXX'; // TODO: Obtener de tu cuenta Wompi
  private readonly PUBLIC_KEY_PROD = 'pub_prod_XXXXXXXXXXXXXXX'; // Para producción
  // Usar test o prod según el ambiente
  private readonly isProduction = false;
  private readonly publicKey = this.isProduction ? this.PUBLIC_KEY_PROD : this.PUBLIC_KEY_TEST;

  constructor() { }

  /**
   * Genera una referencia única para la transacción
   */
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `OMG-${timestamp}-${random}`;
  }

  /**
   * Abre el widget de Wompi para procesar el pago
   */
  openCheckout(config: Partial<WompiCheckoutConfig>): void {
    // Validar que existe el script de Wompi
    if (!(window as any).WidgetCheckout) {
      console.error('El script de Wompi no está cargado');
      alert('Error al cargar el sistema de pagos. Por favor recarga la página.');
      return;
    }

    const checkoutConfig: WompiCheckoutConfig = {
      currency: config.currency || 'COP',
      amountInCents: config.amountInCents || 0,
      reference: config.reference || this.generateReference(),
      publicKey: this.publicKey,
      redirectUrl: config.redirectUrl || `${window.location.origin}/payment-confirmation`,
      customerData: config.customerData
    };

    // Crear instancia del widget de Wompi
    const checkout = new (window as any).WidgetCheckout({
      currency: checkoutConfig.currency,
      amountInCents: checkoutConfig.amountInCents,
      reference: checkoutConfig.reference,
      publicKey: checkoutConfig.publicKey,
      redirectUrl: checkoutConfig.redirectUrl,
      customerData: checkoutConfig.customerData
    });

    // Abrir el widget
    checkout.open((result: any) => {
      const transaction = result.transaction;
      console.log('Transacción completada:', transaction);

      // Aquí puedes manejar el resultado
      if (transaction.status === 'APPROVED') {
        console.log('✅ Pago aprobado!');
        // Redirigir a página de éxito o mostrar mensaje
      } else if (transaction.status === 'DECLINED') {
        console.log('❌ Pago rechazado');
        // Mostrar mensaje de error
      } else if (transaction.status === 'PENDING') {
        console.log('⏳ Pago pendiente');
        // Mostrar mensaje de pendiente
      }
    });
  }

  /**
   * Calcula el monto en centavos para Wompi
   */
  convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Formatea el precio para mostrar
   */
  formatPrice(amountInCents: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amountInCents / 100);
  }
}
