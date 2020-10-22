import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FacturaPorEntregarPageRoutingModule } from './factura-por-entregar-routing.module';

import { FacturaPorEntregarPage } from './factura-por-entregar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FacturaPorEntregarPageRoutingModule
  ],
  declarations: [FacturaPorEntregarPage]
})
export class FacturaPorEntregarPageModule {}
