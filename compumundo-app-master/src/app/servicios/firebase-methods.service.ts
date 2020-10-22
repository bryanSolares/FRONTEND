import { Injectable, OnInit } from '@angular/core';
import { DataService } from './data.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../interfaces/user';
import { Correlativo } from "../interfaces/correlativo";
import { Producto } from "../interfaces/producto";
import { Ruta } from "../interfaces/ruta";
import { Observable } from 'rxjs';
import { UtilitiesService } from './utilities.service';
import { Categoria } from '../interfaces/categoria';
import { Banco } from '../interfaces/banco';
import { Rutero } from '../interfaces/rutero';
import { async } from '@angular/core/testing';

@Injectable({
  providedIn: 'root'
})
export class FirebaseMethodsService implements OnInit {

  item: Observable<User>;
  public userID: string;
  conectado: boolean;
  rutas: Ruta[];
  hayPendientes: boolean = false;
  correlativoObject: Correlativo;

  public cargaRutero = {
    correlativo: false,
    itinerario: false
  }
  constructor(
    private afs: AngularFirestore,
    public data: DataService,
    public utilities: UtilitiesService
  ) {
    return
  }
  ngOnInit() {
    // Determinar hay internet
    this.userID = localStorage.getItem("userID")
    this.data.$connected.subscribe((conectado: boolean) => {
      this.conectado = conectado
    })
    this.data.$userID.subscribe((userID: string) => {
      if (userID) this.userID = userID
    })
    this.data.$rutas.subscribe((rutas: Ruta[]) => {
      this.rutas = rutas
    });
    this.data.$correlativo.subscribe((rutas: Correlativo) => {
      this.correlativoObject = rutas
    });
  }
  cargarTodo() {
    return new Promise(async (res, rej) => {
      console.log("CARGAR TODO", this.data.$user.value)
      this.userID = localStorage.getItem("userID") || ""
      let loading: HTMLIonLoadingElement = await this.utilities.createLoading()
      //if (!this.data.$user.value) { // Cargar data del usuario

      let userType = localStorage.getItem("userType")
      this.cargarUsuario(userType)
      console.log(userType)
      try {
        if (userType === "v") {
          await this.afs.collection('pendientes').doc(this.userID).delete();
          await this.afs.collection('emisiones').doc(this.userID).delete();
          await this.cargarCorrelativoOrdenVentas(loading);
          console.log("Correlativo cargado")
          await this.cargarRutaVendedor(loading);
          console.log("Rutas cargadas")
          await this.cargarProductos(loading);
          console.log("Productos cargados")
          await this.cargarCategorias(loading);
          console.log("Categorías cargadas")
          localStorage.setItem("estaEnRuta", "true")
        }
      } catch (e) {
        loading.dismiss();
        this.utilities.presentAlert('Error de conexión', 'La petición a fallado por algún error de conexión o falta de datos, intente de nuevo.');

        this.borrarTodoVendedor();
        return rej(e)
      }
      loading.dismiss()
      this.utilities.presentAlert('Datos cargados', 'Los datos han sido cargados de manera exitosa.');

      return res(true)
      //}
    })
  }
  cargarTodoRutero() {
    return new Promise(async (res, rej) => {
      this.userID = localStorage.getItem("userID") || ""
      let loading: HTMLIonLoadingElement = await this.utilities.createLoading()
      //if (!this.data.$user.value) { // Cargar data del usuario

      let userType = localStorage.getItem("userType")
      this.cargarUsuario(userType)
      console.log(userType)
      try {
        if (userType === "r") {
          this.cargaRutero = {
            correlativo: true,
            itinerario: true
          }
          /*let h = await this.afs.collection('pendientes').doc(this.userID).delete().then();
          await this.afs.collection('emisiones').doc(this.userID).delete();

          console.log(h);*/

          await this.borrarTodoRutero();
          await this.cargarEmpresas();
          await this.cargarCorrelativoPago(loading);
          console.log("Correlativo cargado");
          if (!this.cargaRutero.correlativo) {
            loading.dismiss();
            return;
          }
          await this.cargarRutaRutero(loading);
          console.log("Rutas cargadas");
          if (!this.cargaRutero.itinerario) {
            loading.dismiss();
            return;
          }
          await this.cargarProductos(loading);
          console.log("Productos cargados")
          await this.cargarCategorias(loading);
          console.log("Categorías cargadas")
          await this.cargarBancos(loading);
          console.log("Bancos cargados")
          localStorage.setItem("estaEnRuta", "true")

          localStorage.setItem('orden', '0');
        }
      } catch (e) {
        loading.dismiss();
        this.utilities.presentAlert('Error de conexión', 'La petición a fallado por algún error de conexión o falta de datos, intente de nuevo.');

        this.borrarTodoRutero();
        return rej(e)
      }
      loading.dismiss()
      this.utilities.presentAlert('Datos cargados', 'Los datos han sido cargados de manera exitosa.');
      return res(true)
      //}
    })
  }
  cargarUsuario(type) {
    return new Promise(async (res, rej) => {
      let usuarioData: any, usuario;
      let response: any = await this.utilities.httpRequest("users", true, true, null, null, null, true);

      if (type === "v") {
        usuarioData = response.result as User;
        localStorage.setItem("userID", usuarioData.CODUsuario)
        this.userID = usuarioData.CODUsuario;
      } else {
        usuarioData = response.result as Rutero;
        localStorage.setItem("userID", usuarioData.CODGenerico)
        this.userID = usuarioData.CODGenerico;
      }

      this.data.$userID.next(this.userID)
      this.afs.collection("usuarios").doc(this.userID).set(usuarioData)

      this.data.$user.next(usuarioData)
      res(usuarioData)
    })
  }
  cargarCorrelativoOrdenVentas(loading?: HTMLIonLoadingElement): Promise<Correlativo> {
    return new Promise(async (res, rej) => {
      try {
        if (loading) loading = await this.utilities.createLoading('Cargando correlativo del vendedor...');
        let correlativo: Correlativo, correlativoSnap: any;
        let response: any = await this.utilities.httpRequest("vendor-correlative", true, true, null, null, null, true);
        correlativo = response.result as Correlativo;
        this.afs.collection("correlativosov").doc(this.userID).set(correlativo)
        this.data.$correlativo.next(correlativo)
        if (loading) loading.dismiss();
        res(correlativo)
      }
      catch (err) {
        loading.dismiss();
        this.utilities.presentAlert('Sin correlativo', 'Solicite un correlativo de venta.');
        rej(err);
      }
    });
  }

