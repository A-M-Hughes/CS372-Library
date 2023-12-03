import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecomendedPageComponent } from './recomended-page.component';

describe('RecomendedPageComponent', () => {
  let component: RecomendedPageComponent;
  let fixture: ComponentFixture<RecomendedPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecomendedPageComponent]
    });
    fixture = TestBed.createComponent(RecomendedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
