import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TrendingBookService {
  private apiUrl = 'http://localhost:4000/api/books/featured';

  constructor(private http: HttpClient) { }

  getTrendingBooks() {
    return this.http.get(this.apiUrl);
  }
}
