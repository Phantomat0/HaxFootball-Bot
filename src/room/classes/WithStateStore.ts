import { SHOW_DEBUG_CHAT } from "../roomConfig";
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
    this._stateStore[state] = value;

    if (SHOW_DEBUG_CHAT) {
      Chat.send(`StateChange: ${state}`);
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
        `State: ${state} was not found using the getState method. Only use getState when the state is defined, use stateExists to check if a state exists `
      );
    return this._stateStore[state] as unknown as T[K];
  }

  deleteState<K extends keyof T>(state: K) {
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
