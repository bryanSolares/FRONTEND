import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Ruta } from '../interfaces/ruta';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.scss'],
})
export class ClientePage implements OnInit {
  loaded: boolean = false;
  cliente: Ruta;
  rutasMode: boolean = false;
  constructor(
    public afs: AngularFirestore,
    public activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(map => map);
    let query = this.activatedRoute.snapshot.queryParams;
    let ref = query.ref || "rutas";
    this.rutasMode = true;
    this.afs.collection(ref).doc(query.cliente).get().toPromise().then(s => {
      this.cliente = s.data() as Ruta;
      console.log(s.data(), s)
      this.loaded = true;
    })
  }

}
