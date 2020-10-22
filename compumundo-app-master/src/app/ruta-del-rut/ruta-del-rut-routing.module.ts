import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RutaDelRutPage } from './ruta-del-rut.page';

const routes: Routes = [
  {
    path: '',
    component: RutaDelRutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RutaDelRutPageRoutingModule {}
