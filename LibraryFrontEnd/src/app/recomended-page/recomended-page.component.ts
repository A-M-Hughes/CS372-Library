import { Component, OnInit } from '@angular/core';
import { RecomendedBookService } from '../../controllers/recommended-book-controller/recomended-book.service';
import { BookCollectionService } from 'src/controllers/book-collection-controller/book-collection.service';
@Component({
  selector: 'app-recomended-page',
  templateUrl: './recomended-page.component.html',
  styleUrls: ['./recomended-page.component.css']
})
export class RecomendedPageComponent implements OnInit {

  constructor(private recommendedBookService: RecomendedBookService, private booksCollectionService: BookCollectionService) {}
  recommendedBooks: any[] = [];

  ngOnInit(): void {
    this.recommendedBookService.getRecommendedBooks().subscribe((res: any) => {
      this.recommendedBooks = res.success.books;
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

  removeFromRecommendations(bookID: string) {
    this.recommendedBookService.deleteRecommendations(bookID).subscribe({
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
    this.recommendedBookService.getRecommendedBooks().subscribe((res: any) => {
      this.recommendedBooks = res.success.books;
      console.log(res);
    });
  }

  createRecommendedButton() {
    this.recommendedBookService.createRecommendations().subscribe({
      next: () => {
        console.log('Recommendations created successfully');
      },
      error: (error) => {
        console.error('Error creating recommendations:', error);
      }
    });
  }

  addToCollection(book: any) {
    const trimmedTitle = book.title.slice(0, 80);
    console.log(book);
    const formattedBook = {
      title: trimmedTitle,
      author: Array.isArray(book.author) ? book.author.join(', ') : book.author,
      pageNumber: String(book.pageNumber) || '0',
      coverLink: book.coverLink,
      genres: ["No genres provided."],
      rating: book.rating,
      publishedYear: book.rating
    };

    this.booksCollectionService.addBookToCollection(formattedBook).subscribe({
      next: (data) => {
        console.log('Book added successfully', data);
        this.removeFromRecommendations(book._id);
      },
      error: (error) => {
        console.error('Error adding book to collection', error);
      }
    });
  }
}
