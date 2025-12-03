import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { CategoryHeroComponent } from '../../components/category-hero/category-hero.component';
import { CategoryFiltersComponent, FilterOption, FilterState } from '../../components/category-filters/category-filters.component';
import { ProductsGridComponent } from '../../components/products-grid/products-grid.component';

@Component({
  selector: 'app-men',
  standalone: true,
  imports: [CommonModule, RouterModule, CategoryHeroComponent, CategoryFiltersComponent, ProductsGridComponent],
  templateUrl: './men.component.html',
  styleUrl: './men.component.scss'
})
export class MenComponent implements OnInit {
  private productService = inject(ProductService);
  categoryTitle = 'Hombre';
  categoryDescription = 'Descubre nuestra colección exclusiva de monturas y lentes diseñados específicamente para el hombre moderno. Combina estilo y funcionalidad con nuestras opciones premium.';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  filterState: FilterState = {
    searchTerm: '',
    selectedSort: 'featured',
    selectedPriceRange: 'all',
    selectedStyle: 'all'
  };
  sortOptions: FilterOption[] = [
    { label: 'Destacados', value: 'featured' },
    { label: 'Precio: Menor a Mayor', value: 'price-asc' },
    { label: 'Precio: Mayor a Menor', value: 'price-desc' },
    { label: 'Nombre: A-Z', value: 'name-asc' },
    { label: 'Nombre: Z-A', value: 'name-desc' }
  ];
  priceRanges: FilterOption[] = [
    { label: 'Todos los precios', value: 'all' },
    { label: 'Menos de $200.000', value: 'under-200k' },
    { label: '$200.000 - $400.000', value: '200k-400k' },
    { label: '$400.000 - $600.000', value: '400k-600k' },
    { label: 'Más de $600.000', value: 'over-600k' }
  ];
  styleOptions: FilterOption[] = [
    { label: 'Todos los estilos', value: 'all' },
    { label: 'Clásico', value: 'classic' },
    { label: 'Moderno', value: 'modern' },
    { label: 'Deportivo', value: 'sport' },
    { label: 'Casual', value: 'casual' }
  ];

  async ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    try {
      this.products = await this.productService.getProductsByCategory('men');
      this.applyFilters();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  onFilterChange(filterState: FilterState) {
    this.filterState = filterState;
    this.applyFilters();
  }

  onSearch(searchTerm: string) {
    this.filterState.searchTerm = searchTerm;
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.products];

    if (this.filterState.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.filterState.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(this.filterState.searchTerm.toLowerCase())
      );
    }

    if (this.filterState.selectedPriceRange !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.price;
        switch (this.filterState.selectedPriceRange) {
          case 'under-200k': return price < 200000;
          case '200k-400k': return price >= 200000 && price < 400000;
          case '400k-600k': return price >= 400000 && price < 600000;
          case 'over-600k': return price >= 600000;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      const priceA = a.price;
      const priceB = b.price;

      switch (this.filterState.selectedSort) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

    this.filteredProducts = filtered;
  }
}
