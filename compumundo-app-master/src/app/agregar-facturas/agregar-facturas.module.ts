import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AgregarFacturasPageRoutingModule } from './agregar-facturas-routing.module';

import { AgregarFacturasPage } from './agregar-facturas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AgregarFacturasPageRoutingModule
  ],
  declarations: [AgregarFacturasPage]
})
export class AgregarFacturasPageModule {}
