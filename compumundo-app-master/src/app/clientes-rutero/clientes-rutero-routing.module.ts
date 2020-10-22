import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClientesRuteroPage } from './clientes-rutero.page';

const routes: Routes = [
  {
    path: '',
    component: ClientesRuteroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRuteroPageRoutingModule {}
