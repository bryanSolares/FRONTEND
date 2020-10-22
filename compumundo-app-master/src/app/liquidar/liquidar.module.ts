import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LiquidarPageRoutingModule } from './liquidar-routing.module';

import { LiquidarPage } from './liquidar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LiquidarPageRoutingModule
  ],
  declarations: [LiquidarPage]
})
export class LiquidarPageModule {}
