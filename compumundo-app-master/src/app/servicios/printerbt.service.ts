import { Injectable } from "@angular/core";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial/ngx";

import { AlertController } from "@ionic/angular";
import { UtilitiesService } from "./utilities.service";

import EscPosEncoder from "esc-pos-encoder-ionic";
import { Producto } from "./../interfaces/producto";
import { Canasta } from "./../interfaces/canasta";
import { Ruta } from "../interfaces/ruta";
import { Orden } from "../interfaces/orden";
import { User } from "../interfaces/user";
import { Factura } from "../interfaces/factura";
import { Correlativo } from "../interfaces/correlativo";
import { AngularFirestore } from "@angular/fire/firestore";
declare var Socket: any;

@Injectable({
  providedIn: "root",
})
export class PrinterbtService {
  encoder: EscPosEncoder;
  userID: string;
  private nombreEmpresa;
  private direcEmpresa;
  private nitEmpresa;
  private telEmpresa;

  constructor(
    private bluetoothSerial: BluetoothSerial,
    public alertController: AlertController,
    public utilities: UtilitiesService,
    public afs: AngularFirestore
  ) {
    this.userID = localStorage.getItem("userID");
    this.encoder = new EscPosEncoder();
    const empresa = JSON.parse(localStorage.getItem("empresaPrint"));
    this.nombreEmpresa = empresa[0].Nombre;
    this.direcEmpresa = empresa[0].Direccion;
    this.nitEmpresa = empresa[0].Nit;
    this.telEmpresa = empresa[0].Telefono;
  }

