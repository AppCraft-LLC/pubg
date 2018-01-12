//
//  Programmer Unknown's BattleGround
//  Base Ape Algorithm
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
 * creatureMaxBullets = 3;
 * 
 * // Possible actions
 * actions = { 
 *      none:   0,    // do nothing, no energy required. No params needed.
 *      move:   1,    // move in specified direction, in radians:
 *                       { do: actions.move, params: { angle: 1.5 } }
 *                       Movement costs energy.
 *      turn:   2,    // rotate cw or ccw:
 *                       { do: actions.turn, params: { clockwise: true } }
 *                       Doesn't cost energy.
 *      shoot:  3,    // shoot. Costs energy, no params needed.
 *                       { do: actions.shoot }
 *      jump:   4,    // jump in specified direction, in radians:
 *                       { do: actions.jump, params: { angle: 1.5 } }
 *      eat:    5     // eat a bullet, no params needed:
 *                       { do: actions.eat }
 *                       Costs a lot of energy.
 * }
 * 
 * // Possible creature's kinds
 * kinds = { rhino: 0, bear: 1, moose: 2, bull: 4 }
 * 
 * // Battleground dimensions
 * ground = { width: 100, height: 100 }
 * 
 * // Hurt per bullet hit
 * bulletDamage = 10
 * 
 * // Energy costs
 * shotEnergyCost = 30
 * jumpEnergyCost = 50
 * eatBulletEnergyCost = 100
 * 
 * // How much lives each eaten bullet gives
 * livesPerEatenBullet = 20
 * 
 * 
 * -----------------------
 *        Helpers
 * -----------------------
 * 
 * // Returns distance between two objects. Each of them must has {postision} property with {x} and {y} in it/
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
 */

Brain_0 = {
    
    /* Name of your awesome neuro-blockchain algorithm. 10 chars max. */
    name: "Ape",

    /** 
     * Kind of a creature. 
     * Possible variations are [rhino, bear, moose, bull].
     */
    kind: kinds.bull,

    /* 10 chars max, displayed with name of the algorithm on the leaderboard. */
    author: "Nature",

    /**
     * Loop function called by runner.
     * 
     * @param self contains the sctucture with data of your creature:
     * 
     * { id: 0,             // Unique ID of an object
     *   lives: 100,        // amount of lives. Get max using {creatureMaxLives[self.level]}
     *   bullets: 3,        // amount of bullets your creature has. Limit is {creatureMaxBullets}
     *   energy: 100,       // amount of energy. Get max using {creatureMaxEnergy[self.level]} 
     *   level: 0,          // level of the creature. There're 3 levels in the game: 0, 1 and 2.  
     *   position: { x: 10, y: 10 },  // position on the map. Use {ground} struct to get it's dimensions 
     *   velocity: { x: 10, y: 10 },  // contains velocity vector of the creature's body  
     *   angle: 1.5,        // direction the creature looking in, in radians.
     *   speed: 5,          // speed of the body
     *   angularVelocity: 1 // use it to determine is the creature rotating or not
     * };
     * 
     * @param enemies contains an array with all other creatures. Can be empty.
     * It doesn't contain your creature, i.e. there is no self struct in it.
     * All elements has the same data like in self struct.
     * 
     * @param bullets an array with all free bullets. Bullet's data has the following structure:
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
     *   speed: 5                     // speed of the object
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

        let safeBullet, dangerousBullet;
        const max = ground.width + ground.height;
        let safeBulletDist = max,
            dangerousBulletDist = max;

        // Looking for nearest bullets
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            if (!bullet.dangerous && dist < safeBulletDist) {
                safeBulletDist = dist;
                safeBullet = bullet;
            }
        });

        // Consider dangerous bullet first
        if (dangerousBullet) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(self, dangerousBullet);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return { do: actions.jump, params: { angle: bulletAngle + Math.PI / 2.0 } };
            }
        }

        // Consider save bullet. Just nearest.
        if (safeBullet && self.bullets < creatureMaxBullets) {
            let angle = angleBetween(self, safeBullet);
            return { do: actions.move, params: { angle: angle } };
        }

        // Do nothing if there's no anyone else
        if (self.bullets < 1 || enemies.length < 1 ) {
            return { do: actions.none, params: { message: "Yeahh" } };
        }
        else {
            // Check enough energy for hunting
            if (self.energy > shotEnergyCost + 10 /* for pursuit */) {
                // First enemy, whithout hesitation
                let enemy = enemies[0];
                let directionAngle = angleBetween(self, enemy);
                const backlash = Math.PI / 50.0;
                let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle) - Math.PI);
                if (diff < backlash) {
                    return { do: actions.shoot };
                }
                else {
                    return { do: actions.move, params: { angle: directionAngle } };
                }
            }   
        }
 
        return { do: actions.none };
    }
    
};
