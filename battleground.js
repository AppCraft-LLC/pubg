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

// Lives amount for each of possible levels
const creatureMaxLives = [100.0, 150.0, 250.0],
// Energy amount for each level
      creatureMaxEnergy = [100.0, 150.0, 250.0],
      creatureMaxBullets = 3,
      bulletDamage = 10,
// Energy costs of actions
      shotEnergyCost = 10,
      jumpEnergyCost = 30,
      eatBulletEnergyCost = 100,
//
      livesPerEatenBullet = 20;


let actions = { none: 0, move: 1, turn: 2, shoot: 3, jump: 4, eat: 5 },
    kinds = { rhino: 0, bear: 1, moose: 2, bull: 3 },
    ground = { width: 0, height: 0 };

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
        lastLoadedBrainId = -1,
        scrVer = 0;

    const loopScale = 1.0;
          loopStep = 0.1 * loopScale;
          moveForce = -0.04 / loopScale,
          bulletForce = 15.5 / loopScale,
          jumpForce = -0.1 / loopScale,
          isCreature = 2,
          isBullet = 3,
          creatureRad = 30,
          bulletRad = 5,
          torqueForce = 0.7,
          container = document.getElementById("container"),
          width = container.clientWidth,
          height = container.clientHeight,
          widthHalf = width / 2,
          heightHalf = height / 2,
          dangerousBulletSpeed  = 5,
          killsToLevelUp = [3, 10],
          obstaclesDensity = 33, // 1 obj per 33k pixels
          maxAliveCreatures = 3,
          colors = [ { value: "#34A7D8", used: false } , 
                     { value: "#F04A50", used: false } , 
                     { value: "#8FC703", used: false } , 
                     { value: "#BA21F8", used: false } , 
                     { value: "#FFD241", used: false } ],
          
    // Energy costs of actions
          moveEnergyCost = 1.5,

    // Energy refill speed
          energyRefillPerTick = 0.5,
          bulletsGeneratorFrequency = 100,

    // IQ 
          decreaseIQByEnemy = 2,
          decreaseIQByIncident = 1,
          increaseIQForKill = 2;

    // create an engine
    let engine = Engine.create(),
        world = engine.world;

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
        id: 0,
        author: "",
        name: "",
        kind: 0,
        kills: 0,
        deaths: 0,
        iq: 10,
        alive: true,
        code: null,
        color: 0
    }

    let Creature = {
        lives: creatureMaxLives[0],
        energy: creatureMaxEnergy[0],
        brain: null,
        body: null,
        bullets: 1, //3,
        level: 0,
        kills: 0
    };

    let Bullet = {
        body: null,
        shooter: null
    };

    let Obstacle = {
        body: null,
        kind: 0
    };

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
                let c = colors[item.color].value;
                row.style.color = c;
                row.style.webkitTextStroke = `1px ${Common.shadeColor(c, -40)}`;
            } else {
                row.style.color = null;
                row.style.webkitTextStroke = null;
                row.classList.add("dead");
            }
        }

    }
    
    function incarnateCreatureForBrain(brain) {
        // Give birth to a creature
        let creature = Object.create(Creature);
        creature.brain = brain;

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
        updateCreatureEmbodiment(creature);
        World.add(world, body);

        creatures.push(creature);
    }

    function afterCreatureBirth(success) {
        // Prevent infinite loading loop
        if (!success && brains.length < 3) {
            console.log("At least 3 brains needed to start a game. Otherwise it won't be fun enough.");
            return;
        }
        if (!success) { lastLoadedBrainId = -1;}
        updateLeaderboard();
        nextCreatureAfterAwile();
    }

    function nextCreatureAfterAwile() {
        setTimeout(nextCreature, 3000);
    }

    function nextCreature() {
        let alive = creatures.length;
        if (alive >= maxAliveCreatures) return;

        // Load existing dead brain
        if (lastLoadedBrainId < 0 && brains.length > 0) {
            for (let i = 0; i < brains.length; i++) {
                if (!brains[i].alive) {
                    lastLoadedBrainId = brains[i].id - 1;
                    break;
                }
            }
        }
        
        newCreature(++lastLoadedBrainId);
    }

    function unusedColor() {
        for (let i = 0; i < colors.length; i++) {
            if (!colors[i].used) {
                colors[i].used = true;
                return i;
            }
        }
        return 0;
    }

    // 
    function newCreature(brainId) {

        const id = `Brain_${brainId}`;

        // Delete code if exists
        let script = document.getElementById(id);
        if (script) {
            script.parentNode.removeChild(script);
            delete(eval(id));
        }
        
        // Create the new one
        script = document.createElement('script');
        script.src = `./brains/brain_${brainId}.js?v=${scrVer}`;
        scrVer++;
        script.setAttribute("id", id);
        script.onload = function() {

            // Check brain already loaded
            let brain,
                old = false;
            brains.forEach(br => {
                if (br.id == brainId) brain = br;
            });
            if (brain != null) {
                old = true;
                brain.alive = true;
            } else {
                brain = Object.create(Brain);
                brain.id = brainId;    
            }

            // Create brain
            let code = Object.create(eval(id));
            brain.author = code.author.length > 10 ? code.author.substr(0, 10) : code.author;
            brain.name = code.name.length > 10 ? code.name.substr(0, 10) : code.name;
            brain.kind = code.kind;
            brain.code = code;
            brain.color = unusedColor();
            
            if (!old) {
                let iq = localStorage.getItem(id);
                if (iq) brain.iq = parseInt(iq);
                brains.push(brain);
            }  

            incarnateCreatureForBrain(brain);
            afterCreatureBirth(true);
        };

        // script.onreadystatechange = onLoad;
        script.onerror = function () {
            afterCreatureBirth(false);
        };

        document.body.appendChild(script);
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
            case 4:     w = 55;     h = 55;     d = 5.5;    fa = 0.2;    break; // Steel box
            case 5:     w = 100;    h = 31;     break;                          // Log
            case 6:     w = 88;     h = 60;     d = 20.0;   fa = 0.5;    break; // Concrete block
            case 7:     r = 22;    d = 2.0;     break;                          // Large gear
            case 8:     r = 9;     d = 2.0;     break;                          // Small gear
            case 9:     r = 25;    d = 0.8;     fa = 0.05;  break;              // Lifebuoy
            case 10:    r = 40;    d = 20.0;    fa = 0.5;   break;              // Large stone
            case 11:    r = 27;    d = 20.0;    fa = 0.5;   break;              // Middle stone
            case 12:    r = 15;    d = 20.0;    fa = 0.5;   break;              // Small stone
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
        }
    }

    function updateCreatureEmbodiment(creature) {
        let max = creatureMaxLives[creature.level],
            health = Math.round(((max - creature.lives) / max) * 2.0);
        creature.body.render.sprite.texture = `./img/creatures/${creature.brain.kind}_${creature.level}_${health}.png`;
    }

    // 
    Object.freeze(actions);
    Object.freeze(kinds);
    ground = { width: width, height: height };
    Object.freeze(ground);
    
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
    mouseConstraint.collisionFilter.mask = 0;

    World.add(world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // an example of using mouse events on a mouse
    Events.on(mouseConstraint, 'mousedown', function(event) {
        // nextCreature();
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
        
        if (bulletsGeneratorCounter > bulletsGeneratorFrequency) {
            bulletsGeneratorCounter = 0;
            const margin = creatureRad * 2;
            let x = randomInt(margin, width - margin),
                y = randomInt(margin, height - margin);
            shot({x: x, y: y}, 0, null, true);
        } 

        let enemies = [];
        creatures.forEach(it => {
            it.energy += energyRefillPerTick;
            if (it.energy > creatureMaxEnergy[it.level]) it.energy = creatureMaxEnergy[it.level];
            let enemy = { id: it.body.id,
                          lives: it.lives, 
                          bullets: it.bullets,
                          energy: it.energy,
                          level: it.level, 
                          position: it.body.position, 
                          velocity: it.body.velocity, 
                          angle: it.body.angle,
                          speed: it.body.speed,
                          angularVelocity: it.body.angularVelocity };
            enemies.push(enemy);
        });

        let bllts = [];
        bullets.forEach(it => {
            let bullet = { id: it.body.id,
                           position: it.body.position,
                           velocity: it.body.velocity,
                           speed: it.body.speed,
                           dangerous: it.body.speed >= dangerousBulletSpeed };
            bllts.push(bullet);
        });
        
        let obcls = [];
        obstacles.forEach(it => {
            let obj = { id: it.body.id,
                        position: it.body.position,
                        velocity: it.body.velocity,
                        speed: it.body.speed };
            obcls.push(obj);
        });
        
        // 
        creatures.forEach(function callback(it, index, array) {

            let enemiesForIt = enemies.slice(0);
            enemiesForIt.splice(index, 1);

            let action = it.brain.code.thinkAboutIt(enemies[index], enemiesForIt, bllts, obcls);
            switch (action.do) {
                case actions.move: 
                    move(it, action.params.angle);
                    break;
                case actions.turn:
                    torque(it, action.params.clockwise);
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
                default: break;
            }
        });

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

                if (blt.speed >= dangerousBulletSpeed) {
                    creature.lives -= bulletDamage;

                    // Deadly shot
                    if (creature.lives <= 0) {

                        let shooter = bullet.shooter;
                        if (shooter && shooter.body != creature.body) {
                            shooter.kills++;
                            shooter.brain.kills++;
                            shooter.brain.iq += increaseIQForKill;
                            updateCreatureLevel(shooter);
                            localStorage.setItem(`Brain_${shooter.brain.id}`, shooter.brain.iq);
                        } else {
                            shooter = null;
                        }

                        creature.brain.iq -= shooter ? decreaseIQByEnemy : decreaseIQByIncident;
                        if (creature.brain.iq < 0) creature.brain.iq = 0;
                        creature.brain.deaths++;
                        creature.brain.alive = false;
                        localStorage.setItem(`Brain_${creature.brain.id}`, creature.brain.iq);
                        
                        colors[creature.brain.color].used = false;
                        
                        for (let i = 0; i < creatures.length; i++) {
                            if (creatures[i].body == body) {
                                let blts = creatures[i].bullets;
                                let pos = body.position;
                                creatures.splice(i, 1);
                                Matter.Composite.remove(world, body);
                                for (let i = 0; i < blts; i++) {
                                    shot(pos, randomAngle(), null, false);
                                }
                                break;
                            }
                        }

                        updateLeaderboard();
                        nextCreatureAfterAwile();
                    }
                    else {
                        updateCreatureEmbodiment(creature);
                    }
                }
                else {

                    if (creature.bullets < creatureMaxBullets) {
                        for (let i = 0; i < bullets.length; i++) {
                            if (bullets[i].body == blt) {
                                bullets.splice(i, 1);
                                Matter.Composite.remove(world, blt);
                                creature.bullets++;
                                break;
                            }
                        }
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
                color = colors[it.brain.color].value;
            // Color
            ctx.fillStyle = color;
            ctx.fillRect(x - sh, y, s, s);
            ctx.strokeStyle = Common.shadeColor(color, -20);
            ctx.lineWidth = 1;
            ctx.strokeRect(x - sh, y, s, s);
            // Lives
            ctx.fillStyle = "#800000";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#D25253";
            ctx.fillRect(x, y, it.lives / creatureMaxLives[it.level] * w, h);
            // Energy
            y += h + dh;
            ctx.fillStyle = "#008002";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#5CDC5D";
            ctx.fillRect(x, y, it.energy / creatureMaxEnergy[it.level] * w, h);
            // Bullets
            y += h + dh;
            ctx.fillStyle = "#2A7BB9";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#2ABFFD";
            ctx.fillRect(x, y, it.bullets / creatureMaxBullets * w, h);
        });

    });

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);


    // Action functions
    function shot(pos, angle, shooter, dry) {
        const bulletColor = "#fff000";
        let blt = Object.create(Bullet);
        let bullet = Bodies.circle(pos.x, pos.y, bulletRad, {
            restitution: 0.2,
            frictionAir: 0.015,
            collisionFilter: {
               category: isBullet
            },
            label: blt,
            render: {
                fillStyle: bulletColor,
                strokeStyle: Common.shadeColor(bulletColor, -20)
            }
        });
        blt.body = bullet;
        blt.shooter = shooter;
        bullets.push(blt);
        World.add(world, bullet);
        if (!dry) Body.setVelocity(bullet, { x: Math.cos(angle) * bulletForce, y: Math.sin(angle) * bulletForce });
    }

    function move(creature, angle) {
        if (creature.energy < moveEnergyCost) return;
        creature.energy -= moveEnergyCost;        
        let body = creature.body;
        Body.applyForce(body, { x: body.position.x + Math.cos(body.angle) * creatureRad, y: body.position.y + Math.sin(body.angle) * creatureRad }, 
            { x: Math.cos(angle) * moveForce, y: Math.sin(angle) * moveForce });
    }

    function shoot(creature) { 
        if (creature.bullets < 1) return;
        if (creature.energy < shotEnergyCost) return;
        creature.bullets--;
        creature.energy -= shotEnergyCost;
        let body = creature.body;
        shot({ x: body.position.x + Math.cos(body.angle) * (creatureRad + bulletRad * 2.0), 
               y: body.position.y + Math.sin(body.angle) * (creatureRad + bulletRad * 2.0) }, body.angle, creature, false);
    } 

    function jump(creature, angle) {
        if (creature.energy < jumpEnergyCost) return;
        creature.energy -= jumpEnergyCost;
        Body.applyForce(creature.body, creature.body.position, { x: Math.cos(angle) * jumpForce, y: Math.sin(angle) * jumpForce });
    }

    function torque(creature, clockwise) {
        creature.body.torque = torqueForce * (clockwise ? 1.0 : -1.0);
    }

    function eatBullet(creature) {
        if (creature.bullets < 1) return;
        if (creature.energy < eatBulletEnergyCost) return;
        creature.bullets--;
        creature.energy -= eatBulletEnergyCost;
        creature.lives += livesPerEatenBullet;
        if (creature.lives > creatureMaxLives[creature.level]) creature.lives = creatureMaxLives[creature.level];
        updateCreatureEmbodiment(creature);
    }

    nextCreatureAfterAwile();

}

// Common helpers

function distanceBetween(obj1, obj2) {
    return Math.hypot(obj2.position.x - obj1.position.x, obj2.position.y - obj1.position.y);
}

function distanceBetweenPoints(pt1, pt2) {
    return Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
}

function angleBetween(obj1, obj2) {
    let	dx = obj1.position.x - obj2.position.x,
        dy = obj1.position.y - obj2.position.y;
    return Math.atan2(dy, dx);
}

function angleBetweenPoints(pt1, pt2) {
    let	dx = pt1.x - pt2.x,
        dy = pt1.y - pt2.y;
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
