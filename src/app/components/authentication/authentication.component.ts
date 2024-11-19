import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GithubService } from '../../services/github.service';
import { Router } from '@angular/router';
import { ToastService } from '../../modules/shared/services/toast.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationComponent {
  constructor(
    private githubService: GithubService,
    private router: Router,
    private toastService: ToastService
  ) {}
  public accessTokenInput = new FormControl<string>('', [
    Validators.required,
    this.tokenFormatValidator,
  ]);
  public userName = signal<string | null>(null);
  public formSubmitted = signal<boolean>(false);

  public testConnectionClicked(): void {
    this.formSubmitted.set(true);
    const token = this.accessTokenInput.value as string;
    if (token) {
      this.authenticateUser(token);
    } else {
      console.warn('Access token is required');
    }
  }

  private authenticateUser(token: string): void {
    this.githubService
      .authenticateUser(token)
      .pipe(take(1))
      .subscribe({
        next: (data: any) => {
          this.handleSuccessfulAuthentication(data);
        },
        error: (err) => {
          console.error('Error:', err);
          this.showToast(
            'error',
            'Error',
            'Authentication failed. Please check your token.'
          );
        },
      });
  }

  private handleSuccessfulAuthentication(data: any): void {
    this.userName.set(data.name);
    this.showToast(
      'success',
      'Authentication Successful',
      `Welcome, ${data.name}!`
    );
    this.navigateToDashboard(data);
    this.resetForm();
  }

  private showToast(type: any, title: string, message: string): void {
    this.toastService.displayToast(type, title, message);
  }

  private navigateToDashboard(data: any): void {
    this.router.navigate(['/dashboard'], {
      state: { userData: data },
    });
  }

  private resetForm(): void {
    this.accessTokenInput.reset();
    this.formSubmitted.set(false);
  }

  private tokenFormatValidator(
    control: FormControl
  ): { [key: string]: boolean } | null {
    const token = control.value;
    if (!token) {
      return null;
    }

    const isValidFormat = /^ghp_[a-zA-Z0-9]{36}$/.test(token);
    return isValidFormat ? null : { invalidTokenFormat: true };
  }
}
