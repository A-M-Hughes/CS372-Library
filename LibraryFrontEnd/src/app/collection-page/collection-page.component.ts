import { Component, OnInit } from '@angular/core';
import { BookCollectionService } from 'src/controllers/book-collection-controller/book-collection.service';

@Component({
  selector: 'app-collection-page',
  templateUrl: './collection-page.component.html',
  styleUrls: ['./collection-page.component.css']
})
export class CollectionPageComponent implements OnInit{

  constructor(private booksCollectionService: BookCollectionService) {}
  books: any;

  ngOnInit(): void {
    this.booksCollectionService.getAllBooksFromCollection().subscribe((data) => {
      this.books = data;
    });
  }
}
