import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../servicios/data.service';
import { User } from '../interfaces/user';
import { Observable } from 'rxjs';
import { UtilitiesService } from '../servicios/utilities.service';
import { FirebaseMethodsService } from '../servicios/firebase-methods.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrdenesService } from '../servicios/ordenes.service';
import { map, retryWhen } from 'rxjs/operators';
import { Orden_f } from '../interfaces/orden_f';
import { FacturasService } from '../servicios/facturas.service';
import { LiquidacionService } from '../servicios/liquidacion.service';
import { DevolucionService } from '../servicios/devolucion.service';
import { Ruta } from '../interfaces/ruta';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home-cobrador',
  templateUrl: './home-cobrador.page.html',
  styleUrls: ['./home-cobrador.page.scss'],
})
export class HomeCobradorPage implements OnInit {

  noViaje: string;
  user: User;
  userID: string;
  conectado: boolean = false;
  rutasNoVisitadas: number;
  pendientesSincronizar: number;
  permitirDescarga: boolean = false;
  estaEnRuta: boolean = false;
  pendientes: Observable<any[]>;
  rutas: Observable<Ruta[]>;
  constructor(
    public data: DataService,
    public utilities: UtilitiesService,
    public change: ChangeDetectorRef,
    public fm: FirebaseMethodsService,
    public afs: AngularFirestore,
    public ordenesService: OrdenesService,
    public facturasService: FacturasService,
    public devolucionesService: DevolucionService,
    public liquidacionesService: LiquidacionService,
    public router: Router,
    public nav: NavController
  ) {

  }

