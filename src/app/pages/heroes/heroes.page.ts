import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonLabel,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonFab,
  IonFabButton,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonAlert,
  IonBackdrop,
  IonText,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { 
  addOutline, 
  createOutline, 
  trashOutline, 
  closeOutline, 
  saveOutline,
  imageOutline,
  timerOutline,
  homeOutline, informationCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Heroe } from 'src/app/interfaces/heroes.interface';

import { Router } from '@angular/router';
import { Observable, catchError, finalize, from, of, tap } from 'rxjs';
import { HeroesBDService } from 'src/app/services/heroes-bd.service';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.page.html',
  styleUrls: ['./heroes.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonLabel,
    IonModal,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton,
    IonButtons,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonAlert,
    IonBackdrop,
    IonText,
    CommonModule, 
    FormsModule,
    ReactiveFormsModule
  ]
})
export class HeroesPage implements OnInit {
  @ViewChild('heroModal') heroModal!: IonModal;
  @ViewChild('editModal') editModal!: IonModal;
  
  // Variables generales
  heroes: Heroe[] = [];
  filteredHeroes: Heroe[] = [];
  loading = false;
  error = false;
  errorMessage = '';
  searchTerm = '';
  
  // Héroe seleccionado y nuevo héroe
  selectedHero: Heroe | null = null;
  newHero: Heroe = this.resetHeroForm();
  isEditMode = false;
  
  // Para controlar procesos
  processingAction = false;
  
  // Imagen por defecto
  defaultImage = 'assets/img/no-image.png';
  
  // Opciones para el select de casa
  casas = ['Marvel', 'DC'];
$event: any;
Array: any;
  
