import { Injectable } from '@angular/core';
import { calcularCashback, CashbackInfo } from '../shared/utils/cashback.util';

export interface MensajeWhatsApp {
  telefono: string;
  mensaje: string;
}

export type { CashbackInfo };

export interface WhatsAppConfig {
  nombreNegocio: string;
  mensajeBienvenida: string;
  mensajeReferido: string;
}

const DEFAULT_CONFIG: WhatsAppConfig = {
  nombreNegocio: 'OhMyGlasses',
  mensajeBienvenida: `Bienvenido/a a {NEGOCIO}, {NOMBRE}!

Ya eres parte de nuestro Sistema de Fidelización OMG.
Tus beneficios:
- Promociones especiales por tu cumpleaños
- Cashback por cada cliente referido

Refiere a un amigo y gana beneficios adicionales!

Gracias por confiar en nosotros.

{NEGOCIO}`,
  mensajeReferido: `Felicidades {NOMBRE_REFERIDOR}!

{NOMBRE_REFERIDO} hizo una compra en {NEGOCIO} gracias a ti.

Tu beneficio por esta compra:
- Cashback: {CASHBACK_COMPRA}

Total cashback acumulado: {CASHBACK_TOTAL}
Este cashback lo puedes redimir en tu próxima compra.
Sigue refiriendo amigos y acumula más beneficios!

{NEGOCIO}`,
};

const STORAGE_KEY = 'whatsapp_config';

@Injectable({
  providedIn: 'root',
})
export class WhatsAppService {
  private readonly CODIGO_PAIS = '57';
  private config: WhatsAppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Carga la configuración desde localStorage o usa la default
   */
  private loadConfig(): WhatsAppConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading WhatsApp config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig(config: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
  }

  getConfig(): WhatsAppConfig {
    return { ...this.config };
  }

  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem(STORAGE_KEY);
  }

  getDefaultConfig(): WhatsAppConfig {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Calcula el cashback según el rango de precio de la compra
   * - $0 - $300.000: $10.000
   * - $300.000 - $600.000: $15.000
   * - $600.000 - $1.000.000: $20.000
   * - $1.000.000 - $1.500.000: $25.000
   * - $1.500.000 en adelante: $30.000
   */
  /**
   * Calcula el cashback según el rango de precio de la compra
   * DEPRECATED: Usar la utilidad compartida calculateCashback
   * Se mantiene como wrapper por compatibilidad si es necesario, o se elimina.
   * En este caso, redirigimos a la utilidad.
   */
  calcularCashback(rangoPrecio: string): CashbackInfo {
    return calcularCashback(rangoPrecio);
  }

  generarMensajeBienvenida(nombreCliente: string): string {
    const primerNombre = nombreCliente.split(' ')[0];

    return this.config.mensajeBienvenida
      .replace(/{NEGOCIO}/g, this.config.nombreNegocio)
      .replace(/{NOMBRE}/g, primerNombre);
  }

  generarMensajeReferido(
    nombreReferidor: string,
    nombreReferido: string,
    rangoPrecioCompra: string,
    cashbackAcumulado: number = 0,
    esNuevoRegistro: boolean = true
  ): string {
    const primerNombreReferidor = nombreReferidor.split(' ')[0];
    const partesNombreReferido = nombreReferido.split(' ');
    const primerNombreReferido = partesNombreReferido[0];
    const apellidoReferido =
      partesNombreReferido.length >= 3
        ? partesNombreReferido[2]
        : partesNombreReferido[1] || '';
    const nombreCompletoReferido = apellidoReferido
      ? `${primerNombreReferido} ${apellidoReferido}`
      : primerNombreReferido;

    const cashbackCompra = this.calcularCashback(rangoPrecioCompra);

    // Si es nuevo registro, el cashback aún no está en el total, hay que sumar
    // Si es cliente existente, el cashback ya está incluido en el total
    const totalCashback = esNuevoRegistro
      ? cashbackAcumulado + cashbackCompra.monto
      : cashbackAcumulado;

    return this.config.mensajeReferido
      .replace(/{NEGOCIO}/g, this.config.nombreNegocio)
      .replace(/{NOMBRE_REFERIDOR}/g, primerNombreReferidor)
      .replace(/{NOMBRE_REFERIDO}/g, nombreCompletoReferido)
      .replace(/{CASHBACK_COMPRA}/g, cashbackCompra.montoFormateado)
      .replace(/{RANGO_COMPRA}/g, cashbackCompra.rangoCompra)
      .replace(
        /{CASHBACK_TOTAL}/g,
        `$${totalCashback.toLocaleString('es-CO')}`
      );
  }

  formatearTelefono(telefono: string): string {
    let telefonoLimpio = telefono.replace(/[\s\-\(\)\+]/g, '');
    if (telefonoLimpio.startsWith('57') && telefonoLimpio.length === 12)
      return telefonoLimpio;

    if (telefonoLimpio.length === 10 && telefonoLimpio.startsWith('3'))
      return `${this.CODIGO_PAIS}${telefonoLimpio}`;

    return telefonoLimpio;
  }

  generarUrlWhatsApp(telefono: string, mensaje: string): string {
    const telefonoFormateado = this.formatearTelefono(telefono);
    const mensajeCodificado = encodeURIComponent(mensaje);

    return `https://wa.me/${telefonoFormateado}?text=${mensajeCodificado}`;
  }

  enviarMensajeBienvenida(telefono: string, nombreCliente: string): void {
    const mensaje = this.generarMensajeBienvenida(nombreCliente);
    const url = this.generarUrlWhatsApp(telefono, mensaje);
    window.open(url, '_blank');
  }

  enviarMensajeReferido(
    telefonoReferidor: string,
    nombreReferidor: string,
    nombreReferido: string,
    rangoPrecioCompra: string,
    cashbackAcumulado: number = 0,
    esNuevoRegistro: boolean = true
  ): void {
    const mensaje = this.generarMensajeReferido(
      nombreReferidor,
      nombreReferido,
      rangoPrecioCompra,
      cashbackAcumulado,
      esNuevoRegistro
    );
    const url = this.generarUrlWhatsApp(telefonoReferidor, mensaje);
    window.open(url, '_blank');
  }

  obtenerDatosMensajes(
    nuevoCliente: { nombres: string; telefono: string },
    referidor?: { nombres: string; telefono: string } | null,
    rangoPrecioCompra?: string,
    cashbackAcumulado: number = 0,
    esNuevoRegistro: boolean = true
  ): {
    bienvenida: MensajeWhatsApp;
    referido?: MensajeWhatsApp;
  } {
    const resultado: {
      bienvenida: MensajeWhatsApp;
      referido?: MensajeWhatsApp;
    } = {
      bienvenida: {
        telefono: nuevoCliente.telefono,
        mensaje: this.generarMensajeBienvenida(nuevoCliente.nombres),
      },
    };

    if (referidor && rangoPrecioCompra) {
      resultado.referido = {
        telefono: referidor.telefono,
        mensaje: this.generarMensajeReferido(
          referidor.nombres,
          nuevoCliente.nombres,
          rangoPrecioCompra,
          cashbackAcumulado,
          esNuevoRegistro
        ),
      };
    }

    return resultado;
  }
}
