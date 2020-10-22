import { ProductoCargado } from "./productoCargado";

export interface Factura {
    noCheque?: any;
    nombreBanco?: string;
    tipoPago?: string;
    estado?: any;
    id?: any;
    Descripcion?: string
    Detalle?: ProductoCargado[]
    IDDocumento?: string
    IdCliente?: string
    Serie?: string
    Total?: number
    SaldoPagado?: number
    usuario?: string
    visitada?: boolean
    Tipo?: number;
    IDEmpresa?: number;
}
