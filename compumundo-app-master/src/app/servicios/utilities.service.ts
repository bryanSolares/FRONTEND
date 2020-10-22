import { Injectable } from "@angular/core";
import {
  AlertController,
  LoadingController,
  ActionSheetController,
  ToastController,
} from "@ionic/angular";
import { AlertOptions } from "@ionic/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AppSettings } from "../servicios/global";
import { async } from "rxjs/internal/scheduler/async";

@Injectable({
  providedIn: "root",
})
export class UtilitiesService {
  constructor(
    public loadingController: LoadingController,
    public actionSheetController: ActionSheetController,
    private alertController: AlertController,
    public toastController: ToastController,
    public http: HttpClient
  ) {}

  public presentAlert(headers: string, msm: string, subheader?: string) {
    return new Promise(async (res, rej) => {
      let alerOptions: AlertOptions = {
        header: headers,
        subHeader: subheader,
        message: msm,
        buttons: [
          {
            text: "Aceptar",
            handler: (blah) => {
              res(true);
            },
          },
        ],
        keyboardClose: true,
      };
      await this.alertController.create(alerOptions).then((_alert) => {
        _alert.present();
      });
    });
  }
  presentToast(message: string) {
    return new Promise(async (res, rej) => {
      const toast: HTMLIonToastElement = await this.toastController.create({
        message,
        duration: 2000,
      });
      toast.present();
      toast.onDidDismiss().then(res).catch(rej);
    });
  }
  presentAlertConfirm(header: string, message: string): Promise<boolean> {
    return new Promise((res, rej) => {
      this.alertController
        .create({
          header,
          message,
          buttons: [
            {
              text: "Cancelar",
              role: "cancel",
              cssClass: "secondary",
              handler: (blah) => {
                res(false);
              },
            },
            {
              text: "Aceptar",
              handler: () => {
                res(true);
              },
            },
          ],
        })
        .then((alert) => {
          alert.present();
        });
    });
  }

  presentAlertPrompt(
    header: string,
    message: string,
    number?: boolean,
    min?: number,
    max?: number
  ): Promise<string | number> {
    return new Promise(async (res, rej) => {
      const alert = await this.alertController.create({
        header,
        message,
        inputs: [
          {
            name: "name",
            type: number ? "number" : "text",
            min: min || 0,
            max: max || 1000,
            placeholder: "Ingrese un texto",
          },
        ],
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
            cssClass: "secondary",
            handler: () => {
              console.log("Confirm Cancel");
            },
          },
          {
            text: "Aceptar",
            handler: (data) => {
              res(data.name);
            },
          },
        ],
      });
      await alert.present();
    });
  }

  public presentAlertError(error: number) {
    let message = "Un error desconocido ha ocurrido";
    switch (error) {
      case -1:
        message = "Ya tiene una sesión activa, por favor, cierre la anterior.";
        break;
      case -2:
        message = "No hay autorización para la acción deseada.";
        break;
      case 2:
        message =
          "Credenciales inválidas, por favor, ingrese sus datos de usuario nuevamente.";
        break;
      case 3:
        message = "Error con la conexión a la base de datos.";
        break;
      case 4:
        message =
          "El usuario o la contraseña no son válidos, por favor, revise.";
        break;
      case 5:
        message =
          "No se ha logrado obtener un correlativo adecuado para su usuario.";
        break;
      case 6:
        message = "No se ha logrado recuperar la información del cliente.";
        break;
      case 7:
        message = "No se ha logrado recuperar la información de los productos.";
        break;
      default:
        break;
    }
    return new Promise(async (res, rej) => {
      let alerOptions: AlertOptions = {
        header: "Un error ha ocurrido",
        message,
        buttons: [
          {
            text: "Aceptar",
            handler: (blah) => {
              res(true);
            },
          },
        ],
        keyboardClose: true,
      };
      await this.alertController.create(alerOptions).then((_alert) => {
        _alert.present();
      });
    });
  }
  public createLoading(message?: string): Promise<HTMLIonLoadingElement> {
    return new Promise((res, rej) => {
      let mess: string = "Por favor, espere";
      if (message) mess = message;
      this.loadingController
        .create({
          message: mess,
        })
        .then((l: HTMLIonLoadingElement) => {
          document.getElementById("htmlapp").classList.add("loadingpresented");
          l.onDidDismiss().then((s) => {
            document
              .getElementById("htmlapp")
              .classList.remove("loadingpresented");
          });
          l.present();
          res(l);
        });
    });
  }
  public httpRequest(
    method: string,
    getType: boolean,
    silence: boolean,
    afterTitle?: string,
    afterMessage?: string,
    jsonData?: any,
    headers?: boolean
  ) {
    return new Promise(async (res, rej) => {
      try {
        let token: string, hT;
        if (headers) {
          token = localStorage.getItem("token");
          hT = {
            headers: new HttpHeaders().set("Authorization", token),
          };
        }

        let requestT = getType
          ? this.http.get(AppSettings.API_ENDPOINT + method, hT)
          : this.http.post(AppSettings.API_ENDPOINT + method, jsonData, hT);
        let s: any = await requestT.toPromise();

        if (s && s.error !== 0) {
          // NO HAY ERROR
          if (!silence) await this.presentAlertError(s.error);
          rej(s.error);
        } else {
          if (!silence) await this.presentAlert(afterTitle, afterMessage);
          res(s);
        }
      } catch (e) {
        if (!silence)
          await this.presentAlert(
            "Un error ha ocurrido",
            "No fue posible realizar la petición."
          );
        rej(e);
      }
    });
  }
  formatNumber(numero: number): string {
    let t = (Math.round(numero * 100) / 100).toFixed(2).toString();
    t = t.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return t;
  }
}