  cargarEmpresas() {
    return new Promise(async (res, rej) => {
      let response: any = await this.utilities.httpRequest("enterprise", true, true, null, null, null, true);
      console.log(response);
      localStorage.setItem('Empresas', JSON.stringify(response.result));
      res(true);
    });
  }
  cargarCorrelativoPago(loading?: HTMLIonLoadingElement): Promise<Correlativo[]> {
    return new Promise(async (res, rej) => {
      try {
        if (loading) loading = await this.utilities.createLoading('Cargando correlativos...');
        let correlativos: Correlativo[], correlativoSnap: any;
        let response: any = await this.utilities.httpRequest("pilot-correlative", true, true, null, null, null, true);
        correlativos = response.result as Correlativo[];
        for (const i in correlativos) {
          const correlativo = correlativos[i];
          if (correlativo.CODTipoMovimiento === "RC")
            await this.afs.collection("correlativospa").doc(this.userID).set(correlativo)
          else
            await this.afs.collection("correlativosli").doc(this.userID).set(correlativo)
        }
        if (loading) loading.dismiss();
        res(correlativos)
      }
      catch (err) {
        this.cargaRutero.correlativo = false;
        loading.dismiss();
        this.utilities.presentAlert('Sin correlativo', 'Solicite correlativos de recibo y devolución.');
        rej(err);
      }
    });
  }
  guardarCambioCorrelativoOrdenVentas(): Promise<any> {
    return this.afs.collection("correlativosov").doc(this.userID).update(this.correlativoObject)
  }
  async cargarRutaVendedor(loading: HTMLIonLoadingElement) {
    try {
      console.log("cargar rutas")
      loading = await this.utilities.createLoading('Cargando itinerario de clientes...');
      let rutasAnteriores = await this.afs.collection("rutas", q => q.where("usuario", "==", this.userID)).get().toPromise();
      let rutaData = rutasAnteriores.docs
      for (const rutaDoc in rutaData) {
        const rutaSnap = rutaData[rutaDoc];
        try {
          this.afs.collection("rutas").doc(rutaSnap.id).delete()
        } catch (e) {
          console.log(e)
        }
      }
      let rutas: Ruta[] = [], rutasNoVisitadas = 0, rutasVisitadas = 0, rutaSnap: firebase.firestore.QuerySnapshot;
      let response: any = await this.utilities.httpRequest("vendor-customer", true, true, null, null, null, true);
      rutas = response.result;
      let contador = 0;

      //Itinerario en local storage.
      localStorage.setItem("ITSerie", rutas[0].Serie);
      localStorage.setItem("ITCorrelativo", String(rutas[0].IDDocumento));

      for (const i in rutas) {
        const ruta = rutas[i];
        ruta.usuario = this.userID;
        ruta.visitada = false;
        rutasNoVisitadas++;
        let r = await this.afs.collection("rutas").add(ruta)
        ruta.id = r.id
        contador++;
      }
      loading.dismiss()
    }
    catch (err) {
      loading.dismiss();
      this.utilities.presentAlert('Sin itinerarios', 'No hay itinerarios asignados.');
      this.borrarTodoVendedor();
    }
  }

