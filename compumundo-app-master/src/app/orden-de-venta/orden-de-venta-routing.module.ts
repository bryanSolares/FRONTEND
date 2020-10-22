import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdenDeVentaPage } from './orden-de-venta.page';

const routes: Routes = [
  {
    path: '',
    component: OrdenDeVentaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdenDeVentaPageRoutingModule {}
