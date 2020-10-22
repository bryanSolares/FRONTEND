import { Injectable } from '@angular/core';

import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class RoleGuardService implements CanActivate {
  constructor(public auth: AuthService, public router: Router) { }
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data.expectedRole;
    const redirectTo = route.data.redirectTo;
    const token = localStorage.getItem('token');
    let role = localStorage.getItem("userType")
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    } else if (role !== expectedRole) {
      this.router.navigate([redirectTo || 'login']);
      return false;
    }
    return true;
  }
}