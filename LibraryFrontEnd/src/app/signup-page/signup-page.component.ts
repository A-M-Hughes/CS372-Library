import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  constructor(private http: HttpClient, private router: Router){}

  email: string = '';
  password: string = '';

  apiUrl: string = environment.apiurl

  onSubmit() {
    const registrationData = {
      email: this.email,
      password: this.password,
    };

    this.http.post(`http://${this.apiUrl}/register`, registrationData)
    .subscribe((response: any) => {
      console.log('Registration successful!', response);
      const data = {
        token: response.success.accessToken,
        refresh: response.success.refreshToken
      }
  
      localStorage.setItem("jwt-auth-token", data.token);
      localStorage.setItem("jwt-refr-token", data.refresh);
  
      this.router.navigate(['/home']);
    }, (error: any) => {
      console.error('Registration failed.', error);
    });
  }


}
