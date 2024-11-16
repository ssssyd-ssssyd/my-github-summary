import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GithubService } from '../../services/github.service';
import { Router } from '@angular/router';

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
  constructor(private githubService: GithubService, private router: Router) {}
  public accessToken = new FormControl<string>('');
  public showToast = signal<boolean>(false);
  public userName = signal<string | null>(null);
  public toastVariant = signal<'success' | 'error' | null>(null);

  public testConnectionClicked(): void {
    const token = this.accessToken.value as string;
    if (token) {
      this.githubService.authenticateUser(token).subscribe({
        next: (data: any) => {
          this.userName.set(data.name);
          this.showToast.set(true);
          this.toastVariant.set('success');
          console.log('User Data:', data);
          this.router.navigate(['/dashboard'], {
            state: { userData: data },
          });
        },
        error: (err) => {
          console.error('Error:', err);
          this.showToast.set(true);
          this.toastVariant.set('error');
        },
      });
    } else {
      console.warn('Access token is required');
    }
    this.accessToken.setValue('');
  }

  public closeToast(): void {
    this.showToast.set(false);
  }
}
