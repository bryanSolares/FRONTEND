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
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
})
export class ClientesPage implements OnInit {
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
    this.rutas = this.afs.collection<Ruta[]>("rutas", q => q.where("usuario", "==", this.userID)).snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
      let da = c.payload.doc.data() as Ruta;
      da.id = c.payload.doc.id;
      return da;
    })))
    this.loaded = true
    this.rutas.subscribe(s => {
      console.log(s)

    })
  }

}