  constructor(
    private heroesService: HeroesBDService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {
    // Registrar los iconos que utilizaremos
    addIcons({timerOutline,createOutline,trashOutline,homeOutline,addOutline,closeOutline,imageOutline,informationCircleOutline,saveOutline});
  }

  ngOnInit() {
    this.loadHeroes();
  }

  /**
   * Carga todos los héroes desde el servicio
   */
  loadHeroes() {
    this.loading = true;
    this.error = false;
    
    this.heroesService.getHeroes()
      .pipe(
        tap((response) => {
          if (response && response.resp) {
            this.heroes = this.normalizeHeroesData(response.resp);
            this.filteredHeroes = [...this.heroes];
          } else {
            this.error = true;
            this.errorMessage = 'La respuesta del servidor no tiene el formato esperado';
          }
        }),
        catchError(err => {
          this.error = true;
          this.errorMessage = err.message || 'Error al cargar héroes';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }

  /**
   * Normaliza los datos de los héroes para asegurar consistencia
   */
  normalizeHeroesData(heroes: Heroe[]): Heroe[] {
    return heroes.map(hero => {
      // Asegurar que img siempre sea un array
      if (!hero.img) {
        hero.img = [];
      } else if (typeof hero.img === 'string') {
        hero.img = [hero.img];
      }
      return hero;
    });
  }

  /**
   * Filtra los héroes basado en el término de búsqueda
   */
  filterHeroes() {
    if (!this.searchTerm.trim()) {
      this.filteredHeroes = [...this.heroes];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredHeroes = this.heroes.filter(hero => 
      hero.nombre.toLowerCase().includes(searchTermLower) ||
      hero.casa.toLowerCase().includes(searchTermLower)
    );
  }

  /**
   * Maneja el evento de refresh de la lista
   */
  doRefresh(event: any) {
    this.loadHeroes();
    // Completar el evento de refresh
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Selecciona un héroe para ver sus detalles
   */
  viewHeroDetails(hero: Heroe) {
    this.selectedHero = { ...hero };
    this.heroModal.present();
  }

  /**
   * Cierra el modal de detalles
   */
  closeHeroModal() {
    this.heroModal.dismiss();
    this.selectedHero = null;
  }

  /**
   * Abre el modal para editar un héroe
   */
  editHero(hero: Heroe) {
    this.isEditMode = true;
    this.newHero = { ...hero };
    // Si es un array de imágenes, toma la primera como referencia
    if (Array.isArray(this.newHero.img) && this.newHero.img.length > 0) {
      this.newHero.img = this.newHero.img[0];
    } else if (Array.isArray(this.newHero.img) && this.newHero.img.length === 0) {
      this.newHero.img = '';
    }
    this.heroModal.dismiss();
    this.editModal.present();
  }

  /**
   * Abre el modal para crear un nuevo héroe
   */
  openNewHeroModal() {
    this.isEditMode = false;
    this.newHero = this.resetHeroForm();
    this.editModal.present();
  }

  /**
   * Cierra el modal de edición/creación
   */
  cancelEdit() {
    this.editModal.dismiss();
  }

  /**
   * Guarda el héroe (crea o actualiza)
   */
  saveHero() {
    // Validar campos obligatorios
    if (!this.validateHeroForm()) {
      this.presentToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }
    
    this.processingAction = true;
    const action = this.isEditMode ? 'modificar' : 'insertar';
    
    this.heroesService.crud_Heroes(this.newHero, action)
      .pipe(
        tap(response => {
          this.presentToast(
            this.isEditMode ? 'Héroe actualizado correctamente' : 'Héroe creado correctamente', 
            'success'
          );
          this.editModal.dismiss();
          this.loadHeroes(); // Recargar la lista
        }),
        catchError(err => {
          this.presentToast(
            `Error al ${this.isEditMode ? 'actualizar' : 'crear'} héroe: ${err.message}`, 
            'danger'
          );
          return of(null);
        }),
        finalize(() => {
          this.processingAction = false;
        })
      )
      .subscribe();
  }

  /**
   * Valida el formulario de héroe
   */
  validateHeroForm(): boolean {
    return !!(
      this.newHero.nombre?.trim() &&
      this.newHero.bio?.trim() &&
      this.newHero.aparicion?.trim() &&
      this.newHero.casa?.trim()
    );
  }

  /**
   * Elimina un héroe tras confirmación
   */
  async deleteHero(hero: Heroe) {
    const alert = await this.alertController.create({
      header: '¿Eliminar héroe?',
      message: `¿Estás seguro de que deseas eliminar a ${hero.nombre}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteHero(hero);
          }
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Confirma la eliminación del héroe
   */
  confirmDeleteHero(hero: Heroe) {
    this.processingAction = true;
    
    this.heroesService.crud_Heroes(hero, 'eliminar')
      .pipe(
        tap(response => {
          this.presentToast('Héroe eliminado correctamente', 'success');
          this.heroModal.dismiss();
          // Eliminar el héroe de las listas locales
          this.heroes = this.heroes.filter(h => h._id !== hero._id);
          this.filteredHeroes = this.filteredHeroes.filter(h => h._id !== hero._id);
        }),
        catchError(err => {
          this.presentToast(`Error al eliminar héroe: ${err.message}`, 'danger');
          return of(null);
        }),
        finalize(() => {
          this.processingAction = false;
        })
      )
      .subscribe();
  }

  /**
   * Muestra un toast con un mensaje
   */
  async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    
    await toast.present();
  }

  /**
   * Navega a la galería de imágenes del héroe seleccionado
   */
  viewHeroGallery() {
    if (this.selectedHero) {
      this.heroModal.dismiss();
      // Navegar al tab de galería y seleccionar este héroe
      this.router.navigate(['/tabs/tab3']);
      // Aquí podrías implementar un servicio de comunicación entre componentes
      // para abrir directamente la galería del héroe seleccionado
    }
  }

  /**
   * Maneja errores de carga de imágenes
   */
  handleImageError(event: any) {
    event.target.src = this.defaultImage;
  }

  /**
   * Reinicia el formulario de héroe
   */
  resetHeroForm(): Heroe {
    return {
      nombre: '',
      bio: '',
      aparicion: '',
      casa: 'Marvel', // Valor por defecto
      img: ''
    };
  }

  /**
   * Devuelve la primera imagen del héroe o la imagen por defecto
   */
  getHeroImage(hero: Heroe): string {
    if (Array.isArray(hero.img) && hero.img.length > 0) {
      return hero.img[0];
    } else if (typeof hero.img === 'string' && hero.img) {
      return hero.img;
    }
    return this.defaultImage;
  }
}