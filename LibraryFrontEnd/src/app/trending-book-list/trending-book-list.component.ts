import { Component, OnInit } from '@angular/core';
import { TrendingBookService } from '../../controllers/trending-book-controller/trending-book.service';

@Component({
  selector: 'app-trending-book-list',
  templateUrl: './trending-book-list.component.html',
  styleUrls: ['./trending-book-list.component.css']
})
export class TrendingBookListComponent implements OnInit {
  books: any;

  constructor(private trendingBookService: TrendingBookService) { }

  ngOnInit(): void {
    this.trendingBookService.getTrendingBooks().subscribe((data) => {
      this.books = data;
    });
  }
  
}
