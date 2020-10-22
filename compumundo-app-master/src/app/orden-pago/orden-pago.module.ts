import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdenPagoPageRoutingModule } from './orden-pago-routing.module';

import { OrdenPagoPage } from './orden-pago.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdenPagoPageRoutingModule
  ],
  declarations: [OrdenPagoPage]
})
export class OrdenPagoPageModule {}
