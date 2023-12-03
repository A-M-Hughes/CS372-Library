import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatChipInputEvent, MatChipEditedEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from 'src/environments/environment';


export interface Genre {
  name: string;
}

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  constructor(private http: HttpClient, private router: Router) { }

  email: string = '';
  password: string = '';
  name: string = '';

  apiUrl: string = environment.apiurl

  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  genres: String[] = ['Action', 'Adventure', 'Fantasy'];

  announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value) {
      this.genres.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  remove(genre: String): void {
    const index = this.genres.indexOf(genre);

    if (index >= 0) {
      this.genres.splice(index, 1);

      this.announcer.announce(`Removed ${genre}`);
    }
  }

  edit(genre: String, event: MatChipEditedEvent) {
    const value = event.value.trim();

    if (!value) {
      this.remove(genre);
      return;
    }

    const index = this.genres.indexOf(genre);
    if (index >= 0) {
      this.genres[index] = value;
    }
  }

  onSubmit() {
    const registrationData = {
      email: this.email,
      password: this.password,
      name: this.name,
      genres: this.genres
    };

    this.http.post(`${this.apiUrl}/register`, registrationData)
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
