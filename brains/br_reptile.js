
br_reptile = {

    name: 'Reptile',

    kind: kinds.runchip,

    author: 'vaskebjørn',

    bot: {},

    findBulletTimestamp: null,
    bulletId: null,
    ignoringBullets: [],

    lastJumpTimestamp: Date.now(),

    silentMode: true,
    silentModeTimestamp: Date.now(),

    center: {
        x: ground.width / 2,
        y: ground.height / 2
    },

    squares: [{
        x: ground.width / 4,
        y: ground.height / 4,
        width: ground.width / 2,
        height: ground.height / 2,
        position: {
            x: 80,
            y: 80
        }
    },
    {
        x: ground.width / 2 + ground.width / 4,
        y: ground.height / 4,
        width: ground.width / 2,
        height: ground.height / 2,
        position: {
            x: ground.width - 80,
            y: 80
        }
    },
    {
        x: ground.width / 4,
        y: ground.height / 2 + ground.height / 4,
        width: ground.width / 2,
        height: ground.height / 2,
        position: {
            x: 80,
            y: ground.height - 80
        }
    },
    {
        x: ground.width / 2 + ground.width / 4,
        y: ground.height / 2 + ground.height / 4,
        width: ground.width / 2,
        height: ground.height / 2,
        position: {
            x: ground.width - 80,
            y: ground.height - 80
        }
    }
    ],

    message: null,

    near: 400,

    goToPoint: function (point) {
        // Determine center area
        const wh = ground.width / 20,
            hh = ground.height / 20;

        if (this.bot.position.x < point.x - wh || this.bot.position.x > point.x + wh ||
            this.bot.position.y < point.y - hh || this.bot.position.y > point.y + hh) {
            return this.moveBot(angleBetweenPoints(this.bot.position, point));
        } else {
            return this.idleBot();
        }
    },

    findTarget: function (enemies) {
        let target = null;
        enemies.forEach(e => {
            if (e.lives > 0 && e.lives <= this.bot.bullets * bulletDamage) {
                target = e;
            }
        });
        return target;
    },

    idleBot: function () {
        if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.energy >= eatBulletEnergyCost && this.bot.bullets > 0) {
            return this.eatBot();
        } else {
            let params = undefined;
            if (!this.silentMode && this.message) {
                params = {
                    message: this.message
                };
            }
            return {
                do: actions.none,
                params: params
            };
        }
    },
    moveBot: function (angle) {
        return {
            do: actions.move,
            params: {
                angle: angle,
                message: !this.silentMode && this.message ? this.message : undefined
            }
        };
    },
    rotateBot: function (clockwise) {
        return {
            do: actions.rotate,
            params: {
                clockwise: clockwise,
                message: !this.silentMode && this.message ? this.message : undefined
            }
        }
    },
    turnBot: function (angle) {
        return {
            do: actions.turn,
            params: {
                angle: angle,
                message: !this.silentMode && this.message ? this.message : undefined
            }
        }
    },
    jumpBot: function (angle) {
        return {
            do: actions.jump,
            params: {
                angle: angle,
                message: !this.silentMode && this.message ? this.message : undefined
            }
        };
    },
    shootBot: function () {
        let params = undefined;
        if (!this.silentMode && this.message) {
            params = {
                message: this.message
            };
        }
        return {
            do: actions.shoot,
            params: params
        };
    },

    eatBot: function () {
        return {
            do: actions.eat,
            params: {
                message: !this.silentMode ? 'Hrrhhealing...' : undefined
            }
        };
    },

    attackTarget: function (target, angle) {
        const d = Math.abs(differenceBetweenAngles(this.bot.angle, angle));
        const b = Math.PI / 30.0;
        if (!rayBetween(this.bot, target)) {
            this.message = "You can't hide, " + target.name;
            return this.moveBot(angle);
        } else if (d < b) {
            this.message = "Hrrrh, " + target.name + ', gg!';
            return this.shootBot();
        } else {
            this.message = "Hrrrh, " + target.name + ', get ready!';
            return this.turnBot(angle);
        }
    },

    prepareAttack: function (target) {

        const angle = angleBetween(this.bot, target);
        const distance = distanceBetween(this.bot, target);

        if (this.bot.energy < shotEnergyCost) {
            this.message = "Hrrh, feel my power\n" + target.name;
            return this.idleBot();
        }
        if (distance > 350) {
            this.message = "Hrhh, come closer\n" + target.name;
            return this.moveBot(angle);
        } else {
            return this.attackTarget(target, angle);
        }
    },

    findBullet: function (bullets) {
        const safeBullets = bullets.filter(bullet => {
            return !bullet.dangerous;
        });
        if (safeBullets.length < 1) {
            return null;
        }
        let targetBullet;
        let temp = ground.width + ground.height;

        safeBullets.forEach(bullet => {
            let d = distanceBetween(this.bot, bullet);
            if (rayBetween(this.bot, bullet) && d < temp && this.ignoringBullets.indexOf(bullet.id) < 0) {
                targetBullet = bullet;
                temp = d;
            }
        });
        return targetBullet;
    },

    findDangerous: function (bullets) {
        const dangerousBullets = bullets.filter(bullet => {
            return bullet.dangerous;
        });
        if (dangerousBullets.length < 1) {
            return null;
        }
        let dangerous;
        let temp = ground.width + ground.height;

        dangerousBullets.forEach(bullet => {
            let d = distanceBetween(this.bot, bullet);
            if (rayBetween(this.bot, bullet) && d < temp) {
                dangerous = bullet;
                temp = d;
            }
        });
        if (!dangerous) {
            return null;
        }
        return {
            bullet: dangerous,
            distance: temp
        };
    },

    checkAchtung: function (enemies) {
        const achtungZone = {
            minX: this.bot.position.x - this.near / 2,
            maxX: this.bot.position.x + this.near / 2,
            minY: this.bot.position.y - this.near / 2,
            maxY: this.bot.position.y + this.near / 2,
        }
        let achtungSource = null;
        let temp = ground.width + ground.height;
        enemies.forEach(e => {
            let d = distanceBetween(this.bot, e);
            if (rayBetween(this.bot, e) && e.bullets > 0 && d < temp) {
                achtungSource = e;
                temp = d;
            }
        });

        if (!achtungSource) {
            this.message = 'Hrrhrr! Safe zone';
            return this.idleBot();
        }

        const angle = angleBetween(achtungSource, this.bot);
        const d = Math.abs(differenceBetweenAngles(achtungSource.angle, angle));
        const b = Math.PI / 20.0;
        if (d < b) {
            if (d > Math.PI) {
                this.message = 'Hrrhrr! Get away!\n' + achtungSource.name;
                return this.moveBot(achtungSource.angle - Math.PI / 2.0);
            } else {
                this.message = 'Hrrhrr! Catch me!\n' + achtungSource.name;
                return this.moveBot(achtungSource.angle + Math.PI / 2.0);
            }
        }
        this.message = "Hrr! I see you!\n" + achtungSource.name;
        return this.idleBot();
    },


    thinkAboutIt: function (self, enemies, bullets, objects, events) {
        this.bot = self;
        this.message = null;
        const now = Date.now();

        if ((now - this.silentModeTimestamp) / 1000 >= 60) {
            this.silentModeTimestamp = now;
            this.silentMode = !this.silentMode;
        }

        const dangerous = this.findDangerous(bullets);
        if (dangerous) {
            let bulletAngle = Math.atan2(dangerous.bullet.velocity.y, dangerous.bullet.velocity.x);
            let collisionAngle = angleBetween(dangerous.bullet, this.bot);
            const b = Math.PI / 25.0;
            let d = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (d < b) {
                const moveAngle = bulletAngle + Math.PI / 2.0;
                if (this.bot.level > 2 && dangerous.distance >= 250 && this.bot.energy >= jumpEnergyCost && (now - this.lastJumpTimestamp) / 1000 > 10) {
                    this.message = 'Jump';
                    return this.jumpBot(moveAngle)
                } else {
                    this.message = 'Pew-Pew Miss-Miss';
                    return this.moveBot(moveAngle);
                }
                // this.message = 'Pew-Pew Miss-Miss';
                // return this.moveBot(moveAngle);
            }
        }

        if (this.bot.level >= 3 && this.bot.lives <= creatureMaxLives[this.bot.level] * 0.5) {
            this.message = 'Hhrrhh...';
            return this.checkAchtung(enemies);
        }

        const target = this.findTarget(enemies);
        if (target && this.bot.bullets > 0) {
            return this.prepareAttack(target);
        }

        const saveBullet = this.findBullet(bullets);
        if (saveBullet && this.bot.bullets < creatureMaxBullets[this.bot.level]) {
            if (saveBullet.id !== this.bulletId) {
                this.findBulletTimestamp = Date.now();
                this.bulletId = saveBullet.id;
            } else if ((now - this.findBulletTimestamp) / 1000 > 12) {
                this.ignoringBullets.push(saveBullet.id);
                this.bulletId = null;
                this.findBulletTimestamp = null;
            }
            this.message = 'Hhrrhh, bullet ' + saveBullet.id + ' is mine!';
            const angle = angleBetween(this.bot, saveBullet);
            return this.moveBot(angle);
        }

        return this.checkAchtung(enemies);

    }

};