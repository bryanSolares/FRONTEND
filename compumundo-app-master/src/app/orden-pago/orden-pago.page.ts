import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Producto } from '../interfaces/producto';
import { Orden } from '../interfaces/orden';
import { Factura } from '../interfaces/factura';
import { DevolucionService } from '../servicios/devolucion.service';
import { DataService } from '../servicios/data.service';
import { Ruta } from '../interfaces/ruta';
import { Observable } from 'rxjs';
import { ProductoCargado } from '../interfaces/productoCargado';
import { UtilitiesService } from '../servicios/utilities.service';
import { FacturasService } from '../servicios/facturas.service';

import { Location } from '@angular/common';
@Component({
  selector: 'app-orden-pago',
  templateUrl: './orden-pago.page.html',
  styleUrls: ['./orden-pago.page.scss'],
})
export class OrdenPagoPage implements OnInit {
  loaded: boolean;

  canasta: ProductoCargado[] = [];
  total: number = 0;
  userID: string;
  conectado: boolean;
  llaveFacturaDetalle: string
  llaveViaje: string;
  private facturasS: any;

  private itemDoc: AngularFirestoreDocument<Ruta>;
  item: Observable<Ruta>;
  itemObj: Ruta;

  private facturaDoc: AngularFirestoreDocument<Factura>;
  factura: Observable<Factura>;
  facturaObj: Factura;
  constructor(
    public activatedRoute: ActivatedRoute,
    public afs: AngularFirestore,
    public devolucionService: DevolucionService,
    public facturaService: FacturasService,
    public data: DataService,
    public uti: UtilitiesService,
    private router: Router
  ) { }

  async ngOnInit() {
    
    this.userID = localStorage.getItem("userID")
    this.devolucionService.userID = localStorage.getItem("userID");

    this.data.$userID.subscribe((userID: string) => {
      if (userID) this.userID = userID
    })
    this.data.$connected.subscribe((conectado: boolean) => {
      this.conectado = conectado
    })
    this.activatedRoute.queryParams.subscribe(map => map);
    let query = this.activatedRoute.snapshot.queryParams;
    this.llaveFacturaDetalle = query.llaveFacturaDetalle;
    this.llaveViaje = query.llaveViaje;

    this.itemDoc = this.afs.doc<Ruta>('viajes/' + this.llaveViaje);
    this.item = this.itemDoc.valueChanges();
    this.item.subscribe(itemObj => {
      this.itemObj = itemObj
    })
    this.facturaDoc = this.afs.doc<Factura>('facturas/' + this.llaveFacturaDetalle);
    this.factura = this.facturaDoc.valueChanges();
    
    this.facturasS = this.factura.subscribe(async (s) => {
      let loading: HTMLIonLoadingElement = await this.uti.createLoading('Cargando..');
      this.facturaObj = s;
      this.canasta = s.Detalle
      let total = 0;
      for (const k in this.canasta) {
        let p = this.canasta[k];
        console.log(p.idProducto)
        let detallesSnap = await this.afs.collection("productos", q => q.where("CODProducto", "==", p.idProducto).where("IDEmpresa","==",p.IDEmpresaDoc).orderBy('Nombre')).get().toPromise(),
          detalle = !detallesSnap.empty ? detallesSnap.docs[0].data() : {}
        detalle.index = k
        this.canasta[k] = { ...p, ...detalle }
        total += p.Subtotal;
      }
      this.total = total;
      this.loaded = true;
      loading.dismiss();
    })

  }

  ngOnDestroy(){
    this.facturasS.unsubscribe();
  }

  calcularTotal() {
    let total = 0;
    this.canasta.forEach(p => {
      if (p.Subtotal) total += p.Subtotal;
    });
    this.total = total;
  }
  
  async restAmount(item: ProductoCargado) {
    let aceptar = await this.uti.presentAlertConfirm("Está a punto de realizar una devolución", "Si está seguro de que debe realizar una devolución presione 'Aceptar'.")
    if (aceptar) {
      let descuento = await this.uti.presentAlertPrompt("Ingrese la cantidad a devolver", "Por favor, ingrese un número lógico", true, 1, item.Cantidad)
      descuento = Math.round(parseFloat(String(descuento)) * 100) / 100;
      console.log(descuento)
      if (!descuento || descuento <= 0 || descuento > item.Cantidad) {
        console.log(item);
        this.uti.presentAlert("No ha ingresado una cantidad adecuada", "Intentalo de nuevo, la mínima es 1 y la máxima es " + item.Cantidad)
        return;
      } else if (descuento) {
        this.emitirDevolucion(item, parseFloat("" + descuento))
      }
    }
  }

  async emitirDevolucion(item: ProductoCargado, descuento: number) {
    let aceptar = await this.devolucionService.emitirDevolucion(item, descuento, this.llaveFacturaDetalle, this.canasta, this.facturaObj.IDDocumento, this.facturaObj.Serie, this.itemObj, this.facturaObj, this.llaveViaje);
    
    //this.router.navigate(["/lista-facturas"], { queryParams: { cliente: this.facturaObj.IdCliente } })
  }

  async emitirCobro() {
    console.log("EMITIR COBRO")
    let factura: Factura = this.facturaObj;
    let it: Ruta = this.itemObj;
    let seCobra = await this.uti.presentAlertConfirm("¿Desea realizar un cobro ahora?", "Es necesario que primero realice las devoluciones y luego indique el cobro 'Aceptar'.")

    if (seCobra) {
      console.log("Se debe cobrar")
      it.id = this.llaveViaje;
      factura.id = this.llaveFacturaDetalle;

      let total = 0;
      this.canasta.forEach(p => {
        if (p.Subtotal) total += p.Subtotal;
      });

      factura.Total = total;
      console.log("Atrás")
      //this.total = factura.Total;

      await this.facturaService.cambiarEstado(it, 5, factura, seCobra, true);
      console.log(factura)

      //this.router.navigate(["/lista-facturas"], { queryParams: { cliente: factura.id } })
    }

  }
}
