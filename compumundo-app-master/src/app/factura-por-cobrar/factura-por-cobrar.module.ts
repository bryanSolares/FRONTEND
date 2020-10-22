import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FacturaPorCobrarPageRoutingModule } from './factura-por-cobrar-routing.module';

import { FacturaPorCobrarPage } from './factura-por-cobrar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FacturaPorCobrarPageRoutingModule
  ],
  declarations: [FacturaPorCobrarPage]
})
export class FacturaPorCobrarPageModule {}
