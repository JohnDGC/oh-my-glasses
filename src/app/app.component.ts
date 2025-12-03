import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'ohmyglasses';
  isInitializing = true;

  constructor(private router: Router, private authService: AuthService) {}

  async ngOnInit() {
    // Esperar a que AuthService se inicialice completamente
    await this.authService.waitForInitialization();
    this.isInitializing = false;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        }
      });
  }
}
