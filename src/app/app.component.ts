import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TegelModule } from '@scania/tegel-angular-17';
import { TegelToastComponent } from './modules/shared/components/tegel-toast/tegel-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TegelModule, TegelToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
