import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Subscription} from 'rxjs/Subscription';
import {Router} from '@angular/router';
import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  title = 'COJ';
  username = '';

  searchBox: FormControl = new FormControl();

  subscription: Subscription;

  constructor(@Inject('auth') public auth,
              @Inject('input') private input,
              private router: Router) {
  }

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.username = this.auth.getProfile().nickname;
    }

    this.subscription = this.searchBox.valueChanges
      .debounceTime(200) // every 200 catches one event
      .subscribe(
      term => {
        this.input.changeInput(term);
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  searchProblem() {
    this.router.navigate(['/problems']);
  }


  login(): void {
    localStorage.setItem('curLocation', window.location.href);
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
    localStorage.removeItem('curLocation');
  }

}
