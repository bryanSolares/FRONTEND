import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RutaDelDiaPageRoutingModule } from './ruta-del-dia-routing.module';

import { RutaDelDiaPage } from './ruta-del-dia.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RutaDelDiaPageRoutingModule
  ],
  declarations: [RutaDelDiaPage]
})
export class RutaDelDiaPageModule {}
