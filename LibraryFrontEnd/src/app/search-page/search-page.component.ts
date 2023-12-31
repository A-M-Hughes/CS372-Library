import { Component, OnInit, ElementRef, Renderer2, } from '@angular/core';
import { BookSearchService } from 'src/controllers/book-search-controller/book-search.service';
import { BookCollectionService } from 'src/controllers/book-collection-controller/book-collection.service';


@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit {
  constructor(private renderer: Renderer2, private bookSearchService: BookSearchService, private bookCollectionService: BookCollectionService, private el: ElementRef) {
    for (let i = 0; i < 15; i++) {
      this.clicked[i] = false;
    }
  }

  clicked: any = {};
  searchQuery: string = '';
  searchResults: any[] = [];
  pageNumber: number = 0;
  maxNumber: number = -1;

  ngOnInit() { }

  search() {
    const data = {
      searchQuery: this.searchQuery
    };

    if (data.searchQuery.trim() !== '') {
      this.bookSearchService.searchBooks(data.searchQuery).subscribe((res: any) => {
        this.searchResults = res.results;
        this.maxNumber = Math.ceil(res.numFound / res.numOnPage);
        this.pageNumber = 1;
        console.log(res);
      });
    }
  }

  nextPage() {
    const data = {
      searchQuery: this.searchQuery
    };

    if (data.searchQuery.trim() !== '') {
      this.bookSearchService.searchBooks(data.searchQuery, ++this.pageNumber).subscribe((res: any) => {
        this.searchResults = res.results;
        console.log(res);
      });
    }
  }

  previousPage() {
    const data = {
      searchQuery: this.searchQuery
    };

    if (data.searchQuery.trim() !== '') {
      this.bookSearchService.searchBooks(data.searchQuery, --this.pageNumber).subscribe((res: any) => {
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


  addToCollection(book: any, id: number) {
    console.log(id);
    book.inCollection = true;
    const trimmedTitle = book.title.slice(0, 80);
    const formattedBook = {
      title: trimmedTitle,
      author: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
      pageNumber: String(book.medianNumPages) || '0',
      coverLink: book.bookCover,
      genres: ["No genres provided."],
      rating: String(book.ratingsAverage),
      publishedYear: String(book.firstPublishYear) || '0'
    };

    this.bookCollectionService.addBookToCollection(formattedBook).subscribe({
      next: (data) => {
        console.log('Book added successfully', data);

        const buttonElement: HTMLButtonElement = this.el.nativeElement.querySelector('#b' + id);
        // Change the button text
        buttonElement.innerText = 'In Collection';
        buttonElement.disabled = true;
        buttonElement.classList.add('finishedButton');
        this.clicked[id] = true;
        // Change the onclick function to do nothing
        buttonElement.onclick = () => {
          console.log('Button clicked, but doing nothing');
        }
      },
      error: (error) => {
        console.error('Error adding book to collection', error);
      }
    });
  }
}