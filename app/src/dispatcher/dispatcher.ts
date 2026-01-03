// FLUX Dispatcher base para React/Next.js
// Simples implementação baseada no padrão Facebook FLUX

type Callback<T = unknown> = (payload: T) => void;

class Dispatcher<T = unknown> {
  private callbacks: { [id: string]: Callback<T> } = {};
  private lastId = 1;

  register(callback: Callback<T>): string {
    const id = `ID_${this.lastId++}`;
    this.callbacks[id] = callback;
    return id;
  }

  unregister(id: string) {
    delete this.callbacks[id];
  }

  dispatch(payload: T) {
    Object.values(this.callbacks).forEach(cb => cb(payload));
  }
}

const dispatcher = new Dispatcher();
export default dispatcher;
