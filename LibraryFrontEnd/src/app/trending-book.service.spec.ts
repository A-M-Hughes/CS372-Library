import { TestBed } from '@angular/core/testing';

import { TrendingBookService } from './trending-book.service';

describe('TrendingBookService', () => {
  let service: TrendingBookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrendingBookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
