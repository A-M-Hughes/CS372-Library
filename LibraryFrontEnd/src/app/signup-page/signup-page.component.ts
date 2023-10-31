import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  signupForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.signupForm = this.createSignupForm();
  }

  //Logic for signing up goes here
  signup() {
    // Check if the passwords match
    if (this.signupForm.value.password !== this.signupForm.value.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

     //Check each control and mark as touched if empty
    Object.values(this.signupForm.controls).forEach(control => {
      if (control.value === '' && control.hasError('required')) {
        control.markAsTouched();
      }
    });

    console.log(this.signupForm.value);
  }

  private createSignupForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    });
  }
}
