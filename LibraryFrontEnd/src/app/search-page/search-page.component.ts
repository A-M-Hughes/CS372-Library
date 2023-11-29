import { Component, OnInit } from '@angular/core';
import { BookSearchService } from '../../controllers/book-search-controller/book-search.service';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit{
  constructor(private bookSearchService: BookSearchService) {}

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
}