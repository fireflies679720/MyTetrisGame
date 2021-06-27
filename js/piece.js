class Piece {
  constructor(tetromino, name, color) {
    this.tetromino = tetromino;
    this.name = name;
    this.color = color;

    // start from the first pattern
    this.pattern = 0;
    this.activeTetromino = this.tetromino[this.pattern];

    // drop position
    this.x = 3;
    if (this.activeTetromino.length == 4) {
      this.y = -3;
    } else {
      this.y = -2;
    }
  }

  static randomPiece() {
    let random = Math.floor(Math.random() * PIECES.length);
    return new Piece(PIECES[random][0], PIECES[random][1], PIECES[random][2]);
  }

  // draw next piece to the "next" frame
  drawPieceToNextFrame() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    let width, height;
    if (this.name == "I" || this.name == "O") {
      width = height = 4 * SQUARE_SIZE;
    } else {
      width = height = 3 * SQUARE_SIZE;
    }
    let x = nextCanvas.width / 2 - width / 2;
    let y = nextCanvas.height / 2 - height / 2;
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // draw only occupied squares
        if (this.activeTetromino[r][c]) {
          nextContext.fillStyle = this.color;
          nextContext.fillRect(x + c * SQUARE_SIZE, y + r * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

          nextContext.strokeStyle = "#262626";
          nextContext.strokeRect(x + c * SQUARE_SIZE, y + r * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }
      }
    }
  }
  // draw next piece to the "hold" frame
  drawPieceToHoldFrame() {
    holdContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    let width, height;
    if (this.name == "I" || this.name == "O") {
      width = height = 4 * SQUARE_SIZE;
    } else {
      width = height = 3 * SQUARE_SIZE;
    }
    let x = holdCanvas.width / 2 - width / 2;
    let y = holdCanvas.height / 2 - height / 2;
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // draw only occupied squares
        if (this.activeTetromino[r][c]) {
          holdContext.fillStyle = this.color;
          holdContext.fillRect(x + c * SQUARE_SIZE, y + r * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

          holdContext.strokeStyle = "#262626";
          holdContext.strokeRect(x + c * SQUARE_SIZE, y + r * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }
      }
    }
  }

  // draw a piece to the board
  draw() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // draw only occupied squares
        if (this.activeTetromino[r][c]) {
          drawSquare(this.x + c, this.y + r, this.color);
        }
      }
    }
  }

  // undraw a piece 
  undraw() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // draw only occupied squares
        if (this.activeTetromino[r][c]) {
          drawSquare(this.x + c, this.y + r, VACANT);
        }
      }
    }
  }

  // move down the piece
  async moveDown() {
    if (disabled) {
      return;
    }
    if (this.y == -2 || this.y == -3) {
      if (!this.collides(0, 2, this.activeTetromino)) {
        this.undraw();
        this.y += 2;
        this.draw();
        clearInterval(intervalID2);
        intervalID2 = setInterval(drop, 1000);
        return;
      }
      clearInterval(intervalID2);
      intervalID2 = setInterval(drop, 1000);
    }
    if (!this.collides(0, 1, this.activeTetromino)) {
      this.undraw();
      this.y++;
      this.draw();
    } else {
      // lock the piece and generate a new one
      disabled = true;
      if (!isHardDrop) {
        await sleep(400);
      }
      if (!this.collides(0, 1, this.activeTetromino)) {
        disabled = false;
        return;
      } else {
        if (isHoldOnce) {
          isHoldOnce = false;
        }
        disabled = false;
        isHardDrop = false;
        clearInterval(intervalID2);
        intervalID2 = setInterval(drop, 1);
        this.lock();
        p = nextPiece;
        p.draw();
        nextPiece = Piece.randomPiece();
        nextPiece.drawPieceToNextFrame();
      }
    }
  }

  // move right the piece
  moveRight() {
    if (!this.collides(1, 0, this.activeTetromino)) {
      this.undraw();
      this.x++;
      this.draw();
    }
  }

  // move left the piece
  moveLeft() {
    if (!this.collides(-1, 0, this.activeTetromino)) {
      this.undraw();
      this.x--;
      this.draw();
    }
  }

  // rotate the piece
  rotateRight() {
    let next = this.tetromino[(this.pattern + 1) % this.tetromino.length];
    let kick = 0;
    if (this.collides(0, 0, next)) {
      if (this.x > COLUMN / 2) {
        kick = -1; // move the piece to the left when colliding with the right wall
      } else {
        kick = 1; // move the piece to the right when colliding with the left wall
      }
    }
    if (!this.collides(kick, 0, next)) {
      this.undraw();
      this.x += kick;
      this.pattern = (this.pattern + 1) % this.tetromino.length;
      this.activeTetromino = this.tetromino[this.pattern];
      this.draw();
    }
  }
  rotateLeft() {
    let previous = this.tetromino[this.pattern == 0 ? this.tetromino.length - 1 : this.pattern - 1];
    let kick = 0;
    if (this.collides(0, 0, previous)) {
      if (this.x > COLUMN / 2) {
        if (this.name == "I" && this.pattern == 3) {
          kick = -2;
        } else {
          kick = -1; // move the piece to the left when colliding with the right wall
        }
      } else {
        if (this.name == "I" && this.pattern == 1) {
          kick = 2;
        } else {
          kick = 1; // move the piece to the right when colliding with the left wall
        }
      }
    }
    if (!this.collides(kick, 0, previous)) {
      this.undraw();
      this.x += kick;
      this.pattern = this.pattern == 0 ? this.tetromino.length - 1 : this.pattern - 1;
      this.activeTetromino = this.tetromino[this.pattern];
      this.draw();
    }
  }

  // detect collisions
  collides(x, y, piece) {
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece.length; c++) {
        // if the square is empty, skip it
        if (!piece[r][c]) {
          continue;
        }

        // coordinates of the piece after movement
        let newX = this.x + c + x;
        let newY = this.y + r + y;

        // check if piece reaches the left, right, bottom wall
        if (newX < 0 || newX >= COLUMN || newY >= ROW) {
          return true;
        }

        if (newY < 0) {
          continue;
        }

        // check if there is a locked piece already in place
        if (board[newY][newX] != VACANT) {
          return true;
        }
      }
    }
    return false;
  }

  lock() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // skip the vacant squares
        if (!this.activeTetromino[r][c]) {
          continue;
        }
        // if the piece locks on the top, game over
        if (this.y + r < 0) {
          clearInterval(intervalID1);
          clearInterval(intervalID2);
          alert("Game over");
          return;
        }
        // lock the piece
        board[this.y + r][this.x + c] = this.color;
      }
    }
    // remove full rows
    for (let r = 0; r < ROW; r++) {
      let isRowFull = true;
      for (let c = 0; c < COLUMN; c++) {
        if (board[r][c] == VACANT) {
          isRowFull = false;
          break;
        }
      }
      if (isRowFull) {
        // move down all rows above it
        for (let y = r; y > 1; y--) {
          for (let c = 0; c < COLUMN; c++) {
            board[y][c] = board[y - 1][c];
          }
        }
        // the top row board[0][] has no row above it
        for (let c = 0; c < COLUMN; c++) {
          board[0][c] = VACANT;
        }
        // increase the score
        score += 10;
        lines++;
      }
    }
    // update the board
    drawBoard();

    // update the score 
    scoreElement.innerHTML = score;
    linesElement.innerHTML = lines;
    
  }
}
