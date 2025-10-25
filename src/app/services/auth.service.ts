import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly SESSION_KEY = 'ohmyglasses_session';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.initAuthListener();
  }

  private async initAuthListener() {
    try {
      const savedSession = this.getStoredSession();
      if (savedSession) {
        const { data: { user } } = await this.supabaseService.client.auth.getUser(savedSession.access_token);
        if (user)
          this.currentUserSubject.next(user);
        else
          this.clearStoredSession();

      }
    } catch (error: any) {
      console.error('Error initializing auth listener:', error);
      this.clearStoredSession();
    }

    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        this.storeSession(session);
        this.currentUserSubject.next(session.user);
      } else {
        this.clearStoredSession();
        this.currentUserSubject.next(null);
      }
    });
  }

  private storeSession(session: Session): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private getStoredSession(): Session | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private clearStoredSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) throw error;

    this.clearStoredSession();
    this.currentUserSubject.next(null);
    await this.router.navigate(['/login']);
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const savedSession = this.getStoredSession();
      if (!savedSession) return false;

      const expiresAt = savedSession.expires_at || 0;
      if (Date.now() / 1000 > expiresAt) {
        this.clearStoredSession();
        return false;
      }

      const { data: { user } } = await this.supabaseService.client.auth.getUser(savedSession.access_token);
      return !!user;
    } catch (error: any) {
      this.clearStoredSession();
      return false;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const savedSession = this.getStoredSession();
      if (!savedSession) return null;

      const expiresAt = savedSession.expires_at || 0;
      if (Date.now() / 1000 > expiresAt) {
        this.clearStoredSession();
        return null;
      }

      return savedSession;
    } catch (error: any) {
      return null;
    }
  }
}
