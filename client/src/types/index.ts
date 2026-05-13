export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'reservada';
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  disponible: number;
  categoria_id?: number;
  descripcion?: string;
  categoria_nombre?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface CategoriaMenu {
  id: number;
  nombre: string;
  productos: Producto[];
}

export interface ItemCarrito extends Producto {
  cantidad: number;
  observaciones: string;
}

export interface ProductoPedido {
  nombre: string;
  cantidad: number;
  subtotal: number;
}

export interface PedidoCaja {
  id: number;
  mesa_numero?: number;
  mesero: string;
  estado: string;
  total: number;
  productos: ProductoPedido[];
  tipo?: 'mesa' | 'domicilio';
  cliente_nombre?: string;
  direccion_entrega?: string;
  estado_domicilio?: string;
  costo_domicilio?: number;
}

export interface ProductoComanda {
  nombre: string;
  cantidad: number;
  observaciones?: string;
}

export interface PedidoCocina {
  id: number;
  mesa_numero?: number;
  mesa_id?: number;
  mesero: string;
  estado: string;
  productos: ProductoComanda[];
  observaciones?: string;
  created_at: string;
  tipo?: 'mesa' | 'domicilio';
  cliente_nombre?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'mesero' | 'cocina' | 'cajero';
  activo: number;
}

export interface Empleado {
  id: number;
  nombre: string;
  documento?: string;
  cargo?: string;
  salario_base?: number;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  banco?: string;
  cuenta_bancaria?: string;
  activo: number;
}

export interface Egreso {
  id: number;
  concepto: string;
  monto: number;
  categoria: 'servicios' | 'nomina' | 'insumos' | 'otros';
  fecha: string;
  empleado_id?: number | null;
  empleado_nombre?: string;
}

export interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: 'kg' | 'gr' | 'lt' | 'und';
  stock_actual: number;
  stock_minimo: number;
}
