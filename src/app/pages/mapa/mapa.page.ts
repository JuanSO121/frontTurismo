import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MapaPage implements OnInit, OnDestroy, AfterViewInit {
  coordenadas: string = '';
  lat: number | null = null;
  lon: number | null = null;
  private map: L.Map | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('🗺️ [MapaPage] Constructor ejecutado');
    
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.coordenadas = navigation.extras.state['coordenadas'];
      console.log('📍 Coordenadas recibidas:', this.coordenadas);
      
      if (this.coordenadas) {
        const coords = this.coordenadas.split(',');
        if (coords.length === 2) {
          this.lat = parseFloat(coords[0].trim());
          this.lon = parseFloat(coords[1].trim());
          console.log('📍 Coordenadas parseadas:', { lat: this.lat, lon: this.lon });
        }
      }
    }
    
    if (!this.coordenadas && history.state?.coordenadas) {
      this.coordenadas = history.state.coordenadas;
      const coords = this.coordenadas.split(',');
      if (coords.length === 2) {
        this.lat = parseFloat(coords[0].trim());
        this.lon = parseFloat(coords[1].trim());
      }
    }
  }

  ngOnInit() {
    console.log('🗺️ [MapaPage] ngOnInit iniciado');
  }

  ngAfterViewInit() {
    console.log('🗺️ [MapaPage] ngAfterViewInit - Vista cargada');
    
    // ✅ SOLUCION DEFINITIVA: Múltiples chequeos hasta que funcione
    this.waitForMapContainer();
  }

  private waitForMapContainer() {
    const checkContainer = () => {
      const mapContainer = document.getElementById('map');
      
      if (!mapContainer) {
        console.log('⏳ Esperando contenedor del mapa...');
        setTimeout(checkContainer, 100);
        return;
      }

      // ✅ VERIFICAR dimensiones del contenedor
      const rect = mapContainer.getBoundingClientRect();
      console.log('📐 Dimensiones del contenedor:', {
        width: rect.width,
        height: rect.height,
        display: getComputedStyle(mapContainer).display,
        visibility: getComputedStyle(mapContainer).visibility
      });

      if (rect.width === 0 || rect.height === 0) {
        console.log('⏳ Contenedor sin dimensiones, esperando...');
        setTimeout(checkContainer, 100);
        return;
      }

      // ✅ FORZAR estilos directamente en el elemento
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100vh';
      mapContainer.style.display = 'block';
      mapContainer.style.position = 'relative';
      
      console.log('✅ Contenedor listo, inicializando mapa...');
      this.initMap();
    };

    checkContainer();
  }

  private initMap() {

    if (!this.lat || !this.lon) {
      console.error('❌ No se proporcionaron coordenadas válidas');
      return;
    }

    try {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('❌ Map container not found.');
        return;
      }
      this.configureLeafletIcons();


      // ✅ LIMPIAR completamente cualquier mapa anterior
      if (this.map) {
        console.log('🧹 Limpiando mapa anterior...');
        this.map.remove();
        this.map = undefined;
      }

      // ✅ LIMPIAR el contenedor HTML
      mapContainer.innerHTML = '';

      console.log('🗺️ Creando nuevo mapa...');

      // ✅ CREAR mapa con configuración específica para evitar tiles rotos
      this.map = L.map(mapContainer, {
        center: [this.lat!, this.lon!],
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
        // ✅ IMPORTANTE: Configuraciones para evitar problemas de tiles
        preferCanvas: false,
        worldCopyJump: false,
        maxBounds: undefined
      });

      // ✅ AGREGAR tiles con configuración robusta
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1,
        // ✅ CONFIGURACIONES CLAVE para evitar tiles fragmentados
        tileSize: 256,
        zoomOffset: 0,
        crossOrigin: true,
        // ✅ FORZAR recarga de tiles
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 2
      });

      tileLayer.addTo(this.map);

      // ✅ AGREGAR marcador
      const marker = L.marker([this.lat!, this.lon!]).addTo(this.map);
      marker.bindPopup('Ubicación de la visita 📍').openPopup();

      console.log('✅ Mapa creado exitosamente');

      // ✅ CLAVE: Forzar invalidación del tamaño después de todo
      setTimeout(() => {
        if (this.map) {
          console.log('🔄 Invalidando tamaño del mapa...');
          this.map.invalidateSize(true);
          
          // ✅ SEGUNDO intento si el primero no funciona
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize(true);
              console.log('✅ Mapa completamente inicializado');
            }
          }, 200);
        }
      }, 100);

    } catch (error) {
      console.error('❌ Error al inicializar el mapa:', error);
    }
  }

  private configureLeafletIcons() {
  // Solucionar el problema de los iconos base64
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'assets/leaflet/images/marker-icon-2x.png',
    iconUrl: 'assets/leaflet/images/marker-icon.png',
    shadowUrl: 'assets/leaflet/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

  ngOnDestroy() {
    console.log('🧹 Limpiando mapa en destroy...');
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}