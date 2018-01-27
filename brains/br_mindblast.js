
br_mindblast = {

    name: 'Mindblast',
    kind: kinds.splitpus,
    author: 'Analytic',

    bot: {},
    message: null,

    target: null,
    targetKilledTimestamp: null,

    tripleshot: false,

    progress: 0,

    // BOT ACTIONS
    idleBot: function () {
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
        return {
            do: actions.eat,
            params: {
                message: this.message ? this.message : undefined
            }
        };
    },

    // MAIN Think about it 
    thinkAboutIt: function (self, enemies, bullets, objects, events) {
        this.bot = self;
        this.message = null;
        const now = Date.now();

        this.progress += 1;
        if (this.progress > 100) {
            this.progress = 0;
        }

        //Ситуация с пульками
        const bulletSituation = this.getBulletsSituation(bullets);
        //Проверка с действием: меньше трех пуль и есть видимая пуля
        const goToBulletIfNeeded = this.goToNearestBullet(bulletSituation);
        //Проверка можно ли отхилиться
        const canHeal = this.checkCanHeal();

        this.target = this.findTarget(enemies);

        //Если цель не была найдена
        if (!this.target) {
            if (canHeal) {
                this.message = 'Healing brain neurons...' + this.progress + '%';
                return this.eatBot();
            } else if (goToBulletIfNeeded) {
                return goToBulletIfNeeded;
            } else {
                return this.survive(enemies);
            }
        }

        //Режим тройного выстрела
        if (this.tripleshot) {
            if (this.bot.energy < 3 * shotEnergyCost) {
                this.message = 'Break ' + this.target.name + ' mind protection...' + this.progress + '%';
                return this.idleBot();
            } else {
                if (this.bot.bullets < 1) {
                    this.tripleshot = false;
                    return this.idleBot();
                } else {
                    this.message = 'Triple mind blasting...' + this.progress + '%';
                    return this.prepareAttack(this.target, 320);
                }
            }
        } //ОБЫЧНЫЙ РЕЖИМ 
        else {
            if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet) {
                if (canHeal) {
                    this.message = 'Downloading health updates...' + this.progress + '%';
                    return this.eatBot();
                } else if (goToBulletIfNeeded) {
                    return goToBulletIfNeeded;
                } else {
                    return this.survive(enemies);
                }
            }

            if (this.bot.bullets == creatureMaxBullets[this.bot.level]) {
                this.tripleshot = true;
            } else if (goToBulletIfNeeded) {
                return goToBulletIfNeeded;
            } else {
                return this.survive(enemies);
            }

            return this.idleBot();
        }
    },

    findTarget: function (enemies) {
        let target = null;
        let iq = -1;
        enemies.forEach(e => {
            if (e.iq > iq) {
                target = e;
                iq = e.iq;
            }
        });
        return target;
    },

    checkTarget: function (enemies) {
        const exists = enemies.filter(e => {
            return e.id == this.target.id;
        })
        if (exists && exists.length > 0) {
            return exists[0];
        } else {
            return null;
        }
    },

    prepareAttack: function (target, shootDistance) {

        const angle = angleBetween(this.bot, target);
        const distance = distanceBetween(this.bot, target);

        if (this.bot.energy < shotEnergyCost) {
            return this.idleBot();
        }
        if (distance <= shootDistance && rayBetween(this.bot, target)) {
            const d = Math.abs(differenceBetweenAngles(this.bot.angle, angle));
            const b = Math.PI / 35.0;

            if (d < b) {
                this.message = target.name + ", your IQ will be mine!";
                return this.shootBot();
            } else {

                return this.turnBot(angle);
            }
        } else {
            return this.moveBot(angle);
        }
    },

    moveToTarget: function () {
        const angle = angleBetween(this.bot, this.target);
        return this.moveBot(angle);
    },

    moveNearToTarget: function (shootDistance) {
        const distance = distanceBetween(this.bot, this.target);
        const angle = angleBetween(this.bot, this.target);
        if (distance < shootDistance) {
            return this.turnBot(angle);
        } else {
            return this.moveBot(angle);
        }
    },

    getBulletsSituation: function (bullets) {
        const safeBullets = bullets.filter(bullet => {
            return !bullet.dangerous;
        });
        if (safeBullets.length < 1) {
            return null;
        }
        let resultBullets = [];
        let nearestBullet;
        let temp = ground.width + ground.height;

        safeBullets.forEach(bullet => {
            if (rayBetween(this.bot, bullet)) {
                resultBullets.push(bullet);
                let d = distanceBetween(this.bot, bullet);
                if (d < temp) {
                    nearestBullet = bullet;
                    temp = d;
                }
            }
        });
        if (resultBullets.length > 0) {
            return {
                nearest: nearestBullet,
                bullets: resultBullets,
            }
        } else {
            return null;
        }
    },

    goToNearestBullet: function (bulletSituation) {
        if (bulletSituation && this.bot.bullets < creatureMaxBullets[this.bot.level]) {
            const angle = angleBetween(this.bot, bulletSituation.nearest);
            return this.moveBot(angle);
        } else {
            return null;
        }
    },

    checkCanHeal: function () {
        return this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.energy >= eatBulletEnergyCost && this.bot.bullets > 0;
    },

    survive: function (enemies) {
        let suspiciousArray = [];
        let suspicious = null;
        const b = Math.PI / 20.0;
        let temp = Math.PI / 20;

        enemies.forEach(e => {
            let dist = distanceBetween(this.bot, e);
            const angle = angleBetween(e, this.bot);
            const d = Math.abs(differenceBetweenAngles(e.angle, angle));
            if (rayBetween(this.bot, e) && e.bullets > 0 && d < b && dist < 500) {
                suspiciousArray.push(e);
                if (d < temp) {
                    suspicious = e;
                    temp = d;
                }
            }
        });

        if (suspiciousArray.length < 1) {
            this.message = 'Teaching neural network...' + this.progress + '%';
            return this.idleBot();
        }

        const angle = angleBetween(suspicious, this.bot);
        const d = Math.abs(differenceBetweenAngles(suspicious.angle, angle));
        if (d < b) {
            if (d > Math.PI) {
                return this.moveBot(suspicious.angle - Math.PI / 2.0);
            } else {
                return this.moveBot(suspicious.angle + Math.PI / 2.0);
            }
        }
        this.message = 'Hacking nearest brain...' + this.progress + '%';
        return this.idleBot();
    },
};