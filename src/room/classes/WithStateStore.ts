import Chat from "../roomStructures/Chat";

export default class WithStateStore<T extends string> {
  private _stateStore: { [key in T]: any } = {} as { [key in T]: any };

  /**
   * Set state
   */
  setState(state: T, value: any = true) {
    Chat.send(`StateChange: ${state}`);
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
   * Checks if the state is plotted, regardless of value
   */
  checkIfStateExists(state: string) {
    return this._stateStore.hasOwnProperty(state);
  }

  /**
   * Clears all state keys
   */
  clearState() {
    this._stateStore = {} as { [key in T]: any };
  }

  /**
   * Reads all state
   */
  readAllState() {
    return this._stateStore;
  }
}
