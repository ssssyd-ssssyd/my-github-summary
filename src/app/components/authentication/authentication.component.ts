import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GithubService } from '../../services/github.service';
import { Router } from '@angular/router';
import { ToastService } from '../../modules/shared/services/toast.service';

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
  public accessTokenInput = new FormControl<string>('');
  public userName = signal<string | null>(null);

  public testConnectionClicked(): void {
    const token = this.accessTokenInput.value as string;
    if (token) {
      this.githubService.authenticateUser(token).subscribe({
        next: (data: any) => {
          this.userName.set(data.name);
          this.toastService.displayToast(
            'success',
            'Success',
            `Logged in successfully as ${data.name}`
          );
          this.router.navigate(['/dashboard'], {
            state: { userData: data },
          });
        },
        error: (err) => {
          console.error('Error:', err);
          this.toastService.displayToast(
            'error',
            'Error',
            'There was an error logging in'
          );
        },
      });
    } else {
      console.warn('Access token is required');
    }
    this.accessTokenInput.setValue('');
  }
}
