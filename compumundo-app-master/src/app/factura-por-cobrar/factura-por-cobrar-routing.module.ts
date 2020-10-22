import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FacturaPorCobrarPage } from './factura-por-cobrar.page';

const routes: Routes = [
  {
    path: '',
    component: FacturaPorCobrarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FacturaPorCobrarPageRoutingModule {}
