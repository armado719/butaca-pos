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
  mesa_numero: number;
  mesero: string;
  estado: string;
  total: number;
  productos: ProductoPedido[];
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
}
