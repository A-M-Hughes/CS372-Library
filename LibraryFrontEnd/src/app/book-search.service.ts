import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookSearchService {
  private apiUrl = environment.apiurl
  //private apiUrl = 'http://localhost:4000';
  private authToken = localStorage.getItem("jwt-auth-token");

  constructor(private http: HttpClient) { }

  searchBooks(query: string, page?: number) {

    const encodedQuery = encodeURIComponent(query);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authToken}`,
    });

    //return this.http.get(`${this.apiUrl}/api/booksApi/searchBooks/${query}/${page}`, { headers })
    
    return this.http.get(`http://${this.apiUrl}/booksApi/searchBooks/${encodedQuery}/${page}`, {headers, withCredentials: true })
  }
}