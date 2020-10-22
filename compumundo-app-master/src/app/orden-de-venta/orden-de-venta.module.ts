import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { NgxMaskModule, IConfig } from 'ngx-mask'

import { OrdenDeVentaPageRoutingModule } from './orden-de-venta-routing.module';

import { OrdenDeVentaPage } from './orden-de-venta.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxMaskModule.forRoot(),
    OrdenDeVentaPageRoutingModule
  ],
  declarations: [OrdenDeVentaPage]
})
export class OrdenDeVentaPageModule {}
