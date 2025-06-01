// src/app/shared/icons.ts
import { addIcons } from 'ionicons';
import { 
  add, 
  close, 
  cameraOutline, 
  mapOutline, 
  locationOutline,
  arrowBack
} from 'ionicons/icons';

export function registerIcons() {
  addIcons({
    'add': add,
    'close': close,
    'camera-outline': cameraOutline,
    'map-outline': mapOutline,
    'location-outline': locationOutline,
    'arrow-back': arrowBack
  });
}

// Alternativamente, si prefieres registrar todos los iconos de una vez
// import * as icons from 'ionicons/icons';
// 
// export function registerAllIcons() {
//   addIcons(icons);
// }