
br_yssysin = {

    name: 'YSSYSIN',

    kind: kinds.rhino,

    author: 'X-Ray',

    bot: {},

    message: null,
    target: null,
    targetKilledTimestamp: null,

    // BOT ACTIONS
    idleBot: function () {
        if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.energy >= eatBulletEnergyCost && this.bot.bullets > 0) {
            return this.eatBot();
        } else {
            let params = undefined;
            if (this.message) {
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
                message: this.message ? this.message : undefined
            }
        };
    },
    rotateBot: function (clockwise) {
        return {
            do: actions.rotate,
            params: {
                clockwise: clockwise,
                message: this.message ? this.message : undefined
            }
        }
    },
    turnBot: function (angle) {
        return {
            do: actions.turn,
            params: {
                angle: angle,
                message: this.message ? this.message : undefined
            }
        }
    },
    jumpBot: function (angle) {
        return {
            do: actions.jump,
            params: {
                angle: angle,
                message: this.message ? this.message : undefined
            }
        };
    },
    shootBot: function () {
        let params = undefined;
        if (this.message) {
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
        let message = this.message;

        if (message) {
            message += '\nFirst aid done';
        } else {
            message = 'First aid done';
        }

        return {
            do: actions.eat,
            params: {
                message: message
            }
        };
    },

    // MAIN Think about it 
    thinkAboutIt: function (self, enemies, bullets, objects, events) {
        this.bot = self;
        this.message = null;
        const now = Date.now();

        const goToBulletIfNeeded = this.goToBullet(bullets);

        if (this.target) {
            const exists = enemies.filter(e => {
                return e.id == this.target.id;
            })
            if (!exists || exists.length < 1) {
                this.target = null;
                this.targetKilledTimestamp = now;
            }
        }
        if (this.targetKilledTimestamp) {
            if ((now - this.targetKilledTimestamp) / 1000 > 7) {
                this.targetKilledTimestamp = null;
            } else {
                this.message = 'Washing blood';
                return this.idleBot();
            }
        }

        if (!this.target) {
            if (enemies.length < 2) {
                this.message = "Who's next?";
                return this.idleBot();
            } else {
                const index = randomInt(0, enemies.length - 1);
                this.target = enemies[index];
                this.message = this.target.name + ', you are my target!';
            }
        }

        const distance = distanceBetween(this.bot, this.target);
        if ((distance < 300 && this.bot.bullets >= 1) || this.bot.bullets >= creatureMaxBullets[this.bot.level]) {
            return this.prepareAttack(this.target);
        } else if (goToBulletIfNeeded) {
            return goToBulletIfNeeded;
        } else {
            return this.idleBot();
        }
    },

    prepareAttack: function (target) {

        const angle = angleBetween(this.bot, target);
        const distance = distanceBetween(this.bot, target);

        if (this.bot.energy < shotEnergyCost) {
            this.message = 'Prepare to attack';
            return this.idleBot();
        }
        if (distance <= 320 && rayBetween(this.bot, target)) {
            const d = Math.abs(differenceBetweenAngles(this.bot.angle, angle));
            const b = Math.PI / 35.0;
            this.message = 'Killing ' + target.name;
            if (d < b) {
                return this.shootBot();
            } else {
                return this.turnBot(angle);
            }
        } else {
            return this.moveBot(angle);
        }
    },

    findBullet: function (bullets, inSector) {
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
            if (rayBetween(this.bot, bullet) && d < temp) {
                targetBullet = bullet;
                temp = d;
            }
        });
        return targetBullet;
    },

    goToBullet: function (bullets) {
        const saveBullet = this.findBullet(bullets);
        if (saveBullet && this.bot.bullets < creatureMaxBullets[this.bot.level]) {
            const angle = angleBetween(this.bot, saveBullet);
            return this.moveBot(angle);
        } else {
            return null;
        }
    }
};