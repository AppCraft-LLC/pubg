//
//  Programmer Unknown's BattleGround
//  Sample Algorithm
//
//  The MIT License (MIT)
//
//  Copyright (c) 2018 AppCraft LLC, http://appcraft.pro
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
//  Please read documentation at https://github.com/AppCraft-LLC/pubg/wiki

/**
 * -----------------------
 *     Global consts
 * -----------------------
 * 
 * // Contains max lives for each creature's level
 * creatureMaxLives = [100.0, 150.0, 250.0]
 * 
 * // Contains max energy for each creature's level
 * creatureMaxEnergy = [100.0, 150.0, 250.0]
 * 
 * // Max amount of bullet each creature can carry
 * creatureMaxBullets = [3, 4, 5]
 * 
 * // Possible actions
 * actions = { 
 *      none:   0,    // do nothing, no energy required. No params needed.
 *      move:   1,    // move in specified direction, in radians:
 *                       { do: actions.move, params: { angle: 1.5 } }
 *                       Movement costs energy.
 *      rotate: 2,    // rotate cw or ccw:
 *                       { do: actions.rotate, params: { clockwise: true } }
 *                       Doesn't cost energy.
 *      turn:   3,    // turn to specified angle:
 *                       { do: actions.turn, params: { angle: 1.5 } }
 *                       Doesn't cost energy.
 *      shoot:  4,    // shoot. Costs energy, no params needed.
 *                       { do: actions.shoot }
 *      jump:   5,    // jump in specified direction, in radians:
 *                       { do: actions.jump, params: { angle: 1.5 } }
 *      eat:    6,    // eat a bullet, no params needed:
 *                       { do: actions.eat }
 *                       Costs a lot of energy.
 *      spell:  7     // make some street magic:
 *                       { do: actions.spell }
 *                       Costs a lot of energy.
 *                       Some spells require additional params, 
 *                       please see https://github.com/AppCraft-LLC/pubg/wiki/Actions#rhino
 *                       for more details.
 * }
 * 
 * // Possible creature's kinds
 * kinds = { rhino: 0, bear: 1, moose: 2, bull: 3, runchip: 4, miner: 5, sprayer: 6, splitpus: 7 }
 * 
 * // Battleground dimensions
 * ground = { width: 100, height: 100 }
 * 
 * // Hurt per bullet hit
 * bulletDamage = 10
 * 
 * // Energy costs
 * moveEnergyCost = 1
 * shotEnergyCost = 10
 * jumpEnergyCost = 30
 * eatBulletEnergyCost = 60
 * 
 * // How much lives each eaten bullet gives
 * livesPerEatenBullet = 40
 * 
 * 
 * -----------------------
 *        Helpers
 * -----------------------
 * 
 * // Returns distance between two objects. Each of them must has {position} property with {x} and {y} in it/
 * distanceBetween(obj1, obj2)
 * 
 * // Distance between two points.
 * distanceBetweenPoints(pt1, pt2)
 * 
 * // Angle between two objects.
 * angleBetween(obj1, obj2)
 * 
 * // Angle between two points.
 * angleBetweenPoints(pt1, pt2)
 * 
 * // Returns normalized angle. E.g. (PI * 7) converts to (PI), (-PI) converts to (PI).
 * normalizeAngle(angle)
 * 
 * // Returns difference between angles. Angles are normilized automatically.
 * differenceBetweenAngles(ang1, ang2)
 * 
 * // Returns random integer numbers in specified range.
 * randomInt(min, max)
 * 
 * // Returns random angle in radians.
 * randomAngle()
 * 
 * // Check are objects visible to each other.
 * rayBetween(obj1, obj2)
 * 
 */

