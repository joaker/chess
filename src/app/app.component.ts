import { Component } from '@angular/core';
import { ChessBoardComponent } from './chess-board/chess-board.component';

@Component({
  selector: 'app-root',
  imports: [ChessBoardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'chess';
}
