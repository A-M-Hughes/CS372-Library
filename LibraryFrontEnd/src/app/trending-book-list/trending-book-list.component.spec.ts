import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendingBookListComponent } from './trending-book-list.component';

describe('TrendingBookListComponent', () => {
  let component: TrendingBookListComponent;
  let fixture: ComponentFixture<TrendingBookListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrendingBookListComponent]
    });
    fixture = TestBed.createComponent(TrendingBookListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
