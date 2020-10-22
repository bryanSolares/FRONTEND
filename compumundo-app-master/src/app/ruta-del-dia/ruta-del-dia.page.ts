import { Component, OnInit } from "@angular/core";
import { DataService } from "../servicios/data.service";
import { Ruta } from "../interfaces/ruta";
import { UtilitiesService } from "../servicios/utilities.service";
import { ActionSheetController } from "@ionic/angular";
import { Router } from "@angular/router";
import { FirebaseMethodsService } from "../servicios/firebase-methods.service";
import { Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map } from "rxjs/operators";
import { Producto } from "../interfaces/producto";
import { Orden } from "../interfaces/orden";
import { User } from "../interfaces/user";
import { Correlativo } from "../interfaces/correlativo";
import { PrinterbtService } from "../servicios/printerbt.service";

@Component({
  selector: "app-ruta-del-dia",
  templateUrl: "./ruta-del-dia.page.html",
  styleUrls: ["./ruta-del-dia.page.scss"],
})
export class RutaDelDiaPage implements OnInit {
  loaded: boolean = false;
  activeSegment: string = "p";
  actualRutas: Ruta[];
  rutas: Observable<Ruta[]>;
  userID: string;
  constructor(
    public data: DataService,
    public utilities: UtilitiesService,
    public router: Router,
    public fm: FirebaseMethodsService,
    public actionSheetController: ActionSheetController,
    public afs: AngularFirestore,
    public printer: PrinterbtService
  ) {}
  total: number = 0;
  rutasVisitadas: Ruta[] = [];
  rutasNoVisitadas: Ruta[] = [];
  ngOnInit() {
    this.userID = localStorage.getItem("userID");
    let rutasVisitadas = 0,
      rutasNoVisitadas = 0;
    this.rutas = this.afs
      .collection("rutas", (q) =>
        q.where("usuario", "==", this.userID).orderBy("Ruta")
      )
      .snapshotChanges(["added", "removed", "modified"])
      .pipe(
        map((changes) =>
          changes.map((c) => {
            let da: any = c.payload.doc.data();
            da.id = c.payload.doc.id;
            return da;
          })
        ),
        map((data) => {
          return data.sort(
            (a, b) =>
              (isNaN(a.Ruta) ? 0 : a.Ruta) - (isNaN(b.Ruta) ? 0 : b.Ruta)
          );
        })
      );
    this.rutas.subscribe((s) => {
      rutasVisitadas = 0;
      rutasNoVisitadas = 0;
      this.rutasNoVisitadas = [];
      this.rutasVisitadas = [];
      this.total = 0;
      s.forEach((ss) => {
        this.total++;
        if (ss.visitada) {
          rutasVisitadas++;
          this.rutasVisitadas.push(ss);
        } else {
          rutasNoVisitadas++;
          this.rutasNoVisitadas.push(ss);
        }
      });
      this.actualRutas = this.rutasNoVisitadas;
      this.loaded = true;
    });
  }

  segmentChanged(event?: any) {
    if (event && event.detail && event.detail.value) {
      this.activeSegment = event.detail.value;
      if (this.activeSegment === "p") this.actualRutas = this.rutasNoVisitadas;
      else this.actualRutas = this.rutasVisitadas;
    }
  }
  async registrarVisita(item: Ruta) {
    let buttons = !item.visitada
      ? [
          {
            text: "Generar orden", // TIPO 2
            icon: "cash",
            handler: () => {
              this.router.navigate(["/orden-de-venta"], {
                queryParams: { cliente: item.id },
              });
            },
          },
          {
            text: "Marcar como visitado", // TIPO 3
            icon: "checkmark-circle",
            handler: () => {
              this.fm.marcarVisitaRuta(item);
            },
          },
        ]
      : [];
    buttons.push(
      {
        text: "Imprimir recibo de cobro", // TIPO 4
        icon: "print",
        handler: () => {
          this.imprimirRecibo(item);
        },
      },
      {
        text: "Ver más información del cliente", // TIPO 4
        icon: "contact",
        handler: () => {
          this.router.navigate(["/cliente"], {
            queryParams: { cliente: item.id },
          });
        },
      }
    );

    if (item.visitada == true) {
      buttons.push(
        {
          text: "Marcar como NO visitado", // TIPO 3
          icon: "checkmark-circle",
          handler: () => {
            this.fm.marcarNoVisitaRuta(item);
            this.activeSegment = "p";
          },
        },
        {
          text: "Cancelar",
          icon: "close",
          handler: () => {},
        }
      );
    } else {
      buttons.push({
        text: "Cancelar",
        icon: "close",
        handler: () => {},
      });
    }
    const actionSheet = await this.actionSheetController.create({
      header: "Seleccione la acción deseada",
      buttons,
    });
    await actionSheet.present();
  }

  imprimirRecibo(ruta: Ruta) {
    this.afs
      .collection("ordenes-generadas", (q) =>
        q.where("clienteID", "==", ruta.CODCliente)
      )
      .get()
      .toPromise()
      .then((ordenesGeneradas) => {
        ordenesGeneradas.forEach((ordenGenerada) => {
          let d = ordenGenerada.data();
          this.imprimirReciboBT(
            d.productos as Producto[],
            d.cliente as Ruta,
            d.orden as Orden,
            d.usuario as User,
            d.correlativo as Correlativo
          );
        });
      });
  }

  imprimirReciboBT(
    productos: Producto[],
    cliente: Ruta,
    orden: Orden,
    usuario: User,
    correlativo: Correlativo
  ) {
    return new Promise(async (res, rej) => {
      let confirmar = await this.utilities.presentAlertConfirm(
        "¿Desea imprimir un recibo?",
        "Por favor, seleccione aceptar, si desea imprimir recibo de orden de venta."
      );
      if (confirmar)
        try {
          await this.printer.initBTPrinter();
          await this.printer.crearImpresion(
            productos,
            cliente,
            orden,
            usuario,
            correlativo
          );
          this.utilities
            .presentAlert(
              "Espere a que la impresión finalice",
              "Cuando la impresión haya finalizado, presione 'Aceptar', para imprimir la copia"
            )
            .then((S) => {
              this.printer.crearImpresion(
                productos,
                cliente,
                orden,
                usuario,
                correlativo
              );
            });
          res(true);
        } catch (error) {
          console.log(error);
          this.afs
            .collection("error")
            .add({ error: error.toString(), usuario: this.userID });
          rej(error);
        }
      else res(true);
    });
  }
}
