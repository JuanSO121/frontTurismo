import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonItem, IonLabel, IonButton, IonText, IonSpinner, IonToast } from '@ionic/angular/standalone';
import { StorageService } from '../services/storage.service';
import { HeroesBDService } from '../services/heroes-bd.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonText, 
    IonButton, 
    IonLabel, 
    IonItem, 
    IonInput, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonSpinner,
    IonToast,
    FormsModule, 
    CommonModule
  ],
})
export class Tab1Page {

  user: string = '';
  password: string = '';
  err: string = '';
  isLoading: boolean = false;
  isToastOpen: boolean = false;
  toastMessage: string = '';

  constructor(
    private storageService: StorageService, 
    private dbService: HeroesBDService,
    private router: Router
  ) {
    // Check if already logged in
    this.checkAuthStatus();
  }

  async checkAuthStatus() {
    const isAuthenticated = await this.dbService.isAuthenticated();
    if (isAuthenticated) {
      // Si ya está autenticado, redirigir a la página principal
      this.router.navigate(['/tabs/heroes']);
    }
  }

  async login() {
    if (!this.user || !this.password) {
      this.showToast('Por favor ingresa usuario y contraseña');
      return;
    }

    this.isLoading = true;
    this.err = '';

    this.dbService.login(this.user, this.password).subscribe({
      next: async (res: any) => {
        this.isLoading = false;
        if (res.ok) {
          await this.storageService.setCookie(res.token);
          console.log('Token guardado:', await this.storageService.getCookie());
          this.showToast('¡Inicio de sesión exitoso!');
          
          // Redirigir a la página principal
          this.router.navigate(['/tabs/heroes']);
        } else {
          this.err = res.msg || 'Error desconocido';
          this.showToast(this.err);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error en login:', err);
        if (err.error && err.error.msg) {
          this.err = err.error.msg;
        } else {
          this.err = 'Error desconocido. Intenta de nuevo.';
        }
        this.showToast(this.err);
      }
    });
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }

  setToastOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }
}