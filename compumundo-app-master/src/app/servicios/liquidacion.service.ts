import { Injectable } from '@angular/core';
import { Liquidacion } from '../interfaces/liquidacion';

import { AngularFireStorage } from '@angular/fire/storage';
import { DataService } from './data.service';

import { Storage } from '@ionic/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { UtilitiesService } from './utilities.service';
@Injectable({
  providedIn: 'root'
})
export class LiquidacionService {
  userID: string;
  conectado: boolean;
  constructor(
    private storage: AngularFireStorage,
    private data: DataService,
    public storageSQL: Storage,
    public afs: AngularFirestore,
    public utilities: UtilitiesService

  ) {
    this.userID = localStorage.getItem("userID")
    this.data.$connected.subscribe(conectado => {
      this.conectado = conectado;
    })
    this.data.$userID.subscribe((userID: string) => {
      if (userID) this.userID = userID
    })
  }

  emitirLiquidacion(liquidarRecibos: Liquidacion[]) {
    
    //  1. Guardar el objeto
    let noDeposito = liquidarRecibos[0].NoDeposito
    console.log("NO DEPOSITO", noDeposito)
    this.guardarLiquidacion(liquidarRecibos)
    console.log("here");
  }
  subirLiquidacionesPendientes() {
    return new Promise((res, rej) => {
      this.afs.collection("pendientes").doc(this.userID).collection("liquidaciones").get().toPromise().then(async s => {
        if (s.empty) {
          res(true)
          return
        } else {
          let d = s.docs;
          for (const k in d) {
            const ss = d[k];
            try {
              let dejo = await this.enviarLiquidacion(ss.data().recibos)
              if (dejo) this.afs.collection("pendientes").doc(this.userID).collection("liquidaciones").doc(ss.id).delete()
          
            } catch (error) {
              
            }
          }
        }
      });
    });
  }
  enviarLiquidacion(liquidarRecibos: Liquidacion[]) {
    let noDeposito = liquidarRecibos[0].NoDeposito

    return new Promise(async (res, rej) => {
      //let s = await this.storageSQL.get(noDeposito)
      try {
        let url = "";//await this.subirFoto(noDeposito, s)
        for (const o in liquidarRecibos) {
          const recibo = liquidarRecibos[o];
          recibo.urlFoto = url;
        }
      } catch (error) {
        rej(true)
      }

      try {
        let r: any = await this.utilities.httpRequest(
          `pilot-liquidacion`, false, true, null, null, liquidarRecibos, true)
        if (r.error === 0) {
          await this.storageSQL.remove(noDeposito)
          res(true)
        } else
          rej(true)
      } catch (e) {
        rej(true)
      }
    });
  }
  guardarLiquidacion(liquidarRecibos: Liquidacion[]) {
    let noDeposito = liquidarRecibos[0].NoDeposito
    try
    {
      this.afs.collection("pendientes").doc(this.userID).collection("liquidaciones").doc(noDeposito).set({ recibos: liquidarRecibos })
    }
    catch(err)
    {
      console.log('Error: liquidacion.service.ts liquidarRecibos malo');
    }
  }
  subirFoto(liquidacionID: string, fileString: string): Promise<string> {
    return new Promise((res, rej) => {
      const filePath = 'liquidaciones/' + this.userID + "/" + liquidacionID;
      const ref = this.storage.ref(filePath);
      const task = ref.putString(fileString, "base64");
      task.then(s => {
        task.task.snapshot.ref.getDownloadURL().then((downloadURL: string) => {
          res(downloadURL)
        }).catch(rej)
      }).catch(e => {
        rej(true)
      })
    })
  }
}
