// pipes/phone-mask.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneMask',
  standalone: false
})
export class PhoneMaskPipe implements PipeTransform {
  
  transform(phoneNumber: string | null | undefined, format: string = 'XXX XXX XXX'): string {
    if (!phoneNumber) {
      return '';
    }
    
    // Remove any non-digit characters
    const cleaned = phoneNumber.toString().replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.length === 12 && cleaned.startsWith('254')) {
      // Format: 2547XXXXXXXX -> 254 XXX XXX XXX
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`;
    } else if (cleaned.length === 10 && cleaned.startsWith('07')) {
      // Format: 07XXXXXXXX -> 07X XXX XXX
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 10)}`;
    } else if (cleaned.length === 9) {
      // Format: 7XXXXXXXX -> 7XX XXX XXX
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`;
    }
    
    // Default: show last 4 digits only (privacy)
    if (cleaned.length > 4) {
      const last4 = cleaned.slice(-4);
      const masked = '*'.repeat(cleaned.length - 4) + last4;
      // Group in chunks of 3
      return masked.match(/.{1,3}/g)?.join(' ') || masked;
    }
    
    return phoneNumber;
  }
}