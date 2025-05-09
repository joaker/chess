import { Component } from '@angular/core';
import { ChessBoardComponent } from './chess-board/chess-board.component';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [ChessBoardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [{provide: APP_BASE_HREF, useValue: '/chess'}]
})
export class AppComponent {
  title = 'chess';
}
