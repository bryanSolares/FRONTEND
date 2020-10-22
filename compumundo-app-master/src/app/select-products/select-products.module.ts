import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { NgxMaskModule, IConfig } from 'ngx-mask'

const maskConfigFunction: () => Partial<IConfig> = () => {
  return {
    validation: false,
  };
};
import { SelectProductsPageRoutingModule } from './select-products-routing.module';

import { SelectProductsPage } from './select-products.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxMaskModule.forRoot(),
    SelectProductsPageRoutingModule
  ],
  declarations: [SelectProductsPage]
})
export class SelectProductsPageModule {}
