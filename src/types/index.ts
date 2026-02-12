// User types
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  rol: 'admin' | 'user';
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Vehicle types
export type VehicleStatus = 'Disponible' | 'Vendido' | 'Inactivo';

export interface Vehicle {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  kilometraje: number;
  estado: VehicleStatus;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMileage {
  id: number;
  vehicleId: number;
  kilometrajeAnterior: number;
  kilometrajeNuevo: number;
  usuarioId: number;
  usuarioNombre: string;
  observacion?: string;
  fechaRegistro: string;
}

// Contract types
export type ContractStatus = 'Borrador' | 'Vigente' | 'Cancelado' | 'Anulado';
export type PaymentFrequency = 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual';

export interface Contract {
  id: number;
  vehicleId: number;
  vehicle?: Vehicle;
  fechaInicio: string;
  precio: number;
  pagoInicial: number;
  numeroCuotas: number;
  frecuencia: PaymentFrequency;
  estado: ContractStatus;
  clienteNombre?: string;
  clienteDni?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  observaciones?: string;
  pagoInicialRegistrado: boolean;
  comisionPorcentaje?: number;
  moraPorcentaje?: number;
  cronograma?: PaymentSchedule[];
  createdAt: string;
  updatedAt: string;
}

// Payment Schedule types
export type ScheduleStatus = 'Pendiente' | 'Pagada' | 'Vencida';

export interface PaymentSchedule {
  id: number;
  contractId: number;
  numeroCuota: number;
  fechaVencimiento: string;
  capital: number;
  total: number;
  montoPagado: number;
  saldo: number;
  estado: ScheduleStatus;
  montoSubcontrato?: number;
  subcontractIds?: string;
  createdAt: string;
}

// Payment types
export type PaymentType = 'Pago Inicial' | 'Cuota' | 'Abono';
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Yape' | 'Plin' | 'Tarjeta' | 'Otro';

export interface Payment {
  id: number;
  contractId: number;
  contract?: Contract;
  scheduleId?: number;
  tipo: PaymentType;
  importe: number;
  fechaPago: string;
  medioPago: PaymentMethod;
  numeroOperacion?: string;
  voucher?: string;
  notas?: string;
  usuarioId: number;
  usuarioNombre: string;
  createdAt: string;
}

// Report types
export interface ArrearsReportItem {
  placa: string;
  contractId: number;
  fechaContrato: string;
  cuotasVencidas: number;
  montoVencido: number;
  maxDiasAtraso: number;
  ultimoPago: {
    fecha: string | null;
    importe: number | null;
  };
  frecuencia: PaymentFrequency;
  estado: ContractStatus;
}

export interface QuickSearchResult {
  placa: string;
  estado: string;
  vehicleStatus: string;
  contratoActivo: {
    id: number;
    estado: ContractStatus;
    fechaInicio: string;
    precio: number;
    pagoInicial: number;
  } | null;
  proximaCuota: {
    numero: number;
    fechaVencimiento: string;
    importe: number;
  } | null;
  deudaVencida: number;
  totalPagado: number;
}

export type SemaforoStatus = 'verde' | 'ambar' | 'rojo';

export interface TrafficLightItem {
  vehicleId: number;
  placa: string;
  marca: string;
  modelo: string;
  contractId: number;
  clienteNombre: string;
  clienteTelefono: string;
  frecuencia: PaymentFrequency;
  cuotasVencidas: number;
  montoVencido: number;
  diasAtraso: number;
  semaforo: SemaforoStatus;
  ultimoPago: string | null;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard types
export interface DashboardStats {
  totalVehiculos: number;
  vehiculosDisponibles: number;
  contratosVigentes: number;
  totalCobradoMes: number;
  totalPendiente: number;
  totalMoraAcumulada: number;
  semaforo: {
    verde: number;
    ambar: number;
    rojo: number;
  };
  cobranzasMensuales: {
    mes: string;
    cobrado: number;
    pendiente: number;
  }[];
}

// Subcontract types
export type SubcontractMode = 'Independiente' | 'AgregarACuotas';
export type SubcontractStatus = 'Vigente' | 'Cancelado' | 'Anulado';

export interface SubcontractSchedule {
  id: number;
  subcontractId: number;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  montoPagado: number;
  saldo: number;
  estado: string;
  createdAt: string;
}

export interface Subcontract {
  id: number;
  parentContractId: number;
  parentContract?: Contract;
  tipo: string;
  modalidad: SubcontractMode;
  monto: number;
  numeroCuotas?: number;
  frecuencia?: PaymentFrequency;
  fechaInicio: string;
  descripcion?: string;
  estado: SubcontractStatus;
  cronograma?: SubcontractSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcontractDto {
  parentContractId: number;
  tipo: string;
  modalidad: SubcontractMode;
  monto: number;
  numeroCuotas?: number;
  frecuencia?: PaymentFrequency;
  fechaInicio: string;
  descripcion?: string;
}
