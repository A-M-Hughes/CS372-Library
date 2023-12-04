import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private router: Router) { }

  logOut(): void {
    console.log('Logging out...');
    localStorage.setItem('jwt-auth-token', 'garbage');
    console.log('jwt-auth-token set to garbage');

    // Log the current route before navigation
    console.log('Current route:', this.router.url);

    this.router.navigate(['/']).then(() => {
      // Log after navigation is complete
      console.log('Navigated to /logIn');
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }
}
