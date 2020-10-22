export interface ReciboLiquidar {
    id: string;
    selected?: any;
    facturas: any[];
    cobrosRealizados: any[];
    totalEfectivo: number;
    totalCheque: number
    serieRec: string;
    correlativoRec: number,
    liquidado: boolean,
    deposito?: string
}
