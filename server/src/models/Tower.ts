export interface Tower {
  id: string;
  type: TowerType;
  playerId: string;
  position: Position;
  level: number;
  attributes: TowerAttributes;
  target?: string; // Enemy ID
  lastAttackTime: number;
  createdAt: Date;
}

export interface Position {
  x: number;
  y: number;
}

export type TowerType = "basic" | "sniper" | "splash" | "slow" | "money";

export interface TowerAttributes {
  range: number;
  damage: number;
  cooldown: number; // in milliseconds
  splashRadius?: number;
  slowFactor?: number; // for slow tower
  moneyBonus?: number; // for money tower
  cost: number;
  upgradeCost: number;
}
