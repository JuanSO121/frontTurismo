import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { VisitaService } from 'src/app/services/turismo/visitas.service';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/autenticacion/auth.service';
import { addIcons } from 'ionicons';
import { peopleCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { Platform } from '@ionic/angular';


@Component({
  selector: 'app-mapa-rutas',
  templateUrl: './mapa-rutas.component.html',
  styleUrls: ['./mapa-rutas.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class MapaRutasComponent implements OnInit, OnDestroy {
  private map: L.Map | undefined;
  private routeLayer: L.Polyline | undefined;
  private markers: L.Marker[] = [];
  public isLoading = true;

  constructor(
    private visitaService: VisitaService,
    private alertController: AlertController,
    private router: Router,
    private authService: AuthService,
    private platform: Platform,

  ) {
    addIcons({ peopleCircleOutline, arrowBackOutline });
  }

  // En tu ngOnInit
  async ngOnInit() {
    try {
      const isAuth = await this.authService.isAuthenticated();
      if (!isAuth) {
        this.router.navigate(['/login']);
        return;
      }

      // Esperar un ciclo de detección de cambios
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.initMap();
      await this.loadRoute();
    } catch (error) {
      console.error('Error en ngOnInit:', error);
      this.showAlert('Error', 'Error al inicializar el componente');
      this.router.navigate(['/tabs/visita']);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    this.markers = [];
    this.routeLayer = undefined;
  }

  private initMap() {
    try {
      this.map = L.map('routeMap').setView([4.5709, -74.2973], 6);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);

      // Escuchar cambios de orientación/tamaño
      this.platform.resize.subscribe(() => {
        setTimeout(() => {
          this.map?.invalidateSize();
        }, 100);
      });

      this.configureLeafletIcons();
    } catch (error) {
      console.error('Error al inicializar mapa:', error);
      this.showAlert('Error', 'No se pudo inicializar el mapa');
    }
  }

  private configureLeafletIcons() {
    // Limpiar configuración previa
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

  private async loadRoute() {
    this.isLoading = true;
    
    try {
      console.log('Iniciando carga de coordenadas...');
      
      // Usar toPromise() con manejo de errores mejorado
      const response = await this.visitaService.getCoordenadasVisitas().toPromise();
      
      console.log('Respuesta del servicio:', response);
      
      if (response && response.ok && response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('Coordenadas recibidas:', response.data);
        
        // Procesar coordenadas
        const coordinates = this.processCoordinates(response.data);
        
        if (coordinates.length > 0) {
          this.drawRoute(coordinates);
          this.addMarkers(coordinates);
          this.fitMapToBounds(coordinates);
        } else {
          this.showAlert('Sin datos', 'No se pudieron procesar las coordenadas recibidas.');
        }
      } else {
        console.warn('Respuesta vacía o inválida:', response);
        this.showAlert('Sin datos', 'No se encontraron coordenadas de visitas para mostrar la ruta.');
      }
    } catch (error) {
      console.error('Error al cargar coordenadas:', error);

      // Manejar diferentes tipos de errores
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        const errMsg = (error as any).message as string;
        if (errMsg.includes('401')) {
          this.showAlert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          this.router.navigate(['/login']);
        } else if (errMsg.includes('No autorizado')) {
          this.showAlert('Sin autorización', 'No tienes permisos para ver esta información.');
          this.router.navigate(['/tabs/visita']);
        } else {
          this.showAlert('Error de conexión', 'No se pudieron cargar las coordenadas. Verifica tu conexión a internet.');
        }
      } else {
        this.showAlert('Error de conexión', 'No se pudieron cargar las coordenadas. Verifica tu conexión a internet.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  private processCoordinates(coordenadasArray: string[]): L.LatLng[] {
    const coordinates: L.LatLng[] = [];
    
    for (const coordStr of coordenadasArray) {
      try {
        if (typeof coordStr === 'string' && coordStr.includes(',')) {
          const [latStr, lngStr] = coordStr.split(',');
          const lat = parseFloat(latStr.trim());
          const lng = parseFloat(lngStr.trim());
          
          // Validar que las coordenadas sean válidas
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            coordinates.push(L.latLng(lat, lng));
          } else {
            console.warn('Coordenada inválida ignorada:', coordStr);
          }
        } else {
          console.warn('Formato de coordenada inválido:', coordStr);
        }
      } catch (error) {
        console.error('Error procesando coordenada:', coordStr, error);
      }
    }
    
    console.log('Coordenadas procesadas:', coordinates);
    return coordinates;
  }

  private drawRoute(coordinates: L.LatLng[]) {
    if (!this.map) return;

    // Remover ruta anterior si existe
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    // Crear nueva ruta
    this.routeLayer = L.polyline(coordinates, {
      color: '#3880ff',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 5',
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.map);

    console.log('Ruta dibujada con', coordinates.length, 'puntos');
  }

  private addMarkers(coordinates: L.LatLng[]) {
    if (!this.map) return;

    // Limpiar marcadores anteriores
    this.markers.forEach(marker => {
      this.map!.removeLayer(marker);
    });
    this.markers = [];

    // Agregar nuevos marcadores
    coordinates.forEach((coord, index) => {
      const isFirst = index === 0;
      const isLast = index === coordinates.length - 1;
      
      let popupContent = `<strong>Visita #${index + 1}</strong><br>`;
      popupContent += `Coordenadas: ${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}<br>`;
      
      if (isFirst) {
        popupContent += '<em>Punto de inicio</em>';
      } else if (isLast) {
        popupContent += '<em>Último punto visitado</em>';
      }

      const marker = L.marker(coord).addTo(this.map!);
      marker.bindPopup(popupContent);
      
      this.markers.push(marker);
      
      // Abrir popup del primer marcador
      if (isFirst) {
        marker.openPopup();
      }
    });

    console.log('Agregados', this.markers.length, 'marcadores al mapa');
  }

  private fitMapToBounds(coordinates: L.LatLng[]) {
    if (!this.map || coordinates.length === 0) return;

    try {
      if (coordinates.length === 1) {
        // Si solo hay un punto, centrar en él
        this.map.setView(coordinates[0], 15);
      } else {
        // Si hay múltiples puntos, ajustar para mostrar todos
        const bounds = L.latLngBounds(coordinates);
        this.map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 16
        });
      }
    } catch (error) {
      console.error('Error al ajustar vista del mapa:', error);
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Solo navegar de vuelta si no es un error de autenticación
            if (!message.includes('sesión') && !message.includes('autorización')) {
              this.router.navigate(['/tabs/visita']);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método público para recargar la ruta (opcional)
  async recargarRuta() {
    if (this.isLoading) return;
    
    await this.loadRoute();
  }

  // Método para volver atrás
  goBack() {
    this.router.navigate(['/tabs/visita']);
  }
}
