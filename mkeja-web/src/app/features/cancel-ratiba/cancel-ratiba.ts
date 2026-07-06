// components/cancel-ratiba/cancel-ratiba.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface CancelRatibaData {
  planName: string;
  amount: number;
}

@Component({
  selector: 'app-cancel-ratiba-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './cancel-ratiba.html',
  styleUrls: ['./cancel-ratiba.css']
})
export class CancelRatibaDialogComponent {
  reasonControl = new FormControl('');
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<CancelRatibaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelRatibaData
  ) {}

  onConfirm(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.dialogRef.close({ confirmed: true, reason: this.reasonControl.value });
    }, 500);
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}