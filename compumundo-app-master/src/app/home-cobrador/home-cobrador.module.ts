import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomeCobradorPageRoutingModule } from './home-cobrador-routing.module';

import { HomeCobradorPage } from './home-cobrador.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomeCobradorPageRoutingModule
  ],
  declarations: [HomeCobradorPage]
})
export class HomeCobradorPageModule {}
