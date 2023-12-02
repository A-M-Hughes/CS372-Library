import { Component, OnInit } from '@angular/core';
import { RecomendedBookService } from '../../controllers/recommended-book-controller/recomended-book.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  constructor(private recommendedBookService: RecomendedBookService) {}

  ngOnInit(): void {

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

}
