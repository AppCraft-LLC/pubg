
const cfg_sources = [
    "br_enigma.js",
    "br_barber.js",
    "br_pacifist.js",
    "br_edmund.js"
];

const creatureMaxLives = [100.0, 150.0, 250.0],
      creatureMaxEnergy = [100.0, 150.0, 250.0],

      maxAliveCreatures = 3,
      killsToLevelUp = [2, 4],

      creatureMaxBullets = 3,
      bulletDamage = 10,
      livesPerEatenBullet = 40,

      // Energy costs of actions
      moveEnergyCost = 1.0,
      shotEnergyCost = 10,
      jumpEnergyCost = 30,
      eatBulletEnergyCost = 60,

      // Energy refill speed
      energyRefillPerTick = 0.8,
      bulletsGeneratorFrequency = 90,

      obstaclesDensity = 130, // 1 obj per N square kilopixels (default 33)

      // Messaging
      messageLineLimit = 20, 
      messageShowTime = 3 * 1000;



