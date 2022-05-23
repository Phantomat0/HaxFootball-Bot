export type CommandName = string;

export enum ARGUMENT_TYPES {
  PLAYER = "Player name or ID",
  PLAYER_OR_USER = "Player or user,",
  CUSTOM = "Custom",
}

export class CommandError {
  errorMsg: string;
  constructor(errorMsg: string) {
    this.errorMsg = errorMsg;
  }
}

export interface CommandPermissions {
  level: AdminLevel;
  muted: boolean;
  game: boolean;
}

export interface CommandArguments {
  skipMaxCheck?: boolean;
  min: number;
  max: number;
  types: ARGUMENT_TYPES[];
}

export interface Command {
  name: string;
  description: string;
  usage: string[];
  showCommand: boolean;
  permissions: CommandPermissions;
  arguments: CommandArguments;
  run(cmd: CommandMessage): Promise<void>;
}

const commandsMap = new Map<CommandName, Command>([]);
