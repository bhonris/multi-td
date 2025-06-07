# Multiplayer Web-Based Tower Defense Game

A multiplayer web-based typescript Tower Defense Game.
This project is designed to be a full-stack application with a React frontend and a Node (typescript) backend, utilizing WebSockets for real-time multiplayer functionality. The game will allow players to build towers, defend against waves of enemies, and compete against each other.

## Features

- **Multiplayer Support**: Real-time multiplayer functionality using WebSockets.
- **Tower Building**: Players can build various types of towers with different attributes.
- **Enemy Waves**: Enemies spawn in waves, increasing in difficulty.
- **Leaderboard**: Track player scores and display a leaderboard.
- **Web-Based**: Accessible through web browsers, no downloads required.

## Technologies Used

- **Frontend**: React, TypeScript, Redux (for state management), WebSockets.
- **Backend**: Node.js, TypeScript, Express, WebSocket.

## Project Structure

```
/tower-defense
  /client
    /src
      /components
      /hooks
      /pages
      /styles
      /utils
    /public
  /server
    /src
      /controllers
      /models
      /routes
      /services
    /tests
  /docker
    /client
      Dockerfile
    /server
      Dockerfile
  docker-compose.yml
```

## Game Design

### Game Mechanics

- **Base Health**: All players share a base that has a certain amount of health. If the base health reaches zero, the game ends.
- **Money**: Players earn money by defeating enemies, which can be used to build and upgrade towers.
- **Towers**: Players can build towers to defend against waves of enemies. Each tower has unique attributes such as range, damage, and cooldown.
- **Enemies**: Enemies spawn in waves and move towards the player's base. Players must strategically place towers to defeat these enemies before they reach the base.
- At the start of each wave, enemies will spawn from the left side of the map and move towards the right side. If an enemy reaches the right side, the base loses a life.
- **Waves**: Enemies will spawn in waves, with each wave increasing in difficulty. Players must work together to defeat these waves.
- **Bosses**: At the end of each level, a boss enemy will spawn. The boss will have significantly higher health and damage, requiring players to work together to defeat it.

### Towers

Each tower type has the following unique attributes:

- **Range**: The distance the tower can attack enemies.
- **Damage**: The amount of damage dealt to enemies.
- **Cooldown**: The time between attacks.
- **Splash Damage**: Some towers can deal damage to multiple enemies in a radius.
- **Cost**: The cost to build the tower, players can earn cash to spend on towers by defeating enemies.
- **Upgrading Tree**: Players can upgrade towers to increase their attributes, such as damage, range, and cooldown.

### Enemies

Enemies will have varying attributes:

- **Health**: The amount of damage the enemy can take before being defeated.
- **Speed**: How fast the enemy moves towards the player's base.
- **Size**: The size of the enemy
- **Unique Abilities**: Some enemies may have special abilities, such as healing other enemies or being resistant to certain types of damage.

### Waves

Enemies will spawn in waves, with each wave increasing in difficulty. Players must strategically build and upgrade their towers to defend against these waves.

### Boss

At the end of each level, a boss enemy will spawn. The boss will have significantly higher health and damage, requiring players to work together to defeat it.

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/td-vibe.git
   cd td-vibe
   ```

2. Install dependencies for both client and server:

   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

### Running the Game

#### Development Mode

1. Start the server:

   ```bash
   # From the root directory
   npm run server
   ```

2. In a separate terminal, start the client:

   ```bash
   # From the root directory
   npm run client
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

#### Using Docker

1. Build and run the containers:

   ```bash
   # From the root directory
   docker-compose up --build
   ```

2. Access the game in your browser:
   ```
   http://localhost:3000
   ```

### Gameplay Instructions

1. Register a new account or log in to an existing one
2. Create a new game or join an existing one from the lobby
3. Wait for all players to ready up
4. Once the game starts:

   - Use the grid to place towers strategically along the enemy path
   - Click on a tower type in the control panel, then click on the grid to place it
   - Upgrade towers by selecting them and clicking the upgrade button
   - Defeat enemies to earn money for more towers and upgrades
   - Work together with other players to defend your base

5. The game ends when either:
   - The base health reaches zero (defeat)
   - All waves are successfully cleared (victory)
