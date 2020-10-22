import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdenPagoPage } from './orden-pago.page';

const routes: Routes = [
  {
    path: '',
    component: OrdenPagoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdenPagoPageRoutingModule { }
