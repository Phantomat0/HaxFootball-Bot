import Player from "../classes/Player";
import { CommandError } from "../commands/CommandHandler";
import Room from "../roomStructures/Room";
import { TEAM_OBJ } from "../utils/types";

type ArrayElementOrValue<T> = T extends readonly any[]
  ? T[number] extends ParamParser<unknown>
    ? ReturnType<T[number]["parse"]>
    : T[number]
  : T;

type ParamParserType =
  | "any"
  | "or"
  | "string"
  | "integer"
  | "float"
  | "enum"
  | "team"
  | "player";

type DataCheckName = "positive" | "min" | "max";

interface DataCheck {
  name: DataCheckName;
  value?: any;
}

export default class ParamParser<T, R = false> {
  protected _checks: DataCheck[] = [];
  protected _dataName: string | undefined;
  type: ParamParserType;
  _dataType: T;
  isOptional = false;
  constructor(
    dataType: T,
    type: ParamParserType,
    dataName: string | undefined
  ) {
    this._dataType = dataType;
    this._dataName = dataName;
    this.type = type;
  }

  /**
   * Returns the data name, or the data type if data name not defined.
   * ONLY USED IN COMMAND HANDLER
   */
  get dataName() {
    if (this._dataName) return this._dataName.toLowerCase();
    if (Array.isArray(this._dataType) && typeof this._dataType[0] === "string")
      return this._dataType.join(", ");
    return this._dataType;
  }

  private _throwWithDataName(str: string, dataName: string) {
    throw new CommandError(
      `${this._dataName ? this._dataName : dataName} ${str}`
    );
  }

  private _throwNumberError() {
    const mustPositive = this._checks.find(
      (check) => check.name === "positive"
    );
    const mustMin = this._checks.find((check) => check.name === "min");
    const mustMax = this._checks.find((check) => check.name === "max");

    const intOrDecimal = this.type === "float" ? "decimal" : "integer";
    const maybePositiveNumber = mustPositive ? " positive " : " ";
    const betweenMinAndMax =
      mustMin && mustMax
        ? `between ${mustMin.value} and ${mustMax.value}`
        : mustMin
        ? `greater than ${mustMin.value}`
        : mustMax
        ? `less than ${mustMax!.value}`
        : "";

    this._throwWithDataName(
      `must be a${maybePositiveNumber}${intOrDecimal} ${betweenMinAndMax}`,
      "Number"
    );
  }

  private _parseOr(this: ParamParser<ParamParser<unknown>[]>, data: string) {
    const orResults = this._dataType.map((paramParser) => {
      try {
        paramParser.parse(data);
      } catch (e) {
        console.log(e);
        return false;
      }
      return true;
    });

    const firstParamThatSatisfiedIndex = orResults.findIndex(
      (paramParseResult) => paramParseResult === true
    );

    // If none of the param parser parse correctly, then throw an error
    // Data name is always an error message for or
    if (firstParamThatSatisfiedIndex === -1)
      throw new CommandError(this._dataName as string);

    // If one of them parsed well, return that one
    return this._dataType[firstParamThatSatisfiedIndex].parse(data);
  }

  /**
   * This also incorporates min and max
   */
  private _parseNumber(data: string) {
    const isNumber = (value: string | number): value is number => {
      return Number.isNaN(Number(value)) === false;
    };

    const isNumberWhenParsed = isNumber(data);

    if (!isNumberWhenParsed)
      this._throwWithDataName("must be a number", "Number");

    const dataAsNumber = Number(data);

    for (const check of this._checks) {
      if (check.name === "positive") {
        if (dataAsNumber < 0) this._throwNumberError();
      }

      if (check.name === "min") {
        if (dataAsNumber < check.value) this._throwNumberError();
      }

      if (check.name === "max") {
        if (dataAsNumber > check.value) this._throwNumberError();
      }
    }

    return dataAsNumber;
  }

  private _parseInteger(data: string) {
    const dataAsNumber = this._parseNumber(data);

    console.log("AS NUMBER", dataAsNumber);

    const isFloat =
      Number.isInteger(dataAsNumber) === false && Number.isFinite(dataAsNumber);

    if (isFloat) this._throwWithDataName("must be an integer", "Number");

    console.log(isFloat);

    return dataAsNumber;
  }

