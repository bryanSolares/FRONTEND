import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DataService } from '../servicios/data.service';
import { Observable } from 'rxjs';
import { ReciboLiquidar } from '../interfaces/reciboLiquidar';
import { map } from 'rxjs/operators';
import { UtilitiesService } from '../servicios/utilities.service';
import { Banco } from '../interfaces/banco';
import { ActionSheetController } from '@ionic/angular';
import { Liquidacion } from '../interfaces/liquidacion';
import { LiquidacionService } from '../servicios/liquidacion.service';

@Component({
  selector: 'app-liquidar',
  templateUrl: './liquidar.page.html',
  styleUrls: ['./liquidar.page.scss'],
})
export class LiquidarPage implements OnInit {
  userID: string;
  conectado: boolean;
  recibosLiquidar: Observable<ReciboLiquidar[]>;
  recibosLiquidados: Observable<ReciboLiquidar[]>;
  recibosLiquidarObj: ReciboLiquidar[];
  recibosLiquidadosObj: ReciboLiquidar[];
  loaded: boolean;
  segmento = "s";
  bancos: Banco[];
  constructor(
    public afs: AngularFirestore,
    public data: DataService,
    public uti: UtilitiesService,
    public actionSheetController: ActionSheetController,
    public liquidacionServices: LiquidacionService
  ) {
    this.userID = localStorage.getItem("userID")
    this.data.$connected.subscribe(conectado => {
      this.conectado = conectado;
    })
  }
  
  ngOnInit() {
    this.recibosLiquidar = this.afs.collection("emisiones/" + this.userID + "/recibos-emitidos", q => q.where("liquidado", "==", false).orderBy('correlativoRec'))
      .snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
        let da: any = c.payload.doc.data();
        da.id = c.payload.doc.id;
        return da;
      })))
    this.recibosLiquidados = this.afs.collection("emisiones/" + this.userID + "/recibos-emitidos", q => q.where("liquidado", "==", true).orderBy('correlativoRec'))
      .snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
        let da: any = c.payload.doc.data();
        da.id = c.payload.doc.id;
        return da;
      })))
    this.recibosLiquidar.subscribe(s => {
      this.loaded = false
      setTimeout(() => {
        this.recibosLiquidarObj = s
        this.loaded = true
      }, 300);
    })
    this.recibosLiquidados.subscribe(s => {
      this.loaded = false
      setTimeout(() => {

        this.recibosLiquidadosObj = s
        this.loaded = true
      }, 300);
    })
    this.loaded = true

    this.afs.collection("bancos", ref => ref.where('IDEmpresa','==',parseInt(localStorage.getItem('empresa')))).get().toPromise().then(s => {
      let bancos: Banco[] = []
      s.forEach(ss => {
        bancos.push(ss.data() as Banco)
      });
      this.bancos = bancos
    })
  }

  async liquidar() {
    let recibosSeleccionados: ReciboLiquidar[] = [], totalEfectivo = 0, totalCheque = 0;
    let liquidarRecibos: Liquidacion[] = []
    this.recibosLiquidarObj.forEach(recibo => {
      if (recibo.selected) {
        recibosSeleccionados.push(recibo)
        totalCheque += recibo.totalCheque || 0
        totalEfectivo += recibo.totalEfectivo || 0

      }
    });
    if (!recibosSeleccionados.length) {
      this.uti.presentAlert("No ha seleccionado ningún recibo", "Primero seleccione un recibo.")
    } else {
      let confiramr = await this.uti.presentAlertConfirm("¿Desea liquidar los recibos seleccionados?", "Ha seleccionado " + recibosSeleccionados.length + " recibos. Corrobore que sumen, Q " + this.uti.formatNumber(totalEfectivo) + " efectivo, y Q " + this.uti.formatNumber(totalCheque) + " cheques.")
      if (confiramr) {
        try {
          let banco: Banco = await this.seleccionarBanco()
          let noCheque = await this.uti.presentAlertPrompt("¿Cuál es el número del depósito?", "Por favor, ingrese el número del depósito.",true);
          if (!noCheque) {
            this.uti.presentAlert("No ha ingresado el número de depósito", "Por favor, intente de nuevo.")
            return
          }

          this.recibosLiquidarObj.forEach(recibo => {
            if (recibo.selected) {
              liquidarRecibos.push({
                serie: recibo.serieRec,
                idRecibo: recibo.correlativoRec,
                NoDeposito: "" + noCheque,
                IDBanco: String(banco.id_banco),
                CODCuentaBancaria: banco.no_cuenta,
                urlFoto: null
              })
              this.afs.collection("emisiones/" + this.userID + "/recibos-emitidos").doc(recibo.id).update({ liquidado: true, deposito: noCheque })
            }
          });

          this.liquidacionServices.emitirLiquidacion(liquidarRecibos)

        } catch (error) {
          return;
        }
      } else
        return;
    }
  }
  seleccionarBanco(): Promise<Banco> {
    return new Promise((res, rej) => {
      let botones = []
      this.bancos.forEach(banco => {
        botones.push({
          text: banco.nombre /*+ ": " + banco.no_cuenta*/,
          handler: () => res(banco)
        })
      });
      botones.push({
        text: 'Cancelar',
        handler: () => rej(true)
      })
      this.actionSheetController.create({
        header: "Seleccione la cuenta en que depositó",
        buttons: botones
      }).then(al => al.present())
    })
  }

}
