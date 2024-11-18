import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-tegel-toast',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tegel-toast.component.html',
  styleUrl: './tegel-toast.component.css',
})
export class TegelToastComponent {
  constructor(public toastService: ToastService) {}
}
