import { Position } from "./Tower";

export interface Enemy {
  id: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  position: Position;
  speed: number;
  reward: number;
  damage: number; // damage to base if it reaches the end
  abilities: EnemyAbility[];
  effects: EnemyEffect[];
  path: Position[];
  pathIndex: number;
  createdAt: Date;
}

export type EnemyType = "basic" | "fast" | "tank" | "healer" | "boss";

export type EnemyAbility = "heal" | "speed" | "spawn" | "shield" | "regen";

export interface EnemyEffect {
  type: "slow" | "damage-over-time" | "stun";
  duration: number; // in milliseconds
  endTime: number; // timestamp when the effect ends
  factor: number; // slow factor or damage per tick
  sourceId: string; // tower ID that applied the effect
}
