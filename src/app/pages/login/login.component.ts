import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ngOnInit() {
    const isAuth = await this.authService.isAuthenticated();
    if (isAuth)
      this.router.navigate(['/admin']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    try {
      await this.authService.signIn(email, password);
      await this.router.navigate(['/admin']);
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error.message);
      this.isLoading = false;
    }
  }

  private getErrorMessage(error: string): string {
    if (error.includes('Invalid login credentials'))
      return 'Credenciales inválidas. Verifica tu email y contraseña.';

    if (error.includes('Email not confirmed'))
      return 'Por favor confirma tu email antes de iniciar sesión.';

    return 'Error al iniciar sesión. Por favor intenta de nuevo.';
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
