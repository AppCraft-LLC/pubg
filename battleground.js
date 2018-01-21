//
//  Programmer Unknown's BattleGround
//  Main
//
//  The MIT License (MIT)
//
//  Copyright (c) 2018 AppCraft LLC, http://appcraft.pro/pubg/
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

let actions = { none: 0, move: 1, rotate: 2, turn: 3, shoot: 4, jump: 5, eat: 6, spell: 7 },
    kinds = { rhino: 0, bear: 1, moose: 2, bull: 3, runchip: 4, miner: 5, sprayer: 6, splitpus: 7 },
    ground = { width: 0, height: 0 },
    events = { wound: 0, murder: 1, death: 2, upgrade: 3, birth: 4, spell: 5 },
    engineRefExt;

function pubg() {
    // Load config first
    let script = document.createElement('script');
    script.src = `./config.js`;
    script.onload = () => {
        // Run the game after that
        battleGround();
    };
    script.onerror = function () {
        console.error("Error loading config.");
    };
    document.body.appendChild(script);
}

function battleGround() {
    
    // Module aliases
    let Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Mouse = Matter.Mouse,
        Events = Matter.Events,
        Body = Matter.Body,
        Common = Matter.Common,
        MouseConstraint = Matter.MouseConstraint,
        Bodies = Matter.Bodies;

    // Base arrays, loop management
    let creatures = [],
        obstacles = [],
        bullets = [],
        loopCounter = -1,
        brains = [],
        bulletsGeneratorCounter = 0,
        lastActivatedBrainId = -1,
        scrVer = 0,
        happened = [],
        summonCounter = 0,
        bulletsGeneratorFrequency = 0,
        shells = { steel: 0, poisoned: 1, rubber: 2, ice: 3 },
        bulletColors = [
            { fill: "#FFF000", stroke: "#BEB320" },
            { fill: "#42FF00", stroke: "#299E00" },
            { fill: "#FF581E", stroke: "#C93400" },
            { fill: "#00AEFF", stroke: "#0093A0" }
        ];

    const loopStep = 0.1,
          moveForce = 0.04,
          bulletForce = 15.5,
          jumpForce = 0.1,
          torqueForce = 0.5,
          isCreature = 2,
          isBullet = 3,
          creatureRad = 30,
          bulletRad = 5,
          container = document.getElementById("container"),
          width = container.clientWidth,
          height = container.clientHeight,
          widthHalf = width / 2,
          heightHalf = height / 2,
          dangerousBulletSpeed  = 5,
          maxBulletsOnGround = 20,
          summonInterval = 20; //10;

    // create an engine
    let engine = Engine.create(),
        world = engine.world;
    engineRefExt = engine;

    // create a renderer
    let render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false
            // showAngleIndicator: true,
            // background: ''
        }
    });

    // Prototypes
    let Brain = {
        id: "",
        author: "",
        name: "",
        kind: 0,
        kills: 0,
        deaths: 0,
        iq: 10,
        alive: false,
        code: null,
        color: ""
    }

    let Creature = {
        lives: creatureMaxLives[0],
        energy: creatureMaxEnergy[0],
        brain: null,
        body: null,
        bullets: 1, //3,
        level: 0,
        kills: 0,
        cryToTheLeft: false,
        message: null,
        shouted: 0, // timestamp of the last shout
        invisible: false,
        invulnerable: false,
        poisonCounter: 0,
        poisoner: false,
        magnet: false,
        guttapercha: false,
        freezeCounter: 0,
        subzero: false,
        counter: 0
    };

    let Bullet = {
        body: null,
        shooter: null,
        shell: shells.steel
    };

    let Obstacle = {
        body: null,
        kind: 0
    };

    let Event = {
        type: 0,
        payload: null 
    };

    function rainbow(numOfSteps, step) {
        let r, g, b,
            h = step / numOfSteps,
            i = ~~(h * 6),
            f = h * 6 - i,
            q = 1 - f;
        switch(i % 6) {
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        let sh = Math.floor(step / 6) * -25;
        if (sh < -120) sh = -120;
        if (sh < 0) c = Common.shadeColor(c, sh)
        return (c);
    }

    // Load config
    if (typeof cfg_sources === 'undefined') {
        console.error("config.js not found.");
        return;
    }
    if (cfg_sources.length < 3) {
        console.error("At least 3 brains needed to start the game. Otherwise it won't be fun enough.");
        return;
    }
    if (cfg_sources.length < maxAliveCreatures) {
        console.error("Not enough brains for specified maxAliveCreatures const.");
        return;
    }

    let loadedBrainsCount = 0;
    bulletsGeneratorFrequency = 105 - maxAliveCreatures * bulletsGeneratorFrequencyPerCreature
    if (bulletsGeneratorFrequency < 20) bulletsGeneratorFrequency = 20;

    function sourceLoaded() {
        loadedBrainsCount++;
        if (loadedBrainsCount == cfg_sources.length) assembleBrains();
    }

    function assembleBrains() {

        let sources = shuffleBrains ? shuffleArray(cfg_sources) : cfg_sources;
        for (let i = 0; i < sources.length; i++) {
            
            let filename = sources[i],
                type = filename.substr(0, filename.length - 3);

            let code = Object.create(eval(type)),
                brain = Object.create(Brain);
            brain.id = type;
            brain.author = code.author.length > 10 ? code.author.substr(0, 10) : code.author;
            brain.name = code.name.length > 10 ? code.name.substr(0, 10) : code.name;
            brain.kind = code.kind;
            brain.code = code;
            brain.color = rainbow(sources.length, i);
            
            let iq = localStorage.getItem(brain.id);
            if (iq) brain.iq = parseInt(iq);
            brains.push(brain);
        };

        // Start the game after loading all brains
        letTheBattleBegin();
    }

    cfg_sources.forEach(filename => {
        if (!(filename.includes("br_") && filename.includes(".js"))) {
            console.error(filename, " filename has invalid format.");
            return;    
        }
        let script = document.createElement('script');
        script.src = `./brains/${filename}`;
        script.onload = sourceLoaded;
        script.onerror = function () {
            console.error("Error loading brain.");
        };
        document.body.appendChild(script);
    });

    function updateLeaderboard() {
        let table = document.getElementById("leaderboard"),
            rows = table.rows.length - 1;

        // sort by kills 
        let items = [];
        brains.forEach(b => {
            items.push({ name: `${b.name} (${b.author})`.toUpperCase(), kills: b.kills, iq: b.iq, alive: b.alive, color: b.color, deaths: b.deaths });
        });
        items.sort(function(a, b) {
            return a.kills > b.kills ? -1 : a.kills < b.kills ? 1 : 0;
        });

        for (let i = 0; i < items.length; i++) {
            let item = items[i],
                row,
                r = i + 1;
            if (rows < r) {
                row = table.insertRow(r);
                for (let j = 0; j < 5; j++) { 
                    let cell = row.insertCell(j);
                    if (j == 2 || j == 3) cell.classList.add("right");
                }
            } else {
                row = table.rows[r];
            }
            row.cells[0].innerHTML = `${r}`;
            row.cells[1].innerHTML = item.name;
            row.cells[2].innerHTML = `${item.kills}`;
            row.cells[3].innerHTML = `${item.deaths}`;
            row.cells[4].innerHTML = `${item.iq}`;
            if (item.alive) {
                row.classList.remove("dead");
                let c = item.color;
                row.style.color = c;
                row.style.webkitTextStroke = `0.5px ${Common.shadeColor(c, -40)}`;
            } else {
                row.style.color = null;
                row.style.webkitTextStroke = null;
                row.classList.add("dead");
            }
        }
    }

    // Give birth to a creature
    function incarnateCreatureForBrain(brainId) {

        if (brainId < 0 || brainId >= brains.length) return;
        
        let creature = Object.create(Creature),
            brain = brains[brainId];
        creature.brain = brain;
        brain.alive = true;

        // Make a body
        const margin = creatureRad * 2;
        let body = Bodies.circle(randomInt(margin, width - margin), randomInt(margin, height - margin), creatureRad, {
            restitution: 1,
            frictionAir: 0.09,
            collisionFilter: {
                category: isCreature
            },
            label: creature
        });
        Body.setAngle(body, randomAngle());
        creature.body = body;
        creature.cryToTheLeft = Math.random() < 0.5;
        updateCreatureEmbodiment(creature);
        World.add(world, body);

        creatures.push(creature);
        updateLeaderboard();

        // Emit birth event
        let event = Object.create(Event);
        event.type = events.birth;
        event.payload = [obfuscateCreature(creature)];
        happened.push(event);
    }

    function nextDeadBrainFromId(id) {  
        let found = -1;
        if (id >= brains.length) return found;
        for (let i = id; i < brains.length; i++) {
            if (!brains[i].alive) {
                found = i;
                break;
            }
        }
        return found;
    }

    function nextCreature() {

        if (creatures.length >= maxAliveCreatures) return;

        let nextId = nextDeadBrainFromId(lastActivatedBrainId + 1);
        if (nextId < 0) {
            lastActivatedBrainId = -1;
            nextId = nextDeadBrainFromId(0);
        }

        if (nextId < 0) {
            console.error("Error loading next brain.");
            return;
        }

        lastActivatedBrainId = nextId;
        incarnateCreatureForBrain(nextId);
    }

    function newObstacle(kind) {

        const margin = creatureRad * 2;
        let d = 1.0,
            w, h, r = 0,
            rs = 1.0,
            fa = 0.09;
        
        switch (kind) {
            case 0:     w = 60;     h = 60;     break;                          // Wooden box
            case 1:     w = 88;     h = 60;     break;                          // Wooden block
            case 2:     w = 11;     h = 40;     d = 0.5;    fa = 0.02;   break; // Bottle
            case 3:     w = 50;     h = 50;     d = 0.2;    break;              // Carton
            case 4:     w = 55;     h = 55;     d = 5.5;    fa = 0.1;    break; // Steel box
            case 5:     w = 100;    h = 31;     break;                          // Log
            case 6:     w = 88;     h = 60;     d = 20.0;   fa = 0.1;    break; // Concrete block
            case 7:     r = 22;    d = 2.0;     break;                          // Large gear
            case 8:     r = 9;     d = 2.0;     break;                          // Small gear
            case 9:     r = 25;    d = 0.8;     fa = 0.05;  break;              // Lifebuoy
            case 10:    r = 40;    d = 20.0;    fa = 0.1;   break;              // Large stone
            case 11:    r = 27;    d = 20.0;    fa = 0.1;   break;              // Middle stone
            case 12:    r = 15;    d = 20.0;    fa = 0.1;   break;              // Small stone
            case 13:    r = 15;    d = 1.0;     break;                          // Tambourine
            case 14:    r = 34;    d = 0.7;     fa = 0.05; break;               // Large tire
            case 15:    r = 20;    d = 0.7;     fa = 0.05; break;               // Small tire
        }

        let obstacle = Object.create(Obstacle);
        obstacle.kind = kind;
        d *= 0.001 /* default density */;    

        let x = randomInt(margin, width - margin),
            y = randomInt(margin, height - margin);

        let body = r == 0 ? Bodies.rectangle(x, y, w, h) : Bodies.circle(x, y, r);
        body.restitution = rs;
        body.frictionAir = fa;
        body.label = obstacle;
        // body.density = d;
        Body.setDensity(body, d);
        body.render.sprite.texture = `./img/obstacles/${kind}.png`;

        Body.setAngle(body, randomAngle());
        obstacle.body = body;
        World.add(world, body);
        obstacles.push(obstacle);
    }

    function updateCreatureLevel(creature) {
        let level = creature.kills >= killsToLevelUp[1] ? 2 : creature.kills >= killsToLevelUp[0] ? 1 : 0;
        if (level != creature.level) {
            creature.level = level;
            creature.lives = creatureMaxLives[level];
            creature.energy = creatureMaxEnergy[level];
            updateCreatureEmbodiment(creature);
            // Emit upgrade event
            let event = Object.create(Event);
            event.type = events.upgrade;
            event.payload = [obfuscateCreature(creature)];
            happened.push(event);            
        }
    }

    function updateCreatureEmbodiment(creature) {
        let max = creatureMaxLives[creature.level],
            health = Math.round(((max - creature.lives) / max) * 2.0);
        creature.body.render.sprite.texture = `./img/creatures/${creature.brain.kind}_${creature.level}_${health}.png`;
    }

    function obfuscateCreature(c) {
        if (c == null) return c;
        return { id: c.body.id,
                 kills: c.brain.kills,
                 deaths: c.brain.deaths,
                 iq: c.brain.iq,
                 author: c.brain.author,
                 name: c.brain.name,
                 lives: c.lives, 
                 bullets: c.bullets,
                 energy: c.energy,
                 level: c.level, 
                 position: c.body.position, 
                 velocity: c.body.velocity, 
                 angle: c.body.angle,
                 speed: c.body.speed,
                 angularVelocity: c.body.angularVelocity,
                 poisoned: c.poisonCounter > 0, 
                 spelling: c.counter > 0 };
    }

    function obfuscateBullet(b) {
        if (b == null) return b;
        return { id: b.body.id,
                 position: b.body.position,
                 velocity: b.body.velocity,
                 speed: b.body.speed,
                 dangerous: b.body.speed >= dangerousBulletSpeed };
    }

    function obfuscateObstacle(o) {
        if (o == null) return o;
        return { id: o.body.id,
                 position: o.body.position,
                 velocity: o.body.velocity,
                 speed: o.body.speed,
                 bounds: o.body.bounds };
    }

    /**
     * Calculates new IQ values for victim and killer
     * @param victim Brain object of victim
     * @param killer Brain object of killer
     */
    function calculateIQForVictimAndKiller(victim, killer) {

        safeIQDecreaseBy = function(brain, value) {
            brain.iq -= value;
            if (brain.iq < 0) brain.iq = 0;
        }

        saveToLocalStorage = function() {
            localStorage.setItem(victim.id, victim.iq);
            if (killer) localStorage.setItem(killer.id, killer.iq);
        }

        if (victim == null) return;
        if (killer == null) {
            safeIQDecreaseBy(victim, 3);
            saveToLocalStorage();
            return;
        }
        let killerIQ = killer.iq,
            victimIQ = victim.iq;
        if (killerIQ >= victimIQ) {
            if (killerIQ - victimIQ > 10) {
            }
            else {
                killer.iq++;
                safeIQDecreaseBy(victim, 1);
            }
        }
        else {
            if (victimIQ - killerIQ > 10) {
                let diff = victimIQ - killerIQ;
                safeIQDecreaseBy(victim, Math.round(diff/5));
                killer.iq += Math.round(diff/3);
            }
            else {
                killer.iq++;
                safeIQDecreaseBy(victim, 1);
            }
        }
        saveToLocalStorage();
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // 
    Object.freeze(actions);
    Object.freeze(kinds);
    ground = { width: width, height: height };
    Object.freeze(ground);
    Object.freeze(events);
    Object.freeze(shells);
    Object.freeze(bulletColors);
    
    const blockMrg = 200,
          blockW = 100,
          blockOff = blockW / 2;
    
    let opt = { isStatic: true };

    let edgeTop = Bodies.rectangle(widthHalf, -blockOff, width + blockMrg, blockW, opt);
    let edgeRight = Bodies.rectangle(width + blockOff, heightHalf, blockW, height + blockMrg, opt);
    let edgeBottom = Bodies.rectangle(widthHalf, height + blockOff, width + blockMrg, blockW, opt);
    let edgeLeft = Bodies.rectangle(-blockOff, heightHalf, blockW, height + blockMrg, opt);

    // add all of the bodies to the world
    World.add(world, [edgeTop, edgeRight, edgeBottom, edgeLeft]);
    world.gravity.x = world.gravity.y = 0;

    // Generate obstacles
    let amount = Math.ceil(width * height / 1000 / obstaclesDensity);
    for (let i = 0; i < amount; i++) {
        newObstacle(Math.round(Math.random() * 15.0));
    }

    // add mouse control
    let mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
    // mouseConstraint.collisionFilter.mask = 0;
    World.add(world, mouseConstraint);
    render.mouse = mouse;

    // an example of using mouse events on a mouse
    Events.on(mouseConstraint, 'mousedown', function(event) {
        // if (creatures.length == 0) {
            // nextCreature();
        // }
        // else {
            // mpoint = mouseConstraint.mouse.position;
        // }

        if (creatures.length > 1) {
            // superPower(creatures[0], creatures[1]);
            // superPower(creatures[0], obstacles[0], Math.PI);
            spell(creatures[0], null, null);
        }
    });

    // to prevent dragging
    Events.on(mouseConstraint, 'startdrag', function(event) {});
    Events.on(mouseConstraint, 'enddrag', function(event) {});

    // loop logic
    Events.on(engine, 'beforeUpdate', function(event) {

        if (creatures.length < 0) return;
        
        loopCounter += loopStep;// 0.1; // every 10th iteration
        if (loopCounter < 0) return;
        loopCounter = -1;

        bulletsGeneratorCounter++;
        
        if (bulletsGeneratorCounter > bulletsGeneratorFrequency && bullets.length < maxBulletsOnGround) {
            bulletsGeneratorCounter = 0;
            const margin = creatureRad * 2;
            let x = randomInt(margin, width - margin),
                y = randomInt(margin, height - margin);
            shot({x: x, y: y}, 0, null, true, shells.steel);
        } 

        let enemies = [],
            invisibles = [],
            magnets = [];
        creatures.forEach(function callback(it, index, array) {
            it.energy += energyRefillPerTick;
            if (it.energy > creatureMaxEnergy[it.level]) it.energy = creatureMaxEnergy[it.level];

            // Consider internal counters
            if (it.counter > 0) { 
                if (--it.counter <= 0) {
                    it.counter == 0;
                    if (it.invisible) {
                        it.invisible = false;
                        it.body.render.opacity = 1;
                    }
                    if (it.invulnerable) it.invulnerable = false;
                    if (it.magnet) it.magnet = false;
                    if (it.poisoner) it.poisoner = false;
                    if (it.guttapercha) it.guttapercha = false;
                    if (it.subzero) it.subzero = false;
                }
            }
            if (it.poisonCounter > 0) {
                if (--it.poisonCounter <= 0) it.poisonCounter = 0;
            }
            if (it.freezeCounter > 0) {
                if (--it.freezeCounter <= 0) it.freezeCounter = 0;
            }

            enemies.push(obfuscateCreature(it));
            if (it.invisible) invisibles.push(index);
            if (it.magnet) magnets.push(index);
        });

        let blts = [];
        bullets.forEach(it => {
            blts.push(obfuscateBullet(it));
            // Magnets
            if (magnets.length > 0) {
                magnets.forEach(i => {
                    let c = creatures[i],
                        d = distanceBetween(c.body, it.body),
                        f = 0.001 * (d / 500),
                        a = angleBetween(it.body, c.body),
                        v = { x: Math.cos(a) * f, 
                              y: Math.sin(a) * f };
                    Body.applyForce(it.body, it.body.position, v);
                });
            }
        });
        
        let objs = [];
        obstacles.forEach(it => {
            objs.push(obfuscateObstacle(it));
        });
        
        Object.freeze(enemies);
        Object.freeze(objs);
        Object.freeze(blts);
        let evnts = happened.slice(0);
        Object.freeze(evnts);
        happened = [];

        creatures.forEach(function callback(it, index, array) {

            // Poison
            if (it.poisonCounter > 0 && it.lives > 5) {
                it.lives -= poisonHurt;
                updateCreatureEmbodiment(it);
            }

            // Freeze
            if (it.freezeCounter > 0) return;
            
            let enemiesForIt = enemies.slice(0);
            if (invisibles.length > 0) {
                let del = false;
                for (let i = invisibles.length - 1; i >= 0; i--) {
                    if (invisibles[i] > index || del) enemiesForIt.splice(invisibles[i], 1);
                    else if (invisibles[i] == index) {
                        enemiesForIt.splice(index, 1);
                        del = true;
                    }
                    else if (invisibles[i] < index) {
                        enemiesForIt.splice(index, 1);
                        enemiesForIt.splice(invisibles[i], 1);
                        del = true;
                    }
                }
                if (!del) enemiesForIt.splice(index, 1);
            } else enemiesForIt.splice(index, 1);
            Object.freeze(enemiesForIt);

            let action = it.brain.code.thinkAboutIt(enemies[index], enemiesForIt, blts, objs, evnts);
            switch (action.do) {
                case actions.move:
                    move(it, action.params.angle);
                    break;
                case actions.rotate:
                    torque(it, action.params.clockwise);
                    break;          
                case actions.turn:
                    turnToAngle(it, action.params.angle);
                    break;                    
                case actions.shoot:
                    shoot(it);
                    break;                    
                case actions.jump:
                    jump(it, action.params.angle);
                    break;    
                case actions.eat:
                    eatBullet(it);
                    break;      
                case actions.spell:
                    let target, angle;
                    if (action.params && action.params.target && action.params.target.id) {
                        let tg = action.params.target.id;
                        for (let i = 0; i < creatures.length; i++) {
                            if (creatures[i].body.id == tg) {
                                target = creatures[i];
                                break;
                            }
                        }
                        if (!target) {
                            for (let i = 0; i < obstacles.length; i++) {
                                if (obstacles[i].body.id == tg) {
                                    target = obstacles[i];
                                    break;
                                }
                            }                                
                        }
                    }
                    if (action.params && action.params.angle) angle = action.params.angle;
                    spell(it, target, angle);
                    break;      
                default: break;
            }
            if (action.params && action.params.message) {
                let msg = action.params.message;
                it.shouted = Date.now();
                it.message = msg.length > messageLineLimit * 2 ? msg.substr(0, messageLineLimit * 2) : msg;
            }
        });

        // Summon new creature if needed 
        if (summonCounter++ > summonInterval) {
            summonCounter = 0;
            if (creatures.length < maxAliveCreatures) nextCreature();
        }
        
    });

    // an example of using collisionStart event on an engine
    Events.on(engine, 'collisionStart', function(event) {
        let pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            let blt, body;
            if (pair.bodyA.collisionFilter.category == isCreature && pair.bodyB.collisionFilter.category == isBullet) {
                blt = pair.bodyB;
                body = pair.bodyA;
            }
            if (pair.bodyB.collisionFilter.category == isCreature && pair.bodyA.collisionFilter.category == isBullet) {
                blt = pair.bodyA;
                body = pair.bodyB;
            }
            if (blt && body) {

                let creature = body.label;
                let bullet = blt.label;

                if (blt.speed >= dangerousBulletSpeed && !creature.invulnerable) {
                    creature.lives -= bulletDamage;
                    let shooter = bullet.shooter;
                    if (shooter && shooter.body == creature.body) shooter = null;

                    // Deadly shot
                    if (creature.lives <= 0) {

                        // Emit murder/death event 
                        let event = Object.create(Event);
                        event.payload = [obfuscateCreature(creature)];
                        
                        if (shooter && shooter.body != creature.body) {
                            shooter.kills++;
                            shooter.brain.kills++;
                            updateCreatureLevel(shooter);
                            event.type = events.murder;
                            event.payload.push(obfuscateCreature(shooter));
                        } else {
                            event.type = events.death;
                        }
                        happened.push(event);

                        let brain = creature.brain,
                            blts = creature.bullets,
                            pos = body.position;
                        Matter.Composite.remove(world, body);
                        creatures.splice(creatures.indexOf(creature), 1);
                        for (let i = 0; i < blts; i++) {
                            shot(pos, randomAngle(), null, false, shells.steel);
                        }

                        brain.deaths++;
                        brain.alive = false;
                        calculateIQForVictimAndKiller(brain, shooter ? shooter.brain : null);
                
                        updateLeaderboard();
                    }
                    else {

                        // Emit wound event
                        let event = Object.create(Event);
                        event.type = events.wound;
                        event.payload = [obfuscateCreature(creature)];
                        if (shooter) event.payload.push(obfuscateCreature(shooter));
                        happened.push(event);

                        if (bullet.shell == shells.poisoned) creature.poisonCounter = poisonDuration;
                        if (bullet.shell == shells.ice) creature.freezeCounter = freezeDuration;

                        updateCreatureEmbodiment(creature);
                    }
                }
                else {
                    if (creature.bullets < creatureMaxBullets[creature.level]) {
                        bullets.splice(bullets.indexOf(bullet), 1);
                        Matter.Composite.remove(world, blt);
                        creature.bullets++;
                    }   
                }
            }
        }
    });

    Events.on(render, "afterRender", function(event) {

        let ctx = render.context;
        const w = 50,
              wh = w / 2,
              h = 4,
              dh = 1,
              offh = 60;

        creatures.forEach(it => {
            let s = h * 3 + dh * 2;
                sh = s + dh * 4,
                x = it.body.position.x - wh + sh / 2,
                y = it.body.position.y - offh,
                color = it.brain.color;
            // Color indicator / super power
            ctx.fillStyle = color;
            ctx.strokeStyle = Common.shadeColor(color, -20);
            ctx.lineWidth = 1;
            if (it.counter > 0) {
                ctx.font = `600 ${s+1}px Verdana`;
                ctx.textBaseline = "hanging";
                ctx.fillText("S", x - sh, y);
                ctx.strokeText("S", x - sh, y);
            }
            else {
                ctx.fillRect(x - sh, y, s, s);
                ctx.strokeRect(x - sh, y, s, s);
            }
            let livesFill = "#800000",
                livesBar = "#D25253",
                energyFill = "#008002",
                energyBar = "#5CDC5D",
                bulletsFill = "#2A7BB9",
                bulletsBar = "#2ABFFD";
            if (it.poisonCounter > 0) {
                livesFill = energyFill = bulletsFill = "#008002";
                livesBar = energyBar = bulletsBar = "#5CDC5D";
            } else 
                if (it.freezeCounter > 0) {
                    livesFill = energyFill = bulletsFill = "#2A7BB9";
                    livesBar = energyBar = bulletsBar = "#2ABFFD";
                } else 
                    if (it.invulnerable) {
                        livesFill = energyFill = bulletsFill = "#535353";
                        livesBar = energyBar = bulletsBar = "#C0C0C0";
                    }

            // Lives
            ctx.fillStyle = livesFill;
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = livesBar;
            ctx.fillRect(x, y, it.lives / creatureMaxLives[it.level] * w, h);
            // Energy
            y += h + dh;
            ctx.fillStyle = energyFill;
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = energyBar;
            ctx.fillRect(x, y, it.energy / creatureMaxEnergy[it.level] * w, h);
            // Bullets
            y += h + dh;
            ctx.fillStyle = bulletsFill;
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = bulletsBar;
            ctx.fillRect(x, y, it.bullets / creatureMaxBullets[it.level] * w, h);

            // Message
            if (it.message) {

                let lines = [];

                if (it.message.length <= messageLineLimit) {
                    let msg = it.message;
                    if (msg.includes("\n")) {
                        let arr = msg.split("\n");
                        lines.push(arr[0]);
                        lines.push(arr[1]);
                    }
                    else {
                        lines.push(it.message);
                    }
                }
                else {
                    let words = it.message.split(" "),
                        line = "",
                        wc = 0;
                    for (let w = 0; w < words.length; w++) {
                        let cl = line + words[w] + " ";
                        wc++;
                        if (cl.includes("\n")) {
                            let pos = cl.indexOf("\n");
                            lines.push(cl.substr(0, pos).trim());
                            line = cl.substr(pos + 1, cl.length - pos - 1);
                            wc = 0;
                        }
                        else {
                            if (cl.length >= messageLineLimit) {
                                lines.push(wc == 1 ? cl.substr(0, messageLineLimit) : line.trim());
                                line = wc == 1 ? "" : words[w] + " ";
                                wc = 0;
                            }
                            else {
                                line = cl;
                            }
                        }
                    }
                    if (line.length) lines.push(line.trim());
                } 

                let lc = Math.min(lines.length, 2),
                    fs = 14,
                    df = 4,
                    mh = fs * lc + df * (lc - 1);
                x = it.body.position.x + offh * 0.7; // 1.0
                y = it.body.position.y - (lc == 1 ? 0 : mh / 2) + 10;

                let max = 0,
                    m = 6;
                for (let i = 0; i < lc; i++) {
                    let lw = ctx.measureText(lines[i]).width;
                    if (lw > max) max = lw;
                }

                let rw = max + m * 2,
                    xl = it.body.position.x - (rw + (x - it.body.position.x));
                if (xl < 0 && it.cryToTheLeft) it.cryToTheLeft = false;
                if (x + rw > ground.width && !it.cryToTheLeft) it.cryToTheLeft = true;
                if (it.cryToTheLeft) x = xl;
                let corners = it.cryToTheLeft ? { tl: 10, br: 10, bl: 10 } : { tr: 10, br: 10, bl: 10 };

                ctx.strokeStyle = "#444444";
                ctx.lineWidth = 0.5;
                ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                roundRect(ctx, x - m, y - m - fs / 2, rw, mh + m * 2, corners, true, true);

                ctx.fillStyle = "#444444";
                ctx.font = `100 ${fs}px Verdana`;
                ctx.textBaseline = "middle";
                for (let i = 0; i < lc; i++) {
                    ctx.fillText(lines[i], x, y);
                    y += fs + df;
                }

                //
                if (Date.now() - it.shouted > messageShowTime) it.message = null;
            }
        });

    });

    // Draw functions
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke == 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            let defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (let side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    function letTheBattleBegin() {
        Engine.run(engine);
        Render.run(render);
    }

    // Action functions
    function shot(pos, angle, shooter, dry, shell) {
        let blt = Object.create(Bullet);
        let bullet = Bodies.circle(pos.x, pos.y, bulletRad, {
            restitution: shell == shells.rubber ? guttaperchaRestitution : 0.2,
            frictionAir: shell == shells.rubber ? guttaperchaAirFriction : 0.015,
            collisionFilter: {
               category: isBullet
            },
            label: blt,
            render: {
                fillStyle: bulletColors[shell].fill,
                strokeStyle: bulletColors[shell].stroke
            }
        });
        blt.body = bullet;
        blt.shooter = shooter;
        blt.shell = shell;
        bullets.push(blt);
        World.add(world, bullet);
        if (!dry) Body.setVelocity(bullet, { x: Math.cos(angle) * bulletForce, y: Math.sin(angle) * bulletForce });
    }

    function move(creature, angle) {
        if (!isNumber(angle)) return;
        if (creature.energy < moveEnergyCost) return;
        creature.energy -= moveEnergyCost;
        let body = creature.body,
            point = { x: body.position.x + Math.cos(body.angle) * creatureRad, 
                      y: body.position.y + Math.sin(body.angle) * creatureRad },
            vector = { x: Math.cos(angle) * moveForce, 
                       y: Math.sin(angle) * moveForce };
        Body.applyForce(body, point, vector);
    }

    function shoot(creature) { 
        if (creature.bullets < 1) return;
        if (creature.energy < shotEnergyCost) return;
        creature.bullets--;
        creature.energy -= shotEnergyCost;
        let body = creature.body,
            point = { x: body.position.x + Math.cos(body.angle) * (creatureRad + bulletRad * 2.0), 
                      y: body.position.y + Math.sin(body.angle) * (creatureRad + bulletRad * 2.0) };
            shell = creature.subzero ? shells.ice : creature.guttapercha ? shells.rubber : creature.poisoner ? shells.poisoned : shells.steel;
        shot(point, body.angle, creature, false, shell);
    } 

    function jump(creature, angle) {
        if (!isNumber(angle)) return;
        if (creature.energy < jumpEnergyCost) return;
        creature.energy -= jumpEnergyCost;
        let vector = { x: Math.cos(angle) * jumpForce, 
                       y: Math.sin(angle) * jumpForce };
        Body.applyForce(creature.body, creature.body.position, vector);
    }

    function torque(creature, clockwise) {
        creature.body.torque = torqueForce * (clockwise ? 1.0 : -1.0);
    }

    function turnToAngle(creature, angle) {
        if (!isNumber(angle)) return;
        let diff = differenceBetweenAngles(creature.body.angle, angle),
            maxf = 2.0;
        creature.body.torque = (diff / Math.PI * maxf);
    }

    function eatBullet(creature) {
        if (creature.bullets < 1) return;
        if (creature.energy < eatBulletEnergyCost) return;
        creature.bullets--;
        creature.energy -= eatBulletEnergyCost;
        creature.lives += livesPerEatenBullet;
        if (creature.lives > creatureMaxLives[creature.level]) creature.lives = creatureMaxLives[creature.level];
        if (creature.poisonCounter > 0) creature.poisonCounter = 0;
        updateCreatureEmbodiment(creature);
    }

    function spell(creature, target, angle) {

        if (creature.level < 1) return;

        // Spell event
        let event = Object.create(Event);
        event.type = events.spell;
        event.payload = [obfuscateCreature(creature)];
        happened.push(event);
        
        let c = creature;
        switch (c.brain.kind) {
            
            case kinds.moose: // Invisible
                if (c.energy >= invisibleEnergyCost) {
                    c.energy -= invisibleEnergyCost;
                    c.invisible = true;
                    c.counter = invisibleDuration;
                    c.body.render.opacity = 0.1;
                }
                break;
        
            case kinds.bull: // Invulnerable
                if (c.energy >= invulnerableEnergyCost) {
                    c.energy -= invulnerableEnergyCost;
                    c.invulnerable = true;
                    c.counter = invulnerableDuration;
                }
                break;
        
            case kinds.rhino: // Magnet
                if (c.energy >= magnetEnergyCost) {
                    c.energy -= magnetEnergyCost;
                    c.magnet = true;
                    c.counter = magnetDuration;
                }
                break;
        
            case kinds.runchip: // Poisoner
                if (c.energy >= poisonerEnergyCost) {
                    c.energy -= poisonerEnergyCost;
                    c.poisoner = true;
                    c.counter = poisonerDuration;
                }
                break;
        
            case kinds.miner: // Guttapercha
                if (c.energy >= guttaperchaEnergyCost) {
                    c.energy -= guttaperchaEnergyCost;
                    c.guttapercha = true;
                    c.counter = guttaperchaDuration;
                }
                break;

            case kinds.sprayer: // Vampire
                if (c.energy >= vampireEnergyCost && target) {
                    let dist = distanceBetween(c.body, target.body);
                    if (dist <= vampireDistance) {
                        c.energy -= vampireEnergyCost;
                        let lives = Math.floor(target.lives / 2),
                            bullets = target.bullets > 0 ? 1 : 0;
                        target.lives -= lives;
                        target.bullets -= bullets;
                        c.lives += lives;
                        if (c.lives > creatureMaxLives[c.level]) c.lives = creatureMaxLives[c.level];
                        c.bullets += bullets;
                        if (c.bullets > creatureMaxBullets[c.level]) c.bullets = creatureMaxBullets[c.level];
                        updateCreatureEmbodiment(target);
                        updateCreatureEmbodiment(c);
                        c.counter = 15; // for indication only
                    }
                }
                break;

            case kinds.bear: // Telekinesis
                if (c.energy >= telekinesisEnergyCost && target && isNumber(angle)) {
                    c.energy -= telekinesisEnergyCost;
                    let force = target.body.mass / 2.8 /* mass of a creature */ * telekinesisForce,
                        vector = { x: Math.cos(angle) * force, 
                                   y: Math.sin(angle) * force };
                    Body.applyForce(target.body, target.body.position, vector);
                    c.counter = 5; // for indication only
                }
                break;

            case kinds.sprayer: // Subzero
                if (c.energy >= subzeroEnergyCost) {
                    c.energy -= subzeroEnergyCost;
                    c.subzero = true;
                    c.counter = subzeroDuration;
                }
                break;
        }
    }
}

// Common helpers

function distanceBetween(obj1, obj2) {
    return Math.hypot(obj2.position.x - obj1.position.x, obj2.position.y - obj1.position.y);
}

function distanceBetweenPoints(pt1, pt2) {
    return Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
}

function angleBetween(obj1, obj2) {
    return angleBetweenPoints(obj1.position, obj2.position);
}

function angleBetweenPoints(pt1, pt2) {
    let	dx = pt2.x - pt1.x,
        dy = pt2.y - pt1.y;
    return Math.atan2(dy, dx);
}

function normalizeAngle(angle) {
    let ang = angle - (Math.PI * 2.0 * Math.floor(angle / (Math.PI * 2.0)));
    if (ang < 0) ang = Math.PI * 2.0 + ang;
    return ang;
}

function differenceBetweenAngles(ang1, ang2) {
    let a1 = normalizeAngle(ang1),
        a2 = normalizeAngle(ang2);
    if (Math.abs(a1 - a2) > Math.PI) {
        if (a1 > a2) 
            a2 += Math.PI * 2.0;
        else
            a1 += Math.PI * 2.0;
    }
    return a2 - a1;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (++max - min)) + min;
}

function randomAngle() {
    return Math.random() * Math.PI * 2;
}

function rayBetween(obj1, obj2) {
    return rayBetweenPoints(obj1.position, obj2.position);
}

function rayBetweenPoints(pt1, pt2) {
    let bodies = Matter.Composite.allBodies(engineRefExt.world),
        collisions = Matter.Query.ray(bodies, pt1, pt2);
    return collisions.length < 3;
}
