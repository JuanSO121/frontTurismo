import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HeroesBDService } from '../../services/heroes-bd.service';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private heroesBDService: HeroesBDService,
    private router: Router,
    private toastController: ToastController,
    private storageService: StorageService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Verificar si ya hay un token guardado
    this.checkExistingToken();
  }

  async checkExistingToken() {
    try {
      const token = await this.storageService.getCookie();
      if (token) {
        console.log('Token encontrado en localStorage. Redirigiendo a la página principal...');
        this.router.navigate(['/tabs/heroes']);
      }
    } catch (error) {
      console.error('Error al verificar token existente:', error);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    try {
      this.heroesBDService.login(email, password)
        .subscribe({
          next: async (response) => {
            console.log('Login response:', response);
            
            if (response && response.token) {
              console.log('Token recibido:', response.token);
              
              // Verificar que el token se haya guardado correctamente
              const savedToken = await this.storageService.getCookie();
              if (savedToken) {
                console.log('Token verificado en storage:', savedToken);
                this.presentToast('Login exitoso', 'success');
                this.router.navigate(['/tabs/heroes']);
              } else {
                console.error('El token no se guardó correctamente en el storage');
                this.errorMessage = 'Error al guardar credenciales';
                this.presentToast('Error al guardar credenciales', 'danger');
              }
            } else {
              console.error('No se recibió token del servidor');
              this.errorMessage = 'Error en la autenticación: No se recibió token';
              this.presentToast('Error de autenticación', 'danger');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error en login', error);
            this.errorMessage = 'Credenciales incorrectas o problema de conexión';
            this.presentToast('Error de autenticación', 'danger');
            this.loading = false;
          }
        });
    } catch (error) {
      console.error('Error en proceso de login:', error);
      this.errorMessage = 'Error inesperado. Por favor, inténtalo de nuevo.';
      this.loading = false;
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

    navigateToRegister() {
    this.router.navigate(['/register']);
  }
}