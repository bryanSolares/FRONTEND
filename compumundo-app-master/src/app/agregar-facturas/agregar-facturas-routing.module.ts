import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AgregarFacturasPage } from './agregar-facturas.page';

const routes: Routes = [
  {
    path: '',
    component: AgregarFacturasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgregarFacturasPageRoutingModule {}
