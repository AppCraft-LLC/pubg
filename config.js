

const cfg_sources = [
        "br_enigma.js",
        "br_barber.js",
        "br_edmund.js",
        "br_pacifist.js"
      ],
      shuffleBrains = false;


const creatureMaxLives = [100.0, 150.0, 250.0],
      creatureMaxEnergy = [100.0, 150.0, 250.0],

      maxAliveCreatures = 3,
      killsToLevelUp = [2, 4],

      creatureMaxBullets = [3, 4, 5],
      bulletDamage = 10,
      livesPerEatenBullet = 40,

      // Energy costs of actions
      moveEnergyCost = 1.0,
      shotEnergyCost = 10,
      jumpEnergyCost = 30,
      eatBulletEnergyCost = 60,

      // Energy refill speed
      energyRefillPerTick = 0.8,
      bulletsGeneratorFrequencyPerCreature = 5,

      obstaclesDensity = 130, // 1 obj per N square kilopixels (default 33)

      // Messaging
      messageLineLimit = 20, 
      messageShowTime = 3 * 1000,

      // Spells
      invisibleEnergyCost = 100,
      invisibleDuration = 80,

      invulnerableEnergyCost = 100,
      invulnerableDuration = 80,

      magnetEnergyCost = 100,
      magnetDuration = 5,

      poisonerEnergyCost = 100,
      poisonerDuration = 80,
      poisonDuration = 50,
      poisonHurt = 1,

      guttaperchaEnergyCost = 100,
      guttaperchaDuration = 80,
      guttaperchaRestitution = 0.95,
      guttaperchaAirFriction = 0.001;

      vampireEnergyCost = 100,
      vampireDistance = 120,

      telekinesisEnergyCost = 2.0,
      telekinesisForce = 0.05,

      subzeroEnergyCost = 100,
      subzeroDuration = 80,
      freezeDuration = 30;
