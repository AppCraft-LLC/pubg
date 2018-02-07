
br_hodor = {    
    
    name: "Hodor",
    kind: kinds.moose,
    author: "Martin",
    description: "Kills the creature who talks more than others.",

    creatures: [],
    desired: null,


    thinkAboutIt: function(self, enemies, bullets, objects, events) {

        let target = null,
            counter = 0;
        enemies.forEach(e => {
            let fid = -1;
            for (let i = 0; i < this.creatures.length; i++) {
                let c = this.creatures[i];
                if (c.id == e.id) {
                    c.exists = true;
                    fid = i;
                    if (c.message != e.message) {
                        c.message = e.message;
                        c.counter++;
                    }
                    break;
                }                
            }
            if (fid < 0) {
                this.creatures.push({ id: e.id, message: e.message, exists: true, counter: 0 });
            } 
            else 
                if (this.creatures[fid].counter > counter && rayBetween(self, e)) {
                    target = e;
                    counter = this.creatures[fid].counter;
                }
        });

        for (let i = this.creatures.length - 1; i >= 0; i--) {
            if (!this.creatures[i].exists) this.creatures.splice(i, 1);
        }

        const max = ground.width + ground.height;
        
        let dangerousBullet,
            dangerousBulletDist = max,
            center = { x: ground.width / 2, y: ground.height / 2 };

        let drops = [],
            exists = false;
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            if (this.desired == null && bullet.speed < 0.1) drops.push(bullet);
            if (this.desired && this.desired.id == bullet.id) exists = true;
        });

        if (!exists) this.desired = null;
        if (this.desired == null) this.desired = drops[randomInt(0, drops.length - 1)];

        if (dangerousBullet && dangerousBulletDist < 200 && self.energy >= jumpEnergyCost) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(dangerousBullet, self);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return { do: actions.jump, params: { angle: bulletAngle + Math.PI / 2.0 } };
            }
        }

        if (self.lives < creatureMaxLives[self.level] * 0.5 && self.bullets > 0) {
            if (self.energy >= eatBulletEnergyCost) return { do: actions.eat }; 
            let corners = [ { x: 0, y: 0 }, 
                            { x: ground.width, y: 0 }, 
                            { x: ground.width, y: ground.height },
                            { x: 0, y: ground.height } ],
                dist = max,
                corner;
            corners.forEach(c => {
                if (distanceBetweenPoints(self.position, c) < dist) {
                    dist = distanceBetweenPoints(self.position, c);
                    corner = c;
                }
            })
            if (dist > 120) {
                return { do: actions.move, params: { angle: angleBetweenPoints(self.position, corner) } };
            }
            else
                return { do: self.energy >= eatBulletEnergyCost ? actions.eat : actions.none }; 
        }

        if (this.desired && self.bullets < creatureMaxBullets[self.level]) {
            let angle = angleBetween(self, this.desired);
            return { do: actions.move, params: { angle: angle } };
        }

        if (self.level > 0 && self.lives < creatureMaxLives[self.level] * 0.7 && self.energy >= invisibleEnergyCost) {
            return { do: actions.spell };
        }
        
        if (target && self.energy > shotEnergyCost + 20 /* for pursuit */) {
            let directionAngle = angleBetween(self, target);
            let dist = distanceBetween(self, target);
            if (dist < 100) return { do: actions.none };
            if (dist > 300) return { do: actions.move, params: { angle: directionAngle } };
            const backlash = Math.PI / 50.0;
            let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
            if (diff < backlash) return { do: actions.shoot };
            else return { do: actions.turn, params: { angle: directionAngle } };
        }

        return { do: actions.none };
    }
};
