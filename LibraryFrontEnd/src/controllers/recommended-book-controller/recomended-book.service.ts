import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecomendedBookService {
  private apiUrl = environment.apiurl;

  private authToken = localStorage.getItem("jwt-auth-token");

  constructor(private http: HttpClient) { }

  getRecommendedBooks() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authToken}`,
    });

    return this.http.get(`${this.apiUrl}/recommendations/getRecommendations`, { headers });
  }

  createRecommendations() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authToken}`,
    });

    return this.http.post(`${this.apiUrl}/recommendations/createRecommendations`, {}, { headers });

  }

  deleteRecommendations() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authToken}`,
    });

    return this.http.delete(`${this.apiUrl}/recommendations/deleteRecommendations`, { headers });

  }
}