  async cargarRutaRutero(loading: HTMLIonLoadingElement) {
    try {
      console.log("cargar rutas")
      loading = await this.utilities.createLoading('Cargando rutas de clientes y facturas...');
      let rutasAnteriores = await this.afs.collection("viajes", q => q.where("usuario", "==", this.userID)).get().toPromise();
      let rutaData = rutasAnteriores.docs
      for (const rutaDoc in rutaData) {
        const rutaSnap = rutaData[rutaDoc];
        try {
          this.afs.collection("viajes").doc(rutaSnap.id).delete()
        } catch (e) {
          console.log(e)
        }
      }
      console.log('hola')
      let rutas: Ruta[] = [], rutasNoVisitadas = 0, rutasVisitadas = 0, rutaSnap: firebase.firestore.QuerySnapshot;
      let response: any = await this.utilities.httpRequest("pilot-travels", true, true, null, null, null, true);
      console.log(response)
      rutas = response.result.viajes;

      for (const i in rutas) {
        const ruta = rutas[i];
        ruta.usuario = this.userID;
        ruta.visitada = false;
        ruta.recibo = false;
        rutasNoVisitadas++;
        let r = await this.afs.collection("viajes").add(ruta)

        ruta.id = r.id
      }
      console.log(response.result)
      this.afs.collection("encabezado-viaje").doc(this.userID).set({
        "Serie": response.result.Serie,
        "IDViaje": response.result.IDViaje,
        "IDTransporte": response.result.IDTransporte,
        "PesoMax": response.result.PesoMax,
      })
      await this.cargarFacturas(response.result.IDViaje, response.result.Serie, loading);

      loading.dismiss();
    }
    catch (err) {
      this.cargaRutero.itinerario = false;
      console.log(err);
      loading.dismiss();
      this.utilities.presentAlert('Sin itinerario', 'No hay un itinerario para el día de hoy.');
      localStorage.setItem('itinerario', 'n');
      this.borrarTodoRutero();
    }
  }

