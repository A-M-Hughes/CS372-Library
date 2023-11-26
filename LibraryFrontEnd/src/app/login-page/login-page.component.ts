import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  constructor(private http: HttpClient, private router: Router) { }
  email: string = '';
  password: string = '';
  apiUrl = environment.apiurl;

  onSubmit() {
    const loginData = {
      email: this.email,
      password: this.password
    }

    this.http.post(`${this.apiUrl}/login`, loginData)
      .subscribe((response: any) => {
        console.log('Registration successful!', response);

        const authToken = response?.success?.accessToken;
        if (authToken) {
          localStorage.setItem("jwt-auth-token", authToken);
        } else {
          console.error('Auth token not found in the response')
        }

        this.router.navigate(['/home']);
      }, (error: any) => {
        console.error('Login failed.', error);
      });
  }
}
