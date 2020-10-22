import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Banco } from '../interfaces/banco';

@Component({
  selector: 'app-cuentas',
  templateUrl: './cuentas.page.html',
  styleUrls: ['./cuentas.page.scss'],
})
export class CuentasPage implements OnInit {
  bancos: Banco[] = [];
  loaded = false;
  constructor(
    public afs: AngularFirestore
  ) { }

  ngOnInit() {
    this.afs.collection("cuentas_bancarias").get().toPromise().then(s => {
      let bancos: Banco[] = []
      s.forEach(ss => {
        bancos.push(ss.data() as Banco)
      });
      this.bancos = bancos
    })
    this.loaded = true;
  }

}