  private _parseFloat(data: string) {
    const dataAsNumber = this._parseNumber(data);

    const isInt =
      Number.isInteger(dataAsNumber) && Number.isFinite(dataAsNumber);

    if (!isInt) this._throwWithDataName("must be an integer", "Number");

    return dataAsNumber;
  }

  private _parseEnum(this: ParamParser<readonly string[]>, data: string) {
    const isInEnum = this._dataType.includes(data);
    if (!isInEnum)
      this._throwWithDataName(
        `must be one of the following: [${this._dataType.join(", ")}]`,
        "Option"
      );

    return data;
  }

  private _parseTeam(data: string): any {
    const TEAM_NAME_PARAM = ["blue", "b", "red", "r"] as const;

    if (data === "blue" || data === "b") return TEAM_OBJ.BLUE;
    if (data === "red" || data === "r") return TEAM_OBJ.RED;

    this._throwWithDataName(
      `must be one of the following: [${TEAM_NAME_PARAM.join(", ")}]`,
      "Team"
    );
  }

  private _parsePlayer(playerName: string) {
    const player = Room.players.getByName(playerName);

    if (player === null)
      throw new CommandError(`Player ${playerName} does not exist in the room`);

    if (player === -1)
      throw new CommandError(
        `Multiple players were found starting with the name ${playerName} in the room`
      );

    return player;
  }

  optional() {
    this.isOptional = true;
    return this as unknown as ParamParser<T, true>;
  }

  parse<K extends string | undefined>(
    this: ParamParser<any, false>,
    data: K
  ): R extends true
    ? ArrayElementOrValue<T> | undefined
    : ArrayElementOrValue<T> {
    // Check if undefined when not marked optional
    if (!data) {
      if (this.isOptional) return undefined as ArrayElementOrValue<T>;
      throw new CommandError("Requires a parameter");
    }

    if (this.type === "or")
      return this._parseOr(data) as ArrayElementOrValue<T>;

    if (this.type === "string") return data as ArrayElementOrValue<T>;

    if (this.type === "integer")
      return this._parseInteger(data) as ArrayElementOrValue<T>;

    if (this.type === "float")
      return this._parseFloat(data) as ArrayElementOrValue<T>;

    if (this.type === "enum")
      return this._parseEnum(data) as ArrayElementOrValue<T>;

    if (this.type === "team")
      return this._parseTeam(data) as ArrayElementOrValue<T>;

    if (this.type === "player")
      return this._parsePlayer(data) as ArrayElementOrValue<T>;

    return data as ArrayElementOrValue<T>;
  }
}

class NumberParamParser<T> extends ParamParser<T> {
  min(min: number) {
    this._checks.push({ name: "min", value: min });
    return this;
  }

  max(max: number) {
    this._checks.push({ name: "max", value: max });
    return this;
  }

  positive() {
    this._checks.push({ name: "positive", value: true });
    return this;
  }
}

export class z {
  /**
   * Any string value, no validation
   */
  static any(name?: string) {
    return new ParamParser(String(), "any", name);
  }

  /**
   * Must be a float when parsed
   */
  static float(name?: string) {
    return new NumberParamParser(Number(), "float", name);
  }

  /**
   * Must be an integer when parsed
   */
  static integer(name?: string) {
    return new NumberParamParser(Number(), "integer", name);
  }

  /**
   * Must be an enum when parsed
   */
  static enum<K extends readonly string[]>(arr: K, name?: string) {
    return new ParamParser(arr, "enum", name);
  }

  /**
   * Can be multiple values
   */
  static or<K extends readonly any[]>(unionArr: K, errorMsg: string) {
    return new ParamParser(unionArr, "or", errorMsg);
  }

  /**
   * A string value, but will return the rest of the command params
   * Useful when we need text with spaces
   */
  static string(name?: string) {
    return new ParamParser(String(), "string", name);
  }

  /**
   * Must be a player name, will be a player when parsed
   */
  static player(name?: string) {
    return new ParamParser(Player.prototype, "player", name);
  }

  /**
   * Must be a valid team name, will be a teamObj when parsed
   */
  static team() {
    return new ParamParser(
      [TEAM_OBJ.RED, TEAM_OBJ.BLUE] as const,
      "team",
      "Team"
    );
  }
}
