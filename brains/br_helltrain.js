
br_helltrain = {

    name: 'Helltrain',
    kind: kinds.miner,
    author: 'Devil',
    description: "Demon from Hell.",

    bot: {},
    message: null,

    target: null,
    targetKilledTimestamp: null,
    killedName: null,

    hellrage: false,
    preparing: false,

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

        //Ситуация с пульками
        const bulletSituation = this.getBulletsSituation(bullets);
        //Проверка с действием: меньше трех пуль и есть видимая пуля
        const goToBulletIfNeeded = this.goToNearestBullet(bulletSituation);
        //Проверка можно ли отхилиться
        const canHeal = this.checkCanHeal();


        //Проверка на наличие цели
        if (this.target) {
            const check = this.checkTarget(enemies);
            //Проверка существует ли цель
            if (check) {
                this.target = check;
            } else {
                this.killedName = this.target.name;
                this.target = null;
                //Время когда завалили
                this.targetKilledTimestamp = now;

                this.hellrage = false;
                this.preparing = false;
            }
        }
        //Если есть время фрага
        if (this.targetKilledTimestamp) {
            //10 сек передышка
            if ((now - this.targetKilledTimestamp) / 1000 > 12) {
                //Передышка закончилась
                this.targetKilledTimestamp = null;
                this.hellrage = false;
                this.target = null;
                this.preparing = false;
                return this.survive(enemies);
            } else {
                //Передышка
                this.message = 'TOUCHDOWN!!!\nJUST SLAM ' + this.killedName;
                if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet) {
                    if (canHeal) {
                        this.message = 'JUST REPAIRED';
                        return this.eatBot();
                    } else if (goToBulletIfNeeded) {
                        return goToBulletIfNeeded;
                    } else {
                        return this.survive(enemies);
                    }
                }
            }
        }

        //Если нет цели - найти цель
        if (!this.target) {
            this.target = this.findTarget(enemies);
        }
        //Если цель не была найдена
        if (!this.target) {
            if (canHeal) {
                this.message = 'JUST REPAIRED';
                return this.eatBot();
            } else if (goToBulletIfNeeded) {
                return goToBulletIfNeeded;
            } else {
                return this.survive(enemies);
            }
        }

        if (this.hellrage) {

            if (this.bot.bullets > 0) {
                this.message = 'HELLRAGE';
                return this.prepareAttack(this.target, 320);
            } else if (bulletSituation && bulletSituation.nearest && distanceBetween(this.bot, bulletSituation.nearest) < 200) {
                return goToBulletIfNeeded;
            } else {
                this.hellrage = false;
                this.preparing = false;
                return this.idleBot();
            }
        } else if (this.preparing) {
            if (this.target.lives <= 2 * bulletDamage) {
                this.preparing = false;
                this.hellrage = true;
                return this.idleBot();
            } else if (this.target.lives > 4 * bulletDamage) {
                this.preparing = false;
                this.hellrage = false;
                return this.idleBot();
            }
            if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet) {
                if (canHeal) {
                    this.message = 'JUST REPAIRED';
                    return this.eatBot();
                } else if (goToBulletIfNeeded) {
                    return goToBulletIfNeeded;
                } else {
                    return this.survive(enemies);
                }
            }
            if (goToBulletIfNeeded) {
                return goToBulletIfNeeded;
            } else {
                this.message = "I'M READY " + this.target.name;
                return this.moveNearToTarget(270);
            }
        } else {
            //ОБЫЧНЫЙ РЕЖИМ

            //HELLRAGE Если здоровья на две тычки
            if (this.target.lives > 0 && this.target.lives <= 2 * bulletDamage) {
                this.hellrage = true;
                this.preparing = false;
            } //Если здоровье почти низкое - готовиться к hellrage 
            else if (this.target.lives > 2 * bulletDamage && this.target.lives <= 4 * bulletDamage) {
                this.preparing = true;
                this.hellrage = false;
            } else {
                if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet) {
                    if (canHeal) {
                        this.message = 'JUST REPAIRED';
                        return this.eatBot();
                    } else if (goToBulletIfNeeded) {
                        return goToBulletIfNeeded;
                    } else {
                        return this.survive(enemies);
                    }
                }

                //Расстояние до цели
                const distance = distanceBetween(this.bot, this.target);
                if ((distance < 450 && this.bot.bullets >= 1) || this.bot.bullets >= creatureMaxBullets[this.bot.level]) {
                    return this.prepareAttack(this.target, 450);
                } else if (goToBulletIfNeeded) {
                    return goToBulletIfNeeded;
                } else {
                    return this.moveNearToTarget(270);
                }
            }
            return this.idleBot();
        }
    },

    findTarget: function (enemies) {
        let target = null;
        let deaths = Number.MAX_SAFE_INTEGER;
        enemies.forEach(e => {
            if (e.deaths < deaths) {
                target = e;
                deaths = e.deaths;
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
                return this.shootBot();
            } else {
                this.message = target.name + ", YOU AREN'T UNSTOPPABLE!";
                return this.turnBot(angle);
            }
        } else {
            this.message = this.message ? this.message + '\nCHOO-CHOO' : 'CHOO-CHOO';
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
            this.message = 'HELLZONE';
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
        return this.idleBot();
    },
};