  async cargarFacturas(viaje: string, serie: string, loading: HTMLIonLoadingElement) {
    try {
      console.log("cargar facturas")
      let rutasAnteriores = await this.afs.collection("facturas", q => q.where("usuario", "==", this.userID)).get().toPromise();
      let rutaData = rutasAnteriores.docs
      for (const rutaDoc in rutaData) {
        const rutaSnap = rutaData[rutaDoc];
        try {
          this.afs.collection("facturas").doc(rutaSnap.id).delete()
        } catch (e) {
          console.log(e)
        }
      }
      let rutas: Ruta[] = [], rutasNoVisitadas = 0, rutasVisitadas = 0, rutaSnap: firebase.firestore.QuerySnapshot;
      let response: any = await this.utilities.httpRequest(`pilot-invoice?viaje=${viaje}&serie=${serie}`, true, true, null, null, null, true);
      rutas = response.result;
      console.log(rutas);
      for (const i in rutas) {
        const ruta = rutas[i];
        ruta.usuario = this.userID;
        ruta.visitada = false;

        rutasNoVisitadas++;
        let r = await this.afs.collection("facturas").add(ruta)
        ruta.id = r.id
      }
      loading.dismiss();
    }
    catch (err) {
      this.cargaRutero.itinerario = false;
      console.log(err);
      loading.dismiss();
      localStorage.setItem('itinerario', 'n');
      this.utilities.presentAlert('Sin itinerario', 'No hay facturas asignadas para ser entregadas.');
      this.borrarTodoRutero();
    }
  }
  async eliminarRutas(rutas: Ruta[]) {
    for (const i in rutas) {
      const ruta = rutas[i];
      this.afs.collection('rutas').doc(ruta.id).delete();
    }
    this.afs.collection('correlativosov').doc(this.userID).delete();
  }
  async cargarProductos(loading: HTMLIonLoadingElement) {
    try {
      let productos: Producto[] = [], productoSnap: any;
      loading = await this.utilities.createLoading('Cargando productos...');
      productoSnap = await this.afs.collection('productos').get().toPromise()
      console.log(productoSnap)
      productoSnap.forEach(producto => {
        let productoData = producto.data() as Producto;
        productos.push(productoData)
      });
      loading.dismiss();
      console.log(productos);
      this.data.$productos.next(productos);
    }
    catch (err) {
      loading.dismiss();
      this.utilities.presentAlert('Error de conexión', 'La petición a fallado por algún error de conexión o falta de datos, intente de nuevo.');
      this.borrarTodoVendedor();
    }
  }
  async cargarCategorias(loading: HTMLIonLoadingElement) {
    try {
      let productos: Categoria[] = [], productoSnap: any;
      loading = await this.utilities.createLoading('Cargando categorías de los productos...');
      productoSnap = await this.afs.collection('categorias').get().toPromise()
      productoSnap.forEach(producto => {
        let productoData = producto.data() as Categoria;
        productos.push(productoData)
      });
      loading.dismiss();
      this.data.$categorias.next(productos);
    }
    catch (err) {
      loading.dismiss();
      this.utilities.presentAlert('Error de conexión', 'La petición a fallado por algún error de conexión o falta de datos, intente de nuevo.');
      this.borrarTodoVendedor();
    }
  }
  async cargarBancos(loading: HTMLIonLoadingElement) {
    try {
      loading = await this.utilities.createLoading('Cargando cuentas bancarias...');

      let productos: Banco[] = [], productoSnap: any;
      productoSnap = await this.afs.collection('cuentas_bancarias').get().toPromise()
      productoSnap.forEach(producto => {
        let productoData = producto.data()
        productos.push(productoData)
      });

      loading.dismiss();
    }
    catch (err) {
      loading.dismiss();
      this.utilities.presentAlert('Error de conexión', 'La petición a fallado por algún error de conexión o falta de datos, intente de nuevo.');
      this.borrarTodoRutero();
    }
  }

  async marcarNoVisitaViaje(ruta: Ruta) {
    let rutasNoVisitadas = 0, rutasVisitadas = 0;
    this.userID = localStorage.getItem("userID") || "";

    //this.afs.collection("viajes").doc(ruta.id).update({ visitada: true })
    let rutasMarcadas = await this.afs.collection("viajes", q => q.where("usuario", "==", this.userID).where("IdCliente", "==", ruta.IdCliente)).get().toPromise();

    rutasMarcadas.forEach(async snap => {
      await this.afs.collection("viajes").doc(snap.id).update({ visitada: false });
    });

    let rutas = await this.afs.collection("viajes", q => q.where("usuario", "==", this.userID)).get().toPromise()
    rutas.forEach(routeSnap => {
      let route = routeSnap.data()
      if (route.visitada) rutasVisitadas++;
      else rutasNoVisitadas++;
    });
    if (rutasVisitadas === rutas.size) { // HA COMPLETADO TODAS SUS RUTAS
      this.utilities.presentAlert("Ruta completada", "Ha completado su ruta.")
    }
  }

