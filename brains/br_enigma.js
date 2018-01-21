
br_enigma = {
    
    /* Name of your awesome neuro-blockchain algorithm. 10 chars max. */
    name: "Enigma",

    /** 
     * Kind of a creature. 
     * Possible variations are [rhino, bear, moose, bull].
     */
    kind: kinds.miner,

    /* 10 chars max, displayed with name of the algorithm on the leaderboard. */
    author: "Amoneron",

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

        if (!this.stuffGot) {
            this.stuffGot = true;
            this.getStuff();
        }

        let safeBullet, dangerousBullet;
        const max = ground.width + ground.height,
              center = { x: ground.width / 2, y: ground.height / 2 };
        let safeBulletDist = max,
            dangerousBulletDist = max,
            shouldJump = self.bullets == 0;

        // Looking for nearest bullets
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            
            dist = distanceBetween(self, bullet);
            let near = false;
            for (let i = 0; i < enemies.length; i++) {
                if (distanceBetween(enemies[i], bullet) < dist) {
                    near = true;
                    break;
                }
            }
            if (shouldJump) near == false;

            if (!bullet.dangerous && dist < safeBulletDist && !near) {
                safeBulletDist = dist;
                safeBullet = bullet;
            }
        });

        // Consider dangerous bullet first
        if (dangerousBullet && self.energy >= jumpEnergyCost) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(dangerousBullet, self);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return { do: actions.jump, params: { angle: bulletAngle + Math.PI / 2.0 } };
            }
        }

        // Consider heal
        if (self.lives < creatureMaxLives[self.level] * 0.3) {
            return { do: self.energy >= eatBulletEnergyCost ? actions.eat : actions.none };
        }

        // Consider save bullet. Just nearest.
        if (safeBullet && self.bullets == 0) {
            let angle = angleBetween(self, safeBullet),
                dist = distanceBetween(self, safeBullet);
            return { do: dist < 100 ? actions.jump : actions.move , params: { angle: angle } };
        }

        // Check enough energy for hunting
        if (self.energy > shotEnergyCost + 5 /* for pursuit */ && self.bullets > 0) {
            let enemy,
                health = 1000;
            enemies.forEach(e => {
                if (e.lives < health && distanceBetween(self, e) > 150 && rayBetween(self, e)) {
                    enemy = e;
                    health = e.lives;
                }
            });
            if (enemy) {
                let directionAngle = angleBetween(self, enemy);
                if (distanceBetween(self, enemy) < 300) {
                    const backlash = Math.PI / 50.0;
                    let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
                    if (diff < backlash) {
                        return { do: actions.shoot };
                    }
                    else {
                        return { do: actions.turn, params: { angle: directionAngle } };
                    }    
                }
                else {
                    return { do: actions.move, params: { angle: directionAngle } };
                }
            }
        }       

        // Do nothing
        return { do: actions.none };
    },

    stuffGot: false,
    messages: [],

    jsonRequest: function(url, callback) {
        let req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "json";
        req.onload = callback;
        req.send();
    },

    getStuff: function() {

        // BTC rate
        this.jsonRequest("https://api.coindesk.com/v1/bpi/currentprice.json", (data) => {
            if (data.target.status === 200) {
                let info = data.target.response,
                    msg = `1 BTC = $${info.bpi.USD.rate}`;
                this.messages.push(msg);
            }
        });
        
        // Weather
        this.jsonRequest("https://query.yahooapis.com/v1/public/yql?q=select%20item.condition%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22Ryazan%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys", (data) => {
            if (data.target.status === 200) {
                let info = data.target.response,
                    f = parseInt(info.query.results.channel.item.condition.temp),
                    c = Math.round((f-32)*5/9),
                    cond = info.query.results.channel.item.condition.text;
                this.messages.push(`It's ${c}°C now`);
                this.messages.push(`It's ${cond.toLowerCase()} now`);
            }
        });
        
    }
    
};
