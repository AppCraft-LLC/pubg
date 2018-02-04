//
//  Programmer Unknown's BattleGround
//  Config
//  Please read documentation at http://appcraft.pro/pubg/docs/
//

      // List here all brains your want to fight in necessary order
const cfg_sources = [
        "br_edmund.js",
        "br_bulletbull.js",
        "br_dexter.js",
        "br_enigma.js",
        "br_mindblast.js",
        "br_rathorn.js",
        "br_reptile.js",
        "br_pacifist.js",
        "br_derzkyi.js",
        "br_utilizator.js",
        "br_yssysin.js",
        "br_helltrain.js",
        "br_niloultet.js",
        "br_prosucc.js"
      ],
      // If true, specified order will be ignored,
      // brains will be summoned in random order
      shuffleBrains = true;


      // Max lives, energy & bullets for 0-2 levels of creatures
const creatureMaxLives = [100.0, 150.0, 250.0],
      creatureMaxEnergy = [100.0, 150.0, 250.0],
      creatureMaxBullets = [3, 4, 5],

      // How many enemies a creature must kill to get next level
      killsToLevelUp = [2, 4],

      // Max possible amount of creatures fighting on the battlegound simultaneously
      maxAliveCreatures = 4,

      // Damage of a bullet
      bulletDamage = 10,

      // Amount of lives bullet gives if it's eaten
      livesPerEatenBullet = 40,

      // Energy costs of actions
      moveEnergyCost = 1.0,
      shotEnergyCost = 10,
      jumpEnergyCost = 30,
      eatBulletEnergyCost = 60,

      // Energy refill speed
      energyRefillPerTick = 0.8,

      // Greater value - bullets appears faster
      // Less value - bullets appears slower
      bulletsGeneratorFrequencyPerCreature = 5,

      // How many obstacles should be generated
      // 1 obj per N square kilopixels
      // E.g. if values is 130 and the ground has size 1024x768
      // then 786432(1024x768) / [130] * 1000 = 6 objects will be generated
      // Greater value – less obstacles
      // Less value - more obstacles
      obstaclesDensity = 100,

      // Dynamites will appear with this probability
      // Set it to 0 to play without dynamites
      dynamitesProbability = 0.15,

      // Stars will appear from broken obstacles with this probability
      // Set it to 0 to play whithout stars
      starsProbability = 0.8,

      // Chars limit in one line of a message
      // Max 2 lines allowed
      messageLineLimit = 20, 
      
      // How long a message should be displayed
      messageShowTime = 3 * 1000,

      // Energy costs, duration (in ticks) and other params of the spells
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