  async marcarVisitaViaje(ruta: Ruta) {
    return new Promise(async (res, rej) => {
      let rutasNoVisitadas = 0, rutasVisitadas = 0;
      this.userID = localStorage.getItem("userID") || "";

      //this.afs.collection("viajes").doc(ruta.id).update({ visitada: true })
      let rutasMarcadas = await this.afs.collection("viajes", q => q.where("usuario", "==", this.userID).where("IdCliente", "==", ruta.IdCliente)).get().toPromise();

      rutasMarcadas.forEach(snap => {
        this.afs.collection("viajes").doc(snap.id).update({ visitada: true });
        let route: any = snap.data();
        route.id = snap.id;

        let ruta: Ruta = {
          estado: 6,
          IdFactura: route.IdFactura
        }

        console.log(route);
        if (route.estado == 0) {

          this.afs.collection('viajes').doc(route.id).update({ estado: 6 })
          this.enviarCambioFactura(ruta)
        }
      });

      let rutas = await this.afs.collection("viajes", q => q.where("usuario", "==", this.userID)).get().toPromise()
      rutas.forEach(async routeSnap => {
        let route = routeSnap.data()
        if (route.visitada) rutasVisitadas++;
        else rutasNoVisitadas++;
      });
      if (rutasVisitadas === rutas.size) { // HA COMPLETADO TODAS SUS RUTAS
        this.utilities.presentAlert("Ruta completada", "Ha completado su ruta.")
      }
      res(true);
    });
  }

  enviarCambioFactura(it: Ruta, notRetry?: boolean) {
    return new Promise(async (res, rej) => {
      try {
        let encabezadoSnap = await this.afs.collection("encabezado-viaje").doc(this.userID).get().toPromise(), encabezado = encabezadoSnap.data()
        let r: any = await this.utilities.httpRequest(
          `pilot-state-invoice?estado=${it.estado}&IdFactura=${it.IdFactura}&serieViaje=${encabezado.Serie}&idViaje=${encabezado.IDViaje}&IDEmpresa=${localStorage.getItem('empresa')}`, true, true, null, null, null, true);
        if (r.error === 0) {
          res(true)
        } else {
          if (!notRetry)
            this.crearPendienteFactura(it)
          res(true)
        }

      } catch (error) {
        console.log(error)
        if (!notRetry) {
          console.log('here');
          this.crearPendienteFactura(it)
        }

        res(true)
      }

    });
  }

  crearPendienteFactura(it: Ruta) {
    this.afs.collection("pendientes").doc(this.userID).collection("facturas-estado").add({
      estado: it.estado,
      IdFactura: it.IdFactura,
      serieViaje: localStorage.getItem('serie'),
      idViaje: localStorage.getItem('viaje'),
      IDEmpresa: localStorage.getItem('empresa'),
      orden: Number(localStorage.getItem('orden'))
    });
    localStorage.setItem('orden', String(Number(localStorage.getItem('orden')) + 1));
    return;
  }

  async marcarVisitaRuta(ruta: Ruta) {
    let rutasNoVisitadas = 0, rutasVisitadas = 0;
    this.afs.collection("rutas").doc(ruta.id).update({ visitada: true })
    this.userID = localStorage.getItem("userID") || ""
    let rutas = await this.afs.collection("rutas", q => q.where("usuario", "==", this.userID)).get().toPromise()
    rutas.forEach(routeSnap => {
      let route = routeSnap.data()
      if (route.visitada) rutasVisitadas++;
      else rutasNoVisitadas++;
    });
    if (rutasVisitadas === rutas.size) { // HA COMPLETADO TODAS SUS RUTAS
      this.utilities.presentAlert("Ruta completada", "Ha completado su ruta.")
    }
  }

  async marcarNoVisitaRuta(ruta: Ruta) {
    let rutasNoVisitadas = 0, rutasVisitadas = 0;
    this.afs.collection("rutas").doc(ruta.id).update({ visitada: false })
    this.userID = localStorage.getItem("userID") || ""
    let rutas = await this.afs.collection("rutas", q => q.where("usuario", "==", this.userID)).get().toPromise()
    rutas.forEach(routeSnap => {
      let route = routeSnap.data()
      if (route.visitada) rutasVisitadas++;
      else rutasNoVisitadas++;
    });
  }

