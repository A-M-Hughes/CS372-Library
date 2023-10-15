import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-homepage-section',
  templateUrl: './homepage-section.component.html',
  styleUrls: ['./homepage-section.component.css']
})
export class HomepageSectionComponent {
  @Input() imageSrc: string = '';
  @Input() sectionText: string = '';
  @Input() buttonText: string = '';
}
