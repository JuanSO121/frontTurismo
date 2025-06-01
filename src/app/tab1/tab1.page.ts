import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonItem, IonLabel, IonButton, IonText, IonSpinner, IonToast } from '@ionic/angular/standalone';
import { StorageService } from '../services/storage.service';
import { HeroesBDService } from '../services/heroes-bd.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SitiosComponent } from '../components/sitios/sitios.component';
import { Top10SitiosComponent } from '../components/top10-sitios/top10-sitios.component';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonText, 
    IonButton, 
    IonLabel, 
    IonItem, 
    IonInput, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonSpinner,
    IonToast,
    FormsModule, 
    CommonModule,
    SitiosComponent,
    Top10SitiosComponent
    
  ],
})
export class Tab1Page {
    constructor(){}
}