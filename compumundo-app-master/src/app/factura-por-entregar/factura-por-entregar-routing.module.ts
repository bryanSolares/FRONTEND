import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FacturaPorEntregarPage } from './factura-por-entregar.page';

const routes: Routes = [
  {
    path: '',
    component: FacturaPorEntregarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FacturaPorEntregarPageRoutingModule {}