  ngOnInit() {
    this.userID = localStorage.getItem("userID")
    this.data.$connected.subscribe(s => {
      this.conectado = s;

      if (this.conectado) this.cargarPendientesObj()
    })

    this.afs.collection("encabezado-viaje").doc(this.userID).snapshotChanges().subscribe(s => {

      if (s.payload.exists) {
        let obj: any = s.payload.data();
        this.noViaje = obj.IDViaje;
        localStorage.setItem('viaje', obj.IDViaje);
        localStorage.setItem('serie', obj.Serie);
        console.log(this.noViaje);
      }
    });

    console.log(localStorage.getItem("estaEnRuta"))
    this.estaEnRuta = localStorage.getItem("estaEnRuta") === "true" ? true : false;
    this.userID = localStorage.getItem("userID")
    //this.cargarpendientesFunction();
    if (this.userID) {
      //this.cargarpendientesFunction()
      this.cargarPendientesObj();
    }
  }
  ionViewWillEnter() {

    this.hayPendientes = false
    this.pendientes = this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
      let da: any = c.payload.doc.data();
      da.id = c.payload.doc.id;
      return da;
    })))
    this.pendientes.subscribe(s => {
      this.pendientesSincronizar = s.length
      this.permitirDescarga = this.rutasNoVisitadas === 0 && this.pendientesSincronizar === 0 ? true : false;
    })

    this.cargarpendientesFunction();
    this.cargarPendientesObj();
  }
  tratarPendientes() {
    if (this.conectado) this.cargarpendientesFunction()
  }
  cargarPendientesObj() {
    console.log(this.userID)
    let duplicados = {}
    this.rutas = this.afs.collection("viajes", q => q.where("usuario", "==", this.userID)).snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
      let da: any = c.payload.doc.data();
      da.id = c.payload.doc.id;
      return da;
    }))).pipe(map((data) => {
      let ids = [], newArr = [];
      data.forEach(ele => {
        if (!duplicados[ele.IdCliente]) duplicados[ele.IdCliente] = [ele]
        else duplicados[ele.IdCliente].push([ele])
      })
      data.forEach(ele => {
        if (ids.indexOf(ele.IdCliente) === -1) {
          let visitado = true;
          duplicados[ele.IdCliente].forEach(dup => {
            if (!dup.length && !dup.visitada) visitado = false;
            if (dup.length && !dup[0].visitada) visitado = false;
          });
          ele.visitada = visitado;
          newArr.push(ele); ids.push(ele.IdCliente)
        }
      });
      console.log(data, newArr)
      return newArr;
    }))
    this.rutas.subscribe(s => {
      let c = 0;
      s.forEach(ss => {
        if (!ss.visitada) c++;
      });
      this.rutasNoVisitadas = c;
    })
  }
  async cargarTodo() {
    // COMPROBAR QUE NO HAYAN TAREAS PENDIENTES DE SUBIR
    let confirmacion = await this.utilities.presentAlertConfirm("¿Está seguro?", "Al aceptar usted cargará rutas nuevas.")
    if (confirmacion)
      try {
        this.fm.cargarTodoRutero();
        this.estaEnRuta = true;
      } catch (error) {
        console.log(error);
        this.utilities.presentAlert("No se pudo cargar", "Por favor, contacte a administrador, error: " + error)
      }
  }
  async borrarTodo() {
    let confirmacion = await this.utilities.presentAlertConfirm("¿Está seguro?", "Al aceptar usted habrá terminado su ruta.")
    if (confirmacion) {

      if (localStorage.getItem('itinerario')) {
        localStorage.removeItem('itinerario');
        this.estaEnRuta = false;
        this.fm.borrarTodoRutero();
      }
      else {
        let res = await this.ordenesService.marcarRuta(
          Number(localStorage.getItem("viaje")),
          String(localStorage.getItem("serie")),
          Number(localStorage.getItem("empresa")),
          String(localStorage.getItem("userID"))
        )

        if (res) {
          this.estaEnRuta = false;
          this.fm.borrarTodoRutero();
        }
        else {
          this.utilities.presentAlert("Error de conexión.", "Por favor intente de nuevo, revise si tiene conexión a internet.");
        }
      }

    }
  }


  //////////
  // REVISAR PENDIENTES DE PAGO
  /* 
    1. Debe examinar cambios de estado -> facturas-estado x
    2. Cobros realizados -> cobros-realizados x
    3. Recibos de cobro emitidos -> recibos-emitidos  | debe eliminarse
    4. Pagos de facturas, parciales o totales -> pagos-facturas x
    5. Devoluciones -> devoluciones x
    6. Liquidaciones -> liquidaciones x

    7. Se tiene el nodo: "emisiones" -> "recibos-emitidos"  | debe eliminarse
  */
  cantidadPendientes: number
  hayPendientes: boolean = false;
  hayRecibos: boolean = false;
  async cargarpendientesFunction() {
    let loading: HTMLIonLoadingElement = await this.utilities.createLoading('Cargando...');
    if (!this.userID) {
      loading.dismiss();
      this.cantidadPendientes = 0;
      return;
    }
    this.hayPendientes = false;
    this.hayRecibos = false;
    let pendientes = 0;

    let s1 = await this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado").get().toPromise()
    if (!s1.empty) {
      console.log("Hay pendientes facturas-estado")
      this.hayPendientes = true
      this.facturasService.subirPendientesCambiosFacturas()
      pendientes += s1.size
    }
    let s2 = await this.afs.collection("pendientes").doc(this.userID).collection("cobros-realizados", ref => ref.where('impreso', '==', false)).get().toPromise()
    if (!s2.empty) {
      this.hayRecibos = true;
      /*console.log("Hay pendientes cobros-realizados")
      this.hayPendientes = true
      this.facturasService.subirCobrosPendientes()
      pendientes += s2.size*/
    }
    let s3 = await this.afs.collection("pendientes").doc(this.userID).collection("pagos-facturas").get().toPromise()
    if (!s3.empty) {
      console.log("Hay pendientes pagos-facturas")
      this.hayPendientes = true
      this.facturasService.subirPagosPendientes()
      pendientes += s3.size
    }

    let s4 = await this.afs.collection("pendientes").doc(this.userID).collection("devoluciones").get().toPromise()
    if (!s4.empty) {
      console.log("Hay pendientes devoluciones")
      this.hayPendientes = true
      this.devolucionesService.subirDevolucionesPendientes()
      pendientes += s4.size
    }


    let s5 = await this.afs.collection("pendientes").doc(this.userID).collection("liquidaciones").get().toPromise()
    if (!s5.empty) {
      console.log("Hay pendientes liquidaciones")
      this.hayPendientes = true
      this.liquidacionesService.subirLiquidacionesPendientes()
      pendientes += s5.size
    }

    let s6 = await this.afs.collection("pendientes").doc(this.userID).collection("recibos-emitidos").get().toPromise()
    if (!s6.empty) {
      console.log("Hay recibos-emitidos pendientes")
      this.hayPendientes = true
      this.facturasService.subirCobrosPendientes(true)
      pendientes += s6.size
    }


    this.cantidadPendientes = pendientes;


    if (!this.hayPendientes) this.cantidadPendientes = 0;

    loading.dismiss();
    //this.change.detectChanges();
  }

  async cerrarSesion() {
    let confirmacion = await this.utilities.presentAlertConfirm("¿Está seguro?", "¿Desea cerrar sesión?")
    if (confirmacion) {
      localStorage.clear();
      this.nav.navigateRoot("/login", { replaceUrl: true })
    }
  }
}
