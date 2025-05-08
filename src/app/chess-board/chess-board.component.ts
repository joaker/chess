import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type Piece = string | null;

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
  imports: [CommonModule],
})
export class ChessBoardComponent implements OnInit {
  board: Piece[][] = [];

  ngOnInit(): void {
    this.board = [
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];
  }

  getTileColor(row: number, col: number): string {
    return (row + col) % 2 === 0 ? 'white' : 'black';
  }

  getImagePath(piece: Piece): string | null {
    return piece ? `assets/pieces/${piece}.svg` : null;
  }
}


