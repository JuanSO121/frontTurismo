import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mapOutline, locationOutline, expandOutline } from 'ionicons/icons';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MapViewComponent implements OnInit, OnChanges {
  @Input() coordenadas: string = '';
  @Output() abrirMapa = new EventEmitter<string>();

  constructor() {
    // Registrar iconos necesarios
    addIcons({ mapOutline, expandOutline })
  }

  ngOnInit() {
    console.log('🗺️ [MapView] ngOnInit - coordenadas:', this.coordenadas);
  }

  ngOnChanges() {
    console.log('🗺️ [MapView] ngOnChanges - coordenadas:', this.coordenadas);
  }

  openMap(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🗺️ [MapView] openMap() ejecutado con coordenadas:', this.coordenadas);
    
    if (this.coordenadas && this.coordenadas.trim() !== '') {
      console.log('🗺️ [MapView] Emitiendo evento abrirMapa...');
      this.abrirMapa.emit(this.coordenadas);
    } else {
      console.log('❌ [MapView] No hay coordenadas válidas');
      alert('No hay coordenadas disponibles para mostrar el mapa');
    }
  }
}