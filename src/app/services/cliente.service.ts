import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Cliente,
  ClienteCompra,
  ClienteReferido,
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
}
