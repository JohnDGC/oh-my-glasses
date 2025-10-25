import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Product, ProductImage, ProductFeature } from '../../models/product.model';
import { SupabaseProductService } from '../../services/supabase-product.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  productForm!: FormGroup;
  products: Product[] = [];
  editingProduct: Product | null = null;
  isLoading = false;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  searchTerm = '';
  filteredProducts: Product[] = [];
  categories = ['Hombres', 'Mujeres', 'Niños'];
  styles = ['Aviador', 'Cuadrado', 'Redondo', 'Cat Eye', 'Rectangular', 'Ovalado', 'Mariposa', 'Deportivo'];

  private categoryMap: { [key: string]: string } = {
    'Hombres': 'men',
    'Mujeres': 'women',
    'Niños': 'kids'
  };

  private categoryReverseMap: { [key: string]: string } = {
    'men': 'Hombres',
    'women': 'Mujeres',
    'kids': 'Niños'
  };

  constructor(
    private fb: FormBuilder,
    private productService: SupabaseProductService,
    private supabaseService: SupabaseService
  ) { }

  async logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      const { error } = await this.supabaseService.client.auth.signOut();
      if (!error) {
        window.location.href = '/login';
      } else {
        alert('Error al cerrar sesión. Por favor intenta de nuevo.');
      }
    }
  }

  ngOnInit() {
    this.initForm();
    this.loadProducts();
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      originalPrice: [0, Validators.min(0)],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      category: ['', Validators.required],
      style: ['', Validators.required],
      brand: ['', Validators.required],
      color: ['', Validators.required],
      material: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      isNew: [false],
      isFeatured: [false],
      isOnSale: [false],
      showInHomeTrending: [false],
      showInHomeSales: [false],
      images: this.fb.array([]),
      features: this.fb.array([])
    });

    this.productForm.get('isFeatured')?.valueChanges.subscribe(value => {
      const trendingControl = this.productForm.get('showInHomeTrending');
      if (value) {
        trendingControl?.enable();
      } else {
        trendingControl?.disable();
        trendingControl?.setValue(false);
      }
    });

    this.productForm.get('isOnSale')?.valueChanges.subscribe(value => {
      const salesControl = this.productForm.get('showInHomeSales');
      if (value) {
        salesControl?.enable();
      } else {
        salesControl?.disable();
        salesControl?.setValue(false);
      }
    });

    this.productForm.get('showInHomeTrending')?.disable();
    this.productForm.get('showInHomeSales')?.disable();
  }

  get images(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  get features(): FormArray {
    return this.productForm.get('features') as FormArray;
  }

  get isTrendingCheckboxEnabled(): boolean {
    return !!this.productForm.get('isFeatured')?.value;
  }

  get isSalesCheckboxEnabled(): boolean {
    return !!this.productForm.get('isOnSale')?.value;
  }

  async loadProducts() {
    this.isLoading = true;
    try {
      this.products = await this.productService.getAllProducts();
      this.filteredProducts = this.products;
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error al cargar productos');
    } finally {
      this.isLoading = false;
    }
  }

  searchProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = this.products;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      p.category.toLowerCase().includes(term)
    );
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const filesArray = Array.from(input.files);

      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const currentIndex = this.images.length;
          this.imagePreviews.push(e.target?.result as string);
          this.imageFiles[currentIndex] = file;
          this.images.push(this.fb.group({
            imageUrl: [''],
            isMain: [this.images.length === 0],
            orderIndex: [currentIndex]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  }

  async removeImage(index: number) {
    const imageControl = this.images.at(index);
    const imageUrl = imageControl.value.imageUrl;
    if (imageUrl && imageUrl.includes('supabase')) {
      if (!confirm('¿Eliminar esta imagen? Se borrará permanentemente del storage.')) {
        return;
      }

      try {
        const deleted = await this.supabaseService.deleteImage(imageUrl, 'products');
        if (deleted) {
          console.log('✅ Imagen eliminada del storage:', imageUrl);
        }
      } catch (error) {
        console.error('❌ Error al eliminar imagen del storage:', error);
        alert('Error al eliminar la imagen del storage. Se quitará del formulario de todas formas.');
      }
    }

    if (index < this.imageFiles.length)
      this.imageFiles.splice(index, 1);

    if (index < this.imagePreviews.length)
      this.imagePreviews.splice(index, 1);

    this.images.removeAt(index);

    let hasMain = false;
    this.images.controls.forEach((control, i) => {
      control.patchValue({ orderIndex: i });
      if (control.value.isMain) {
        hasMain = true;
      }
    });

    if (!hasMain && this.images.length > 0) {
      this.images.at(0).patchValue({ isMain: true });
    }
  }

  setMainImage(index: number) {
    this.images.controls.forEach((control, i) => {
      control.patchValue({ isMain: i === index });
    });
  }

  moveImageUp(index: number) {
    if (index === 0) return;

    [this.imageFiles[index], this.imageFiles[index - 1]] = [this.imageFiles[index - 1], this.imageFiles[index]];
    [this.imagePreviews[index], this.imagePreviews[index - 1]] = [this.imagePreviews[index - 1], this.imagePreviews[index]];
    const temp = this.images.at(index).value;
    this.images.at(index).patchValue(this.images.at(index - 1).value);
    this.images.at(index - 1).patchValue(temp);
    this.images.controls.forEach((control, i) => {
      control.patchValue({ orderIndex: i });
    });
  }

  moveImageDown(index: number) {
    if (index === this.images.length - 1) return;
    this.moveImageUp(index + 1);
  }

  addFeature() {
    this.features.push(this.fb.group({
      feature: ['', Validators.required],
      orderIndex: [this.features.length]
    }));
  }

  removeFeature(index: number) {
    this.features.removeAt(index);
    this.features.controls.forEach((control, i) => {
      control.patchValue({ orderIndex: i });
    });
  }

  moveFeatureUp(index: number) {
    if (index === 0) return;
    const temp = this.features.at(index).value;
    this.features.at(index).patchValue(this.features.at(index - 1).value);
    this.features.at(index - 1).patchValue(temp);

    this.features.controls.forEach((control, i) => {
      control.patchValue({ orderIndex: i });
    });
  }

  moveFeatureDown(index: number) {
    if (index === this.features.length - 1) return;
    this.moveFeatureUp(index + 1);
  }

  editProduct(product: Product) {
    this.editingProduct = product;
    const categoryDisplay = this.categoryReverseMap[product.category] || product.category;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      discount: product.discount || 0,
      category: categoryDisplay,
      style: product.style,
      brand: product.brand,
      color: product.color,
      material: product.material,
      stock: product.stock,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      showInHomeTrending: product.showInHomeTrending !== false,
      showInHomeSales: product.showInHomeSales !== false
    });

    if (product.isFeatured)
      this.productForm.get('showInHomeTrending')?.enable();
    else
      this.productForm.get('showInHomeTrending')?.disable();

    if (product.isOnSale)
      this.productForm.get('showInHomeSales')?.enable();
    else
      this.productForm.get('showInHomeSales')?.disable();

    this.images.clear();
    this.features.clear();
    this.imageFiles = [];
    this.imagePreviews = [];

    if (product.images && product.images.length > 0) {
      product.images.forEach((img, index) => {
        this.imagePreviews.push(img.imageUrl);
        this.images.push(this.fb.group({
          imageUrl: [img.imageUrl],
          isMain: [img.isMain],
          orderIndex: [index]
        }));
      });
    }

    if (product.features && product.features.length > 0) {
      product.features.forEach((feat, index) => {
        this.features.push(this.fb.group({
          feature: [feat.feature],
          orderIndex: [index]
        }));
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingProduct = null;
    this.productForm.reset();
    this.images.clear();
    this.features.clear();
    this.imageFiles = [];
    this.imagePreviews = [];
    this.initForm();
  }

  async deleteProduct(product: Product) {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;

    this.isLoading = true;
    try {
      if (product.images && product.images.length > 0) {
        for (const img of product.images)
          await this.supabaseService.deleteImage(img.imageUrl, 'products');
      }

      await this.productService.deleteProduct(product.id);
      alert('Producto eliminado exitosamente');
      await this.loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar producto');
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    if (this.productForm.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    try {
      const allImages: ProductImage[] = [];

      for (let i = 0; i < this.images.length; i++) {
        const imageControl = this.images.at(i);
        const imageUrl = imageControl.value.imageUrl;

        if (imageUrl && (imageUrl.includes('supabase') || imageUrl.includes('http'))) {
          allImages.push({
            imageUrl: imageUrl,
            isMain: imageControl.value.isMain,
            orderIndex: i
          });
        }
        else if (this.imageFiles[i]) {
          const file = this.imageFiles[i];
          const uploadedUrl = await this.supabaseService.uploadImage(file, 'products');
          if (uploadedUrl) {
            allImages.push({
              imageUrl: uploadedUrl,
              isMain: imageControl.value.isMain,
              orderIndex: i
            });
          }
        }
      }

      const categoryValue = this.categoryMap[this.productForm.value.category] || this.productForm.value.category.toLowerCase();
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        ...this.productForm.value,
        category: categoryValue,
        images: allImages,
        features: this.features.value as ProductFeature[]
      };

      if (this.editingProduct) {
        await this.productService.updateProduct(this.editingProduct.id, productData);
        alert('Producto actualizado exitosamente');
      } else {
        await this.productService.createProduct(productData);
        alert('Producto creado exitosamente');
      }

      this.cancelEdit();
      await this.loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar producto');
    } finally {
      this.isLoading = false;
    }
  }
}
