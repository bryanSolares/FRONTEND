import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LiquidarPage } from './liquidar.page';

const routes: Routes = [
  {
    path: '',
    component: LiquidarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LiquidarPageRoutingModule {}
