import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DataService } from './data.service';
import { Correlativo } from '../interfaces/correlativo';
import { UtilitiesService } from './utilities.service';
import { FirebaseMethodsService } from './firebase-methods.service';
import { User } from '../interfaces/user';
import { Orden } from "../interfaces/orden";
import { Producto } from '../interfaces/producto';
import { Ruta } from '../interfaces/ruta';
import { Router } from '@angular/router';
import { PrinterbtService } from "../servicios/printerbt.service";
import { Orden_f } from "../interfaces/orden_f";

import { Canasta } from "./../interfaces/canasta";
import { Factura } from '../interfaces/factura';

@Injectable({
  providedIn: 'root'
})
export class OrdenesService {

  conectado: boolean;
  userID: string;
  IDEmpresa: number;

  constructor(
    public afs: AngularFirestore,
    public data: DataService,
    public fm: FirebaseMethodsService,
    public utilities: UtilitiesService,

    public router: Router,
    public printer: PrinterbtService
  ) {
    this.userID = localStorage.getItem("userID")
    this.data.$connected.subscribe(conectado => {
      this.conectado = conectado;
    })
  }

  async crearOrden(orden: Orden, productos: Producto[], cliente: Ruta) {
    this.userID = localStorage.getItem("userID");
    this.IDEmpresa = parseInt(localStorage.getItem("empresa"));
    let loading: HTMLIonLoadingElement;
    loading = await this.utilities.createLoading('Procesando...');

    let correlativo: Correlativo = await this.obtenerSiguienteOrden();
    if (correlativo.NumeroDocumento === correlativo.RangoFinal) {
      loading.dismiss();
      let confirmar = await this.utilities.presentAlertConfirm("Ha llegado al límite de ordenes", "Su correlativo es el último, necesitas agregar más, para ello contacta al administrador y solicita más, si ya lo has hecho y tienes internet, presiona 'continuar'.")
      if (confirmar && this.conectado) {
        loading.dismiss();
        correlativo = await this.fm.cargarCorrelativoOrdenVentas()
        this.crearOrden(orden, productos, cliente)
      } else
        loading.dismiss();
      this.utilities.presentAlert("No puede crear más ordenes", "Su correlativo para ordenes de venta ha llegado a su límite, solicita más e intenta de nuevo más tarde.")
      return;
    }

    loading.dismiss();
    // Genear la orden
    orden.descripcion = "" + await this.utilities.presentAlertPrompt("Si necesita agregar una nota, ingresela ahora", "Podrá agregar una nota, es opcional")
    orden.fechaDoc = (new Date()).getTime()
    let usuarioSnap = await this.afs.collection("usuarios").doc(this.userID).get().toPromise(), usuario: User = usuarioSnap.data() as User
    let detalle = []
    productos.forEach(producto => {
      detalle.push(this.convertItemCanasta(producto))
    });
    orden.detalle = detalle
    // Agregar el correlativo y guardar

    try {
      if (this.conectado) {
        this.enviarOrden(correlativo, usuario, cliente, orden)
      } else {
        this.crearPendiente(correlativo, usuario, cliente, orden)
      }
    } catch (error) {
      console.log(error)
      this.utilities.presentAlert("No se pudo enviar la solicitud", "Por favor, contacte al administrador " + error)
    }
    this.guardarSiguienteOrden(correlativo.NumeroDocumento + 1)
  }
  obtenerSiguienteOrden(): Promise<Correlativo> {
    return new Promise(async (res, rej) => {
      let snap = await this.afs.collection("correlativosov/").doc(this.userID).get().toPromise()
      res(snap.data() as Correlativo);
    })
  }
  guardarSiguienteOrden(NumeroDocumento: number) {
    return this.afs.collection("correlativosov/").doc(this.userID).update({ NumeroDocumento })

  }
  crearPendiente(correlativo: Correlativo, usuario: User, cliente: Ruta, orden: Orden) {
    return new Promise(async (res, rej) => {
      this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").add(this.convertToOrden(correlativo, usuario, cliente, orden));

      this.terminarProceso(cliente, usuario, orden, correlativo)
      res(true)
    });
  }
  convertItemCanasta(item: Producto) {
    return {
      "idProducto": item.CODProducto,
      "cantidad": item.cantidad,
      "precioUnitario": item.total / item.cantidad,
      "unidadXpresentacion": item.UnidadxPresentacion,
      "Nombre": item.Nombre
    }
  }
  convertToOrden(correlativo: Correlativo, usuario: User, cliente: Ruta, orden: Orden): Orden_f {
    return {
      "serie": correlativo.Serie,
      "IDTipoPrecio": cliente.IDTipoPrecio,
      "correlativo": correlativo.NumeroDocumento,
      "usuario": usuario.CODUsuarioV,
      "idVendedor": usuario.CODUsuario,
      "fechaDoc": orden.fechaDoc,
      "descripcion": orden.descripcion || "",
      "idCliente": orden.idCliente,
      "total": orden.total,
      "diasVencimiento": orden.diasVencimiento,
      "detalle": orden.detalle,
      RazonSocial: cliente.RazonSocial,
      IDEmpresa: this.IDEmpresa
    }
  }

