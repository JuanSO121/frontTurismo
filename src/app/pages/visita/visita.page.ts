import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg } from '@ionic/angular/standalone';
import { IonicModule, ModalController } from '@ionic/angular';
import { QrScannerComponent } from 'src/app/components/qr-scanner/qr-scanner.component';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-visita',
  templateUrl: './visita.page.html',
  styleUrls: ['./visita.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, QrScannerComponent, MapViewComponent, IonImg]
})
export class VisitaPage {
  visitas: Array<{ famosos_id: string[]; sitio_id: string; comentario: string; fecha: Date; img: string }> = [];
  mostrarFormulario = false;
  defaultImage = 'assets/imgs/default-image.jpg'; // Ruta a tu imagen por defecto

  // Lista de famosos
  famosos = [
    { id: '1', nombre: 'Famoso A' },
    { id: '2', nombre: 'Famoso B' },
    { id: '3', nombre: 'Famoso C' }
  ];

  // Lista de sitios
  sitios = [
    { id: '1', nombre: 'Sitio A' },
    { id: '2', nombre: 'Sitio B' },
    { id: '3', nombre: 'Sitio C' }
  ];

  nuevaVisita = {
    _id: '',
    famosos_id: [] as string[],
    sitio_id: '',
    fecha: '',
    comentario: '',
    img: '',
    qr_code: '',
    coordenadas: ''
  };

  formSubmitted = false;
  alertController: any;

  constructor(private modalCtrl: ModalController, private router: Router) {}

  onQrScanned(event: {qrCode: string, coordenadas: string}) {
    console.log('🔵 [VisitaPage] QR escaneado:', event);
    this.nuevaVisita.qr_code = event.qrCode;
    this.nuevaVisita.coordenadas = event.coordenadas;
  }

  abrirFormulario(visita?: any) {
    this.mostrarFormulario = true;
    this.formSubmitted = false;
    
    if (visita) {
      const famososArray = Array.isArray(visita.famosos_id) ? 
        visita.famosos_id : 
        (visita.famosos_id ? [visita.famosos_id] : []);
      
      this.nuevaVisita = { 
        ...visita, 
        famosos_id: famososArray 
      };
    } else {
      this.limpiarFormulario();
    }
  }

  async cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  guardarVisita() {
    this.formSubmitted = true;
    
    if (this.isFormValid()) {
      console.log('💾 [VisitaPage] Guardando visita:', this.nuevaVisita);
      
      const visitaAGuardar = {
        ...this.nuevaVisita,
        fecha: new Date(),
        // Asegurarse de que hay una imagen (usar default si no)
        img: this.nuevaVisita.img || this.defaultImage
      };

      this.visitas.push(visitaAGuardar);
      this.cerrarFormulario();
    }
  }

  isFormValid(): boolean {
    return (
      this.nuevaVisita.comentario.trim() !== '' &&
      this.nuevaVisita.famosos_id.length > 0 &&
      this.nuevaVisita.sitio_id.trim() !== ''
    );
  }

  limpiarFormulario() {
    this.nuevaVisita = {
      _id: '',
      famosos_id: [],
      sitio_id: '',
      fecha: '',
      comentario: '',
      img: '',
      qr_code: '',
      coordenadas: ''
    };
    this.formSubmitted = false;
  }
async abrirMapa(coordenadas: string) {
  console.log('🗺️ [VisitaPage] Iniciando abrirMapa con coordenadas:', coordenadas);
  
  // ✅ DEBUG: Verificar estado de autenticación
  console.log('🔐 DEBUG - Verificando autenticación...');
  
  // Revisar si hay token en localStorage
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('access_token');
  console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO');
  
  if (token) {
    console.log('🔑 Token (primeros 20 chars):', token.substring(0, 20));
    
    // Verificar si el token está expirado (si es JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convertir a millisegundos
      const now = Date.now();
      console.log('⏰ Token expira:', new Date(expiry));
      console.log('⏰ Ahora es:', new Date(now));
      console.log('✅ Token válido:', expiry > now ? 'SÍ' : 'NO');
    } catch (error) {
      console.log('⚠️ No se pudo verificar expiración del token:', error);
    }
  }
  
  try {
    // 1. Cerrar el modal primero
    console.log('🔄 Cerrando modal...');
    this.mostrarFormulario = false;
    
    // 2. Delay para asegurar que el cambio de estado se procese
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 3. Navegar al mapa
    console.log('🚀 Navegando a /mapa con coordenadas:', coordenadas);
    
    // ✅ TEMPORAL: Intenta sin guards primero
    console.log('🔍 Intentando navegación...');
    
    await this.router.navigate(['/mapa'], {
      state: { coordenadas },
      replaceUrl: false
    });
    
    console.log('✅ Navegación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en abrirMapa:', error);
    
    let errorMessage = 'No se pudo abrir el mapa.';
    if (error instanceof Error) {
      errorMessage += ' ' + error.message;
    }
    
    const alert = await this.alertController.create({
      header: 'Error de navegación',
      message: errorMessage,
      buttons: ['OK']
    });
    await alert.present();
  }
}

}