import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Categoria } from '../interfaces/categoria';
import { map } from 'rxjs/operators';
import { UtilitiesService } from '../servicios/utilities.service';

@Component({
  selector: 'app-select-category',
  templateUrl: './select-category.page.html',
  styleUrls: ['./select-category.page.scss'],
})
export class SelectCategoryPage implements OnInit {
  categorias: Observable<Categoria[]>;
  public cats: Categoria[] = [];
  search: string = "";
  query: any;
  constructor(
    public afs: AngularFirestore,
    public activatedRoute: ActivatedRoute,
    public utilities: UtilitiesService
  ) {

    this.query = this.activatedRoute.snapshot.queryParams;
    
  }

  async ngOnInit() {
    let loading: HTMLIonLoadingElement;
    loading = await this.utilities.createLoading('Cargando...');
    let catsExiste = [];
    let pivCats = await this.afs.collection("categorias", ref => ref.orderBy('nombre')).get().toPromise();
    let cliente = await this.afs.collection("rutas").doc(this.query.cliente).get().toPromise();
    
    let IDEmpresa = localStorage.getItem('empresa');
    
    this.categorias = await this.afs.collection("productos", ref => ref.where("IDTipoPrecio", "==", cliente.data().IDTipoPrecio).where("IDEmpresa","==",parseInt(IDEmpresa)).orderBy('Categoria')).snapshotChanges(['added', 'removed', 'modified']).pipe(map(changes => changes.map(c => {
     
      let da: any = c.payload.doc.data();
      da.id = c.payload.doc.id;
      
      let element: any = {};
      
      for(let i = 0; i < pivCats.size; i++)
      {
        let obj = pivCats.docs[i].data();
        if(da.Categoria == pivCats.docs[i].id)
        {
            element = obj;
            element.id = pivCats.docs[i].id;
        }
      }
      if(catsExiste.indexOf(element.id) == -1)
      {
        catsExiste.push(element.id);
        return element;
      }
    })));
    

    loading.dismiss();
  }
  
  isAcceptedThing(thing: Categoria) {
    if (this.search && this.search.length)
      return thing.nombre.toLocaleLowerCase().includes(this.search.toLocaleLowerCase())
    else
      return true;
  }
}
