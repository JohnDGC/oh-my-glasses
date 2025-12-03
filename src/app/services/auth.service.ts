import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private initializationPromise: Promise<void>;
  private _isInitialized = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.initializationPromise = this.initAuthListener();
  }

  public async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  private async initAuthListener(): Promise<void> {
    try {
      // Obtener la sesión actual de Supabase (maneja persistencia automáticamente)
      const {
        data: { session },
      } = await this.supabaseService.client.auth.getSession();

      if (session?.user) {
        this.currentUserSubject.next(session.user);
      }
    } catch (error: any) {
      console.error('Error initializing auth listener:', error);
    } finally {
      this._isInitialized = true;
    }

    // Escuchar cambios de autenticación
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.currentUserSubject.next(session.user);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async signIn(email: string, password: string) {
    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) throw error;

    this.currentUserSubject.next(null);
    await this.router.navigate(['/login']);
  }

  async isAuthenticated(): Promise<boolean> {
    // Si no está inicializado, esperar
    if (!this._isInitialized) {
      await this.waitForInitialization();
    }

    // Usar el valor actual del Subject (ya verificado en la inicialización)
    const currentUser = this.currentUserSubject.value;
    if (currentUser) return true;

    // Doble verificación consultando Supabase directamente
    try {
      const {
        data: { session },
      } = await this.supabaseService.client.auth.getSession();
      if (session?.user) {
        this.currentUserSubject.next(session.user);
        return true;
      }
      return false;
    } catch (error: any) {
      return false;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
      } = await this.supabaseService.client.auth.getSession();
      return session;
    } catch (error: any) {
      return null;
    }
  }
}
