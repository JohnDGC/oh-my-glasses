import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  navItems: AdminNavItem[] = [
    { label: 'Clientes', icon: 'bi-people', route: '/clientes' },
    { label: 'Inventario', icon: 'bi-box-seam', route: '/inventario' },
    { label: 'Reportes', icon: 'bi-graph-up', route: '/reportes' },
    { label: 'Catálogo', icon: 'bi-grid', route: '/admin' },
  ];

  collapsed = signal(false);
  mobileOpen = signal(false);
  currentTitle = signal('Panel');

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('omg_admin_sidebar_collapsed');
    this.collapsed.set(saved === 'true');

    this.routerSub = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        this.setTitleFromUrl(event.urlAfterRedirects);
        this.mobileOpen.set(false);
      });

    this.setTitleFromUrl(this.router.url);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleCollapse(): void {
    this.collapsed.update((state) => {
      const next = !state;
      localStorage.setItem('omg_admin_sidebar_collapsed', String(next));
      return next;
    });
  }

  toggleMobileMenu(): void {
    this.mobileOpen.update((state) => !state);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/login']);
  }

  private setTitleFromUrl(url: string): void {
    const path = url.split('?')[0].split('/').filter(Boolean)[0] || 'admin';
    const map: Record<string, string> = {
      admin: 'Catálogo',
      clientes: 'Clientes',
      inventario: 'Inventario',
      formula: 'Fórmulas',
      reportes: 'Reportes',
    };

    this.currentTitle.set(map[path] || 'Panel');
  }
}
