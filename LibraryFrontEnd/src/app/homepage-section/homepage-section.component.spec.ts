import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomepageSectionComponent } from './homepage-section.component';

describe('HomepageSectionComponent', () => {
  let component: HomepageSectionComponent;
  let fixture: ComponentFixture<HomepageSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomepageSectionComponent]
    });
    fixture = TestBed.createComponent(HomepageSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
