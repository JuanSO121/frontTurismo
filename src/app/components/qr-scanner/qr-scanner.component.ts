import { Component, EventEmitter, Output } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController, IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { CommonModule } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class QrScannerComponent {
  @Output() qrScanned = new EventEmitter<{qrCode: string, coordenadas: string}>();
  isScanning = false;

  constructor(private alertController: AlertController) {
    // Registrar iconos necesarios
    addIcons({
      'camera-outline': cameraOutline
    });
  }

  async scan(): Promise<void> {
    if (this.isScanning) return;
    
    console.log('📱 [QrScanner] Iniciando escaneo...');
    this.isScanning = true;

    try {
      const granted = await this.requestPermissions();
      if (!granted) {
        await this.presentAlert();
        return;
      }

      console.log('📱 [QrScanner] Permisos otorgados, escaneando...');

      const [barcodes, position] = await Promise.all([
        BarcodeScanner.scan(),
        Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      ]);

      console.log('📱 [QrScanner] Escaneo completado:', { barcodes, position });

      if (barcodes.barcodes.length > 0) {
        const barcode = barcodes.barcodes[0];
        const coordenadas = `${position.coords.latitude},${position.coords.longitude}`;
        
        console.log('📱 [QrScanner] Emitiendo resultado:', { qrCode: barcode.rawValue, coordenadas });
        
        this.qrScanned.emit({
          qrCode: barcode.rawValue,
          coordenadas: coordenadas
        });
      }

    } catch (error) {
      console.error('❌ [QrScanner] Error al escanear:', error);
      await this.presentErrorAlert();
    } finally {
      this.isScanning = false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();

      if (Capacitor.getPlatform() !== 'web') {
        const { location } = await Geolocation.requestPermissions();
        return camera === 'granted' && location === 'granted';
      }

      return camera === 'granted';
    } catch (error) {
      console.error('❌ [QrScanner] Error solicitando permisos:', error);
      return false;
    }
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permisos requeridos',
      message: 'Para escanear códigos QR necesitas conceder permisos de cámara y ubicación.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async presentErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Ocurrió un error al escanear el código QR. Por favor intenta nuevamente.',
      buttons: ['OK'],
    });
    await alert.present();
  }
}