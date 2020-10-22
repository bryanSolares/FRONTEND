import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RutaDelDiaPage } from './ruta-del-dia.page';

const routes: Routes = [
  {
    path: '',
    component: RutaDelDiaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RutaDelDiaPageRoutingModule {}
