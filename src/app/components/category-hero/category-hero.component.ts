import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-category-hero',
  imports: [],
  templateUrl: './category-hero.component.html',
  styleUrl: './category-hero.component.scss'
})
export class CategoryHeroComponent {
  @Input() title: string = '';
  @Input() description: string = '';
}
