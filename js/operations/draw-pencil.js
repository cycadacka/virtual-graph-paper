import Operation from './operation.js';

// Offset for taking account the anti-aliasing in caching images.
const OFFSET_X = 2;
const OFFSET_Y = 2;
const OFFSET_HALF_X = OFFSET_X / 2;
const OFFSET_HALF_Y = OFFSET_Y / 2;

class DrawPencil extends Operation {
  /**
   * Creates an instance of ArrowOperation.
   *
   * @param {import('../operation-manager.js').default} operationManager
   * @param {import('../cartesian-graph.js').default} cartesianGraph
   * @memberof ArrowOperation
   */
  constructor(operationManager, cartesianGraph) {
    super(operationManager, cartesianGraph);

    this.vertices = [];
    /** @type {null|HTMLImageElement} */
    this.cachedDrawing = null;

    this.foregroundColor = '';
    this.strokeWidth = 0;
  }

  onMousedown({ input, env }) {
    this.foregroundColor = env.foregroundColor;
    this.strokeWidth = env.strokeWidth;
    this.vertices.push({
      x: input.relativeCursorPosition.x,
      y: input.relativeCursorPosition.y,
    });
    this.render();
  }

  onMousemove({ input }) {
    const dist =
      Math.pow(
        input.relativeCursorPosition.x -
          this.vertices[this.vertices.length - 1].x,
        2
      ) +
      Math.pow(
        input.relativeCursorPosition.y -
          this.vertices[this.vertices.length - 1].y,
        2
      );

    if (
      dist >
      0.1 * (this.cartesianGraph.baseScale / this.cartesianGraph.scale)
    ) {
      if (!input.isWheelMouseDown) {
        this.vertices.push({
          x: input.relativeCursorPosition.x,
          y: input.relativeCursorPosition.y,
        });
      }

      this.operationManager.render();
      this.renderVertices(this.operationManager.context);
    }
  }

  #setBounds(x, y) {
    if (x < this.bounds.min.x) {
      this.bounds.min.x = x;
    }

    if (x > this.bounds.max.x) {
      this.bounds.max.x = x;
    }

    if (y < this.bounds.min.y) {
      this.bounds.min.y = y;
    }

    if (y > this.bounds.max.y) {
      this.bounds.max.y = y;
    }
  }

  onMouseup() {
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];

      this.#setBounds(vertex.x, vertex.y);
    }

    const strokeWidth = this.strokeWidth * 0.5;
    this.bounds.min.x -= strokeWidth;
    this.bounds.min.y -= strokeWidth;
    this.bounds.max.x += strokeWidth;
    this.bounds.max.y += strokeWidth;

    const canvas = document.createElement('canvas');
    const viewScale = this.cartesianGraph.scale;
    this.cartesianGraph.scale = this.cartesianGraph.baseScale;

    canvas.width =
      (this.bounds.max.x - this.bounds.min.x) * this.cartesianGraph.scale +
      OFFSET_X;
    canvas.height =
      (this.bounds.max.y - this.bounds.min.y) * this.cartesianGraph.scale +
      OFFSET_Y;
    const context = canvas.getContext('2d');

    context.translate(
      OFFSET_HALF_X - this.cartesianGraph.scaleUpX(this.bounds.min.x),
      OFFSET_HALF_Y - this.cartesianGraph.scaleUpY(this.bounds.max.y)
    );
    this.renderVertices(context);
    this.cartesianGraph.scale = viewScale;
    this.cachedDrawing = new Image(canvas.width, canvas.height);
    this.cachedDrawing.src = canvas.toDataURL('image/png');
    delete this.vertices;
  }

  renderVertices(context) {
    if (this.vertices.length <= 0) return;

    context.save();
    context.beginPath();

    if (this.vertices.length > 1) {
      context.moveTo(
        this.cartesianGraph.scaleUpX(this.vertices[0].x),
        this.cartesianGraph.scaleUpY(this.vertices[0].y)
      );

      let i = 1;
      for (; i < this.vertices.length - 1; i++) {
        const xc = (this.vertices[i].x + this.vertices[i + 1].x) * 0.5;
        const yc = (this.vertices[i].y + this.vertices[i + 1].y) * 0.5;

        context.quadraticCurveTo(
          this.cartesianGraph.scaleUpX(this.vertices[i].x),
          this.cartesianGraph.scaleUpY(this.vertices[i].y),
          this.cartesianGraph.scaleUpX(xc),
          this.cartesianGraph.scaleUpY(yc)
        );
      }

      context.lineCap = 'round';
      context.strokeStyle = this.foregroundColor;
      context.lineWidth = this.strokeWidth * this.cartesianGraph.scale;
      context.stroke();
    } else {
      context.fillStyle = this.foregroundColor;

      context.arc(
        this.cartesianGraph.scaleUpX(this.vertices[0].x),
        this.cartesianGraph.scaleUpY(this.vertices[0].y),
        (this.strokeWidth * this.cartesianGraph.scale) / 2,
        0,
        2 * Math.PI
      );

      context.fill();
    }

    context.restore();
  }

  render() {
    if (this.vertices) {
      this.renderVertices(this.operationManager.context);
    } else if (
      this.cachedDrawing.complete &&
      this.cachedDrawing.src.length > 0
    ) {
      const minX = this.cartesianGraph.scaleUpX(this.bounds.min.x);
      const maxY = this.cartesianGraph.scaleUpY(this.bounds.max.y);
      const multi = this.cartesianGraph.scale / this.cartesianGraph.baseScale;

      this.operationManager.context.imageSmoothingEnabled = false;
      this.operationManager.context.drawImage(
        this.cachedDrawing,
        minX - OFFSET_HALF_X * multi,
        maxY - OFFSET_HALF_Y * multi,
        this.cartesianGraph.scaleUpX(this.bounds.max.x) -
          minX +
          OFFSET_X * multi,
        this.cartesianGraph.scaleUpY(this.bounds.min.y) -
          maxY +
          OFFSET_Y * multi
      );
    }
  }
}

export default DrawPencil;
