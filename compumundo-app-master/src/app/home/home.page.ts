import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { DataService } from '../servicios/data.service';
import { User } from '../interfaces/user';
import { UtilitiesService } from '../servicios/utilities.service';
import { FirebaseMethodsService } from '../servicios/firebase-methods.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Orden_f } from '../interfaces/orden_f';
import { OrdenesService } from '../servicios/ordenes.service';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  user: User;
  userID: string;
  conectado: boolean = false;
  rutasNoVisitadas: number;
  pendientesSincronizar: number;
  permitirDescarga: boolean = false;
  estaEnRuta: boolean = false;
  pendientes: Observable<any[]>;
  constructor(
    public data: DataService,
    public utilities: UtilitiesService,
    public change: ChangeDetectorRef,
    public fm: FirebaseMethodsService,
    public afs: AngularFirestore,
    public ordenesService: OrdenesService,
    public nav: NavController,
    public router: Router

  ) {
    this.data.$connected.subscribe(s => {
      this.conectado = s;
    })
  }
  ngOnInit() {
    console.log(localStorage.getItem("estaEnRuta"))
    this.estaEnRuta = localStorage.getItem("estaEnRuta") === "true" ? true : false;
    this.userID = localStorage.getItem("userID")
    if (this.userID) {
      this.cargarPendientes()
    }
  }
  ionViewWillEnter() {

    this.pendientes = this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
      let da: any = c.payload.doc.data();
      da.id = c.payload.doc.id;
      return da;
    })))
    this.pendientes.subscribe(s => {
      this.pendientesSincronizar = s.length
      this.permitirDescarga = this.rutasNoVisitadas === 0 && this.pendientesSincronizar === 0 ? true : false;
    })

    this.cargarPendientes()
  }

  tratarPendientes() {
    if (this.conectado) this.cargarPendientes(true)
  }

  async cargarPendientes(boton?: boolean) {
    console.log(this.userID)
    let laoding: HTMLIonLoadingElement;
    if (boton) laoding = await this.utilities.createLoading('Sincronizando tareas pendientes...');

    this.afs.collection("rutas", q => q.where("usuario", "==", this.userID).where("visitada", "==", false)).snapshotChanges(['added', 'removed', 'modified']).pipe(
      map(changes => changes.map(c => {
        let da: any = c.payload.doc.data();
        da.id = c.payload.doc.id;
        return da;
      }))
    ).subscribe(async ss => {

      this.rutasNoVisitadas = ss.length;

      if (this.rutasNoVisitadas === 0) {
        this.permitirDescarga = true;
      } else
        this.permitirDescarga = false

      this.fm.comprobarPendientesVendedor().then(async resp => {

        console.log(this.pendientesSincronizar)
        this.permitirDescarga = this.rutasNoVisitadas === 0 && this.pendientesSincronizar === 0 ? true : false;
        if (resp.data.size > 0) {
          let pendientesFormateados: Orden_f[] = []
          resp.data.forEach(ss => {
            let temp: Orden_f = ss.data() as Orden_f;
            temp.id = ss.id
            pendientesFormateados.push(temp)
          });
          if (this.conectado) {
            if (boton) laoding.dismiss();
            this.ordenesService.cargarPendientes(pendientesFormateados)
          }
          else {
            if (boton) {
              laoding.dismiss();
              this.utilities.presentAlert('Error de conexión', 'No hay conexión a internet.');
            }
          }

        }
        else {
          if (boton) {
            laoding.dismiss();
            this.utilities.presentAlert('Sin pendientes', 'No hay tareas pendientes por sincronizar.');
          }
        }
      })
    })

  }
  async cargarTodo() {
    // COMPROBAR QUE NO HAYAN TAREAS PENDIENTES DE SUBIR
    let confirmacion = await this.utilities.presentAlertConfirm("¿Está seguro?", "Al aceptar usted cargará rutas nuevas.")
    if (confirmacion)
      try {
        this.estaEnRuta = true;
        await this.fm.cargarTodo();

      } catch (error) {
        //console.log('heree');
        this.estaEnRuta = false;
        //this.utilities.presentAlert("No se pudo cargar", "Por favor, contacte a administrador, error: " + error)
      }
  }
  async borrarTodo() {
    let confirmacion = await this.utilities.presentAlertConfirm("¿Está seguro?", "Al aceptar usted habrá terminado su ruta.")
    if (confirmacion) {

      let res = await this.ordenesService.borrarItinerario(
        localStorage.getItem("ITSerie"),
        Number(localStorage.getItem("ITCorrelativo"))
      );
      if (res) {
        this.estaEnRuta = false;
        this.fm.borrarTodoVendedor();
      }
      else {
        this.utilities.presentAlert("Error de servidor.", "Por favor intente de nuevo, revise si tiene conexión a internet.");
      }

    }
  }
  async cerrarSesion() {
    let confirmacion = await this.utilities.presentAlertConfirm("¿Está seguro?", "¿Desea cerrar sesión?")
    if (confirmacion) {
      localStorage.clear();
      this.nav.navigateRoot("/login", { replaceUrl: true })
    }
  }
}
