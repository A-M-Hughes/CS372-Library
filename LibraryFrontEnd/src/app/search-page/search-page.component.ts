import { Component, OnInit } from '@angular/core';
import { BookSearchService } from '../../controllers/book-search-controller/book-search.service';
import { BookCollectionService } from 'src/controllers/book-collection-controller/book-collection.service';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit{
  constructor(private bookSearchService: BookSearchService, private bookCollectionService: BookCollectionService) {}

  searchQuery: string = '';
  searchResults: any[] = [];

  ngOnInit() {}

  search() {
    if(this.searchQuery.trim() !== '') {
      this.bookSearchService.searchBooks(this.searchQuery).subscribe((res: any) => {
        this.searchResults = res.results;
        console.log(res);
      });
    }
  }

  displayAuthors(authors: any): string {
    if (Array.isArray(authors)) {
      return authors.join(', ');
    } else if (authors) {
      // Handle case where authors is not an array (e.g., a single author)
      return String(authors);
    } else {
      return 'No authors provided.';
    }
  }


  addToCollection(book: any) {
    const trimmedTitle = book.title.slice(0, 40);
    const formattedBook = {
      title: trimmedTitle,
      author: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
      pageNumber: String(book.medianNumPages) || '0',
      ISBN: "No ISBN provided.",
      coverLink: book.bookCover,
      genres: ["No genres provided."],
      rating: String(book.ratingsAverage),
      publishedYear: String(book.firstPublishYear) || '0'
    };

    this.bookCollectionService.addBookToCollection(formattedBook).subscribe({
      next: (data) => {
        console.log('Book added successfully', data);
      },
      error: (error) => {
        console.error('Error adding book to collection', error);
      }
    });
  }
}