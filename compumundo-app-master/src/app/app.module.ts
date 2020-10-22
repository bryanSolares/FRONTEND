import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { AuthGuardService } from './servicios/auth-guard.service';
import { RoleGuardService } from './servicios/role-guard.service';
import { JwtModule } from '@auth0/angular-jwt';

import { HttpClientModule } from '@angular/common/http';
import { HttpModule } from '@angular/http';

import { Network } from '@ionic-native/network/ngx';

import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule, AngularFirestore } from '@angular/fire/firestore';

import { AngularFireStorageModule } from "@angular/fire/storage";
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicStorageModule } from '@ionic/storage';
import { IConfig, NgxMaskModule } from 'ngx-mask';

const maskConfig: Partial<IConfig> = {
  validation: false,
};


@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireStorageModule,
    IonicModule.forRoot({
      mode: 'md',
      scrollAssist: false,
      scrollPadding: false
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter: null,
        whitelistedDomains: [],
        blacklistedRoutes: []
      }
    }),
    HttpClientModule,
    HttpModule,
    IonicStorageModule.forRoot(),
    NgxMaskModule.forRoot(maskConfig),
    AppRoutingModule
  ],
  providers: [
    AngularFirestore,
    AuthGuardService,
    RoleGuardService,
    Network,
    BluetoothSerial, // BLUETOOTH
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
