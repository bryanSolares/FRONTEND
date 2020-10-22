import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClientesRuteroPageRoutingModule } from './clientes-rutero-routing.module';

import { ClientesRuteroPage } from './clientes-rutero.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClientesRuteroPageRoutingModule
  ],
  declarations: [ClientesRuteroPage]
})
export class ClientesRuteroPageModule { }
