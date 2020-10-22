export interface Devolucion {
    "serie": string,
    "correlativo": number,
    "serieFactura": string,
    "idFactura": number,
    "idProducto": string,
    "cantidad": number,
    "saldoCantidad": number,
    "unidadesDev": number,
    "precioUnitario": number,
    "idTipoPrecio": number,
    IDInterno?: number;
    IDEmpresaDoc?: string;
    CODTipoMovimientoDoc?: string;
    CODBodega?: string;
    Lote?: string;
    FechaVencimiento?: string;
    UnidadxPresentacion?: number;
}
