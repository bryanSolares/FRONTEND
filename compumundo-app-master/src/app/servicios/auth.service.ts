import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { DataService } from './data.service';
import { User } from '../interfaces/user';
import { UtilitiesService } from "../servicios/utilities.service"
import { FirebaseMethodsService } from './firebase-methods.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User
  constructor(
    public jwtHelper: JwtHelperService,
    public data: DataService,
    public utilities: UtilitiesService,
    public fm: FirebaseMethodsService
  ) {
    this.data.$user.subscribe(data => {
      this.user = data;
    });
  }
  public isAuthenticated(): boolean {
    if (this.user)
      return true;
    else {
      const token = localStorage.getItem('token');
      if (token) {
        return true;
      } else return false;
    }
  }
}
