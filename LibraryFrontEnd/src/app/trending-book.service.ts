import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrendingBookService {
  private apiUrl = environment.apiurl;

  constructor(private http: HttpClient) { }

  getTrendingBooks() {
    const authToken = localStorage.getItem("jwt-auth-token");
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    return this.http.get(`${this.apiUrl}/booksApi/featured`, { headers });
  }
}
