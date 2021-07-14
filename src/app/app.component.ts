import { Component, OnInit } from '@angular/core';

const SIDE: number = 256;
const IMAGE_DATA: ImageData = new ImageData(SIDE, SIDE);

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let juliaConstR: number;
let juliaConstI: number;

(() => {
  const R: number = 0;
  const G: number = 255;
  const B: number = 204;
  const TOTAL = SIDE * SIDE * 4;
  for (let i: number = 0; i < TOTAL; i += 4) {
    IMAGE_DATA.data[i + 0] = R;
    IMAGE_DATA.data[i + 1] = G;
    IMAGE_DATA.data[i + 2] = B;
  }
})();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // Const settings.
  side: number = SIDE;
  juliaConstPairs: any[][] = [
    [-.171, .658],
    [.3555, .3555],
    [-.38, .618],
    [-.748, .114],
    [-.76, .08],
    [-.8, .157],
    [.285, .0118],
    [.257, 0],
  ];

  // Variable settings.
  set: string = '0';
  computeSet: Function;
  scale: number = 2.8;
  halfScale: number;
  contrastForSmooth: number = 1;
  contrastForSmoothFalse: number = 1.25;
  juliaConstPair: number = 0;
  maxIteration: number;
  escapeRadius: number = 20;
  escapeRadiusSq: number;
  smooth: boolean = true;

  ngOnInit(): void {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d');

    // For desktop only.
    canvas.onwheel = w => {
      w.preventDefault();
      this.scale = +(this.scale + (w.deltaY < 0 ? -.2 : .2)).toFixed(2);
      if (this.scale > 50 || this.scale < -50)
        this.scale = this.scale > 50 ? 50 : -50;
      this.updateSet();
    }

    // Define for the 1st time.
    juliaConstR = this.juliaConstPairs[this.juliaConstPair][0];
    juliaConstI = this.juliaConstPairs[this.juliaConstPair][1];

    // Define specific values for each Set.
    this.resetSet();
  }

  resetSet(): void {
    switch (this.set) {
      case '0':
        this.maxIteration = 1000;
        this.computeSet = this.julia;
        break;
      case '1':
        this.maxIteration = 400;
        this.computeSet = this.mandelbrot;
        break;
    }

    // Compute and render.
    this.updateSet();
  }

  updateSet(): void {
    this.halfScale = this.scale * .5;
    this.escapeRadiusSq = this.escapeRadius * this.escapeRadius;
    this.computeSet().then(() => this.printSet());
  }

  printSet(): void {
    ctx.clearRect(0, 0, SIDE, SIDE);
    ctx.putImageData(IMAGE_DATA, 0, 0);
  }

  setJuliaConstPair(): void {
    juliaConstR = this.juliaConstPairs[this.juliaConstPair][0];
    juliaConstI = this.juliaConstPairs[this.juliaConstPair][1];
    this.updateSet();
  }

  async julia(): Promise<void> {
    for (let i: number = 0; i < SIDE; i++) {
      for (let j: number = 0; j < SIDE; j++) {
        let r1: number = j / SIDE * this.scale - this.halfScale;
        let i1: number = i / SIDE * this.scale - this.halfScale;
        let rr: number;
        let ii: number;
        let k: number = -1;

        do {
          k++;
          rr = r1 * r1;
          ii = i1 * i1;
          i1 = 2 * r1 * i1 + juliaConstI;
          r1 = rr - ii + juliaConstR;
        } while (k < this.maxIteration && rr + ii <= this.escapeRadiusSq);

        // From coords to array position.
        const spot: number = (SIDE * i + j) * 4;

        // Play with colors.
        let alpha: number = this.smooth ?
          this.contrastForSmooth * (k === this.maxIteration ? 0 :
            k - Math.log(Math.log(Math.sqrt(rr + ii))) / Math.log(2)) :
          this.contrastForSmoothFalse * (k === this.maxIteration ? 0 :
            Math.sqrt(k / this.maxIteration) * 255);

        // Set alpha value.
        IMAGE_DATA.data[spot + 3] = alpha;
      }
    }
  }

  async mandelbrot(): Promise<void> {
    for (let i: number = 0; i < SIDE; i++) {
      for (let j: number = 0; j < SIDE; j++) {
        const r0: number = j / SIDE * this.scale - this.halfScale - .7;
        const i0: number = i / SIDE * this.scale - this.halfScale;
        let r1: number = r0;
        let i1: number = i0;
        let rr: number;
        let ii: number;
        let k: number = -1;

        do {
          k++;
          rr = r1 * r1;
          ii = i1 * i1;
          i1 = 2 * r1 * i1 + i0;
          r1 = rr - ii + r0;
        } while (k < this.maxIteration && rr + ii <= this.escapeRadiusSq);

        // From coords to array position.
        const spot: number = (SIDE * i + j) * 4;

        // Play with colors.
        let alpha: number = this.smooth ?
          5 * this.contrastForSmooth * (k === this.maxIteration ? 0 :
            k - Math.log(Math.log(Math.sqrt(rr + ii))) / Math.log(2)) :
          this.contrastForSmoothFalse * (k === this.maxIteration ? 0 :
            Math.sqrt(k / this.maxIteration) * 255);

        // Set alpha value.
        IMAGE_DATA.data[spot + 3] = alpha;
      }
    }
  }
}

// Main algorithm: wikipedia.
// Smooth: http://linas.org/art-gallery/escape/escape.html
