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
  visitas: Array<{ famosos_id: string[]; sitio_id: string; comentario: string; fecha: Date, usuario_id: string }> = [];
  mostrarFormulario = false;

  famosos = [
    { id: '1', nombre: 'Famoso A' },
    { id: '2', nombre: 'Famoso B' }
  ];

  sitios = [
    { id: '1', nombre: 'Sitio A' },
    { id: '2', nombre: 'Sitio B' }
  ];
  
    // Lista de usuarios
  usuarios = [
    { id: '1', nombre: 'Usuario 1' },
    { id: '2', nombre: 'Usuario 2' },
    { id: '3', nombre: 'Usuario 3' }
  ];


  nuevaVisita = {
    _id: '',
    famosos_id: [] as string[], // Cambiado a array de strings
    usuario_id: '',
    sitio_id: '',
    fecha: '',
    comentario: '',
    img: '',
    qr_code: '',
    coordenadas: ''
  };

    // Variable para controlar si se ha intentado enviar el formulario
  formSubmitted = false;

  onQrScanned(event: {qrCode: string, coordenadas: string}) {
    console.log('🔵 [VisitaPage] QR escaneado:', event);
    this.nuevaVisita.qr_code = event.qrCode;
    this.nuevaVisita.coordenadas = event.coordenadas;
  }

  constructor(private modalCtrl: ModalController, private router: Router) {}

  abrirFormulario(visita?: any) {
    this.mostrarFormulario = true;
    this.formSubmitted = false; // Resetear estado de envío
    
    if (visita) {
      // Convertir famosos_id a array si es string (para compatibilidad)
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
    
    // Validar campos obligatorios
    if (this.isFormValid()) {
      console.log('💾 [VisitaPage] Guardando visita:', this.nuevaVisita);
      
      const visitaAGuardar = {
        ...this.nuevaVisita,
        fecha: new Date()
      };

      this.visitas.push(visitaAGuardar);
      this.cerrarFormulario();
    }
  }

  // Validación del formulario
  isFormValid(): boolean {
    return (
      this.nuevaVisita.comentario.trim() !== '' &&
      this.nuevaVisita.famosos_id.length > 0 &&
      this.nuevaVisita.sitio_id.trim() !== '' &&
      this.nuevaVisita.usuario_id.trim() !== ''
    );
  }

  limpiarFormulario() {
    this.nuevaVisita = {
      _id: '',
      famosos_id: [],
      usuario_id: '',
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
    // ... (mantener el mismo código de abrirMapa)
  }
}