import { Component, OnInit } from '@angular/core';
import { RecomendedBookService } from '../recomended-book.service';
@Component({
  selector: 'app-recomended-page',
  templateUrl: './recomended-page.component.html',
  styleUrls: ['./recomended-page.component.css']
})
export class RecomendedPageComponent implements OnInit {
  recommendedBooks: any;
  constructor(private recommendedBookService: RecomendedBookService) {}

  ngOnInit(): void {
    this.recommendedBookService.getRecommendedBooks().subscribe((data) => {
      this.recommendedBooks = data;
      console.log(this.recommendedBooks);
    });
  }


}
