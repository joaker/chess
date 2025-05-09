import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type Tile = {
    row: number;
    col: number;
    color: 'black' | 'white';
  };
  
  @Component({
    selector: 'app-tile-grid',
    templateUrl: './tile-grid.component.html',
    styleUrls: ['./tile-grid.component.scss'],
    imports: [CommonModule],
  })
  export class TileGridComponent {
    gridSize = 8;
    tiles: Tile[][] = [];
  
    constructor() {
      for (let row = 0; row < this.gridSize; row++) {
        const tileRow: Tile[] = [];
        for (let col = 0; col < this.gridSize; col++) {
          const color = (row + col) % 2 === 0 ? 'black' : 'white';
          tileRow.push({ row, col, color });
        }
        this.tiles.push(tileRow);
      }
    }
  
    toggleTile(tile: Tile) {
      tile.color = tile.color === 'black' ? 'white' : 'black';
    }
  }
  