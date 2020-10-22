import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces/user';
import { Correlativo } from '../interfaces/correlativo';
import { Ruta } from "../interfaces/ruta";
import { Producto } from '../interfaces/producto';
import { Categoria } from '../interfaces/categoria';
@Injectable({
  providedIn: 'root'
})
export class DataService {
  public $user: BehaviorSubject<User> = new BehaviorSubject(null)
  public $connected: BehaviorSubject<boolean> = new BehaviorSubject(null)
  public $userID: BehaviorSubject<string> = new BehaviorSubject(null)
  public $correlativo: BehaviorSubject<Correlativo> = new BehaviorSubject(null)
  public $rutas: BehaviorSubject<Ruta[]> = new BehaviorSubject(null)
  $rutasNoVisitadas: BehaviorSubject<number> = new BehaviorSubject(null)
  $productos: BehaviorSubject<Producto[]> = new BehaviorSubject(null)
  $categorias: BehaviorSubject<Categoria[]> = new BehaviorSubject(null)
  constructor() {
    return
  }
}
