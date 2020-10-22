import { Component, OnInit } from "@angular/core";

import { UtilitiesService } from "../servicios/utilities.service";

import { JwtHelperService } from "@auth0/angular-jwt";
import { DataService } from "../servicios/data.service";

import sha1 from "sha1";
import { FirebaseMethodsService } from "../servicios/firebase-methods.service";

import { NavController } from "@ionic/angular";
@Component({
  selector: "app-login",
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
})
export class LoginPage implements OnInit {
  cargando: boolean = false;
  conectado: boolean;
  type = "v";
  constructor(
    private utilities: UtilitiesService,
    public jwtHelper: JwtHelperService,
    private nav: NavController,
    public data: DataService,
    public firebaseMethods: FirebaseMethodsService
  ) {}

  ngOnInit() {
    this.data.$connected.subscribe((conectado) => {
      this.conectado = conectado;
    });
    this.type = "v";
  }
  async inicio(form, forzar?: boolean) {
    console.log(form);
    let user = form.value.email;
    let password = form.value.password;
    let type = form.value.type || "v";
    let passwordEncoded: string = password; //sha1(password)
    try {
      localStorage.removeItem("estaEnRuta");
      this.cargando = true;
      let response: any = await this.utilities.httpRequest(
        "users/login",
        false,
        false,
        "Sesión iniciada",
        "Se ha logrado iniciar sesión.",
        { user, password: passwordEncoded, type, forzar }
      );
      this.cargando = false;

      if (response && response.result && response.result.token) {
        let token = response.result.token;
        localStorage.setItem("token", token);
        localStorage.setItem("empresa", response.result.IDEmpresa);
        console.log("aún no ha pasado");
        await this.firebaseMethods.cargarUsuario(type);
        console.log("paso");
        localStorage.setItem("userType", type);

        const empresa: any = await this.utilities.httpRequest(
          "enterprise",
          true,
          true,
          null,
          null,
          null,
          true
        );

        empresa
          ? localStorage.setItem("empresaPrint", JSON.stringify(empresa.result))
          : localStorage.setItem("empresaPrint", "");

        if (type === "v") {
          try {
            await this.firebaseMethods.borrarTodoVendedor();
          } catch (error) {
            console.log(error);
          }
          this.nav.navigateRoot("/", { replaceUrl: true });
        } else {
          this.nav.navigateRoot("/home-cobrador", { replaceUrl: true });
        }
      }
    } catch (error) {
      this.cargando = false;
      if (error === -1) {
        let confirm = await this.utilities.presentAlertConfirm(
          "¿Desea borrar las sesiones anteriores?",
          "Esto obligará el cierre de la sesiones anteriores, pero podrá perder la información antigua."
        );

        if (confirm) {
          this.inicio(form, true);
        }
      }
    }
  }
}
