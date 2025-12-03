import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterState {
  searchTerm: string;
  selectedSort: string;
  selectedPriceRange: string;
  selectedStyle: string;
  selectedCategory?: string;
}

@Component({
  selector: 'app-category-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-filters.component.html',
  styleUrl: './category-filters.component.scss'
})
export class CategoryFiltersComponent {
  @Input() sortOptions: FilterOption[] = [];
  @Input() priceRanges: FilterOption[] = [];
  @Input() styleOptions: FilterOption[] = [];
  @Input() categoryOptions?: FilterOption[];
  @Input() showCategoryFilter: boolean = false;

  @Input() filterState: FilterState = {
    searchTerm: '',
    selectedSort: 'featured',
    selectedPriceRange: 'all',
    selectedStyle: 'all',
    selectedCategory: 'all'
  };

  @Output() filterChange = new EventEmitter<FilterState>();
  @Output() search = new EventEmitter<string>();

  showFilters = false;

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterState.searchTerm = value;
    this.search.emit(value);
  }

  onFilterChange() {
    this.filterChange.emit(this.filterState);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    document.body.style.overflow = this.showFilters ? 'hidden' : '';
  }

  hasActiveFilters(): boolean {
    return this.filterState.searchTerm !== '' ||
      this.filterState.selectedPriceRange !== 'all' ||
      this.filterState.selectedStyle !== 'all' ||
      this.filterState.selectedSort !== 'featured' ||
      (this.showCategoryFilter && this.filterState.selectedCategory !== 'all');
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filterState.searchTerm !== '') count++;
    if (this.filterState.selectedPriceRange !== 'all') count++;
    if (this.filterState.selectedStyle !== 'all') count++;
    if (this.filterState.selectedSort !== 'featured') count++;
    if (this.showCategoryFilter && this.filterState.selectedCategory !== 'all') count++;
    return count;
  }

  clearFilters() {
    this.filterState = {
      searchTerm: '',
      selectedSort: 'featured',
      selectedPriceRange: 'all',
      selectedStyle: 'all',
      selectedCategory: 'all'
    };
    this.filterChange.emit(this.filterState);
  }
}
