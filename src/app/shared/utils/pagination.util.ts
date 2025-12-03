/**
 * Clase utilitaria para manejar paginación
 * Reutilizable en cualquier componente con listas
 */
export class PaginationHelper<T> {
  private _items: T[] = [];
  private _currentPage = 1;
  private _itemsPerPage = 10;
  private _totalPages = 0;

  paginatedItems: T[] = [];

  constructor(
    public itemsPerPageOptions: number[] = [10, 20, 30],
    initialItemsPerPage: number = 10
  ) {
    this._itemsPerPage = initialItemsPerPage;
  }

  get currentPage(): number {
    return this._currentPage;
  }

  get itemsPerPage(): number {
    return this._itemsPerPage;
  }

  get totalPages(): number {
    return this._totalPages;
  }

  get totalItems(): number {
    return this._items.length;
  }

  get startIndex(): number {
    return (this._currentPage - 1) * this._itemsPerPage;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this._itemsPerPage, this.totalItems);
  }

  /**
   * Establece los items a paginar y actualiza la paginación
   */
  setItems(items: T[]): void {
    this._items = items;
    this.updatePagination();
  }

  /**
   * Actualiza el número de items por página
   */
  setItemsPerPage(itemsPerPage: number): void {
    this._itemsPerPage = itemsPerPage;
    this._currentPage = 1;
    this.updatePagination();
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this._totalPages) {
      this._currentPage = page;
      this.updatePaginatedItems();
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this._currentPage < this._totalPages) {
      this._currentPage++;
      this.updatePaginatedItems();
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this._currentPage > 1) {
      this._currentPage--;
      this.updatePaginatedItems();
    }
  }

  /**
   * Resetea a la primera página (útil después de filtrar)
   */
  resetToFirstPage(): void {
    this._currentPage = 1;
    this.updatePagination();
  }

  /**
   * Obtiene los números de página a mostrar (máximo 5)
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this._totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this._totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this._currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this._currentPage >= this._totalPages - 2) {
        for (let i = this._totalPages - 4; i <= this._totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this._currentPage - 2; i <= this._currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  /**
   * Verifica si debe mostrar los puntos suspensivos al inicio
   */
  shouldShowStartEllipsis(): boolean {
    return this.getPageNumbers()[0] > 2;
  }

  /**
   * Verifica si debe mostrar los puntos suspensivos al final
   */
  shouldShowEndEllipsis(): boolean {
    const pageNumbers = this.getPageNumbers();
    return pageNumbers[pageNumbers.length - 1] < this._totalPages - 1;
  }

  private updatePagination(): void {
    this._totalPages = Math.ceil(this._items.length / this._itemsPerPage);
    if (this._currentPage > this._totalPages) {
      this._currentPage = this._totalPages || 1;
    }
    this.updatePaginatedItems();
  }

  private updatePaginatedItems(): void {
    const start = this.startIndex;
    const end = this.endIndex;
    this.paginatedItems = this._items.slice(start, end);
  }
}
