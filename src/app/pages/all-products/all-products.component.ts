import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { FormsModule } from '@angular/forms';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, FormsModule, RouterModule],
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.scss'
})
export class AllProductsComponent implements OnInit {
  private productService = inject(ProductService);

  categoryTitle = 'Todos los Lentes';
  categoryDescription = 'Explora nuestra colección completa de lentes para toda la familia. Encuentra el par perfecto que se adapte a tu estilo y necesidades.';
  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Filtros
  selectedSort = 'featured';
  selectedPriceRange = 'all';
  selectedStyle = 'all';
  selectedCategory = 'all';
  searchTerm = '';

  sortOptions: FilterOption[] = [
    { label: 'Destacados', value: 'featured' },
    { label: 'Precio: Menor a Mayor', value: 'price-asc' },
    { label: 'Precio: Mayor a Menor', value: 'price-desc' },
    { label: 'Nombre: A-Z', value: 'name-asc' },
    { label: 'Nombre: Z-A', value: 'name-desc' }
  ];

  priceRanges: FilterOption[] = [
    { label: 'Todos los precios', value: 'all' },
    { label: 'Menos de $50', value: 'under-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: '$100 - $150', value: '100-150' },
    { label: 'Más de $150', value: 'over-150' }
  ];

  styleOptions: FilterOption[] = [
    { label: 'Todos los estilos', value: 'all' },
    { label: 'Clásico', value: 'classic' },
    { label: 'Moderno', value: 'modern' },
    { label: 'Deportivo', value: 'sport' },
    { label: 'Casual', value: 'casual' }
  ];

  categoryOptions: FilterOption[] = [
    { label: 'Todas las categorías', value: 'all' },
    { label: 'Hombres', value: 'men' },
    { label: 'Mujeres', value: 'women' },
    { label: 'Niños', value: 'kids' }
  ];

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.products = this.productService.getProducts();
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  onPriceRangeChange() {
    this.applyFilters();
  }

  onStyleChange() {
    this.applyFilters();
  }

  onCategoryChange() {
    this.applyFilters();
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.products];

    if (this.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    if (this.selectedPriceRange !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.discountPrice || product.price;
        switch (this.selectedPriceRange) {
          case 'under-50': return price < 50;
          case '50-100': return price >= 50 && price < 100;
          case '100-150': return price >= 100 && price < 150;
          case 'over-150': return price >= 150;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      switch (this.selectedSort) {
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
