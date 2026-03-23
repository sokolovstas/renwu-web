
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';



@Component({
  selector: 'renwu-todos-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailComponent {}
