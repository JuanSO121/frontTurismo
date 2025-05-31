import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule, ModalController } from '@ionic/angular';
import { QrScannerComponent } from 'src/app/components/qr-scanner/qr-scanner.component';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-visita',
  templateUrl: './visita.page.html',
  styleUrls: ['./visita.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, QrScannerComponent, MapViewComponent]
})
export class VisitaPage {
  visitas: Array<{ famosos_id: string; sitio_id: string; comentario: string; fecha: Date }> = [];
  mostrarFormulario = false;

  famosos = [
    { id: '1', nombre: 'Famoso A' },
    { id: '2', nombre: 'Famoso B' }
  ];

  sitios = [
    { id: '1', nombre: 'Sitio A' },
    { id: '2', nombre: 'Sitio B' }
  ];

  nuevaVisita = {
    _id: '',
    famosos_id: '',
    usuario_id: '',
    sitio_id: '',
    fecha: '',
    comentario: '',
    img: '',
    qr_code: '',
    coordenadas: ''
  };
  alertController: any;

  onQrScanned(event: {qrCode: string, coordenadas: string}) {
    console.log('🔵 [VisitaPage] QR escaneado:', event);
    this.nuevaVisita.qr_code = event.qrCode;
    this.nuevaVisita.coordenadas = event.coordenadas;
  }

  constructor(private modalCtrl: ModalController, private router: Router) {}

  abrirFormulario(visita?: any) {
    this.mostrarFormulario = true;
    if (visita) {
      this.nuevaVisita = { ...visita };
    } else {
      this.limpiarFormulario();
    }
  }

  async cerrarFormulario() {
    console.log('🔴 [VisitaPage] Cerrando formulario...');
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    // Pequeña pausa para que Angular procese el cambio
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  guardarVisita() {
    console.log('💾 [VisitaPage] Intentando guardar visita:', this.nuevaVisita);
    
    if (
      this.nuevaVisita.comentario.trim() &&
      this.nuevaVisita.famosos_id.trim() &&
      this.nuevaVisita.sitio_id.trim()
    ) {
      const visitaAGuardar = {
        ...this.nuevaVisita,
        fecha: new Date()
      };

      this.visitas.push(visitaAGuardar);
      console.log('✅ [VisitaPage] Visita guardada exitosamente');
      this.cerrarFormulario();
    } else {
      alert('Por favor completa todos los campos requeridos.');
    }
  }

  limpiarFormulario() {
    this.nuevaVisita = {
      _id: '',
      famosos_id: '',
      usuario_id: '',
      sitio_id: '',
      fecha: '',
      comentario: '',
      img: '',
      qr_code: '',
      coordenadas: ''
    };
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