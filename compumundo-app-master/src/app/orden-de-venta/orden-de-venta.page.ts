import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Ruta } from '../interfaces/ruta';
import { AngularFirestore } from '@angular/fire/firestore';
import { Producto } from '../interfaces/producto';
import { OrdenesService } from '../servicios/ordenes.service';
import { Orden } from '../interfaces/orden';
import { UtilitiesService } from '../servicios/utilities.service';

@Component({
  selector: 'app-orden-de-venta',
  templateUrl: './orden-de-venta.page.html',
  styleUrls: ['./orden-de-venta.page.scss'],
})
export class OrdenDeVentaPage implements OnInit {
  loaded: boolean;
  cliente: Ruta;
  canasta: Producto[] = [];
  total: number = 0;
  userID: string;
  constructor(
    public activatedRoute: ActivatedRoute,
    public afs: AngularFirestore,
    public ordenesService: OrdenesService,
    public uti: UtilitiesService,
    public change: ChangeDetectorRef
  ) { }

  ngOnInit() {

  }
  ionViewWillEnter() {
    this.activatedRoute.queryParams.subscribe(map => map);
    let query = this.activatedRoute.snapshot.queryParams;
    this.cargarCliente(query.cliente)
  }
  cargarCliente(clienteID: string) {
    if (clienteID)
      this.afs.collection("rutas").doc(clienteID).get().toPromise().then(s => {
        this.cliente = s.data() as Ruta;
        this.cliente.id = s.id;
        this.cargarCanasta()
        this.loaded = true;

        this.change.detectChanges();
      })
  }
  async cargarCanasta() {
    let loading: HTMLIonLoadingElement = await this.uti.createLoading('Cargando...');
    this.userID = localStorage.getItem("userID")
    let canastaSnap = await this.afs.collection("canasta").doc(this.userID).collection("items").get().toPromise();
    console.log(canastaSnap);
    let ttotal = 0, canastat = [];
    canastaSnap.docs.forEach(docSnap => {
      let tempo = docSnap.data();
      console.log(tempo);
      ttotal += tempo.total;
      canastat.push(tempo)
    });
    this.canasta = canastat;
    this.total = ttotal;
    loading.dismiss();
    this.change.detectChanges();
  }

  async calcularTotalItem(item: Producto) {
    if (item.cantidad < 0) {
      item.cantidad = 0;
    }
    console.log(item.cantidad)
    //item.cantidad = Number(parseFloat(String(item.cantidad)).toFixed(2));
    this.calcularSubTotal(item)
    this.calcularTotal();
  }
  calcularSubTotal(item: Producto) {
    let precioUsado: number = 0;

    if (item.Rango3 && item.cantidad >= item.Rango3)
      item.total = item.PrecioRango3 * item.cantidad;
    else if (item.Rango2 && item.cantidad >= item.Rango2)
      item.total = item.PrecioRango2 * item.cantidad;
    else if (item.Rango1 && item.cantidad >= item.Rango1)
      item.total = item.PrecioRango1 * item.cantidad;
    else
      item.total = item.PrecioSugerido * item.cantidad;

    this.afs.collection('canasta').doc(this.userID).collection("items").doc(item.id).update(item);
    return item;
  }
  calcularTotal() {
    let total = 0;
    this.canasta.forEach(p => {
      if (p.total) total += p.total;
    });
    this.total = total;
    this.change.detectChanges();
  }
  addAmount(item: Producto) {
    item.cantidad++
    item = this.calcularSubTotal(item)
    this.calcularTotal()
  }
  async restAmount(item: Producto) {
    if (item.cantidad > 0)
      item.cantidad--

    item = this.calcularSubTotal(item)
    this.calcularTotal()
  }
  async borrar(item: Producto) {
    this.afs.collection('canasta').doc(this.userID).collection("items").doc(item.id).delete();
    this.uti.presentToast("Se ha eliminado el elemento de la canasta")
    this.cargarCanasta()
  }

  async crearOrden() {
    let orden = {
      idCliente: this.cliente.CODCliente,
      total: this.total,
      diasVencimiento: this.cliente.DiasVencimiento,
    }
    let dejar = true;

    this.canasta.forEach(c => {
      if (c.cantidad == 0 || String(c.cantidad) == 'NaN') {
        dejar = false; return;
      }
    });

    if (dejar && this.total) this.ordenesService.crearOrden(orden as Orden, this.canasta, this.cliente)

    else if (!dejar && this.total) {
      let dejar = await this.uti.presentAlertConfirm('Productos sin cantidad', 'Los productos que tiene una cantidad en 0 no se tomarán en cuenta ¿Desea continuar?');
      if (dejar) {
        this.canasta.forEach(async c => {
          if (c.cantidad == 0 || String(c.cantidad) == 'NaN') {
            this.afs.collection('canasta').doc(this.userID).collection('items').doc(c.id).delete();
          }
        })
        this.canasta = [];
        this.cargarCanasta();
        this.ordenesService.crearOrden(orden as Orden, this.canasta, this.cliente);
        this.change.detectChanges();
      }
    }

    this.change.detectChanges();

  }
}
