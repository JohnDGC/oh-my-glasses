import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  fromEvent,
  merge,
} from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';
import { asyncScheduler } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private initializationPromise: Promise<void>;
  private _isInitialized = false;
  private readonly INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
  private readonly STORAGE_KEY_LAST_ACTIVITY = 'ohmyglasses-last-activity';
  private inactivityTimer: Subscription | null = null;
  private activitySubscription: Subscription | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private ngZone: NgZone
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
      if (this.hasSessionExpiredByInactivity()) {
        console.log('Sesión expirada por inactividad');
        await this.supabaseService.client.auth.signOut();
        localStorage.removeItem(this.STORAGE_KEY_LAST_ACTIVITY);
        this._isInitialized = true;
        return;
      }

      const {
        data: { session },
      } = await this.supabaseService.client.auth.getSession();

      if (session?.user) {
        this.currentUserSubject.next(session.user);
        this.startInactivityMonitor();
      }
    } catch (error: any) {
      console.error('Error initializing auth listener:', error);
    } finally {
      this._isInitialized = true;
    }

    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.currentUserSubject.next(session.user);
        this.startInactivityMonitor();
      } else {
        this.currentUserSubject.next(null);
        this.stopInactivityMonitor();
      }
    });
  }

  private hasSessionExpiredByInactivity(): boolean {
    const lastActivity = localStorage.getItem(this.STORAGE_KEY_LAST_ACTIVITY);
    if (!lastActivity) return false;

    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    return now - lastActivityTime > this.INACTIVITY_TIMEOUT_MS;
  }

  private updateLastActivity(): void {
    localStorage.setItem(this.STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
  }

  private startInactivityMonitor(): void {
    if (this.activitySubscription) return;

    this.updateLastActivity();

    this.ngZone.runOutsideAngular(() => {
      const activityEvents$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll')
      ).pipe(throttleTime(30000));

      this.activitySubscription = activityEvents$.subscribe(() => {
        this.updateLastActivity();
        this.resetInactivityTimer();
      });
    });

    this.resetInactivityTimer();
  }

  private stopInactivityMonitor(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
      this.inactivityTimer = null;
    }
    localStorage.removeItem(this.STORAGE_KEY_LAST_ACTIVITY);
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
    }

    this.inactivityTimer = asyncScheduler.schedule(() => {
      this.ngZone.run(() => {
        this.handleInactivityTimeout();
      });
    }, this.INACTIVITY_TIMEOUT_MS);
  }

  private async handleInactivityTimeout(): Promise<void> {
    console.log('Sesión cerrada por inactividad');
    alert('Tu sesión ha sido cerrada por inactividad (1 hora sin actividad).');
    await this.signOut();
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
    if (!this._isInitialized) {
      await this.waitForInitialization();
    }

    const currentUser = this.currentUserSubject.value;
    if (currentUser) return true;

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
