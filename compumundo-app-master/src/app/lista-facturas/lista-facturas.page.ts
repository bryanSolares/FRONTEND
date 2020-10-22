import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Ruta } from '../interfaces/ruta';
import { Factura } from '../interfaces/factura';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActionSheetController } from '@ionic/angular';
import { DataService } from '../servicios/data.service';
import { FacturasService } from '../servicios/facturas.service';

@Component({
  selector: 'app-lista-facturas',
  templateUrl: './lista-facturas.page.html',
  styleUrls: ['./lista-facturas.page.scss'],
})
export class ListaFacturasPage implements OnInit {
  private itemDoc: AngularFirestoreDocument<Ruta>;
  item: Observable<Ruta>;
  segmento = "e";
  facturas: Observable<Ruta[]>;
  facturasDetalle: Observable<Factura[]>;
  facturasVisibles: Ruta[];
  facturasCobrar: Ruta[];
  facturasEntregar: Ruta[];
  facturasOtras: Ruta[];
  loaded: boolean;
  facturasDetalleKey: {};
  conectado: boolean;
  clienteID: string;
  public cobros: any = {
    efectivo: 0,
    cheque: 0
  }

  constructor(
    public activatedRoute: ActivatedRoute,
    public afs: AngularFirestore,
    public actionSheetController: ActionSheetController,
    public data: DataService,
    public router: Router,
    public facturasService: FacturasService
  ) { 

    this.cobros = {
      efectivo: 0,
      cheque: 0
    }
  }
  userID: string;
  ngOnInit() {
    this.userID = localStorage.getItem("userID");
    console.log(this.userID);
    let query = this.activatedRoute.snapshot.queryParams;

    this.facturasService.userID = localStorage.getItem('userID');
    this.facturasService.fm.userID = localStorage.getItem('userID');

      
    this.data.$userID.subscribe((userID: string) => {
      if (userID) this.userID = userID
    })
    this.data.$connected.subscribe((conectado: boolean) => {
      this.conectado = conectado
    })
    this.activatedRoute.queryParams.subscribe(map => map);
    
    this.itemDoc = this.afs.doc<Ruta>('viajes/' + query.cliente);
    this.clienteID = query.cliente
    this.item = this.itemDoc.valueChanges();
    
    this.item.subscribe(s => {
      this.clienteID = s.IdCliente;
      
      this.afs.collection('pendientes').doc(this.userID).collection('cobros-realizados', ref => ref.where('IdCliente','==',this.clienteID).where('impreso','==',false)).snapshotChanges().subscribe(snap=>{
        this.cobros = {
          efectivo: 0,
          cheque: 0
        };
  
        snap.forEach(data=>{
          let obj: any = data.payload.doc.data();
  
          if(obj.tipoPago == 1) this.cobros.efectivo++;
          else this.cobros.cheque++;
        })
      });

      this.facturas = this.afs.collection("viajes", q => q.where("usuario", "==", this.userID).where("IdCliente","==",this.clienteID)).snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
        let da: any = c.payload.doc.data();
        da.id = c.payload.doc.id;
        return da;
      })))
      this.facturasDetalle = this.afs.collection("facturas", q => q.where("usuario", "==", this.userID).where("IdCliente","==",this.clienteID)).snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
        let da: any = c.payload.doc.data();
        da.id = c.payload.doc.id;
        return da;
      })))

      this.facturas.subscribe(s => {
        this.facturasEntregar = [];
        this.facturasCobrar = [];
        this.facturasOtras = [];
        s.forEach(ss => {
          console.log(ss);
          if (!ss.estado && !ss.visitada)
            this.facturasEntregar.push(ss)
          else if (ss.estado === 1 || ss.estado == 5 /*&& !ss.visitada*/)
            this.facturasCobrar.push(ss)
          else
            this.facturasOtras.push(ss)
        });
        
        this.facturasEntregar.sort(function(a: any,b: any): any{
          if(parseInt(a.IdFactura) > parseInt(b.IdFactura)) return 1;
          if(parseInt(a.IdFactura) < parseInt(b.IdFactura)) return -1;
          return 0;
        });
        this.facturasCobrar.sort(function(a: any,b: any): any{
          if(parseInt(a.IdFactura) > parseInt(b.IdFactura)) return 1;
          if(parseInt(a.IdFactura) < parseInt(b.IdFactura)) return -1;
          return 0;
        });
        this.facturasOtras.sort(function(a: any,b: any): any{
          if(parseInt(a.IdFactura) > parseInt(b.IdFactura)) return 1;
          if(parseInt(a.IdFactura) < parseInt(b.IdFactura)) return -1;
          return 0;
        });

      });

      


      let facturasDetalleKey = {}
      this.facturasDetalle.subscribe(s => {
        
        s.forEach(ss => {
          facturasDetalleKey[ss.Serie + ss.IDDocumento] = ss;
        });
        this.facturasDetalleKey = facturasDetalleKey
      })
    });
  }

  getClase(estado: number): string {
    switch (estado) {
      case 1:
        return "delivered"
      case 2:
        return "rejected"
      case 3:
        return "partial"
      case 4:
        return "paid"
      default:
        return ""
    }
  }
  getLabel(estado: number, Tipo?: number): string {
    if(Tipo && Tipo == 1)
    {
      return "Por cobrar"
    }

    switch (estado) {
      case 1:
        return "Cobrar"
      case 2:
        return "Anulada"
      case 3:
        return "Devolución"
      case 4:
        return "Pagada"
      case 5:
        return "Cobrar"
      case 6:
        return "Pendiente"
      default:
        return "Entregar"
    }
  }
  faltante(factura: Factura): number {
    if (factura)
      return factura.Total - (factura.SaldoPagado || 0)
    else
      return
  }
  accion(it: Ruta, factura: Factura) {
    let botones = []

    console.log(it);
    console.log(factura);
    if(factura.Tipo == 1 && it.estado == 0)
    {
      botones.push({
        text: 'Cobrar',
        handler: () => this.marcarAccion(it, 5, factura, true)
      }, {
        text: 'Marcar, no se pudo cobrar',
        handler: () => this.marcarAccion(it, 6, factura)
      });
    }
    else if(factura.Tipo == 1 && it.estado == 6)
    {
      botones.push({
        text: 'Cobrar',
        handler: () => this.marcarAccion(it, 5, factura, true)
      });
    }
  
    else
    {
      console.log(it);
      switch (it.estado) {
        case 0:
        default:
          botones.push({
            text: 'Entregar sin cobro',
            handler: () => this.marcarAccion(it, 1, factura)
          }, {
            text: 'Entregar y cobrar',
            handler: () => this.marcarAccion(it, 5, factura, true)
          }, {
            text: 'Realizar una devolución (no puede cobrar inmediatamente)',
            handler: () => this.devolucion(it, factura)
          }, {
            text: 'Marcar, no se pudo entregar',
            handler: () => this.marcarAccion(it, 6, factura)
          }, {
            text: 'Anular factura',
            handler: () => this.marcarAccion(it, 2, factura)
          });
          break;
        case 1:
          botones.push({
            text: 'Cobrar',
            handler: () => this.marcarAccion(it, 5, factura, true)
          }/*, {
            text: 'Marcar, no se pudo cobrar',
            handler: () => this.marcarAccion(it, -1, factura)
          }*/)
          break;
        case 5:
          botones.push({
            text: 'Cobrar',
            handler: () => this.marcarAccion(it, 5, factura, true)
          }/*, {
            text: 'Marcar, no se pudo cobrar',
            handler: () => this.marcarAccion(it, -1, factura)
          }*/)
          break;
        case 2:
          break;
        case 3:
          //this.router.navigate(["/orden-pago"], { queryParams: { factura: factura.id } })
          botones.push({
            text: 'Entregar sin cobro',
            handler: () => this.marcarAccion(it, 1, factura)
          }, {
            text: 'Entregar y cobrar',
            handler: () => this.marcarAccion(it, 5, factura, true)
          }, {
            text: 'Realizar una devolución (no puede cobrar inmediatamente)',
            handler: () => this.devolucion(it, factura)
          });
          break;
        case 4:
          break;
        case 6:
          botones.push({
            text: 'Entregar sin cobro',
            handler: () => this.marcarAccion(it, 1, factura)
          }, {
            text: 'Entregar y cobrar',
            handler: () => this.marcarAccion(it, 5, factura, true)
          }, {
            text: 'Realizar una devolución (no puede cobrar inmediatamente)',
            handler: () => this.devolucion(it, factura)
          }, {
            text: 'Anular factura',
            handler: () => this.marcarAccion(it, 2, factura)
          });
          break;
      }
    }

    if (botones.length) {
      botones.push({
        text: 'Cancelar',
      })
      this.actionSheetController.create({
        header: 'Seleccione la acción deseada',
        buttons: botones
      }).then(actionSheet => {
        actionSheet.present();
      })
    }

  }
  marcarAccion(it: Ruta, newEstado: number, factura: Factura, cobrar?: boolean) {
    this.facturasService.cambiarEstado(it, newEstado, factura, cobrar || false)
  }
  emitirReciboCobro() {
    let botones = [];

    botones.push({
      text: 'Efectivo',
      handler: () => this.facturasService.emitirReciboCobro(this.clienteID, 1)
    },
    {
      text: 'Cheque',
      handler: () => this.facturasService.emitirReciboCobro(this.clienteID, 2)
    },{
      text: 'Cancelar',
    });


    this.actionSheetController.create({
      header: 'Emitir recibo de cobro tipo: ',
      buttons: botones
    }).then(actionSheet => {
      actionSheet.present();
    });
  }
  devolucion(it: Ruta, factura: Factura) {
    this.router.navigate(["/orden-pago"], { queryParams: { llaveFacturaDetalle: factura.id, llaveViaje: it.id } })
  }
}
