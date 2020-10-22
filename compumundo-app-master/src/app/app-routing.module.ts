import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SimpleLoadingStrategy } from "./simplepreload";
import {
  AuthGuardService as AuthGuard
} from './servicios/auth-guard.service';
import { RoleGuardService } from './servicios/role-guard.service';
const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "v", redirectTo: "home-cobrador" }
  },
  {
    path: 'list',
    loadChildren: () => import('./list/list.module').then(m => m.ListPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'ruta-del-dia',
    loadChildren: () => import('./ruta-del-dia/ruta-del-dia.module').then(m => m.RutaDelDiaPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "v" }
  },
  {
    path: 'ruta-del-rut',
    loadChildren: () => import('./ruta-del-rut/ruta-del-rut.module').then(m => m.RutaDelRutPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "r" }
  },
  {
    path: 'orden-de-venta',
    loadChildren: () => import('./orden-de-venta/orden-de-venta.module').then(m => m.OrdenDeVentaPageModule)
  },
  {
    path: 'orden-pago',
    loadChildren: () => import('./orden-pago/orden-pago.module').then(m => m.OrdenPagoPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "r" }
  },
  {
    path: 'select-category',
    loadChildren: () => import('./select-category/select-category.module').then(m => m.SelectCategoryPageModule)
  },
  {
    path: 'select-products',
    loadChildren: () => import('./select-products/select-products.module').then(m => m.SelectProductsPageModule)
  },
  {
    path: 'home-cobrador',
    loadChildren: () => import('./home-cobrador/home-cobrador.module').then(m => m.HomeCobradorPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "r" }
  },
  {
    path: 'lista-facturas',
    loadChildren: () => import('./lista-facturas/lista-facturas.module').then(m => m.ListaFacturasPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "r" }
  },
  {
    path: 'factura-por-entregar',
    loadChildren: () => import('./factura-por-entregar/factura-por-entregar.module').then(m => m.FacturaPorEntregarPageModule)
  },
  {
    path: 'factura-por-cobrar',
    loadChildren: () => import('./factura-por-cobrar/factura-por-cobrar.module').then(m => m.FacturaPorCobrarPageModule)
  },
  {
    path: 'agregar-facturas',
    loadChildren: () => import('./agregar-facturas/agregar-facturas.module').then(m => m.AgregarFacturasPageModule)
  },
  {
    path: 'cliente',
    loadChildren: () => import('./cliente/cliente.module').then(m => m.ClientePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'clientes',
    loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesPageModule),
    canActivate: [AuthGuard]
  }, {
    path: 'clientes-rutero',
    loadChildren: () => import('./clientes-rutero/clientes-rutero.module').then(m => m.ClientesRuteroPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'liquidar',
    loadChildren: () => import('./liquidar/liquidar.module').then(m => m.LiquidarPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "r" }
  },
  {
    path: 'cuentas',
    loadChildren: () => import('./cuentas/cuentas.module').then(m => m.CuentasPageModule),
    canActivate: [RoleGuardService],
    data: { expectedRole: "r" }
  }



];

@NgModule({
  providers: [SimpleLoadingStrategy],
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: SimpleLoadingStrategy })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
