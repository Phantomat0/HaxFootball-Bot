export default class WithStateStore<T extends string> {
  private _stateStore: { [key in T]: any } = {} as { [key in T]: any };

  /**
   * Set state
   */
  setState(state: T, value: any = true) {
    this._stateStore[state] = value;
  }

  /**
   * Get state
   * @returns state
   */
  getState(state: T) {
    return this._stateStore[state];
  }

  /**
   * Get state without using the provided state types for this store
   */
  getStateUnsafe(state: string) {
    return this._stateStore[state];
  }

  /**
   * Clears all state keys
   */
  clearState() {
    this._stateStore = {} as { [key in T]: any };
  }
}
