import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import  { RutaDelRutPageRoutingModule } from './ruta-del-rut-routing.module';

import { RutaDelRutPage } from './ruta-del-rut.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RutaDelRutPageRoutingModule
  ],
  declarations: [RutaDelRutPage]
})
export class RutaDelRutPageModule {}
