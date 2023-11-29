import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth-controller/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookCollectionService {
  private apiUrl = environment.apiurl

  constructor(private http: HttpClient, private authService: AuthService) { }



  addBookToCollection(bookData: any) {
    const headers = this.authService.getHeaders();
    return this.http.post(`${this.apiUrl}/collections/addBook`, bookData, { headers });
  }

  getAllBooksFromCollection() {
    const headers = this.authService.getHeaders();
    return this.http.get(`${this.apiUrl}/collections/getBooks`, { headers });
  }

  deleteBookFromCollection(bookID: string) {
    const headers = this.authService.getHeaders();
    return this.http.delete(`${this.apiUrl}/collections/deleteBook`, { headers, body: { bookID } });
  }

}
