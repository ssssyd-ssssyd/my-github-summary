import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public showToast = signal<boolean>(false);
  public toastVariant = signal<
    'success' | 'error' | 'information' | 'warning' | null
  >(null);
  public toastHeader = signal<string>('');
  public toastSubheader = signal<string>('');

  public displayToast(
    variant: 'success' | 'error' | 'information' | 'warning',
    header: string,
    subheader: string,
    duration: number = 5000
  ): void {
    this.toastVariant.set(variant);
    this.toastHeader.set(header);
    this.toastSubheader.set(subheader);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
    }, duration);
  }

  public hideToast(): void {
    this.showToast.set(false);
  }
}
