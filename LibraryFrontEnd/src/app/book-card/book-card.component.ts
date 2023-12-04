import { Component, ElementRef, Input } from '@angular/core';
import { BookCollectionService } from 'src/controllers/book-collection-controller/book-collection.service';

@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.css']
})
export class BookCardComponent {
  @Input() book: any;

  constructor(private bookCollectionService: BookCollectionService, private el: ElementRef) {
    for(let i = 0; i < 15; i++){
      this.clicked[i] = false;
    }
  }
  clicked: any = {};

  addToCollection(book: any, id: number) {
    console.log(book.title);
    console.log(id);
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
        console.log(this.clicked);
        const buttonElement = this.el.nativeElement.querySelector('#b' + id);
        // Change the button text
        buttonElement.innerText = 'Book Added To Collection';
        this.clicked[id] =  true;
        buttonElement.classList.add('finishedButton');
        buttonElement.classList.remove('add-btn');
        // Change the onclick function to do nothing
      },
      error: (error) => {
        console.error('Error adding book to collection', error);
      }
    });
  }
}
