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
    await this.authService.waitForInitialization();
    this.isAuthenticated = await this.authService.isAuthenticated();
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
