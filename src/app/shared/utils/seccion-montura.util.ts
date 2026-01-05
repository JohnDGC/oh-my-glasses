import { Seccion, TipoMontura } from '../../models/cliente.model';

const PREMIUM_MONTURAS: TipoMontura[] = [
  'Taizu',
  'Fento',
  'MH',
  'Lacoste',
  'CK',
  'RayBan',
];

const CLASICAS: TipoMontura[] = [
  'Clásica 1',
  'Clásica 2',
  'Clásica 3',
  'Clásica 4',
];

export function mapMonturaToSeccion(
  tipoMontura: TipoMontura,
  seccionSeleccionada?: Seccion | null
): Seccion {
  // Si el usuario ya eligió la sección en la compra, respetar su selección
  if (seccionSeleccionada) {
    return seccionSeleccionada;
  }

  // Premium → Piedras Preciosas
  if (PREMIUM_MONTURAS.includes(tipoMontura)) {
    return 'Piedras Preciosas';
  }

  // Clásicas → asignar por defecto a Labradorita si no se especifica
  if (CLASICAS.includes(tipoMontura)) {
    return 'Labradorita';
  }

  // Fallback
  return 'Labradorita';
}