  // VENDEDOR
  comprobarPendientesVendedor(): Promise<{ pendientes: boolean, data: firebase.firestore.QuerySnapshot }> {
    this.userID = localStorage.getItem("userID") || ""
    return new Promise(async (res, rej) => {
      this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").get().toPromise().then(s => {
        res({ pendientes: s.empty, data: s })

      })
    });
  }
  subirPendientesVendedor(data: firebase.firestore.QuerySnapshot) {
    return new Promise(async (res, rej) => {
      // 1. Iterar las ordenes pendientes de subir
      let docs = data.docs;

      for (const i in docs) {
        const dodo = docs[i];
        // this.utilities.httpRequest("", false, true) // MÉTODO PARA SUBIR ORDENES DE COMPRA
        // 2. Respuesta correcta, borrar
        await this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").doc(dodo.id).delete();

        // 3. Verificar el correlativo
        if ((this.correlativoObject.NumeroDocumento + 1) > this.correlativoObject.RangoFinal) {
          let antesC = this.correlativoObject;
          let coT = await this.cargarCorrelativoOrdenVentas();
          if (coT.NumeroDocumento === antesC.NumeroDocumento && coT.Serie === antesC.Serie) this.correlativoObject = coT;
        }
        // GUARDAR EL CAMBIO DEL CORRELATIVO
        this.correlativoObject.NumeroDocumento++;
        this.guardarCambioCorrelativoOrdenVentas();
      }
      res(true)
    })
  }

  async borrarTodoVendedor() {
    this.userID = localStorage.getItem("userID") || ""
    let rutasAnteriores = await this.afs.collection("rutas", q => q.where("usuario", "==", this.userID)).get().toPromise();
    let rutaData = rutasAnteriores.docs
    for (const rutaDoc in rutaData) {
      const rutaSnap = rutaData[rutaDoc];
      try {
        this.afs.collection("rutas").doc(rutaSnap.id).delete()
      } catch (e) {
        console.log(e)
      }

      try {
        let oGSnap = await this.afs.collection("ordenes-generadas", q => q.where("clienteID", "==", rutaSnap.data().CODCliente)).get().toPromise()
        let oG = oGSnap.docs;
        for (const i in oG) {
          const oGDATA = oG[i];
          await this.afs.collection("ordenes-generadas").doc(oGDATA.id).delete()
        }
      } catch (error) { }

    }
    let s = await this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").get().toPromise()
    let sss = s.docs
    for (const sk in sss) {
      this.afs.collection("pendientes").doc(this.userID).collection("ordenes-venta").doc(sss[sk].id).delete()
    }

    localStorage.removeItem("estaEnRuta")
    this.afs.collection("canasta").doc(this.userID).delete()


  }

  async borrarTodoRutero() {
    this.userID = localStorage.getItem("userID") || ""
    let rutas = ["facturas-estado", "cobros-realizados", "recibos-emitidos", "pagos-facturas", "devoluciones", "liquidaciones"]
    for (const i in rutas) {
      const ruta = rutas[i];
      let fEsSnap = await this.afs.collection("pendientes").doc(this.userID).collection(ruta).get().toPromise()
      let fEs = fEsSnap.docs || []
      for (const i in fEs) {
        const fE = fEs[i];
        try {
          this.afs.collection("pendientes").doc(this.userID).collection(ruta).doc(fE.id).delete()
        } catch (error) {
          console.log(error);
        }
      }
    }

    this.afs.collection("encabezado-viaje").doc(this.userID).delete()

    let rEmSnap = await this.afs.collection("emisiones").doc(this.userID).collection("recibos-emitidos").get().toPromise()
    let rEm = rEmSnap.docs || []
    for (const i in rEm) {
      const rE = rEm[i];
      try {
        this.afs.collection("emisiones").doc(this.userID).collection("recibos-emitidos").doc(rE.id).delete()
      } catch (error) {
      }
    }

  }


}
