import { Component, ChangeDetectorRef, OnInit } from "@angular/core";

import { Platform, NavController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Network } from "@ionic-native/network/ngx";
import { DataService } from "./servicios/data.service";

import { AngularFirestore } from "@angular/fire/firestore";
import { User } from "./interfaces/user";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
})
export class AppComponent implements OnInit {
  public appPages = [
    {
      title: "Home",
      url: "/home",
      icon: "home",
    },
    {
      title: "List",
      url: "/list",
      icon: "list",
    },
  ];
  userO: any;
  isVendedor: boolean = false;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private network: Network,
    public data: DataService,

    public fs: AngularFirestore,
    public nav: NavController,
    public change: ChangeDetectorRef
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.initializeApp();
  }
  userID: string;
  initializeApp() {
    this.userID = localStorage.getItem("userID");
    this.userO = {};
    console.log(this.userO);

    this.data.$user.subscribe((s) => {
      this.userO = s;
    });

    if (this.userID) {
      this.data.$userID.next(this.userID);
      this.fs
        .collection("usuarios")
        .doc(this.userID)
        .get()
        .toPromise()
        .then((s) => {
          let usuarioData = s.data() as User;
          this.data.$user.next(usuarioData);
        });
    }

    this.platform.ready().then(async () => {
      this.splashScreen.hide();

      if (this.network.type !== this.network.Connection.NONE)
        this.data.$connected.next(true);
      else this.data.$connected.next(false);
      let disconnectSubscription = this.network.onDisconnect().subscribe(() => {
        console.log("network was disconnected :-(");
        this.data.$connected.next(false);
      });
      let connectSubscription = this.network.onConnect().subscribe(() => {
        console.log("network connected!");
        this.data.$connected.next(true);
      });

      this.isVendedor = localStorage.getItem("userType") === "v" ? true : false;

      this.change.detectChanges();
    });
  }
  cerrarSesion() {
    localStorage.clear();
    this.nav.navigateRoot("/login", { replaceUrl: true });
  }
}
