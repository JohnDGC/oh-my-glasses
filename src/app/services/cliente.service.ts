import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Cliente,
  ClienteCompra,
  ClienteReferido,
  ClienteAbono,
} from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  constructor(private supabase: SupabaseService) {}

  async getClientes(): Promise<Cliente[]> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }

    return data || [];
  }

  async getClienteById(id: string): Promise<Cliente | null> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }

    return data;
  }

  async verificarCedulaExistente(
    cedula: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = this.supabase.client
      .from('clientes')
      .select('id, cedula, nombres')
      .eq('cedula', cedula);

    if (excludeId) query = query.neq('id', excludeId);

    const { data, error } = await query;

    if (error) {
      console.error('Error al verificar cédula:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  }

  async createCliente(cliente: Cliente): Promise<Cliente> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .insert([
        {
          nombres: cliente.nombres,
          cedula: cliente.cedula,
          fecha_nacimiento: cliente.fecha_nacimiento,
          telefono: cliente.telefono,
          correo: cliente.correo,
          fecha_registro: new Date().toISOString(),
          es_referido: cliente.es_referido || false,
          cliente_referidor_id: cliente.cliente_referidor_id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear cliente:', error);

      if (error.code === '23505' && error.message.includes('cedula')) {
        throw new Error(
          `Ya existe un cliente registrado con la cédula ${cliente.cedula}`
        );
      }

      throw error;
    }

    return data;
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }

    return data;
  }

  async deleteCliente(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  async getComprasByCliente(clienteId: string): Promise<ClienteCompra[]> {
    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha_compra', { ascending: false });

    if (error) {
      console.error('Error al obtener compras:', error);
      throw error;
    }

    return data || [];
  }

  async createCompra(compra: ClienteCompra): Promise<ClienteCompra> {
    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .insert([
        {
          cliente_id: compra.cliente_id,
          tipo_lente: compra.tipo_lente,
          tipo_montura: compra.tipo_montura,
          rango_precio: compra.rango_precio,
          precio_total: compra.precio_total || null,
          abono: compra.abono || null,
          fecha_compra: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al registrar compra:', error);
      throw error;
    }

    // Si hay un abono inicial, registrarlo en el historial
    if (compra.abono && compra.abono > 0 && data?.id) {
      await this.createAbono({
        compra_id: data.id,
        monto: compra.abono,
        fecha_abono: new Date().toISOString().split('T')[0], // Fecha de hoy
        nota: 'Abono inicial de compra',
      });
    }

    return data;
  }

  async updateCompra(
    id: string,
    compra: Partial<ClienteCompra>
  ): Promise<ClienteCompra> {
    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .update({
        tipo_lente: compra.tipo_lente,
        tipo_montura: compra.tipo_montura,
        rango_precio: compra.rango_precio,
        precio_total: compra.precio_total || null,
        abono: compra.abono || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar compra:', error);
      throw error;
    }

    return data;
  }

  async deleteCompra(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('cliente_compras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar compra:', error);
      throw error;
    }
  }

  // ========== ABONOS ==========

  async getAbonosByCompra(compraId: string): Promise<ClienteAbono[]> {
    const { data, error } = await this.supabase.client
      .from('cliente_abonos')
      .select('*')
      .eq('compra_id', compraId)
      .order('fecha_abono', { ascending: true });

    if (error) {
      console.error('Error al obtener abonos:', error);
      throw error;
    }

    return data || [];
  }

  async createAbono(abono: ClienteAbono): Promise<ClienteAbono> {
    // 1. Crear el abono
    const { data, error } = await this.supabase.client
      .from('cliente_abonos')
      .insert([
        {
          compra_id: abono.compra_id,
          monto: abono.monto,
          fecha_abono: abono.fecha_abono,
          nota: abono.nota || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al registrar abono:', error);
      throw error;
    }

    // 2. Actualizar el total de abono en la compra
    await this.updateTotalAbonoCompra(abono.compra_id);

    return data;
  }

  async deleteAbono(id: string, compraId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('cliente_abonos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar abono:', error);
      throw error;
    }

    // Actualizar el total de abono en la compra
    await this.updateTotalAbonoCompra(compraId);
  }

  private async updateTotalAbonoCompra(compraId: string): Promise<void> {
    // Obtener todos los abonos para sumar
    const abonos = await this.getAbonosByCompra(compraId);
    const totalAbonado = abonos.reduce((sum, a) => sum + Number(a.monto), 0);

    // Actualizar la compra
    const { error } = await this.supabase.client
      .from('cliente_compras')
      .update({ abono: totalAbonado })
      .eq('id', compraId);

    if (error) {
      console.error('Error al actualizar total abono en compra:', error);
      // No lanzamos error para no romper el flujo principal si el abono ya se creó/borró
    }
  }

  async getReferidosByCliente(clienteId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('cliente_referidos')
      .select(
        `
        *,
        cliente_referido:clientes!cliente_referidos_cliente_referido_id_fkey(*)
      `
      )
      .eq('cliente_referidor_id', clienteId)
      .order('fecha_referido', { ascending: false });

    if (error) {
      console.error('Error al obtener referidos:', error);
      throw error;
    }

    return data || [];
  }

  async createReferido(referido: ClienteReferido): Promise<ClienteReferido> {
    const { data, error } = await this.supabase.client
      .from('cliente_referidos')
      .insert([referido])
      .select()
      .single();

    if (error) {
      console.error('Error al registrar referido:', error);
      throw error;
    }

    return data;
  }

  // ========== CASHBACK ==========

  /**
   * Obtiene el cashback acumulado de un cliente
   */
  async getCashback(clienteId: string): Promise<number> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .select('cashback_acumulado')
      .eq('id', clienteId)
      .single();

    if (error) {
      console.error('Error al obtener cashback:', error);
      return 0;
    }

    return data?.cashback_acumulado || 0;
  }

  /**
   * Agrega cashback al acumulado de un cliente
   */
  async addCashback(clienteId: string, monto: number): Promise<number> {
    // Primero obtener el cashback actual
    const cashbackActual = await this.getCashback(clienteId);
    const nuevoCashback = cashbackActual + monto;

    const { data, error } = await this.supabase.client
      .from('clientes')
      .update({ cashback_acumulado: nuevoCashback })
      .eq('id', clienteId)
      .select('cashback_acumulado')
      .single();

    if (error) {
      console.error('Error al agregar cashback:', error);
      throw error;
    }

    return data?.cashback_acumulado || nuevoCashback;
  }

  /**
   * Reinicia el cashback de un cliente a 0 (cuando lo redime)
   */
  async resetCashback(clienteId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('clientes')
      .update({ cashback_acumulado: 0 })
      .eq('id', clienteId);

    if (error) {
      console.error('Error al reiniciar cashback:', error);
      throw error;
    }
  }

  /**
   * Obtiene la última compra de un cliente referido
   * (para calcular el cashback del referidor)
   */
  async getUltimaCompraCliente(
    clienteId: string
  ): Promise<ClienteCompra | null> {
    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha_compra', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener última compra:', error);
      return null;
    }

    return data;
  }

  async redimirReferidosActivos(
    clienteId: string,
    fechaRedencion: string
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('cliente_referidos')
      .update({
        estado: 'redimido',
        fecha_redimido: fechaRedencion,
      })
      .eq('cliente_referidor_id', clienteId)
      .eq('estado', 'activo');

    if (error) {
      console.error('Error al redimir referidos:', error);
      throw error;
    }
  }

  /**
   * Asigna un referidor a un cliente existente y genera el cashback correspondiente
   * basado en su última (o primera) compra.
   */
  async asignarReferidorRetroactivo(
    clienteId: string,
    clienteReferidorId: string
  ): Promise<void> {
    // 1. Verificar si ya tiene compras
    const ultimaCompra = await this.getUltimaCompraCliente(clienteId);

    // 2. Actualizar cliente (asignar referidor)
    const { error: errorCliente } = await this.supabase.client
      .from('clientes')
      .update({
        es_referido: true,
        cliente_referidor_id: clienteReferidorId,
      })
      .eq('id', clienteId);

    if (errorCliente) {
      console.error('Error al asignar referidor:', errorCliente);
      throw errorCliente;
    }

    // 3. Si tiene compra, generar registro de referido y cashback
    if (ultimaCompra && ultimaCompra.rango_precio) {
      // Necesitamos importar calcularCashback o moverlo aquí.
      // Como movimos la lógica a un util compartido, lo importaremos al inicio del archivo.
      // Por ahora, asumiremos que se importará.
      // IMPORTANTE: Este archivo necesita importar calcularCashback
      const { calcularCashback } = await import(
        '../shared/utils/cashback.util'
      );
      const cashbackInfo = calcularCashback(ultimaCompra.rango_precio);

      if (cashbackInfo.monto > 0) {
        // Crear registro de referido
        await this.createReferido({
          cliente_referidor_id: clienteReferidorId,
          cliente_referido_id: clienteId,
          fecha_referido: new Date().toISOString(), // Usamos fecha actual como fecha de "referencia" efectiva
          estado: 'activo',
          cashback_generado: cashbackInfo.monto,
          rango_precio_compra: ultimaCompra.rango_precio,
        });

        // Sumar cashback al referidor
        await this.addCashback(clienteReferidorId, cashbackInfo.monto);
      }
    }
  }

  /**
   * Cambia o remueve el referidor de un cliente, ajustando cashback y registros
   * @param clienteId ID del cliente
   * @param antiguoReferidorId ID del referidor anterior (null si no tenía)
   * @param nuevoReferidorId ID del nuevo referidor (null si se está removiendo)
   */
  async cambiarReferidor(
    clienteId: string,
    antiguoReferidorId: string | null,
    nuevoReferidorId: string | null
  ): Promise<void> {
    // 1. Si había un referidor anterior, revertir el cashback
    if (antiguoReferidorId) {
      // Buscar el registro de referido
      const { data: referidoAntiguo, error: errorBuscar } =
        await this.supabase.client
          .from('cliente_referidos')
          .select('*')
          .eq('cliente_referido_id', clienteId)
          .eq('cliente_referidor_id', antiguoReferidorId)
          .single();

      if (errorBuscar) {
        console.error('Error buscando referido antiguo:', errorBuscar);
        // Continuar de todos modos para intentar limpiar
      }

      // Eliminar el registro de referido
      const { error: errorEliminar } = await this.supabase.client
        .from('cliente_referidos')
        .delete()
        .eq('cliente_referido_id', clienteId)
        .eq('cliente_referidor_id', antiguoReferidorId);

      if (errorEliminar) {
        console.error('Error eliminando referido antiguo:', errorEliminar);
        throw new Error('No se pudo eliminar el registro de referido anterior');
      }

      // Revertir el cashback del referidor anterior
      if (referidoAntiguo?.cashback_generado) {
        const { data: referidorAntiguo } = await this.supabase.client
          .from('clientes')
          .select('cashback_acumulado')
          .eq('id', antiguoReferidorId)
          .single();

        const nuevoCashback =
          (referidorAntiguo?.cashback_acumulado || 0) -
          referidoAntiguo.cashback_generado;

        const { error: errorCashback } = await this.supabase.client
          .from('clientes')
          .update({ cashback_acumulado: Math.max(0, nuevoCashback) })
          .eq('id', antiguoReferidorId);

        if (errorCashback) {
          console.error(
            'Error revirtiendo cashback del referidor anterior:',
            errorCashback
          );
        }
      }
    }

    // 2. Si hay un nuevo referidor, asignarlo retroactivamente
    if (nuevoReferidorId) {
      await this.asignarReferidorRetroactivo(clienteId, nuevoReferidorId);
    }
  }
}
