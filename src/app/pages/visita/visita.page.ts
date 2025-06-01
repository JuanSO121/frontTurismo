import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonImg,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonNote,
  AlertController,
  ModalController, IonAvatar } from '@ionic/angular/standalone';
import { QrScannerComponent } from 'src/app/components/qr-scanner/qr-scanner.component';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';
import { Router } from '@angular/router';
import { VisitaService } from 'src/app/services/turismo/visitas.service';
import { FamososService } from 'src/app/services/turismo/famosos.service';
import { AuthService } from 'src/app/services/autenticacion/auth.service';
import { IonCard } from '@ionic/angular/standalone';
import { IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/angular/standalone';
import { IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, personOutline, peopleOutline, locationOutline, close, add } from 'ionicons/icons';

@Component({
  selector: 'app-visita',
  templateUrl: './visita.page.html',
  styleUrls: ['./visita.page.scss'],
  standalone: true,
  imports: [IonAvatar, 
    CommonModule, 
    FormsModule, 
    QrScannerComponent, 
    MapViewComponent,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonImg,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonNote, IonAvatar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent
  ]
})
export class VisitaPage implements OnInit {
  visitas: any[] = [];
  mostrarFormulario = false;
  defaultImage = './assets/img/lugares-turisticos-de-colombia.png';
  famosos: any[] = [];
  sitios: any[] = [];
  usuariosCache: { [key: string]: any } = {}; // Cache para almacenar datos de usuarios


  nuevaVisita: any = {
    _id: '',
    famoso_id: [],
    sitio_id: '',
    fecha: '',
    comentario: '',
    img: '',
    qr_code: '',
    coordenadas: ''
  };

  formSubmitted = false;
  usuarioActual: any;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private visitaService: VisitaService,
    private famososService: FamososService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({ createOutline, trashOutline, personOutline, peopleOutline, locationOutline, close, add });
  }

  async ngOnInit() {
    await this.cargarDatosIniciales();
  }

  async cargarDatosIniciales() {
    try {
      const isAuth = await this.authService.isAuthenticated();
      if (!isAuth) {
        this.router.navigate(['/login']);
        return;
      }

      this.authService.getCurrentUser().subscribe({
        next: (usuario) => {
          this.usuarioActual = usuario;
          console.log('Usuario actual cargado:', this.usuarioActual);
          this.cargarVisitas();
        },
        error: (error) => {
          console.error('Error al obtener usuario:', error);
          this.router.navigate(['/login']);
        }
      });

      this.famososService.getFamosos().subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.famosos = response.data;
          } else {
            this.mostrarAlerta('Error', 'No se pudieron cargar los famosos');
          }
        },
        error: (error) => {
          console.error('Error al cargar famosos:', error);
          this.mostrarAlerta('Error', 'No se pudieron cargar los famosos');
        }
      });

      this.sitios = [
        { _id: '1', nombre: 'Sitio A' },
        { _id: '2', nombre: 'Sitio B' },
        { _id: '3', nombre: 'Sitio C' }
      ];

    } catch (error) {
      console.error('Error inicial:', error);
      this.router.navigate(['/login']);
    }
  }

 cargarVisitas() {
    if (!this.usuarioActual?._id) {
      console.warn('Usuario no cargado aún, esperando...');
      return;
    }

    this.visitaService.getVisitas().subscribe({
      next: (visitas) => {
        this.visitas = visitas;
        console.log('Visitas cargadas:', visitas);
        
        // Cargar datos de usuarios para cada visita
        this.cargarDatosUsuarios();
      },
      error: (error) => {
        console.error('Error al cargar visitas:', error);
        this.mostrarAlerta('Error', 'No se pudieron cargar las visitas');
      }
    });
  }

  onQrScanned(event: {qrCode: string, coordenadas: string}) {
    console.log('QR escaneado:', event);
    this.nuevaVisita.qr_code = event.qrCode;
    this.nuevaVisita.coordenadas = event.coordenadas;
  }

  abrirFormulario(visita?: any) {
    this.mostrarFormulario = true;
    this.formSubmitted = false;
    
    if (visita) {
      const famososArray = Array.isArray(visita.famoso_id) ? 
        visita.famoso_id : 
        (visita.famoso_id ? [visita.famoso_id] : []);
      
      this.nuevaVisita = { 
        ...visita, 
        famoso_id: famososArray 
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
      const visitaAGuardar = {
        famoso_id: this.nuevaVisita.famoso_id,
        sitio_id: this.nuevaVisita.sitio_id,
        comentario: this.nuevaVisita.comentario.trim(),
        img: this.nuevaVisita.img || this.defaultImage,
        qr_code: this.nuevaVisita.qr_code || '',
        coordenadas: this.nuevaVisita.coordenadas || ''
      };

      console.log('Datos a guardar (limpiados):', visitaAGuardar);

      if (this.nuevaVisita._id) {
        this.visitaService.actualizarVisita(
          this.nuevaVisita._id, 
          visitaAGuardar,
          this.usuarioActual?._id
        ).subscribe({
          next: (response) => {
            console.log('Visita actualizada:', response);
            this.mostrarAlerta('Éxito', 'Visita actualizada correctamente');
            this.cargarVisitas();
            this.cerrarFormulario();
          },
          error: (error) => {
            console.error('Error al actualizar visita:', error);
            this.mostrarAlerta('Error', 'No se pudo actualizar la visita: ' + error.message);
          }
        });
      } else {
        this.visitaService.crearVisita(visitaAGuardar).subscribe({
          next: (response) => {
            console.log('Visita creada:', response);
            this.mostrarAlerta('Éxito', 'Visita creada correctamente');
            this.cargarVisitas();
            this.cerrarFormulario();
          },
          error: (error) => {
            console.error('Error al crear visita:', error);
            this.mostrarAlerta('Error', 'No se pudo crear la visita: ' + error.message);
          }
        });
      }
    } else {
      console.warn('Formulario inválido');
      this.mostrarAlerta('Error', 'Por favor completa todos los campos obligatorios');
    }
  }

  // Confirmación antes de eliminar
  async confirmarEliminar(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar esta visita?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          handler: () => {
            this.eliminarVisita(id);
          }
        }
      ]
    });

    await alert.present();
  }

  eliminarVisita(id: string) {
    this.visitaService.eliminarVisita(id, this.usuarioActual?._id || '').subscribe({
      next: () => {
        this.mostrarAlerta('Éxito', 'Visita eliminada correctamente');
        this.cargarVisitas();
      },
      error: (error) => {
        console.error('Error al eliminar visita:', error);
        this.mostrarAlerta('Error', 'No se pudo eliminar la visita');
      }
    });
  }

  isFormValid(): boolean {
    return (
      this.nuevaVisita.comentario.trim() !== '' &&
      this.nuevaVisita.famoso_id.length > 0 
    );
  }

  limpiarFormulario() {
    this.nuevaVisita = {
      _id: '',
      famoso_id: [],
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
    console.log('Abriendo mapa con coordenadas:', coordenadas);
    
    try {
      this.mostrarFormulario = false;
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await this.router.navigate(['/mapa'], {
        state: { coordenadas },
        replaceUrl: false
      });
      
    } catch (error) {
      console.error('Error al abrir mapa:', error);
      this.mostrarAlerta('Error', 'No se pudo abrir el mapa');
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  getNombresFamosos(famosoIds: string[]): string {
    if (!famosoIds || famosoIds.length === 0) return 'Ninguno';
    
    return famosoIds
      .map(id => this.famosos.find(f => f._id === id)?.nombre || 'Desconocido')
      .join(', ');
  }

  getNombreSitio(sitioId: string): string {
    if (!sitioId) return 'Ninguno';
    return this.sitios.find(s => s._id === sitioId)?.nombre || 'Desconocido';
  }


   
  cargarDatosUsuarios() {
    const usuariosIds = [...new Set(this.visitas.map(v => v.usuario_id).filter(id => id))];
    
    usuariosIds.forEach(userId => {
      // Si ya tenemos los datos en caché, no hacer la petición
      if (this.usuariosCache[userId]) {
        return;
      }

      // Si es el usuario actual, usar sus datos
      if (this.usuarioActual && this.usuarioActual._id === userId) {
        this.usuariosCache[userId] = this.usuarioActual;
        return;
      }

      // Cargar datos del usuario desde el servidor
      this.authService.getUserById(userId).subscribe({
        next: (usuario) => {
          this.usuariosCache[userId] = usuario;
        },
        error: (error) => {
          console.error(`Error al cargar usuario ${userId}:`, error);
          // En caso de error, usar datos por defecto
          this.usuariosCache[userId] = { 
            nombre: 'Usuario desconocido', 
            correo: 'correo@desconocido.com' 
          };
        }
      });
    });
  }


 getCorreoUsuario(usuarioId: string): string {
    if (!usuarioId) return 'Sin usuario';
    
    // Buscar en el cache
    const usuario = this.usuariosCache[usuarioId];
    
    if (usuario) {
      return usuario.correo || 'Sin correo';
    }
    
    // Si no está en caché, mostrar "Cargando..." temporalmente
    return 'Cargando correo...';
  }

  /**
   * Obtiene el nombre del usuario
   * @param usuarioId ID del usuario
   * @returns string con el nombre del usuario
   */
  getNombreUsuario(usuarioId: string): string {
    if (!usuarioId) return 'Sin usuario';
    
    // Buscar en el cache
    const usuario = this.usuariosCache[usuarioId];
    
    if (usuario) {
      // Si es el usuario actual, mostrar "Tú"
      if (this.usuarioActual && this.usuarioActual._id === usuarioId) {
        return 'Tú';
      }
      return usuario.nombre || 'Sin nombre';
    }
    
    return 'Cargando...';
  }
}