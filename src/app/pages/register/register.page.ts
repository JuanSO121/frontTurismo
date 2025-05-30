import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HeroesBDService } from '../../services/heroes-bd.service';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private heroesBDService: HeroesBDService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
  }

  // Custom validator to check that passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
      spinner: 'circles'
    });
    await loading.present();
    
    this.loading = true;
    this.errorMessage = '';
    
    const nombre = this.registerForm.value.nombre;
    const correo = this.registerForm.value.email;
    const password = this.registerForm.value.password;

    try {
      console.log('Enviando solicitud de registro para:', correo);
      
      this.heroesBDService.register(nombre, correo, password)
        .subscribe({
          next: (response) => {
            console.log('Registro exitoso:', response);
            loading.dismiss();
            this.presentToast('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
            
            // If registration includes an automatic token, redirect directly
            if (response && response.token) {
              this.router.navigate(['/tabs/heroes']);
            } else {
              // Otherwise, redirect to login
              this.router.navigate(['/login']);
            }
            
            this.loading = false;
          },
          error: (error) => {
            console.error('Error en registro:', error);
            loading.dismiss();
            
            // Get more precise error message if available
            let errorMsg = 'Error en el registro. Por favor, inténtalo de nuevo.';
            if (error.message) {
              errorMsg = error.message;
            }
            
            this.errorMessage = errorMsg;
            this.presentToast(errorMsg, 'danger');
            this.loading = false;
          }
        });
    } catch (error) {
      console.error('Error inesperado en proceso de registro:', error);
      loading.dismiss();
      this.errorMessage = 'Error inesperado. Por favor, inténtalo de nuevo.';
      this.loading = false;
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}