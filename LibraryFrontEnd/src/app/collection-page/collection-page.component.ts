import { Component, OnInit } from '@angular/core';
import { BookCollectionService } from 'src/controllers/book-collection-controller/book-collection.service';

@Component({
  selector: 'app-collection-page',
  templateUrl: './collection-page.component.html',
  styleUrls: ['./collection-page.component.css']
})
export class CollectionPageComponent implements OnInit{

  constructor(private booksCollectionService: BookCollectionService) {}
  collectedBooks: any[] = [];

  ngOnInit(): void {
    this.booksCollectionService.getAllBooksFromCollection().subscribe((res: any) => {
      this.collectedBooks = res.success.books;
      console.log(res);
    });
  }

  displayAuthors(authors: any): string {
    if (Array.isArray(authors)) {
      return authors.join(', ');
    } else if (authors) {
      return String(authors);
    } else {
      return 'No authors provided.';
    }
  }
  
  displayRating(rating: any): string {
    const numericRating = Number(rating);
  
    if (!isNaN(numericRating)) {
      return Math.floor(numericRating).toString();
    } else {
      return rating;
    }
  }

  removeFromCollection(bookID: string) {
    this.booksCollectionService.deleteBookFromCollection(bookID).subscribe({
      next: (data) => {
        console.log('Book removed successfully', data);
        this.refreshCollection();
      },
      error: (error) => {
        console.error('Error removing book from collection', error);
      }
    });
  }
  
  private refreshCollection() {
    this.booksCollectionService.getAllBooksFromCollection().subscribe((res: any) => {
      this.collectedBooks = res.success.books;
      console.log(res);
    });
  }

}
