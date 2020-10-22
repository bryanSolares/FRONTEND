import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { DataService } from '../servicios/data.service';
import { Ruta } from '../interfaces/ruta';
import { UtilitiesService } from '../servicios/utilities.service';
import { ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseMethodsService } from '../servicios/firebase-methods.service';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';

import { map } from 'rxjs/operators';

@Component({
  selector: 'app-ruta-del-rut',
  templateUrl: './ruta-del-rut.page.html',
  styleUrls: ['./ruta-del-rut.page.scss'],
})
export class RutaDelRutPage implements OnInit {
  loaded: boolean = false
  activeSegment: string = "p"
  actualRutas: Ruta[];
  rutas: Observable<Ruta[]>;
  userID: string;
  constructor(
    public data: DataService,
    public utilities: UtilitiesService,
    public router: Router,
    public fm: FirebaseMethodsService,
    public change: ChangeDetectorRef,
    public actionSheetController: ActionSheetController,
    public afs: AngularFirestore
  ) { }
  total: number = 0;
  rutasVisitadas: Ruta[] = [];
  rutasNoVisitadas: Ruta[] = [];
  ngOnInit() {
    this.fm.userID = localStorage.getItem('userID');
    let ids = []
    this.userID = localStorage.getItem("userID")
    let rutasVisitadas = 0, rutasNoVisitadas = 0, duplicados = {}
    this.rutas = this.afs.collection("viajes", q => q.where("usuario", "==", this.userID).orderBy('Ruta')).snapshotChanges().pipe(map(changes => changes.map(c => {
      let da: any = c.payload.doc.data();
      da.id = c.payload.doc.id;
      return da;
    }))).pipe(
      map((data) => {
        let ids = [], newArr = [], duplicados = {};
        data.forEach(ele => {
          if (!duplicados[ele.IdCliente]) duplicados[ele.IdCliente] = [ele]
          else duplicados[ele.IdCliente].push([ele])
        })
        data.forEach(ele => {
          if (ids.indexOf(ele.IdCliente) === -1) {
            let visitado = true;
            let recibo = false;
            duplicados[ele.IdCliente].forEach(dup => {
              //console.log(dup);
              if (!dup.length && !dup.visitada) visitado = false;
              if (dup.length && !dup[0].visitada) visitado = false;
              if(!dup.length && dup.recibo) recibo = true;
              if (dup.length && dup[0].recibo) recibo = true;
            });
            ele.visitada = visitado;
            ele.recibo = recibo;
            newArr.push(ele); ids.push(ele.IdCliente)
          }
        });
        //console.log(data, newArr)
        return newArr;
      })
    )
    
    this.rutas.subscribe(s => {
      rutasVisitadas = 0;
      rutasNoVisitadas = 0;
      this.rutasNoVisitadas = [];
      this.rutasVisitadas = []
      this.total = 0;
      s.forEach(ss => {
        this.total++;
        if (ss.visitada) {
          rutasVisitadas++;
          this.rutasVisitadas.push(ss)
        } else {
          rutasNoVisitadas++;
          this.rutasNoVisitadas.push(ss)
        }
      });
      this.actualRutas = this.rutasNoVisitadas;
      console.log(this.actualRutas)
      this.loaded = true;
      this.actualRutas.sort(function(a,b): any{
        if(parseInt(a.Ruta) > parseInt(b.Ruta)) return 1;
        if(parseInt(a.Ruta) < parseInt(b.Ruta)) return -1;        
        return 0;
      });
    })
  }

  segmentChanged(event?: any) {
    if (event && event.detail && event.detail.value) {
      this.activeSegment = event.detail.value
      if (this.activeSegment === "p") this.actualRutas = this.rutasNoVisitadas;
      else this.actualRutas = this.rutasVisitadas;
    }
  }
  async registrarVisita(item: Ruta) {
    let buttons = !item.visitada? [{
      text: 'Ver facturas', // TIPO 2
      icon: "cash",
      handler: () => {
        this.router.navigate(["/lista-facturas"], { queryParams: { cliente: item.id } })
      }
    }, {
      text: 'Marcar visita', // TIPO 3
      icon: "checkmark-circle",
      handler: () => {
        this.fm.marcarVisitaViaje(item);
        
        //this.activeSegment = 'v';
        //this.router.navigate(["/home-cobrador"]);
        
      }
    }] : []
    buttons.push({
      text: 'Ver más información del cliente', // TIPO 4
      icon: "contact",
      handler: () => {
        this.router.navigate(["/cliente"], { queryParams: { cliente: item.id, ref: 'viajes' } })
      }
    })

    if(item.visitada == true)
    {
      buttons.push({
        text: 'Marcar como NO visitado', // TIPO 3
        icon: "checkmark-circle",
        handler: () => {
          this.fm.marcarNoVisitaViaje(item)
          this.activeSegment = 'p';
        }
      }, {
        text: 'Cancelar',
        icon: 'close',
        handler: () => {
        }
      });
    }
    else
    {
      buttons.push({
        text: 'Cancelar',
        icon: 'close',
        handler: () => {
        }
      });
    }

    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione la acción deseada',
      buttons
    });
    await actionSheet.present();
  }
}
