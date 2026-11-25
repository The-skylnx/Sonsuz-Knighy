export class ObjectPool {
  constructor(createFn, resetFn = null, initialSize = 0, maxActive = Infinity) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxActive = maxActive;
    this.free = [];
    this.active = [];

    for (let i = 0; i < initialSize; i++) {
      const item = this.createFn();
      this.free.push(item);
    }
  }

  get activeCount() {
    return this.active.length;
  }

  acquire(...args) {
    if (this.active.length >= this.maxActive) {
      return null;
    }

    const item = this.free.length > 0 ? this.free.pop() : this.createFn();
    this.active.push(item);

    if (this.resetFn) {
      this.resetFn(item, ...args);
    }

    return item;
  }

  release(item) {
    const idx = this.active.indexOf(item);
    if (idx === -1) {
      return;
    }

    const last = this.active.pop();
    if (idx < this.active.length) {
      this.active[idx] = last;
    }

    this.free.push(item);
  }

  forEachActive(callback) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      callback(this.active[i]);
    }
  }
}
