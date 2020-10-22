import { Injectable, NgModuleFactoryLoader } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { UtilitiesService } from './utilities.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Factura } from '../interfaces/factura';
import { Ruta } from '../interfaces/ruta';
import { pagoFactura } from "../interfaces/pagoFactura";
import { DataService } from './data.service';
import { ActionSheetController } from '@ionic/angular';
import { Correlativo } from '../interfaces/correlativo';
import { FirebaseMethodsService } from './firebase-methods.service';
import { PrinterbtService } from './printerbt.service';


@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  public userID: string;
  conectado: boolean;
  constructor(
    public afs: AngularFirestore,
    public utilities: UtilitiesService,
    public data: DataService,
    public actionSheetController: ActionSheetController,
    public fm: FirebaseMethodsService,
    public printer: PrinterbtService,
    private router: Router
  ) {
    this.userID = localStorage.getItem("userID")
    this.data.$connected.subscribe(conectado => {
      this.conectado = conectado;
    })
  }

  // CAMBIOS EN ESTADOS DE FACTURAS
  async cambiarEstado(it: Ruta, newEstado: number, factura: Factura, cobrar: boolean, dev?: boolean) {

    it.visitada = true


    if (newEstado === 6) {
      this.afs.collection("viajes").doc(it.id).update({ estado: newEstado });
      this.afs.collection("viajes").doc(it.id).update({ visitada: true });
      it.estado = 6;
      if (this.conectado) {
        this.enviarCambioFactura(it)
      } else {
        this.crearPendienteFactura(it)
      }
      return;
    }

    let monto: number;
    if (cobrar) {
      let maximo = Math.round((factura.Total - (factura.SaldoPagado || 0)) * 100) / 100;
      monto = parseFloat("" + await this.utilities.presentAlertPrompt("¿Cuál es el monto a cobrar?", "El total por pagar de esta factura es Q " + this.utilities.formatNumber(maximo), true, 1, maximo))
      console.log("MONTO", monto)
      console.log("MAXIMO", maximo)
      if (!monto || monto > maximo || monto <= 0) {
        await this.utilities.presentAlert("No se ha ingresado un monto adecuado", "Intente de nuevo, el monto máximo es Q " + this.utilities.formatNumber(maximo))
        return;
      } else if (monto === maximo) {
        newEstado = 4
      }
      /*else if (monto < maximo) {
        newEstado = 1
      }*/

      console.log(monto === maximo);
      console.log(newEstado);
      //this.afs.collection("viajes").doc(it.id).update({ visitada: true });

      /*if (!factura.SaldoPagado) factura.SaldoPagado = monto;
      else
        //factura.SaldoPagado += monto;
        console.log(factura);
      //this.afs.collection("facturas").doc(factura.id).update({ SaldoPagado: factura.SaldoPagado })*/
    }

    console.log('here', newEstado !== 3 && !cobrar)
    if (newEstado !== 3 && !cobrar) {
      it.estado = newEstado
      this.afs.collection("viajes").doc(it.id).update({ estado: newEstado });
      this.afs.collection("viajes").doc(it.id).update({ visitada: true });
      if (this.conectado) {
        this.enviarCambioFactura(it)
      } else {
        this.crearPendienteFactura(it)
      }
    }

    if (newEstado === 3 && !cobrar) {
      console.log(it);
      it.estado = newEstado
      this.afs.collection("viajes").doc(it.id).update({ estado: newEstado });
      this.afs.collection("viajes").doc(it.id).update({ visitada: true });
      if (this.conectado) {
        this.enviarCambioFactura(it)
      } else {
        this.crearPendienteFactura(it)
      }

      return;
    }

    console.log(newEstado == 4 || newEstado == 5 || cobrar);
    if (newEstado == 4 || newEstado == 5 || cobrar) {
      if (dev) this.router.navigate(["/lista-facturas"], { queryParams: { cliente: factura.id } });
      console.log('here');
      this.realizarCobro(it, factura, monto, newEstado)
    }
  }
  crearPendienteFactura(it: Ruta) {
    this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado").add({
      estado: it.estado,
      IdFactura: it.IdFactura,
      serieViaje: localStorage.getItem('serie'),
      idViaje: localStorage.getItem('viaje'),
      IDEmpresa: localStorage.getItem('empresa'),
      orden: Number(localStorage.getItem('orden'))
    });
    localStorage.setItem('orden', String(Number(localStorage.getItem('orden')) + 1));
    return;
  }
  enviarCambioFactura(it: Ruta, notRetry?: boolean) {
    return new Promise(async (res, rej) => {
      console.log(this.userID);

      try {
        let encabezadoSnap = await this.afs.collection("encabezado-viaje").doc(this.userID).get().toPromise(), encabezado = encabezadoSnap.data()
        let r: any = await this.utilities.httpRequest(
          `pilot-state-invoice?estado=${it.estado}&IdFactura=${it.IdFactura}&serieViaje=${encabezado.Serie}&idViaje=${encabezado.IDViaje}&IDEmpresa=${localStorage.getItem('empresa')}`, true, true, null, null, null, true);
        if (r.error === 0) {
          res(true)
        } else {
          if (!notRetry)
            this.crearPendienteFactura(it)
          res(false)
        }

      } catch (error) {
        console.log(error)
        if (!notRetry)
          this.crearPendienteFactura(it)
        res(false)
      }

    });
  }
  async cargarPendientesCambioFacturas() {
    let facturasPendientesSnap = await this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado", ref => ref.orderBy('orden')).get().toPromise(), facturasPendientes = facturasPendientesSnap.docs

    for (const i in facturasPendientes) {
      const facturaPendiente: Ruta = facturasPendientes[i].data() as Ruta;
      try {
        let dejo = await this.enviarCambioFactura(facturaPendiente, true)
        if (dejo) this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado").doc(facturasPendientes[i].id).delete()
      } catch (e) {
        console.log(e)
      }
    }
  }
  subirPendientesCambiosFacturas() {
    return new Promise((res, rej) => {
      this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado", ref => ref.orderBy('orden')).get().toPromise().then(async s => {
        if (s.empty) {
          res(true)
          return
        } else {
          let d = s.docs;
          for (const k in d) {
            const ss = d[k];
            let dejo = await this.enviarCambioFactura(ss.data() as Ruta, true)
            if (dejo) this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado").doc(ss.id).delete()
          }
        }
      });
    });
  }
  ///////////////////
  // REALIZAR PAGOS
  seleccionarBanco(): Promise<any> {
    return new Promise(async (res, rej) => {
      let botones = [], bancos = [
        { nombre: "Banco Agromercantil", id: 1 },
        { nombre: "BAC", id: 2 },
        { nombre: "Citibank Guatemala", id: 3 },
        { nombre: "Crédito Hipotecario Nacional", id: 4 },
        { nombre: "Banco de Desarrollo Rural", id: 5 },
        { nombre: "Banco G&T Continental", id: 6 },
        { nombre: "Banco Industrial", id: 7 },
        { nombre: "Banco Internacional, S.A.", id: 8 },
        { nombre: "BANTRAB", id: 9 },
        { nombre: "Banco Azteca", id: 10 },
        { nombre: "Vivibanco", id: 11 }
      ];

      for (let b in bancos) {
        let banco: any = bancos[b];

        botones.push({
          text: /*banco.data().no_cuenta + '-' +*/ banco.nombre,
          handler: async () => {
            let noCheque = this.utilities.presentAlertPrompt("¿Cuál es el número del cheque?", "Por favor, ingrese el número del cheque.", true, 0);


            noCheque.then(async s => {
              if (!s || String(s) == "") {
                console.log(banco);
                rej(false);
                await this.utilities.presentAlert("Información inválida", "Debe ingresar un número de cheque.")
              }
              else {
                let ban = banco;

                res({ ban, noCheque: s })
              }
            })
          }
        });
      }

      botones.push({
        text: 'Cancelar',
        handler: () => rej(false)
      })

      this.actionSheetController.create({
        header: "Seleccione el banco del sistema",
        buttons: botones
      }).then(actionSheet => actionSheet.present())
    })
  }


  realizarCobro(it: Ruta, factura: Factura, monto: number, newEstado?: number) {

    return new Promise(async (res, rej) => {

      let botones = [
        {
          text: 'Efectivo',
          handler: () => {
            this.crearPago(it, factura, 1, monto, null, newEstado)
          }
        }, {
          text: 'Cheque',
          handler: () => {
            this.seleccionarBanco().then(banco => {
              this.crearPago(it, factura, 2, monto, banco, newEstado)
            })
          }
        }, {
          text: 'Cancelar'
        },
      ]
      this.actionSheetController.create({
        header: "Seleccione la opción de pago del cliente",
        buttons: botones
      }).then(actionSheet => actionSheet.present())
    });
  }

  makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz01234567890123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ¿?=)(/&%$·"!|@#';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

  crearPago(it: Ruta, factura: Factura, tipoPago: number, monto: number, banco?: any, newEstado?: number) {
    return new Promise(async (res, rej) => {
      it.estado = newEstado;
      console.log(banco)
      this.afs.collection("pendientes").doc(this.userID).collection("cobros-realizados").add({
        "usuario": this.userID,
        "serieFactura": factura.Serie,
        "idFactura": factura.IDDocumento,
        "Total": monto,
        tipoPago,
        banco: banco ? banco.ban.id : "",
        nombreBanco: banco ? banco.ban.nombre : "",
        noCheque: banco ? banco.noCheque : '',
        IdCliente: factura.IdCliente,
        impreso: false,
        viaje: it.id
      });
      /////////////////////
      if (!factura.SaldoPagado) factura.SaldoPagado = monto;
      else factura.SaldoPagado += monto;

      console.log(factura);
      //if(it.estado !== 3) it.estado = newEstado;
      if (factura.SaldoPagado == factura.Total) {
        it.estado = 4;
        newEstado = 4;
      }
      this.afs.collection("viajes").doc(it.id).update({ visitada: true, recibo: true });
      this.afs.collection("facturas").doc(factura.id).update({ SaldoPagado: factura.SaldoPagado });
      this.afs.collection("viajes").doc(it.id).update({ estado: newEstado });

      if (this.conectado) {
        this.enviarCambioFactura(it)
      } else {
        this.crearPendienteFactura(it)
      }
      /////////////////////
      let pagoFactura: pagoFactura = {
        saldoPagado: monto,
        tipoPago,
        noCheque: banco ? banco.noCheque : null,
        banco: banco ? banco.ban.id : null,
        serie: factura.Serie,
        idFactura: parseInt(factura.IDDocumento),
        IDEmpresa: parseInt(localStorage.getItem('empresa')),
        idFirestore: this.makeid(Math.floor((Math.random() * (11-5))+5))
      }

      console.log(pagoFactura);
      if (this.conectado) {
        this.enviarPagoFactura(pagoFactura)
      } else {
        this.guardarPagoFactura(pagoFactura)
      }
    });
  }
  enviarPagoFactura(pagoFactura: pagoFactura, notRetry?: boolean) {
    return new Promise(async (res, rej) => {
      try {
        let r: any = await this.utilities.httpRequest(
          `pilot-invoice-pay`, false, true, null, null, pagoFactura, true)
        if (r.error === 0) {
          res(true)
        } else {
          if (!notRetry)
            this.guardarPagoFactura(pagoFactura)
          res(false)
        }
      } catch (e) {
        if (!notRetry)
          this.guardarPagoFactura(pagoFactura)
        res(false)
      }

    })
  }
  guardarPagoFactura(pagoFactura: pagoFactura) {
    return this.afs.collection("pendientes").doc(this.userID).collection("pagos-facturas").add(pagoFactura);
  }
  subirPagosPendientes() {
    return new Promise((res, rej) => {
      this.afs.collection("pendientes").doc(this.userID).collection("pagos-facturas").get().toPromise().then(async s => {
        if (s.empty) {
          res(true)
          return
        } else {
          let d = s.docs;
          for (const k in d) {
            const ss = d[k];
            let data: pagoFactura = ss.data();
            data.idFirestore = ss.id;
            console.log(data);
            let dejo = await this.enviarPagoFactura(data, true);
            if (dejo) await this.afs.collection("pendientes").doc(this.userID).collection("pagos-facturas").doc(ss.id).delete()
          }
          res(true);
        }
      });
    });
  }
  ///////////////////
  // REALIZAR RECIBOD DE COBRO
  async emitirReciboCobro(IdCliente: string, tipoPago: number) {
    let loadin: HTMLIonLoadingElement = await this.utilities.createLoading("Procesando...");
    this.userID = localStorage.getItem('userID');
    
    let disponibles = await this.afs.collection("pendientes").doc(this.userID)
    .collection("cobros-realizados", q => q.where("IdCliente", "==", IdCliente)
    .where('tipoPago','==',tipoPago).where('usuario','==',this.userID)
    .where("impreso", "==", false)).get().toPromise();
    
    //let disponiblesKey = {}, totalEfectivo = 0, totalCheque = 0, disponiblesKeyPivote = {};
    
    if (disponibles.empty) {
      loadin.dismiss();
      this.utilities.presentAlert("No hay pagos realizados", "No puedes emitir un recibo de pago sin haber realizado un cobro.")
      return;
    }

    if(tipoPago == 2)
    {
      let data: any = disponibles.docs[0].data();
      data.id = disponibles.docs[0].id;

      disponibles = await this.afs.collection("pendientes").doc(this.userID)
      .collection("cobros-realizados", q => q.where("IdCliente", "==", IdCliente)
      .where('tipoPago','==',tipoPago).where('usuario','==',this.userID)
      .where('banco','==',data.banco).where('noCheque','==',data.noCheque)
      .where("impreso", "==", false)).get().toPromise();
    }

    let facturas: Factura[] = [], keys = {}, totalRecibos = 0.0, cobrosRealizados: any[] = [];;

    for(let i = 0; i < disponibles.size; i ++)
    {
      let obj: any = disponibles.docs[i].data();
      obj.id = disponibles.docs[i].id;

      let factura: Factura = {
        SaldoPagado: obj.Total,
        IDDocumento: obj.idFactura,
        Serie: obj.serieFactura,
        tipoPago: tipoPago == 1 ? 'Efectivo' : 'Cheque',
        nombreBanco: obj.nombreBanco,
        noCheque: obj.noCheque,
        IdCliente: IdCliente,
        usuario: this.userID,
        IDEmpresa: parseInt(localStorage.getItem('empresa')),
        id: obj.id
      };
      keys[obj.id] = obj;
      totalRecibos += obj.Total;

      facturas.push(factura);
      cobrosRealizados.push(obj);
    }

    loadin.dismiss();

    console.log(facturas);
    console.log(keys);

    if (facturas.length == 0) {
      this.utilities.presentAlert("No hay pagos realizados", `No hay cobros realizados ${tipoPago == 1 ? 'en "Efectivo"' : 'con "Cheque"'} para emitir un recibo`);
      return
    }

    let confirmar = await this.utilities.presentAlertConfirm(`Está por emitir un recibo de pago por todas las facturas recién cobradas con: ${tipoPago == 1 ? 'Efectivo' : 'Cheque'}`, `${tipoPago == 1 ? "El total de sus facturas en efectivo es: Q" + this.utilities.formatNumber(totalRecibos) : "El total de sus facturas con cheque es: Q" + this.utilities.formatNumber(totalRecibos)}`)
    
    if(confirmar)
    {
      for(let i in keys)
      {
        let key = keys[i];

        this.afs.collection("viajes").doc(key.viaje).update({ visitada: true, recibo: false });
        this.afs.collection("pendientes").doc(this.userID).collection("cobros-realizados").doc(key.id).update({
          impreso: true
        });
      }

      if (this.conectado) {
        this.cobroHTTP(facturas, false, false, totalRecibos, totalRecibos, cobrosRealizados, keys, loadin)

      } else {
        this.guardarCobros(facturas, false, totalRecibos, totalRecibos, cobrosRealizados)
      }
    }
  }
  cobroHTTP(facturas: any[], isNotNew?: boolean, notRetry?: boolean, totalEfectivo?: number, totalCheque?: number, cobrosRealizados?: any[], disponiblesKey?: any, loadin?: HTMLIonLoadingElement, noImprimir?: boolean) {
    return new Promise(async (res, rej) => {
      if (loadin) loadin = await this.utilities.createLoading("Procesando...");

      let correlativoCobroSnap, correlativoCobro: Correlativo, facturasFormateadas: any[]
      if (!isNotNew) {
        correlativoCobroSnap = await this.afs.collection("correlativospa").doc(this.userID).get().toPromise(),
          correlativoCobro = correlativoCobroSnap.data() as Correlativo,

          facturasFormateadas = []
        facturas.forEach(factura => {
          let facturaFormateada = {
            "serie": correlativoCobro.Serie,
            "correlativo": correlativoCobro.NumeroDocumento,
            "usuario": this.userID,
            "serieFactura": factura.Serie,
            "idFactura": factura.IDDocumento,
            "Total": factura.SaldoPagado,
            "IDEmpresa": factura.IDEmpresa,
            "nombreBanco": factura.nombreBanco || "",
            "noCheque": factura.noCheque || '',
            "idFirestore": this.makeid(Math.floor((Math.random() * (11-5))+5))
          }
          facturasFormateadas.push(facturaFormateada)
        });

        console.log(facturas);


        //await this.printer.crearImpresionCobro(facturas, facturasFormateadas)
        this.afs.collection("emisiones").doc(this.userID).collection("recibos-emitidos").add({
          facturas: facturasFormateadas,
          cobrosRealizados,
          totalEfectivo,
          totalCheque,
          liquidado: false,
          serieRec: correlativoCobro.Serie,
          correlativoRec: correlativoCobro.NumeroDocumento
        });
        this.subirCorrelativo(correlativoCobro);
      } else {
        facturasFormateadas = facturas;
      }

      console.log(facturasFormateadas);
      try {
        let r: any = await this.utilities.httpRequest(
          `pilot-receipt`, false, true, null, null, facturasFormateadas, true)

        if (loadin) loadin.dismiss();
        if (r.error === 0) {
          for (const key in disponiblesKey) {
            const dis = disponiblesKey[key];
            await this.afs.collection("pendientes").doc(this.userID).collection("cobros-realizados").doc(dis.id).delete();
          }
          if (loadin) this.utilities.presentAlert("Recibo generado", "El recibo ha sido enviado de manera exitosa.");
          if (!noImprimir)
            try {
              await this.imprimiFacturas(facturas, facturasFormateadas)
            } catch (error) {
              console.log(error)
            }

          res(true)
        } else {
          if (!notRetry)
            this.guardarCobros(facturasFormateadas, true)
          res(false)
        }
      } catch (e) {
        if (loadin) loadin.dismiss();
        if (loadin) this.utilities.presentAlert("Recibo generado", "El recibo ha sido enviado de manera exitosa.");
        if (!notRetry)
          this.guardarCobros(facturasFormateadas, true)
        res(false)
      }
    });
  }
  guardarCobros(facturas: any[], isNotNew: boolean, totalEfectivo?: number, totalCheque?: number, cobrosRealizados?: any[]) {
    return new Promise(async (res, rej) => {

      let correlativoCobroSnap, correlativoCobro: Correlativo, facturasFormateadas: any[] = [], total = 0;
      if (!isNotNew) {
        let correlativoCobroSnap = await this.afs.collection("correlativospa").doc(this.userID).get().toPromise()
        let correlativoCobro = correlativoCobroSnap.data() as Correlativo;
        facturasFormateadas = [];

        facturas.forEach(factura => {
          factura.Total = factura.SaldoPagado;
          let facturaFormateada = {
            "serie": correlativoCobro.Serie,
            "correlativo": correlativoCobro.NumeroDocumento,
            "usuario": this.userID,
            "serieFactura": factura.Serie || factura.serieFactura,
            "idFactura": factura.IDDocumento || factura.idFactura,
            "Total": factura.Total,
            "IDEmpresa": factura.IDEmpresa,
            "nombreBanco": factura.nombreBanco || "",
            "noCheque": factura.noCheque || ''
          }
          total += factura.Total;
          facturasFormateadas.push(facturaFormateada)
        });
        console.log(facturas);
        console.log(this.userID, correlativoCobro, cobrosRealizados, facturasFormateadas, totalEfectivo, totalCheque)

        try {
          this.afs.collection("emisiones").doc(this.userID).collection("recibos-emitidos").add({ facturas: facturasFormateadas, cobrosRealizados, totalEfectivo, totalCheque, serie: correlativoCobro.Serie, correlativo: correlativoCobro.NumeroDocumento, liquidado: false });
        } catch (error) {
          console.log(error)
        }
        this.subirCorrelativo(correlativoCobro)
        this.imprimiFacturas(facturas, facturasFormateadas)

      } else {
        facturasFormateadas = facturas;
      }
      console.log(facturasFormateadas)
      try {
        this.afs.collection("pendientes").doc(this.userID).collection("recibos-emitidos").add({ facturas: facturasFormateadas });
      } catch (error) {
        console.log(error)
      }
    })
  }
  async imprimiFacturas(facturas: any[], facturasFormateadas: any[]) {

    try {
      console.log(facturas, facturasFormateadas)
      let clienteSnap = await this.afs.collection("viajes", q => q
        .where("IdCliente", "==", facturas[0].IdCliente)
        .where("IdFactura", "==", facturas[0].IDDocumento)
        .where("SerieFactura", "==", facturas[0].Serie)
        .where("usuario", "==", facturas[0].usuario)
      ).get().toPromise()
      let clienteData = clienteSnap.docs[0].data();
      await this.printer.crearImpresionCobro(facturas, facturasFormateadas, clienteData)
      this.utilities.presentAlert("Espere a que la impresión finalice", "Cuando la impresión haya finalizado, presione 'Aceptar', para imprimir la copia").then(S => {
        this.printer.crearImpresionCobro(facturas, facturasFormateadas, clienteData)
      })
    } catch (error) {
      console.log(error)
      this.utilities.presentAlert("No se ha logrado conectar con la impresora", "Por favor, reporte el siguiente error: " + error)
    }
  }
  subirCobrosPendientes(noImprimir?: boolean) {
    return new Promise((res, rej) => {
      console.log(this.userID);
      this.afs.collection("pendientes").doc(this.userID).collection("recibos-emitidos").get().toPromise().then(async s => {
        if (s.empty) {
          res(true)
          return
        } else {
          let d = s.docs;
          for (const k in d) {
            const ss = d[k];
            console.log(ss.data());
            let data: any = ss.data();
            let dataF: any = [];
            for(let i = 0; i < data.facturas.length; i++)
            {
              let obj: any = data.facturas[i];
              obj.idFirestore = ss.id + String(i);
              dataF.push(obj);
            }
            console.log(data);
            let dejo = await this.cobroHTTP(dataF, true, true, null, null, null, null, null, noImprimir);
            if (dejo) this.afs.collection("pendientes").doc(this.userID).collection("recibos-emitidos").doc(ss.id).delete()
          }
        }
      });
    });
  }
  async subirCorrelativo(correlativo: Correlativo) {
    if ((correlativo.NumeroDocumento + 1) > correlativo.RangoFinal) {
      let antesC = correlativo;
      let coTSnap: Correlativo[] = await this.fm.cargarCorrelativoPago(), coT;
      coTSnap.forEach(correlativoT => {
        if (correlativoT.CODTipoMovimiento) {
          coT = correlativoT
        }
      });
      correlativo = coT
    }
    // GUARDAR EL CAMBIO DEL CORRELATIVO
    correlativo.NumeroDocumento++;
    this.guardarCambioCorrelativoOrdenPago(correlativo);
  }
  guardarCambioCorrelativoOrdenPago(correlativo: Correlativo) {
    return this.afs.collection("correlativospa").doc(this.userID).update(correlativo)
  }

}
