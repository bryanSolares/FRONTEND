import { Producto } from "./producto";

export interface Orden_f {
    id?: string;
    "serie": string,
    "correlativo": number,
    "usuario": string,
    "idVendedor": string,
    "fechaDoc": number,
    "descripcion": string,
    "idCliente": string,
    "total": number,
    "diasVencimiento": number,
    "detalle": Producto[],
    "IDTipoPrecio": number,
    RazonSocial?: string;
    IDEmpresa: number;

}