br_edmund = {
    
    /* Name of your awesome neuro-blockchain algorithm. 10 chars max. */
    name: "Edmund",

    /** 
     * Kind of a creature. 
     * Possible variations are [rhino, bear, moose, bull, runchip, miner, sprayer, splitpus].
     */
    kind: kinds.bear,

    /* 10 chars max, displayed with name of the algorithm on the leaderboard. */
    author: "Amoneron",

    /** 
     * Describe what logic you implemented in this brain
     * so other users can understand your genius thoughts.
     * */
    description: "The basic algorithm for writing your bots",

    /**
     * Loop function called by runner.
     * 
     * @param self contains the sctucture with data of your creature:
     * 
     * { id: 0,             // Unique ID of an object
     *   kills: 0,          // kills counter
     *   deaths: 0,         // deaths counter
     *   iq: 10,            // current IQ of your brain in current match
     *   name: "Megabrain", // name of the creature
     *   author: "Author",  // author of the creature
     *   lives: 100,        // amount of lives. Get max using {creatureMaxLives[self.level]}
     *   bullets: 3,        // amount of bullets your creature has. Limit is {creatureMaxBullets[self.level]}
     *   energy: 100,       // amount of energy. Get max using {creatureMaxEnergy[self.level]} 
     *   level: 0,          // level of the creature. There're 3 levels in the game: 0, 1 and 2.  
     *   position: { x: 10, y: 10 },  // position on the map. Use {ground} struct to get it's dimensions 
     *   velocity: { x: 10, y: 10 },  // contains velocity vector of the creature's body  
     *   angle: 1.5,        // direction the creature looking in, in radians.
     *   speed: 5,          // speed of the body
     *   angularVelocity: 1,// use it to determine is the creature rotating or not
     *   poisoned: false,   // is the creature poisoned or not
     *   spelling: false,   // is the creature spelling or not
     *   message: "Hi!"     // phrase the creature is speaking
     * };
     * 
     * @param enemies contains an array with all other creatures. Can be empty.
     * It doesn't contain your creature, i.e. there is no self struct in it.
     * All elements has the same data like in self struct.
     * 
     * @param bullets an array with all bullets on the ground. Bullet's data has the following structure:
     * 
     * { id: 0,                       // Unique ID of an object
     *   position: { x: 10, y: 10 },  // position on the map
     *   velocity: { x: 10, y: 10 },  // direction of bullet's movement
     *   speed: 5,                    // speed of the bullet
     *   dangerous: false             // true if the speed of the bullet is enough to hurt a creature 
     * };        
     * 
     * @param objects contains all obstacles on the map with the following sctructure:
     * 
     * { id: 0,                       // Unique ID of an object
     *   position: { x: 10, y: 10 },  // position on the map
     *   velocity: { x: 10, y: 10 },  // direction of object's movement
     *   speed: 5,                    // speed of the object
     *   bounds: { min: { x: 5, y: 5 }, max: { x: 15, y: 15 } },
     *                                // AABB region of the object
     *                                // min contains left top corner
     *                                // max contains bottom right corner of the rect
     *   condition: 10,               // condition of the object,
     *                                // measured in the same units as lives of creatures
     *   type: objectTypes.obstacle,  // type of the object, can be:
     *                                // objectTypes = { obstacle: 0, dynamite: 1, star: 2 }
     *   shape: starShapes.levelup    // shape of the object, for stars can be:
     *                                // starShapes = { levelup: 0, healing: 1, poisoned: 2, frozen: 3, death: 4 }
     * };
     * 
     * @param events contains happened events in last loop tick. Can be empty.
     * Each event has the following structure:
     * 
     * { type: eventTypes.birth,  // Type of an event. The following types of events are possible:
     *                            // eventTypes = { wound: 0, murder: 1, death: 2, upgrade: 3, birth: 4, spell: 5 }
     *   payload: [ creature ]    // An array with 1 or 2 creature objects.
     *                            // If contains 2 creatures, the 1st one is the object and the 2nd one is the subject.
     *                            // Payload of [murder] event contains 2 creatures: 
     *                            // the 1st creature is the victim and the 2nd creature is the attacker.
     *                            // Payload of [death, upgrade, birth, spell] events contains 1 creature object.
     *                            // Payload of [wound] may contain or may not contain the attacker.
     * };
     * 
     * @returns a structure with desired action in the following format: 
     * 
     * { do: actions.move,  // desired action. See all variations in the globals consts section. 
     *   params: {          // key value params, not necessary for some actions
     *      angle: 1.5      // desired direction of movement in radians
     *   }
     * };
     * 
     */
    thinkAboutIt: function(self, enemies, bullets, objects, events) {

        // Use max conts as max possible distance between the creature and bullets / enemies
        const max = ground.width + ground.height;
        
        // Declare bullets and distances variables
        let safeBullet, dangerousBullet,
            safeBulletDist = max,
            dangerousBulletDist = max,
            center = { x: ground.width / 2, y: ground.height / 2 };

        // Try to find nearest dangerous bullet to the creature
        // and nearest safe bullet to the center of the ground.
        // Bullets at the corners aren't always easy available,
        // so we go to centered bullet first.
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            dist = distanceBetweenPoints(center, bullet.position);
            if (!bullet.dangerous && dist < safeBulletDist) {
                safeBulletDist = dist;
                safeBullet = bullet;
            }
        });

        // Consider dangerous bullet first.
        // If dangerous bullet found, the distance between it and the creature is not large,
        // it flies right into the creature and it's enough energy to jump, then we jump sideways.
        // It's smarter to walk sideways too if it's not enough energy to jump.
        // It's more smarter to walk sideways even if it's enough energy to jump but
        // the distance between the bullet and the creature is large enough to have time to do that.
        // In this case less energy will be spent to avoid wound.
        if (dangerousBullet && dangerousBulletDist < 200 && self.energy >= jumpEnergyCost) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(dangerousBullet, self);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return { do: actions.jump, params: { angle: bulletAngle + Math.PI / 2.0 } };
            }
        }

        // Consider what to do if we have no bullets or we're alone
        if (self.bullets < 1 || enemies.length < 1 ) {        
            
            // Try to grab safe bullet if possible
            if (safeBullet && self.bullets < creatureMaxBullets[self.level]) {
                let angle = angleBetween(self, safeBullet);
                return { do: actions.move, params: { angle: angle } };
            }
            
            // Otherwise go to center and wait for enemies or bullets.
            // There're more chances to get the next new bullet if we're at the center of the ground.
            let wh = ground.width / 8,  // Determine center area
                hh = ground.height / 8; // 
            if (self.position.x < center.x - wh || self.position.x > center.x + wh ||
                self.position.y < center.y - hh || self.position.y > center.y + hh) {
                    return { do: actions.move, params: { angle: angleBetweenPoints(self.position, center) } };
            }
            else {
                // Do nothing if we're at the center area.
                return { do: actions.none };
            }  

        }
        else {

            // Eat bullet to heal itself or do nothing to accumulate enough energy
            // if the creature has less then 25% of lives.
            if (self.lives < creatureMaxLives[self.level] * 0.25) {
                return { do: self.energy >= eatBulletEnergyCost ? actions.eat : actions.none }; 
            }
    
            // Otherwise find the nearest enemy.
            // It's smarter to consider other enemies data, 
            // e.g. you can search for the enemy with least amount of lives.
            // Or you can listen to events to determine who attacks you
            // and attack your attacker first to prevent killing you by other creatures 
            // while you're hunting.
            let enemy = enemies[0],
                enemyDist = max;
            enemies.forEach(e => {
                let dist = distanceBetween(self, e);
                if (dist < enemyDist) {
                    enemyDist = dist;
                    enemy = e;
                }
            });
            let directionAngle = angleBetween(self, enemy);
            const backlash = Math.PI / 50.0;

            // Check enough energy for hunting
            if (self.energy > shotEnergyCost + 20 /* for pursuit */) {
                // Shoot if we're looking right at the enemy.
                // It's smarter to check the distance first.
                // It's more smarter to also check are creatures visible to each other or not
                // using rayBetween(self, enemy) function.
                let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
                if (diff < backlash) {
                    return { do: actions.shoot };
                }
                else {
                    // And move to it otherwise.
                    // It's smarter to turn to specified angle if the distance between creatures
                    // aren't large enough to save energy.
                    return { do: actions.move, params: { angle: directionAngle } };
                }
            }
        }

        // Do nothing in all other cases.
        // Please end with this line all your brains
        // to be sure you return right struct in the thinkAboutIt function.
        return { do: actions.none };
    }
    
};
