import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Producto } from '../interfaces/producto';
import { UtilitiesService } from '../servicios/utilities.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Ruta } from '../interfaces/ruta';
import { OrdenesService } from "../servicios/ordenes.service";
@Component({
  selector: 'app-select-products',
  templateUrl: './select-products.page.html',
  styleUrls: ['./select-products.page.scss'],
})
export class SelectProductsPage implements OnInit {
  userID: string;
  cliente: Ruta;
  clienteID: string;
  productos: Producto[];
  productosO: Producto[];
  loaded: boolean = false;
  search: string = "";
  total: number = 0;
  public categoria: string = "";
  constructor(
    public afs: AngularFirestore,
    public activatedRoute: ActivatedRoute,
    public utilities: UtilitiesService,
    public router: Router,
    public ordenesService: OrdenesService
  ) { }

  ngOnInit() {
    this.userID = localStorage.getItem("userID")
    this.activatedRoute.queryParams.subscribe(map => map);
    let query: any = this.activatedRoute.snapshot.queryParams;
    this.categoria = query.categoria;
    this.cargarClienteProducto(query.cliente).then(s => {
      this.cargarProductos(this.userID, query.categoria)
    })

  }
  async cargarClienteProducto(clienteID: string) {
    let s = await this.afs.collection("rutas").doc(clienteID).get().toPromise()
    this.cliente = s.data() as Ruta;
    this.clienteID = clienteID
    this.loaded = true;
  }
  async cargarProductos(userID: string, categoria: string) {
    let loading: HTMLIonLoadingElement;
    loading = await this.utilities.createLoading('Cargando...');
    let IDEmpresa = localStorage.getItem('empresa');

    let canastaSnap = await this.afs.collection("canasta").doc(this.userID).collection("items").get().toPromise();
    
    let s = await this.afs.collection("productos", ref => ref.where("IDTipoPrecio", "==", this.cliente.IDTipoPrecio).where("Categoria", "==", categoria).where("IDEmpresa","==",parseInt(IDEmpresa)).orderBy('Nombre')).get().toPromise()
    let productos = [];
    
    s.forEach(ss => {
      
      let producto = ss.data() as Producto;
      //console.log(producto);
      producto.id = ss.id
      producto.cantidad = 0;
      canastaSnap.docs.forEach(docSnap => {
        let tempo = docSnap.data();
        if (tempo.cantidad && tempo.total && docSnap.id === producto.id) {
          producto.cantidad = tempo.cantidad
          producto.total = tempo.total
        }
      });
      productos.push(producto)
    });
    this.productos = productos;
    this.productosO = productos;
    this.calcularTotal();
    this.loaded = true;
    loading.dismiss();
  }
  async agregarProductos() {
    let loading: HTMLIonLoadingElement = await this.utilities.createLoading('Cargando...');
    console.log(this.productos)
    let cantidad = 0;
    for (const i in this.productos) {
      const pr = this.productos[i];
      if (pr.cantidad && pr.total) {
        this.afs.collection("canasta").doc(this.userID).collection("items").doc(pr.id).set(pr)
        cantidad++;
      }
    }
    loading.dismiss();
    if (cantidad > 0) {
      this.afs.collection("canasta").doc(this.userID).update({ cantidad, total: this.total })
      this.utilities.presentToast("Productos actualizados")
      this.router.navigate(["/orden-de-venta"], { queryParams: { cliente: this.clienteID } })
    } else
      this.utilities.presentAlert("No ha agregado productos", "No ha seleccionado ningún producto para agregar a tu orden.")
  }
  filtrar() {
    this.productos = this.productosO.filter(x =>
      x.Nombre.toLowerCase().includes(this.search.toLowerCase()) ||
      x.CODProducto.toLowerCase().includes(this.search.toLowerCase())
    )
  }
  calcularTotalItem(item: Producto) {
    if(item.cantidad < 0) item.cantidad = 0;
    this.calcularSubTotal(item)
    this.calcularTotal();
  }
  addAmount(item: Producto) {
    item.cantidad++
    item = this.calcularSubTotal(item)
    this.calcularTotal()
  }
  restAmount(item: Producto) {
    if (item.cantidad > 0)
      item.cantidad--
    item = this.calcularSubTotal(item)
    this.calcularTotal()
  }
  borrarFiltro() {
    this.productos = this.productosO;
  }
  calcularSubTotal(item: Producto): Producto {
    let rango = 0;
    if (item.Rango3 && item.cantidad >= item.Rango3)
      item.total = item.PrecioRango3 * item.cantidad;
    else if (item.Rango2 && item.cantidad >= item.Rango2)
      item.total = item.PrecioRango2 * item.cantidad;
    else if (item.Rango1 && item.cantidad >= item.Rango1)
      item.total = item.PrecioRango1 * item.cantidad;
    else
      item.total = item.PrecioSugerido * item.cantidad;

    return item;
  }
  calcularTotal() {
    let total = 0;
    this.productos.forEach(p => {
      if (p.total) total += p.total;
    });
    this.total = total;
  }

  isAcceptedThing(thing: Producto) {
    if (this.search && this.search.length)
      return thing.Nombre.toLocaleLowerCase().includes(this.search.toLocaleLowerCase())
    else
      return true;
  }
  
}
