import { DEBUG_MODE } from "../room.config";
import Chat from "../roomStructures/Chat";

/**
 * Class allowing for managing state
 */
export default class WithStateStore<
  T extends Record<string, any>,
  R extends string
> {
  private _stateStore: Partial<T> = {};

  /**
   * Set state
   */
  setState<K extends keyof T>(state: K, value: T[K] = true as unknown as T[K]) {
    this._stateStore[state] = value;
    if (DEBUG_MODE) {
      Chat.send(`StateChange: ${String(state)}`, { color: 0xffef5c });
    }
  }

  /**
   * Get state
   * @returns state, throws an error if that state has not been defined yet
   */
  getState<K extends keyof T>(state: K): T[K] {
    const stateValue = this._stateStore[state];
    if (typeof stateValue === "undefined")
      throw Error(
        `State: ${String(
          state
        )} was not found using the getState method. Only use getState when the state is defined, use stateExists to check if a state exists `
      );
    return this._stateStore[state] as unknown as T[K];
  }

  deleteState<K extends keyof T>(state: K) {
    if (DEBUG_MODE) {
      Chat.send(`State delete: ${String(state)}`, { color: 0xffef5c });
    }
    delete this._stateStore[state];
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
