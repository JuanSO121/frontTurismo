import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_HEROES } from 'src/app/config/url.servicios';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) {}

  register(nombre: string, correo: string, password: string): Observable<any> {
    const url = `${URL_HEROES}/usuarios`;
    const body = { nombre, correo, password };

    return this.http.post(url, body).pipe(
      tap((res: any) => {
        if (res?.token) {
          this.storageService.setCookie(res.token)
            .then(() => console.log('Token guardado tras registro'));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  login(user: string, pass: string): Observable<any> {
    const url = `${URL_HEROES}/auth/login`;
    const body = { correo: user, password: pass };

    return this.http.post(url, body).pipe(
      switchMap((res: any) => {
        if (res?.token) {
          return from(this.storageService.setCookie(res.token)).pipe(map(() => res));
        }
        return of(res);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logout(): Observable<void> {
    return from(this.storageService.removeCookie()).pipe(
      tap(() => this.router.navigate(['/login'])),
      catchError(error => {
        console.error('Error cerrando sesión:', error);
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.storageService.getCookie();
      return !!token;
    } catch (err) {
      console.error('Error al verificar token:', err);
      return false;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      errorMessage = error.error?.msg || `Error ${error.status}: ${error.message}`;
      if (error.status === 401) {
        this.handleAuthError();
        errorMessage = 'No autorizado: Sesión inválida o expirada.';
      }
    }

    console.error('AuthService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private handleAuthError() {
    this.storageService.removeCookie()
      .then(() => this.router.navigate(['/login']))
      .catch(() => this.router.navigate(['/login']));
  }

  
}
