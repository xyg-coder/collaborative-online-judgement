// src/app/auth/auth.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import * as auth0 from 'auth0-js';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class AuthService {

  domain = 'coj-xinyuan.auth0.com';
  auth0 = new auth0.WebAuth({
    clientID: 'pf_K2LP7K-6J49wQ6lt69WJMyBtxfnnp',
    domain: 'coj-xinyuan.auth0.com',
    responseType: 'token id_token',
    // responseType: 'code',
    audience: 'https://coj-xinyuan.auth0.com/userinfo',
    redirectUri: 'http://127.0.0.1:3000/callback',
    scope: 'openid profile email'
  });

  constructor(public router: Router, private http: HttpClient) {}

  public login() {
    this.auth0.authorize();
  }

  // ...
  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        const accessToken = authResult.accessToken;
        this.auth0.client.userInfo(accessToken, (error: string, profile: Object) => {
          localStorage.setItem('profile', JSON.stringify(profile));
          this.setSession(authResult);
         window.location.href = localStorage.getItem('curLocation');
          console.log(this.auth0);
          console.log('handle authentication');
        });
      } else if (err) {
        this.router.navigate(['/home']);
        console.log(err);
      }
    });
  }

  private setSession(authResult): void {
    // Set the time that the Access Token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    // console.log('set session');
  }

  public logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('profile');
    // Go back to the home route
  }

  public isAuthenticated(): boolean {
    // Check whether the current time is past the
    // Access Token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public getProfile() {
    return JSON.parse(localStorage.getItem('profile'));
  }

  public resetPassword(): Object {
    const options = {headers: new HttpHeaders({'Content-Type': 'application/json'})};
    const body = {
      client_id: 'pf_K2LP7K-6J49wQ6lt69WJMyBtxfnnp',
      email: this.getProfile().email,
      connection: 'Username-Password-Authentication'
    };
    const url = 'https://coj-xinyuan.auth0.com/dbconnections/change_password';
    return this.http.post(url, body, options)
      .toPromise()
      .then((res: Response) => {
        console.log(res);
      }).catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('Error Occurred', error);
    return Promise.reject(error.message || error);
  }

  public getRoles(): Object {
    const appData = 'https://coj-authorization-domain.com/app_metadata';
    return this.getProfile()[appData].authorization.roles;
  }
}


