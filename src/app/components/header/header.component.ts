import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  isMenuOpen = false;
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    // Esperar a que AuthService termine de inicializarse
    await this.authService.waitForInitialization();

    // Ahora verificar autenticación
    this.isAuthenticated = await this.authService.isAuthenticated();

    // Suscribirse a cambios en el estado de autenticación
    this.authService.currentUser.subscribe((user) => {
      this.isAuthenticated = !!user;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  async logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        await this.authService.signOut();
        this.closeMenu();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Por favor intenta de nuevo.');
      }
    }
  }
}
