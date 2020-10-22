import { Component, OnInit } from '@angular/core';
import { DataService } from '../servicios/data.service';
import { UtilitiesService } from '../servicios/utilities.service';
import { Router } from '@angular/router';
import { FirebaseMethodsService } from '../servicios/firebase-methods.service';
import { ActionSheetController } from '@ionic/angular';
import { Ruta } from '../interfaces/ruta';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-clientes-rutero',
  templateUrl: './clientes-rutero.page.html',
  styleUrls: ['./clientes-rutero.page.scss'],
})
export class ClientesRuteroPage implements OnInit {
  loaded: boolean = false
  userID: string;
  constructor(
    public data: DataService,
    public utilities: UtilitiesService,
    public router: Router,
    public fm: FirebaseMethodsService,
    public actionSheetController: ActionSheetController,
    public afs: AngularFirestore
  ) { }
  rutas: Observable<Ruta[]>;
  ngOnInit() {


  }
  ionViewWillEnter() {
    this.userID = localStorage.getItem("userID")
    let ids = []
    this.rutas = this.afs.collection<Ruta[]>("viajes", q => q.where("usuario", "==", this.userID)).snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
      let da = c.payload.doc.data() as Ruta;
      da.id = c.payload.doc.id;
      return da;
    }))).pipe(
      map((data) => {
        let ids = [], newArr = [], sinCompletar = {};
        data.forEach(ele => {
          if (!sinCompletar[ele.IdCliente] && !ele.visitada)
            sinCompletar[ele.IdCliente] = true
        })
        data.forEach(ele => {
          if (ids.indexOf(ele.IdCliente) === -1) {
            ele.visitada = !sinCompletar[ele.IdCliente]
            newArr.push(ele);
            ids.push(ele.IdCliente)
          }
        });
        return newArr;
      })
    )
    this.loaded = true
    this.rutas.subscribe(s => {
      console.log(s)

    })
  }

}
