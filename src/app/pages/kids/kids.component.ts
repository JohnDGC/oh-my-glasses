import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CategoryHeroComponent } from '../../components/category-hero/category-hero.component';
import { CategoryFiltersComponent, FilterState } from '../../components/category-filters/category-filters.component';
import { ProductsGridComponent } from '../../components/products-grid/products-grid.component';

@Component({
  selector: 'app-kids',
  standalone: true,
  imports: [RouterLink, CategoryHeroComponent, CategoryFiltersComponent, ProductsGridComponent],
  templateUrl: './kids.component.html',
  styleUrl: './kids.component.scss'
})
export class KidsComponent implements OnInit {
  categoryTitle = 'Niños';
  categoryDescription = 'Gafas divertidas, resistentes y diseñadas especialmente para los más pequeños de la casa.';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  filterState: FilterState = {
    searchTerm: '',
    selectedSort: 'featured',
    selectedPriceRange: 'all',
    selectedStyle: 'all'
  };
  sortOptions = [
    { value: 'featured', label: 'Destacados' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
    { value: 'name-desc', label: 'Nombre: Z-A' },
    { value: 'price-asc', label: 'Precio: Menor a Mayor' },
    { value: 'price-desc', label: 'Precio: Mayor a Menor' }
  ];
  priceRanges = [
    { value: 'all', label: 'Todos los precios' },
    { value: '0-50', label: 'Menos de $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-200', label: '$100 - $200' },
    { value: '200-up', label: 'Más de $200' }
  ];
  styleOptions = [
    { value: 'all', label: 'Todos los estilos' },
    { value: 'clasico', label: 'Clásico' },
    { value: 'moderno', label: 'Moderno' },
    { value: 'deportivo', label: 'Deportivo' },
    { value: 'casual', label: 'Casual' }
  ];

  constructor(private productService: ProductService) { }

  async ngOnInit() {
    this.products = await this.productService.getProductsByCategory('kids');
    this.applyFilters();
  }

  onFilterChange(filterState: FilterState) {
    this.filterState = filterState;
    this.applyFilters();
  }

  onSearch(searchTerm: string) {
    this.filterState.searchTerm = searchTerm;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.products];

    if (this.filterState.searchTerm) {
      const searchLower = this.filterState.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    if (this.filterState.selectedPriceRange !== 'all') {
      const [min, max] = this.filterState.selectedPriceRange.split('-').map(v => v === 'up' ? Infinity : Number(v));
      filtered = filtered.filter(p => p.price >= min && p.price < max);
    }

    if (this.filterState.selectedStyle !== 'all') {
      filtered = filtered.filter(p => p.style === this.filterState.selectedStyle);
    }

    switch (this.filterState.selectedSort) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    this.filteredProducts = filtered;
  }
}
