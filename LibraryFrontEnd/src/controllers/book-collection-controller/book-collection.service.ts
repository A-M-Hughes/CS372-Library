import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth-controller/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookCollectionService {
  private apiUrl = environment.apiurl

  constructor(private http: HttpClient, private authService: AuthService) { }



  addBookToCollection(bookData: any): Observable<any> {
    const headers = this.authService.getHeaders();
    return this.http.post(`${this.apiUrl}/collections/addBook`, bookData, { headers });
  }

  getAllBooksFromCollection(): Observable<any> {
    const headers = this.authService.getHeaders();
    return this.http.get(`${this.apiUrl}/collections/getBooks`, { headers });
  }

  deleteBookFromCollection(bookID: string): Observable<any> {
    const headers = this.authService.getHeaders();
    return this.http.delete(`${this.apiUrl}/collections/deleteBook`, { headers, body: { bookID } });
  }

}
