import { Enemy, EnemyEffect, Game, Position, Tower } from "@shared/types";

export class AttackService {
  /**
   * Process attacks for all towers in the game
   */
  processAttacks(game: Game): {
    damagedEnemies: Enemy[];
    defeatedEnemies: Enemy[];
  } {
    const now = Date.now();
    const damagedEnemies: Enemy[] = [];
    const defeatedEnemiesList: Enemy[] = []; // Renamed to avoid conflict with return object property

    if (!game.enemies || game.enemies.length === 0) {
      return { damagedEnemies, defeatedEnemies: defeatedEnemiesList };
    }

    // Debug info - how many towers and enemies
    console.log(
      `Processing attacks for ${game.towers.length} towers against ${game.enemies.length} enemies`
    );

    // Process each tower's attack
    game.towers.forEach((tower) => {
      // Check if tower can attack (cooldown expired)
      const cooldownExpired =
        now - tower.lastAttackTime >= tower.attributes.cooldown;

      if (cooldownExpired) {
        const target = this.findTarget(tower, game.enemies);

        // If a target is found, process the attack
        if (target) {
          console.log(
            `Tower ${tower.id} (${tower.type}, lvl ${tower.level}) found target ${target.id} (health: ${target.health})`
          );
          const attackResult = this.attackEnemy(tower, target, game);

          // Update tower's last attack time
          tower.lastAttackTime = now;
          tower.target = target.id; // Target is updated/cleared in findTarget or if target is defeated

          // If enemy was damaged and is still alive, update it in the main list
          if (attackResult.damaged && attackResult.enemy.health > 0) {
            const index = game.enemies.findIndex(
              (e) => e.id === attackResult.enemy.id
            );
            if (index !== -1) {
              game.enemies[index] = attackResult.enemy;
            }
            if (!damagedEnemies.find((de) => de.id === attackResult.enemy.id)) {
              damagedEnemies.push(attackResult.enemy);
            }
          }

          // If enemy was defeated, add to defeatedEnemiesList for later removal
          if (attackResult.defeated) {
            console.log("enemy defeated:", attackResult.enemy.id);
            if (
              !defeatedEnemiesList.find((de) => de.id === attackResult.enemy.id)
            ) {
              defeatedEnemiesList.push(attackResult.enemy);
            }
            // Clear tower's target if it was the defeated enemy
            if (tower.target === attackResult.enemy.id) {
              tower.target = undefined;
            }
          }
        } else {
          // No target found, clear the tower's target
          tower.target = undefined;
        }
      }
    });

    // Remove defeated enemies from the game
    // and ensure they are correctly marked in the defeatedEnemiesList
    const trulyDefeatedIds = new Set(defeatedEnemiesList.map((e) => e.id));
    game.enemies = game.enemies.filter((enemy) => {
      if (enemy.health <= 0) {
        trulyDefeatedIds.add(enemy.id);
        return false; // Remove from game.enemies
      }
      return true;
    });

    // Construct the final defeatedEnemies array based on trulyDefeatedIds
    const finalDefeatedEnemies = Array.from(trulyDefeatedIds)
      .map(
        (id) =>
          defeatedEnemiesList.find((e) => e.id === id) ||
          game.enemies.find((e) => e.id === id) || // Should not happen if logic is correct
          ({ id, health: 0 } as Enemy) // Fallback, though ideally all info is present
      )
      .filter((e) => e && e.id !== undefined) as Enemy[];

    return { damagedEnemies, defeatedEnemies: finalDefeatedEnemies };
  }
  /**
   * Find a valid target for a tower
   */
  private findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
    // Filter enemies that are within range
    const enemiesInRange = enemies.filter(
      (enemy) =>
        enemy.health > 0 &&
        this.isInRange(tower.position, enemy.position, tower.attributes.range)
    );

    if (enemiesInRange.length === 0) {
      return null;
    }

    // If tower already has a target that's still in range and alive, keep targeting it
    if (tower.target) {
      const currentTarget = enemies.find(
        (e) => e.id === tower.target && e.health > 0
      );
      if (
        currentTarget &&
        this.isInRange(
          tower.position,
          currentTarget.position,
          tower.attributes.range
        )
      ) {
        return currentTarget;
      }
    }

    // Target priority: closest to the end of the path (highest pathIndex)
    const target = enemiesInRange.reduce(
      (closest, enemy) =>
        enemy.pathIndex > closest.pathIndex ? enemy : closest,
      enemiesInRange[0]
    );

    // Log target information for debugging
    if (target) {
      const dx = tower.position.x - target.position.x;
      const dy = tower.position.y - target.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      console.log(
        `Tower ${tower.id} (${tower.type}) targeting enemy ${
          target.id
        }. Distance: ${distance.toFixed(2)}, Range: ${tower.attributes.range}`
      );
    }