  borrarItinerario(serie: String, correlativo: Number) {
    return new Promise(async (res, rej) => {
      try {
        let r: any = await this.utilities.httpRequest("vendor-delete-it", false, true, null, null, {
          "idDocumento": correlativo,
          "serie": serie
        }, true);

        if (r.error == 0) res(true);
        else res(false);
      }
      catch (error) {
        console.log(error);
        res(false);
      }
    });
  }

  marcarRuta(IDDocumento: number, Serie: string, IDEmpresa: number, CODPiloto: string) {
    return new Promise(async (res, rej) => {
      try {
        let r: any = await this.utilities.httpRequest("mark-travel", false, true, null, null, {
          "IDDocumento": IDDocumento,
          "Serie": Serie,
          "IDEmpresa": IDEmpresa,
          "CODPiloto": CODPiloto
        }, true);

        if (r.error == 0) res(true);
        else res(false);
      }
      catch (error) {
        console.log(error);
        res(false);
      }
    });
  }

  async enviarOrden(correlativo: Correlativo, usuario: User, cliente: Ruta, orden: Orden) {
    let loading: HTMLIonLoadingElement = await this.utilities.createLoading('Procesando...');
    return new Promise(async (res, rej) => {
      try {
        let r: any = await this.utilities.httpRequest("vendor-sale-order", false, true, null, null, this.convertToOrden(correlativo, usuario, cliente, orden), true);
        loading.dismiss();
        if (r.error === 0) {
          loading.dismiss();
          this.terminarProceso(cliente, usuario, orden, correlativo)

        } else {
          loading.dismiss();
          this.crearPendiente(correlativo, usuario, cliente, orden)

        }

      } catch (error) {
        loading.dismiss();
        console.log(error)
        this.crearPendiente(correlativo, usuario, cliente, orden)

      }
      loading.dismiss();
      res(true)
    });
  }
  terminarProceso(cliente: Ruta, usuario: User, orden: Orden, correlativo: Correlativo) {
    this.fm.marcarVisitaRuta(cliente)
    this.afs.collection("canasta").doc(this.userID).collection("items").get().toPromise().then(async (ss) => {
      let dd = ss.docs
      for (const i in dd) {
        const ddd = dd[i];
        try {
          this.afs.collection("canasta").doc(this.userID).collection("items").doc(ddd.id).delete()
        } catch (e) { console.log(e) }
      }
    })
    this.afs.collection("canasta").doc(this.userID).delete()
    this.imprimirRecibo(orden.detalle, cliente, orden, usuario, correlativo).then(s => {
      this.router.navigate(["/ruta-del-dia"])
    });
  }
  imprimirRecibo(productos: Producto[], cliente: Ruta, orden: Orden, usuario: User, correlativo: Correlativo) {
    this.afs.collection("ordenes-generadas").add({
      productos, cliente, orden, usuario, correlativo, clienteID: cliente.CODCliente
    })
    return new Promise(async (res, rej) => {
      let confirmar = await this.utilities.presentAlertConfirm("¿Desea imprimir un recibo?", "Por favor, seleccione aceptar, si desea imprimir recibo de orden de venta.")
      if (confirmar)
        try {
          await this.printer.initBTPrinter()
          await this.printer.crearImpresion(productos, cliente, orden, usuario, correlativo)
          res(true)
        } catch (error) {
          console.log(error)
          this.afs.collection("error").add({ error: error.toString(), usuario: this.userID })
          rej(error)
        }
      else
        res(true)
    })
  }
  async cargarPendientes(OrdenesPendientes: Orden_f[]) {
    for (const i in OrdenesPendientes) {
      console.log("Cargando pendiente")
      const element = OrdenesPendientes[i];
      try {
        let r: any = await this.utilities.httpRequest("vendor-sale-order", false, true, null, null, element, true);
        if (r.error === 0) {
          this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").doc(element.id).delete()
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
}
