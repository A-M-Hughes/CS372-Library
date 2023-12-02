import { Component, OnInit } from '@angular/core';
import { RecomendedBookService } from '../../controllers/recommended-book-controller/recomended-book.service';
@Component({
  selector: 'app-recomended-page',
  templateUrl: './recomended-page.component.html',
  styleUrls: ['./recomended-page.component.css']
})
export class RecomendedPageComponent implements OnInit {

  constructor(private recommendedBookService: RecomendedBookService) {}
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

}
