import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoCargado } from '../interfaces/productoCargado';
import { AngularFirestore } from '@angular/fire/firestore';
import { UtilitiesService } from './utilities.service';
import { Devolucion } from '../interfaces/devolucion';
import { DataService } from './data.service';
import { Correlativo } from '../interfaces/correlativo';
import { FacturasService } from './facturas.service';
import { Ruta } from '../interfaces/ruta';
import { Factura } from '../interfaces/factura';
@Injectable({
  providedIn: 'root',
})
export class DevolucionService {
  userID: string;
  conectado: boolean;
  constructor(
    public afs: AngularFirestore,
    public uti: UtilitiesService,
    public data: DataService,
    public facturasService: FacturasService,
    private router: Router
  ) {
    this.userID = localStorage.getItem('userID');
    this.data.$userID.subscribe((userID: string) => {
      if (userID) {
        this.userID = userID;
      }
    });
    this.data.$connected.subscribe((conectado) => {
      this.conectado = conectado;
    });
  }
  async emitirDevolucion(
    item: ProductoCargado,
    descuento: number,
    llaveFactura: string,
    canasta: ProductoCargado[],
    facturaID: string,
    serieFactura: string,
    it: Ruta,
    factura: Factura,
    llaveIt: string
  ) {
    const pivotItem: ProductoCargado = {
      idProducto: item.idProducto,
      Cantidad: item.Cantidad,
      Subtotal: item.Subtotal,
      IDTipoPrecio: item.IDTipoPrecio,
      UnidadxPresentacion: item.UnidadxPresentacion,
      IDInterno: item.IDInterno,
      CODBodega: item.CODBodega,
      Lote: item.Lote,
      FechaVencimiento: item.FechaVencimiento,
      CODTipoMovimientoDoc: item.CODTipoMovimientoDoc,
      IDEmpresaDoc: localStorage.getItem('empresa'),
    };

    item.Cantidad -= descuento;
    item = this.calcularSubTotal(item);
    canasta[item.index] = item;
    this.afs
      .collection('facturas')
      .doc(llaveFactura)
      .update({ Detalle: canasta });

    /*let correlativoCobroSnap = await this.afs.collection("correlativosli").doc(this.userID).get().toPromise(),
      correlativoCobro = correlativoCobroSnap.data() as Correlativo;*/

    const viajeSnap = await this.afs
        .collection('encabezado-viaje')
        .doc(this.userID)
        .get()
        .toPromise(),
      viaje = viajeSnap.data();

    console.log(item);

    const devolucion: Devolucion = {
      IDInterno: pivotItem.IDInterno,
      CODBodega: pivotItem.CODBodega,
      Lote: pivotItem.Lote,
      FechaVencimiento: pivotItem.FechaVencimiento,
      CODTipoMovimientoDoc: pivotItem.CODTipoMovimientoDoc,
      IDEmpresaDoc: pivotItem.IDEmpresaDoc,
      serie: viaje.Serie,
      correlativo: viaje.IDViaje, // correlativoCobro.NumeroDocumento,
      serieFactura,
      idFactura: parseInt(facturaID),
      idProducto: pivotItem.idProducto,
      cantidad: pivotItem.Cantidad,
      saldoCantidad: descuento,
      unidadesDev: descuento,
      UnidadxPresentacion: pivotItem.UnidadxPresentacion,
      precioUnitario: pivotItem.Subtotal / pivotItem.Cantidad,
      idTipoPrecio: pivotItem.IDTipoPrecio,
    };

    it.estado = 3;
    console.log(it);
    if (this.conectado) {
      this.enviarDevolucion(devolucion);
    } else {
      this.guardarDevolucion(devolucion);
    }

    if (this.conectado) {
      this.facturasService.enviarCambioFactura(it);
    } else {
      this.facturasService.crearPendienteFactura(it);
    }

    /*try
    {
      correlativoCobro.NumeroDocumento++;
      this.guardarCambioCorrelativoDevolucion(correlativoCobro);
    }
    catch(e)
    {}*/

    let total = 0;
    canasta.forEach((p) => {
      if (p.Subtotal) {
        total += p.Subtotal;
      }
    });

    this.afs.collection('facturas').doc(llaveFactura).update({ Total: total });

    factura.Total = total;
    factura.id = llaveFactura;

    const seCobra = await this.uti.presentAlertConfirm(
      '¿Desea realizar un cobro ahora?',
      'Es necesario que primero realice las devoluciones y luego indique el cobro \'Aceptar\'.'
    );
    it.id = llaveIt;
    this.afs.collection('viajes').doc(it.id).update({ visitada: true });
    this.afs.collection('viajes').doc(it.id).update({ estado: 3 });

    if (seCobra) {
      await this.facturasService.cambiarEstado(it, 5, factura, seCobra, true);
    }
  }

  guardarCambioCorrelativoDevolucion(correlativo: Correlativo): Promise<any> {
    return this.afs
      .collection('correlativosli')
      .doc(this.userID)
      .update(correlativo);
  }
  calcularSubTotal(item: ProductoCargado): ProductoCargado {
    let precioUsado = 0;
    console.log(item);
    /*if (item.Rango3 && item.Cantidad >= item.Rango3)
      item.Subtotal = item.PrecioRango3 * item.Cantidad;
    else if (item.Rango2 && item.Cantidad >= item.Rango2)
      item.Subtotal = item.PrecioRango2 * item.Cantidad;
    else if (item.Rango1 && item.Cantidad >= item.Rango1)
      item.Subtotal = item.PrecioRango1 * item.Cantidad;
    else*/
    item.Subtotal = item.PrecioUnitario * item.Cantidad;

    precioUsado = item.Subtotal / item.Cantidad;
    item.Subtotal = Math.round(item.Subtotal * 100) / 100;
    item.Cantidad = Math.round((item.Subtotal / precioUsado) * 100) / 100;
    item.bloqueado = true;

    return item;
  }
  enviarDevolucion(devolucion: Devolucion, notRetry?: boolean) {
    return new Promise(async (res, rej) => {
      try {
        const r: any = await this.uti.httpRequest(
          `pilot-dev`,
          false,
          true,
          null,
          null,
          devolucion,
          true
        );
        if (r.error === 0) {
          res(true);
        } else {
          if (!notRetry) {
            this.guardarDevolucion(devolucion);
          }
          res(false);
        }
      } catch (e) {
        if (!notRetry) {
          this.guardarDevolucion(devolucion);
        }
        res(false);
      }
    });
  }
  guardarDevolucion(devolucion: Devolucion) {
    return this.afs
      .collection('pendientes')
      .doc(this.userID)
      .collection('devoluciones')
      .add(devolucion);
  }
  subirDevolucionesPendientes() {
    return new Promise((res, rej) => {
      this.afs
        .collection('pendientes')
        .doc(this.userID)
        .collection('devoluciones')
        .get()
        .toPromise()
        .then(async (s) => {
          if (s.empty) {
            res(true);
            return;
          } else {
            const d = s.docs;
            for (const k in d) {
              const ss = d[k];
              const dejo = await this.enviarDevolucion(
                ss.data() as Devolucion,
                true
              );
              if (dejo) {
                this.afs
                  .collection('pendientes')
                  .doc(this.userID)
                  .collection('devoluciones')
                  .doc(ss.id)
                  .delete();
              }
            }
          }
        });
    });
  }
}