    return target;
  }

  /**
   * Check if a position is within range of a tower
   */ private isInRange(
    towerPos: Position,
    enemyPos: Position,
    range: number
  ): boolean {
    // Calculate distance using Pythagorean theorem
    const dx = towerPos.x - enemyPos.x;
    const dy = towerPos.y - enemyPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Add some extra area of effect radius based on tower type
    // The tower types are determined when calling this function with tower.attributes.range
    // A higher range generally indicates a sniper tower, while a lower range indicates splash damage
    let aoeBonus = 0;

    // This gives all towers a small area of effect, making them more forgiving to hit
    if (range <= 2.5) {
      // Splash/short range towers get a bigger bonus
      aoeBonus = 0.5;
    } else if (range <= 3.5) {
      // Medium range towers
      aoeBonus = 0.3;
    } else {
      // Long range towers (snipers)
      aoeBonus = 0.2;
    }

    // Make it easier to hit enemies
    return distance <= range + aoeBonus;
  }
  /**
   * Process a tower's attack against an enemy
   */
  private attackEnemy(
    tower: Tower,
    enemy: Enemy,
    game: Game
  ): {
    enemy: Enemy;
    damaged: boolean;
    defeated: boolean;
  } {
    let damage = tower.attributes.damage;
    let damaged = false;
    let defeated = false;

    // Apply damage - ensure we actually reduce health
    if (damage > 0) {
      enemy.health -= damage;
      damaged = true;
    }

    // Apply special effects based on tower type
    switch (tower.type) {
      case "splash":
        // Find and damage enemies within splash radius
        if (tower.attributes.splashRadius) {
          game.enemies.forEach((otherEnemy) => {
            if (
              otherEnemy.id !== enemy.id &&
              otherEnemy.health > 0 &&
              this.isInRange(
                enemy.position,
                otherEnemy.position,
                tower.attributes.splashRadius!
              )
            ) {
              // Make sure splash damage is applied
              const splashDamage = damage * 0.5;
              otherEnemy.health -= splashDamage;

              console.log(
                `Splash damage: ${splashDamage} applied to enemy ${otherEnemy.id}. Health now: ${otherEnemy.health}`
              );

              // Check if other enemy was defeated
              if (otherEnemy.health <= 0) {
                otherEnemy.health = 0;
                // Add money to the player who owns the tower
                this.addReward(game, tower.playerId, otherEnemy, tower);
              }
            }
          });
        }
        break;

      case "slow":
        // Apply slow effect
        if (tower.attributes.slowFactor) {
          const slowEffect: EnemyEffect = {
            type: "slow",
            duration: 3000, // 3 seconds slow effect
            endTime: Date.now() + 3000,
            factor: tower.attributes.slowFactor,
            sourceId: tower.id,
          };

          // Remove any existing slow effects from the same tower
          enemy.effects = enemy.effects.filter(
            (effect) =>
              !(effect.type === "slow" && effect.sourceId === tower.id)
          );

          // Add new slow effect
          enemy.effects.push(slowEffect);
        }
        break;
    }

    // Add debug logging to see damage being applied
    console.log(
      `Tower ${tower.id} (${tower.type}) attacked enemy ${enemy.id}. Damage: ${damage}, Enemy health: ${enemy.health}`
    );

    // Check if enemy is defeated
    if (enemy.health <= 0) {
      enemy.health = 0;
      defeated = true;

      console.log(`Enemy ${enemy.id} defeated by tower ${tower.id}!`);

      // Add money to the player who owns the tower
      this.addReward(game, tower.playerId, enemy, tower);
    }

    return { enemy, damaged, defeated };
  }

  /**
   * Add reward money to the player when an enemy is defeated
   */
  private addReward(
    game: Game,
    playerId: string,
    enemy: Enemy,
    tower: Tower
  ): void {
    // Calculate reward amount (apply money tower bonus if applicable)
    let rewardAmount = enemy.reward;
    if (tower.type === "money" && tower.attributes.moneyBonus) {
      rewardAmount = Math.floor(
        rewardAmount * (1 + tower.attributes.moneyBonus)
      );
    }

    // Add money to player
    if (!game.money[playerId]) {
      game.money[playerId] = 0;
    }
    game.money[playerId] += rewardAmount;

    // Update player statistics if we later implement them
    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      player.money += rewardAmount;
      if (player.statistics) {
        player.statistics.enemiesDefeated =
          (player.statistics.enemiesDefeated || 0) + 1;
        player.statistics.moneyEarned =
          (player.statistics.moneyEarned || 0) + rewardAmount;
      }
    }
  }
}
