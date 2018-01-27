
br_utilizator = {

    name: 'UtilizatoR',

    kind: kinds.miner,

    author: 'macMini',

    bot: {},

    message: null,
    target: null,
    checkHealthTimestamp: Date.now(),

    previoiusBulletCount: 1,

    // BOT ACTIONS
    idleBot: function () {
        if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.energy >= eatBulletEnergyCost && this.bot.bullets > 0) {
            this.message = this.bot.lives + ' HP. Now healing.';
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
            message += '\nRecovering.';
        } else {
            message = 'Recovering.';
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

        if (this.bot.bullets == this.previoiusBulletCount + 1) {
            this.message = 'Found bullet';
            this.idleBot();
        }
        this.previoiusBulletCount = this.bot.bullets;


        if ((now - this.checkHealthTimestamp) / 1000 > 30) {
            this.checkHealthTimestamp = now;
            this.message = 'Alert! Checking health...';
            return this.idleBot();
        }

        const target = this.findTarget(enemies);
        if (target) {
            const distance = distanceBetween(this.bot, target);
            if ((distance < 400 && this.bot.bullets >= 1) || this.bot.bullets >= creatureMaxBullets[this.bot.level]) {
                return this.prepareAttack(target);
            }
        }

        const goToBulletIfNeeded = this.goToBullet(bullets);
        if (goToBulletIfNeeded) {
            return goToBulletIfNeeded;
        } else {
            return this.idleBot();
        }
    },

    prepareAttack: function (target) {

        const angle = angleBetween(this.bot, target);
        const distance = distanceBetween(this.bot, target);

        if (this.bot.energy < shotEnergyCost) {
            this.message = 'Charging...' + Math.floor(this.bot.energy) + '/' + shotEnergyCost + '%';
            return this.idleBot();
        }
        if (distance <= 430 && rayBetween(this.bot, target)) {
            const d = Math.abs(differenceBetweenAngles(this.bot.angle, angle));
            const b = Math.PI / 35.0;
            if (d < b) {
                this.message = target.name + ', you must be utilized!';
                return this.shootBot();
            } else {
                return this.turnBot(angle);
            }
        } else {
            this.message = target.name + ', I will find you!';
            return this.moveBot(angle);
        }
    },

    findTarget: function (enemies) {
        let target = null;
        let temp = 0;
        enemies.forEach(e => {
            if (e.bullets > temp) {
                temp = e.bullets;
                target = e;
            }
        });
        return target;
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