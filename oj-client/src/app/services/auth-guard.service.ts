import {Inject, Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(@Inject('auth') private auth,
              public router: Router) { }

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    } else {
      // redirect to home pave
      this.router.navigate(['/problems']);
      return false;
    }
  }


  isAdmin(): boolean {
    if (this.auth.isAuthenticated()) {
      const roles = this.auth.getRoles();
      return roles.includes('admin');
      // for (let i = 0; i < roles.length; i++) {
      //   if (roles[i] === 'admin') {
      //     return true;
      //   }
      // }
    }
    return false;
  }
}
