import { TestBed } from '@angular/core/testing';

import { RecomendedBookService } from './recomended-book.service';

describe('RecomendedBookService', () => {
  let service: RecomendedBookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecomendedBookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
