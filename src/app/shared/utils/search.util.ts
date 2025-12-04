/**
 * Clase utilitaria para manejar búsqueda/filtrado
 * Reutilizable en cualquier componente con búsqueda
 */
export class SearchHelper<T> {
  private _items: T[] = [];
  private _searchTerm = '';
  private _searchFields: (keyof T)[] = [];

  filteredItems: T[] = [];

  constructor(searchFields: (keyof T)[]) {
    this._searchFields = searchFields;
  }

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    this.filter();
  }

  /**
   * Establece los items a filtrar
   */
  setItems(items: T[]): void {
    this._items = items;
    this.filter();
  }

  /**
   * Filtra los items según el término de búsqueda
   */
  filter(): void {
    const term = this._searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredItems = [...this._items];
      return;
    }

    this.filteredItems = this._items.filter((item) => {
      return this._searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }

  /**
   * Limpia la búsqueda
   */
  clear(): void {
    this._searchTerm = '';
    this.filteredItems = [...this._items];
  }
}
