import Operation from './operation.js';

class PencilDraw extends Operation {
  /**
   * Creates an instance of ArrowOperation.
   *
   * @param {import('../operation-history.js').default} operationManager
   * @param {import('../cartesian-graph.js').default} cartesianGraph
   * @memberof ArrowOperation
   */
  constructor(operationManager, cartesianGraph) {
    super(operationManager, cartesianGraph);

    this.strokeWidth = 0;
    this.vertices = [];
  }

  mousedown({ input, env }) {
    super.mousedown.call(this);

    this.strokeWidth = env.getStrokeWidth();
    this.vertices.push([
      input.relativeCursorPosition.x,
      input.relativeCursorPosition.y,
    ]);
  }

  mousemove({ input }) {
    super.mousemove.call(this);

    const dist =
      Math.pow(
        input.relativeCursorPosition.x -
          this.vertices[this.vertices.length - 1][0],
        2
      ) +
      Math.pow(
        input.relativeCursorPosition.y -
          this.vertices[this.vertices.length - 1][1],
        2
      );
    if (dist > 0.25 * 0.25) {
      if (!input.isWheelMouseDown) {
        this.vertices.push([
          input.relativeCursorPosition.x,
          input.relativeCursorPosition.y,
        ]);
      }

      this.operationManager.render();
      const context = this.operationManager.context;
      context.beginPath();
      context.moveTo(
        this.cartesianGraph.scaleUpX(this.vertices[0][0]),
        this.cartesianGraph.scaleUpY(this.vertices[0][1])
      );
      for (let i = 1; i < this.vertices.length; i++) {
        context.lineTo(
          this.cartesianGraph.scaleUpX(this.vertices[i][0]),
          this.cartesianGraph.scaleUpY(this.vertices[i][1])
        );
      }
      context.lineWidth = this.strokeWidth;
      context.stroke();
    }
  }

  mouseup() {
    super.mouseup.call(this);
  }

  render() {
    super.render.call(this);
    const context = this.operationManager.context;
    if (this.vertices.length > 0) {
      context.beginPath();
      context.moveTo(
        this.cartesianGraph.scaleUpX(this.vertices[0][0]),
        this.cartesianGraph.scaleUpY(this.vertices[0][1])
      );
      for (let i = 1; i < this.vertices.length; i++) {
        context.lineTo(
          this.cartesianGraph.scaleUpX(this.vertices[i][0]),
          this.cartesianGraph.scaleUpY(this.vertices[i][1])
        );
      }
      context.lineWidth = this.strokeWidth;
      context.stroke();
    }
  }
}

export default PencilDraw;
