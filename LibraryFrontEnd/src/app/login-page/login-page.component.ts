import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.createLoginForm();
  }

  //Logic for logging in goes here
  login() {

     //Checks each control to see if they are empty
     Object.values(this.loginForm.controls).forEach(control => {
      if (control.value === '' && control.hasError('required')) {
        control.markAsTouched();
      }
    });
    console.log(this.loginForm.value);
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }
}