  async initBTPrinter() {
    let error;
    try {
      let settingsbt = localStorage.getItem("btenabled");
      if (!settingsbt) {
        await this.bluetoothSerial.enable();
      } // PERMITIR EL BLUETOOTH
      await this.bluetoothSerial.isEnabled(); // VERIFICAR QUE ESTÉ DISPONIBLE
    } catch (e) {
      error = e;
      this.bluetoothSerial.showBluetoothSettings();
    }
    if (error) {
      return error;
    } // NO SE LOGRÓ CONECTAR BLUETOOTH
    // SE LOGRÓ CONECTAR CON IMPRESORA
  }
  async crearImpresion(
    productos: Producto[],
    cliente: Ruta,
    orden: Orden,
    usuario: User,
    correlativo: Correlativo
  ) {
    await this.initBTPrinter();
    let devices = (await this.bluetoothSerial.list()) as any[];
    let id = await this.selectDevicePrompt(devices);
    if (id) {
      try {
        console.log(id);
        this.bluetoothSerial.connect(id).subscribe(async (s) => {
          let t = "ABCDEFGHIJKLMNÑOPQRZ12345678901234567890";
          console.log(t.length);
          let result = this.encoder.initialize().codepage("cp737").encode();
          await this.bluetoothSerial.write(result);

          let ts = new Date().getTime();
          let canasta: Canasta = {
            Nit: cliente.Nit,
            fecha: ts,
            ov: correlativo.Serie + " - " + correlativo.NumeroDocumento,
            total: orden.total,
            NombreVendedor: usuario.Nombre,
            RazonSocial: cliente.RazonSocial,
          };
          await this.printHeader(canasta);
          for (const i in productos) {
            const prod = productos[i];
            await this.printProduct(prod);
          }
          await this.printFooter(canasta);
          await this.bluetoothSerial.disconnect();
        });
      } catch (e) {
        this.utilities.presentAlert(
          "No fue posible conectar",
          "Se encontró el error: " + e
        );
      }
    } else {
      this.initBTPrinter();
    }
  }
  getSpaces(text: string, width: number): string {
    let spaces = "";
    for (let i = 0; i < width - text.length; i++) {
      spaces += " ";
    }
    return spaces;
  }
  getLine(width: number): string {
    let spaces = "";
    for (let i = 0; i < width; i++) {
      spaces += "=";
    }
    return spaces;
  }
  getFormattedDate(timeStamp: number): string {
    var date = new Date(timeStamp);
    var month: any = date.getMonth() + 1;
    var day: any = date.getDate();
    var hour: any = date.getHours();
    var min: any = date.getMinutes();
    var sec: any = date.getSeconds();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;
    var str =
      date.getFullYear() +
      "-" +
      month +
      "-" +
      day +
      "_" +
      hour +
      ":" +
      min +
      ":" +
      sec;
    return str;
  }
  printProduct(producto: Producto): Promise<boolean> {
    return new Promise(async (res, rej) => {
      console.log(producto);
      let enco = this.encoder.codepage("cp737");
      let total = parseFloat(producto.cantidad + "") * producto.precioUnitario;
      let c = ("" + producto.cantidad).substr(0, 4) + "x",
        n = producto.Nombre.substr(0, 24),
        t = (Math.round(total * 100) / 100).toFixed(2).toString().substr(0, 8);
      let texto = enco
        .align("left")
        .line(
          this.getSpaces(c, 6) +
            c +
            " " +
            n +
            this.getSpaces(n, 24) +
            " " +
            this.getSpaces(t, 8) +
            t
        );
      try {
        await this.bluetoothSerial.write(texto.encode());
      } catch (e) {
        console.error(e);
      }
      res(true);
    });
  }
  printHeader(canasta: Canasta): Promise<boolean> {
    return new Promise(async (res, rej) => {
      let enco = this.encoder.codepage("cp737");
      const hU = "CANT";
      const hD = "DESCRIPCION";
      const hT = "TOTAL";
      let texto = enco
        .align("center")
        .line(this.nombreEmpresa || "AGRICOLA GROTTO")
        .line("Orden de venta: " + canasta.ov)
        .line("Vendedor: " + canasta.NombreVendedor)
        .line("Fecha: " + this.getFormattedDate(canasta.fecha))
        .newline()
        .line("NIT: " + canasta.Nit)
        .line("Razon social: " + canasta.RazonSocial)
        .newline()
        .line(
          this.getSpaces(hU, 6) +
            hU +
            " " +
            hD +
            this.getSpaces(hD, 24) +
            this.getSpaces(hT, 8) +
            " " +
            hT
        );
      try {
        await this.bluetoothSerial.write(texto.encode());
      } catch (e) {
        console.error(e);
      }
      res(true);
    });
  }
  printFooter(canasta: Canasta): Promise<boolean> {
    return new Promise(async (res, rej) => {
      let enco = this.encoder.codepage("cp737");
      const hT = (Math.round(canasta.total * 100) / 100)
        .toFixed(2)
        .toString()
        .substr(0, 10);
      let texto = enco
        .align("right")
        .line("Total: " + hT)
        .align("right")
        .newline()
        .newline()
        .line(this.getLine(40))
        .line("Firma del receptor:")
        .newline()
        .newline();
      try {
        await this.bluetoothSerial.write(texto.encode());
      } catch (e) {
        console.error(e);
      }
      res(true);
    });
  }
  selectDevicePrompt(devices: any[]): Promise<string> {
    return new Promise(async (res, rej) => {
      let inputs = [];
      devices.forEach((device, index) => {
        inputs.push({
          name: "r",
          type: "radio",
          label: device.name,
          value: device.id,
          checked: index === 0,
        });
      });
      const alert = await this.alertController.create({
        header: "Seleccione una impresora BT",
        inputs,
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
            cssClass: "secondary",
            handler: () => {
              res("");
            },
          },
          {
            text: "Aceptar",
            handler: (data) => {
              res(data);
            },
          },
        ],
      });
      await alert.present();
    });
  }

  //// IMPRESIÓN DE RECIBO DE COBRO
  crearImpresionCobro(
    facturas: Factura[],
    facturasRecibo: any[],
    clienteData: any
  ) {
    return new Promise(async (res, rej) => {
      try {
        await this.initBTPrinter();
      } catch (error) {
        return rej(error);
      }
      let devices;
      try {
        devices = (await this.bluetoothSerial.list()) as any[];
      } catch (error) {
        return rej(error);
      }
      let id = await this.selectDevicePrompt(devices);
      if (id) {
        try {
          console.log(id);
          this.bluetoothSerial.connect(id).subscribe(async (s) => {
            let loadingAlert = await this.utilities.createLoading();
            let t = "ABCDEFGHIJKLMNÑOPQRZ12345678901234567890";
            console.log(t.length);
            try {
              let result = this.encoder.initialize().codepage("cp737").encode();
              await this.bluetoothSerial.write(result);

              await this.printHeaderCobro(
                facturas,
                facturasRecibo,
                clienteData
              );
              let total = 0;
              for (const i in facturasRecibo) {
                console.log(facturasRecibo);
                const prod = facturasRecibo[i];
                try {
                  await this.printFactura(prod);
                } catch (error) {
                  console.log("Error al imprimir una factura", error);
                }
                total += prod.Total;
              }

              await this.printFooterCobro(total);
            } catch (error) {}

            for (const i in facturas) {
              const fac = facturas[i];
              try {
                this.afs
                  .collection("pendientes")
                  .doc(this.userID)
                  .collection("cobros-realizados")
                  .doc(fac.id)
                  .update({ impreso: true });
              } catch (error) {}
            }
            await this.bluetoothSerial.disconnect();
            loadingAlert.dismiss();
          });

          return res(true);
        } catch (e) {
          this.utilities.presentAlert(
            "No fue posible conectar",
            "Se encontró el error: " + e
          );
          return rej(e);
        }
      } else {
        this.initBTPrinter();
      }
      rej("No se ha seleccionado un dispositivo");
    });
  }
  printHeaderCobro(
    facturas: Factura[],
    facturasRecibo: any[],
    clienteData: any
  ): Promise<boolean> {
    return new Promise(async (res, rej) => {
      let enco = this.encoder.codepage("cp737");
      const hU = "SERIE Y FACT.";
      const hT = "TOTAL";
      let empresasA = JSON.parse(localStorage.getItem("Empresas")) as Array<
        any
      >;
      let misEmpresaID = localStorage.getItem("empresa"),
        miEmpresa: any;
      empresasA.forEach((element) => {
        if (String(element.IDEmpresa) === misEmpresaID) {
          miEmpresa = element;
        }
      });
      console.log(empresasA);

      let ts = new Date().getTime();
      let texto = enco
        .align("center")
        .line(this.nombreEmpresa || miEmpresa.Nombre)
        .line(this.direcEmpresa || miEmpresa.Direccion)
        .line(this.telEmpresa || miEmpresa.Telefono)
        .line(
          "Recibo de cobro: " +
            facturasRecibo[0].serie +
            facturasRecibo[0].correlativo
        )
        .line("Fecha: " + this.getFormattedDate(ts))
        .line("Usuario emisor: " + this.userID)
        .line("Tipo de pago: " + facturas[0].tipoPago)
        .line("Codigo del cliente: " + clienteData.IdCliente)
        .line("Nombre del cliente: " + clienteData.NombreCliente.substr(0, 30))
        .line("Telefono del cliente: " + clienteData.Telefono.substr(0, 30))
        .newline()
        .line(
          hU + this.getSpaces(hU, 30) + " " + this.getSpaces(hT, 8) + " " + hT
        );
      try {
        await this.bluetoothSerial.write(texto.encode());
      } catch (e) {
        console.error(e);
      }
      res(true);
    });
  }
  printFooterCobro(total: number): Promise<boolean> {
    return new Promise(async (res, rej) => {
      let enco = this.encoder.codepage("cp737");
      const hT = (Math.round(total * 100) / 100)
        .toFixed(2)
        .toString()
        .substr(0, 10);
      let texto = enco
        .align("right")
        .line("Total: " + hT)
        .align("right")
        .newline()
        .newline()
        .line(this.getLine(40))
        .line("Firma del receptor:")
        .newline();
      try {
        await this.bluetoothSerial.write(texto.encode());
      } catch (e) {
        console.error(e);
      }

      let leyendaArr = this.chunkSubstr(
        "Este recibo es el unico comprobante de pago que reconocemos, si paga con cheque y este es rechazado, automaticamente queda anulado este pago y tendra un recargo de Q 100.00 por gastos administrativos.",
        40
      );
      let texto2 = enco.align("right");
      leyendaArr.forEach((element) => {
        texto2.line(element);
      });
      texto2.newline().newline();
      try {
        await this.bluetoothSerial.write(texto2.encode());
      } catch (e) {
        console.error(e);
      }

      res(true);
    });
  }

  chunkSubstr(str, size): Array<string> {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }
    return chunks;
  }

  printFactura(factura: any): Promise<boolean> {
    return new Promise(async (res, rej) => {
      let enco = this.encoder.codepage("cp737");
      let ccc = factura.serieFactura + " " + factura.idFactura;
      let c = ccc.substr(0, 24),
        t = (Math.round(factura.Total * 100) / 100)
          .toFixed(2)
          .toString()
          .substr(0, 8);
      let texto = enco
        .align("left")
        .line(c + this.getSpaces(c, 30) + " " + this.getSpaces(t, 8) + t);

      try {
        await this.bluetoothSerial.write(texto.encode());
      } catch (e) {
        console.error(e);
      }

      if (factura.nombreBanco) {
        let texto2 = enco
          .align("left")
          .line(
            factura.nombreBanco.substr(0, 24) + " (" + factura.noCheque + ")"
          );
        try {
          await this.bluetoothSerial.write(texto2.encode());
        } catch (e) {
          console.error(e);
        }
      }
      res(true);
    });
  }
}
