import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-visita',
  templateUrl: './visita.page.html',
  styleUrls: ['./visita.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule,IonicModule]
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

  constructor(private modalCtrl: ModalController) {}

  abrirFormulario(visita?: any) {
    this.mostrarFormulario = true;

    if (visita) {
      this.nuevaVisita = { ...visita }; // Copia los datos al formulario
    } else {
      this.limpiarFormulario();
    }
  }


  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

guardarVisita() {
  if (
    this.nuevaVisita.comentario.trim() &&
    this.nuevaVisita.famosos_id.trim() &&
    this.nuevaVisita.sitio_id.trim()
  ) {
    const visitaAGuardar = {
      ...this.nuevaVisita,
      fecha: new Date()  // Asigna fecha actual si es nueva
    };

    this.visitas.push(visitaAGuardar);
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

}
