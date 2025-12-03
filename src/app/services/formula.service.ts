import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  ClienteFormula,
  Formula,
  FormulaConCliente,
} from '../models/formula.model';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class FormulaService {
  constructor(private supabase: SupabaseService) {}

  // ============ CLIENTES FÓRMULA ============

  /**
   * Obtener todos los clientes que solo vienen por fórmula
   */
  async getClientesFormula(): Promise<ClienteFormula[]> {
    const { data, error } = await this.supabase.client
      .from('clientes_formula')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo clientes fórmula:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Buscar cliente de fórmula por identificación
   */
  async getClienteFormulaPorIdentificacion(
    identificacion: string
  ): Promise<ClienteFormula | null> {
    const { data, error } = await this.supabase.client
      .from('clientes_formula')
      .select('*')
      .eq('identificacion', identificacion)
      .maybeSingle();

    if (error) {
      console.error('Error buscando cliente fórmula:', error);
      throw error;
    }

    return data;
  }

  /**
   * Crear nuevo cliente de fórmula
   */
  async createClienteFormula(
    cliente: ClienteFormula
  ): Promise<ClienteFormula> {
    const { data, error } = await this.supabase.client
      .from('clientes_formula')
      .insert([cliente])
      .select()
      .single();

    if (error) {
      console.error('Error creando cliente fórmula:', error);
      throw error;
    }

    return data;
  }

  /**
   * Actualizar cliente de fórmula
   */
  async updateClienteFormula(
    id: string,
    cliente: Partial<ClienteFormula>
  ): Promise<ClienteFormula> {
    const { data, error } = await this.supabase.client
      .from('clientes_formula')
      .update({ ...cliente, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando cliente fórmula:', error);
      throw error;
    }

    return data;
  }

  // ============ FÓRMULAS ============

  /**
   * Obtener todas las fórmulas con información expandida
   */
  async getFormulas(): Promise<FormulaConCliente[]> {
    const { data, error } = await this.supabase.client
      .from('formulas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo fórmulas:', error);
      throw error;
    }

    // Enriquecer con tipo de cliente
    const formulasEnriquecidas = data.map((formula) => ({
      ...formula,
      tipo_cliente: formula.cliente_compra_id ? 'compra' : 'formula',
    })) as FormulaConCliente[];

    return formulasEnriquecidas;
  }

  /**
   * Obtener fórmula por ID
   */
  async getFormulaPorId(id: string): Promise<Formula | null> {
    const { data, error } = await this.supabase.client
      .from('formulas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error obteniendo fórmula:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtener historial de fórmulas de un paciente (por identificación)
   */
  async getHistorialFormulas(identificacion: string): Promise<Formula[]> {
    const { data, error } = await this.supabase.client
      .from('formulas')
      .select('*')
      .eq('identificacion', identificacion)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo historial de fórmulas:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Crear nueva fórmula
   */
  async createFormula(formula: Formula): Promise<Formula> {
    // Generar número de fórmula si no existe
    if (!formula.numero_formula) {
      formula.numero_formula = await this.generarNumeroFormula();
    }

    const { data, error } = await this.supabase.client
      .from('formulas')
      .insert([formula])
      .select()
      .single();

    if (error) {
      console.error('Error creando fórmula:', error);
      throw error;
    }

    return data;
  }

  /**
   * Actualizar fórmula existente
   */
  async updateFormula(id: string, formula: Partial<Formula>): Promise<Formula> {
    const { data, error } = await this.supabase.client
      .from('formulas')
      .update({ ...formula, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando fórmula:', error);
      throw error;
    }

    return data;
  }

  /**
   * Eliminar fórmula
   */
  async deleteFormula(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('formulas').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando fórmula:', error);
      throw error;
    }
  }

  // ============ BÚSQUEDA UNIFICADA ============

  /**
   * Buscar cliente en ambas tablas (clientes de compra y clientes de fórmula)
   */
  async buscarClientePorIdentificacion(
    identificacion: string
  ): Promise<{
    encontrado: boolean;
    tipo: 'compra' | 'formula' | null;
    cliente: Cliente | ClienteFormula | null;
  }> {
    // Primero buscar en clientes de compra
    const { data: clienteCompra, error: errorCompra } = await this.supabase.client
      .from('clientes')
      .select('*')
      .eq('cedula', identificacion)
      .maybeSingle();

    if (clienteCompra) {
      return {
        encontrado: true,
        tipo: 'compra',
        cliente: clienteCompra,
      };
    }

    // Si no está, buscar en clientes de fórmula
    const { data: clienteFormula, error: errorFormula } = await this.supabase.client
      .from('clientes_formula')
      .select('*')
      .eq('identificacion', identificacion)
      .maybeSingle();

    if (clienteFormula) {
      return {
        encontrado: true,
        tipo: 'formula',
        cliente: clienteFormula,
      };
    }

    return {
      encontrado: false,
      tipo: null,
      cliente: null,
    };
  }

  // ============ UTILIDADES ============

  /**
   * Generar número de fórmula único (año-consecutivo)
   */
  private async generarNumeroFormula(): Promise<string> {
    const year = new Date().getFullYear();

    // Obtener el último número del año actual
    const { data, error } = await this.supabase.client
      .from('formulas')
      .select('numero_formula')
      .like('numero_formula', `${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error generando número de fórmula:', error);
    }

    let consecutivo = 1;

    if (data?.numero_formula) {
      const partes = data.numero_formula.split('-');
      if (partes.length === 2) {
        consecutivo = parseInt(partes[1]) + 1;
      }
    }

    return `${year}-${consecutivo.toString().padStart(3, '0')}`;
  }

  /**
   * Obtener estadísticas de fórmulas
   */
  async getEstadisticas(): Promise<{
    total: number;
    porTipo: Record<string, number>;
    ultimoMes: number;
  }> {
    const { data, error } = await this.supabase.client
      .from('formulas')
      .select('tipo_lentes, created_at');

    if (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }

    const ahora = new Date();
    const haceUnMes = new Date(ahora.setMonth(ahora.getMonth() - 1));

    const porTipo: Record<string, number> = {};
    let ultimoMes = 0;

    data.forEach((formula) => {
      // Contar por tipo
      const tipo = formula.tipo_lentes || 'SIN ESPECIFICAR';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;

      // Contar último mes
      if (new Date(formula.created_at) >= haceUnMes) {
        ultimoMes++;
      }
    });

    return {
      total: data.length,
      porTipo,
      ultimoMes,
    };
  }
}
