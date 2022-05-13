import Chat from "../roomStructures/Chat";

interface StateStoreType {
  [key: string]: any;
}

export default class WithStateStore<
  T extends StateStoreType,
  R extends string
> {
  private _stateStore: Partial<T> = {};

  /**
   * Set state
   */
  //@ts-ignore
  setState<K extends keyof T>(state: K, value: T[K] = true) {
    Chat.send(`StateChange: ${state}`);
    this._stateStore[state] = value;
  }

  /**
   * Get state
   * @returns state
   */
  getState<K extends keyof T>(state: K): T[K] {
    return this._stateStore[state] as unknown as T[K];
  }

  /**
   * Checks if the state is plotted, regardless of value
   */
  stateExists<K extends keyof T>(state: K): boolean {
    return this._stateStore.hasOwnProperty(state);
  }

  /**
   * Checks if the state is plotted, regardless of value, but does not use the classes native storage
   */
  stateExistsUnsafe(state: R): boolean {
    return this._stateStore.hasOwnProperty(state);
  }

  /**
   * Clears all state keys
   */
  clearState() {
    this._stateStore = {};
  }

  /**
   * Reads all state
   */
  readAllState() {
    return this._stateStore;
  }
}