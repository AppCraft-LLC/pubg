
br_niloultet = {

    name: 'nil-oultet',

    kind: kinds.sprayer,

    author: 'Andrey',

    description: "Tactical bot. He controls selected sector.",

    bot: {},

    onPosition: true,
    onPositionTimestamp: null,
    movingToPosition: false,
    movingToCenter: true,
    onCenter: false,
    positionIndex: 0,
    previousPosition: null,

    timeInSector: 30,

    lastBulletTakeTimestamp: Date.now(),

    message: null,
    silentMode: false,
    silentModeTimestamp: Date.now(),

    lateGame: false,

    tacticMap: {

        near: 400,

        center: {
            x: ground.width / 2,
            y: ground.height / 2
        },

        sectors: [{
            x: ground.width / 4,
            y: ground.height / 4,
            width: ground.width / 2,
            height: ground.height / 2,
            position: {
                x: 65,
                y: 65
            }
        },
        {
            x: ground.width / 2 + ground.width / 4,
            y: ground.height / 4,
            width: ground.width / 2,
            height: ground.height / 2,
            position: {
                x: ground.width - 65,
                y: 65
            }
        },
        {
            x: ground.width / 4,
            y: ground.height / 2 + ground.height / 4,
            width: ground.width / 2,
            height: ground.height / 2,
            position: {
                x: 65,
                y: ground.height - 65
            }
        },
        {
            x: ground.width / 2 + ground.width / 4,
            y: ground.height / 2 + ground.height / 4,
            width: ground.width / 2,
            height: ground.height / 2,
            position: {
                x: ground.width - 65,
                y: ground.height - 65
            }
        }
        ],
    },

    // BOT ACTIONS

    idleBot: function () {
        if (this.bot.lives < creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.energy >= eatBulletEnergyCost && this.bot.bullets > 0) {
            return this.eatBot();
        } else {
            let params = undefined;
            let message = 'Report: Do nothing.';
            if (this.message) {
                message = this.message;
            }
            if (!this.silentMode) {
                params = {
                    message: message
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
        let message = this.message;
        if (this.silentMode) {
            message = undefined;
        } else {
            if (message) {
                message += '\nReport: Healed.';
            } else {
                message = 'Report: Healed.';
            }
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

        if (bullets.length < 12) {
            return this.earlyGame(enemies, bullets, objects, events);
        } else {
            const doLateGame = this.lateGame(enemies, bullets, objects, events);
            if (!this.lateGame) {
                this.message = 'Status: Late Game.';
                this.lateGame = true;
            }
            return doLateGame;
        }

    },

    // EARLY GAME
    earlyGame: function (enemies, bullets, objects, events) {
        if (this.movingToCenter) {
            return this.goToCenter();
        } else {
            const target = this.findNearest(enemies);
            if (target && this.bot.bullets > 0 && distanceBetween(this.bot, target) <= 450) {
                return this.prepareAttack(target);
            }

            const goToBulletIfNeeded = this.goToBullet(bullets);
            if (goToBulletIfNeeded) {
                return goToBulletIfNeeded;
            }

            return this.detectMode(enemies);
        }
    },

    // LATE GAME
    lateGame: function (enemies, bullets, objects, events) {
        const now = Date.now();

        if (!this.lateGame) {
            this.movingToCenter = true;
        }

        if (this.movingToCenter) {
            return this.goToCenter();
        } else if (this.onCenter) {
            this.positionIndex = this.detectBullets(bullets);
            this.onCenter = false;
            this.movingToPosition = true;
            return this.idleBot();
        } else if (this.movingToPosition) {
            const position = this.tacticMap.sectors[this.positionIndex].position;
            return this.goToPosition(position);
        } else if (this.onPosition) {
            //время на позиции
            const positionTimeDelta = (now - this.onPositionTimestamp) / 1000;

            //рядом есть пуля
            const goToBulletIfNeeded = this.goToBullet(bullets, true);
            const position = this.tacticMap.sectors[this.positionIndex].position;
            const farFromPosition = this.checkNotOnPosition(position);

            //кол-во пуль рядом
            const nearBulletsCount = this.getNearBulletsCount(bullets);

            //если нет врагов в секторе - собирать пули
            const sectorEnemies = this.findEnemiesInSector(enemies);
            if (!sectorEnemies) {
                if (this.bot.lives <= creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.bullets > 0) {
                    return this.eatBot();
                } else if (goToBulletIfNeeded) {
                    return goToBulletIfNeeded;
                } else if (farFromPosition) {
                    return this.goToPosition(position, true);
                } else if (positionTimeDelta > this.timeInSector) {
                    if (nearBulletsCount < 2) {
                        this.onPositionTimestamp = null;
                        this.onPosition = false;
                        this.movingToCenter = true;
                        this.previousPosition = this.positionIndex;
                        return this.idleBot();
                    } else {
                        this.onPositionTimestamp = now;
                    }
                }
            }



            //если есть хилый враг - добить
            const weakTarget = this.findWeak(enemies);
            if (weakTarget && this.bot.bullets > 0) {
                return this.prepareAttack(weakTarget);
            }

            if (this.bot.lives <= creatureMaxLives[this.bot.level] - livesPerEatenBullet && this.bot.bullets > 0) {
                return this.eatBot();
            }

            if (positionTimeDelta > this.timeInSector) {
                if (nearBulletsCount < 2) {
                    this.onPositionTimestamp = null;
                    this.onPosition = false;
                    this.movingToCenter = true;
                    this.previousPosition = this.positionIndex;
                    return this.idleBot();
                } else {
                    this.onPositionTimestamp = now;
                }
            }

            //если есть враг и он далеко, но есть пуля - взять пулю
            const target = this.findTarget(enemies);
            if (target) {
                const targetDistance = distanceBetween(this.bot, target);
                if (targetDistance > 450) {
                    if (goToBulletIfNeeded) {
                        return goToBulletIfNeeded;
                    }
                } else if (this.bot.bullets > 0) {
                    return this.prepareAttack(target);
                }
            } else if (goToBulletIfNeeded) {
                return goToBulletIfNeeded;
            }


            if (farFromPosition) {
                return this.goToPosition(position, true);
            }

            return this.detectMode(enemies);
        } else {
            this.message = 'Report: No tactics.';
            return this.idleBot(enemies);
        }
    },

    // TACTIC FUNCTIONS 😄

    checkNotOnPosition: function (position) {
        const wh = ground.width / 40,
            hh = ground.height / 40;
        return (this.bot.position.x < position.x - wh || this.bot.position.x > position.x + wh ||
            this.bot.position.y < position.y - hh || this.bot.position.y > position.y + hh);
    },

    goToPosition: function (position, ignoreTimestampt) {
        if (this.checkNotOnPosition(position)) {
            const angle = angleBetweenPoints(this.bot.position, position);
            this.message = "Report: I'm on my way(" + position.x + ':' + position.y + ').';
            return this.moveBot(angle);
        } else {
            if (!ignoreTimestampt) {
                this.onPositionTimestamp = Date.now();
            }
            this.onPosition = true;
            this.movingToPosition = false;
            this.message = "Report: I'm on position(" + position.x + ':' + position.y + ').'
            return this.idleBot();
        }
    },

    goToCenter: function () {
        // Determine center area
        const wh = ground.width / 40,
            hh = ground.height / 40;

        const center = this.tacticMap.center;

        if (this.bot.position.x < center.x - wh || this.bot.position.x > center.x + wh ||
            this.bot.position.y < center.y - hh || this.bot.position.y > center.y + hh) {
            const angle = angleBetweenPoints(this.bot.position, center)
            this.message = "Report: I'm going to center.";
            return this.moveBot(angle);
        } else {
            this.movingToCenter = false;
            this.onCenter = true;
            this.message = "Report: I'm on center.";
            return this.idleBot();
        }
    },

    detectBullets: function (bullets) {
        let detected = [0, 0, 0, 0];
        const delta = 200;
        bullets.forEach(bullet => {
            if (bullet.position.x >= 0 && bullet.position.x <= delta && bullet.position.y >= 0 && bullet.position.y <= delta) {
                detected[0] += 1;
            } else if (bullet.position.x >= ground.width - delta && bullet.position.y >= 0 && bullet.position.y <= delta) {
                detected[1] += 1;
            } else if (bullet.position.x >= 0 && bullet.position.x <= delta && bullet.position.y >= ground.height - delta) {
                detected[2] += 1;
            } else if (bullet.position.x >= ground.width - delta && bullet.position.y >= ground.height - delta) {
                detected[3] += 1;
            }
        });

        let sector = 0;
        let count = 0;

        for (var i = 0; i < 4; i++) {
            if (detected[i] > count) {
                count = detected[i];
                sector = i;
            }
        }
        return sector;
    },

    findNearest: function (enemies) {
        let target = null;
        let temp = ground.width + ground.height;

        enemies.forEach(e => {
            const dist = distanceBetween(this.bot, e);
            if (dist < temp && rayBetween(this.bot, e)) {
                temp = dist;
                target = e;
            }
        });
        return target;
    },

    findEnemiesInSector: function (enemies) {
        let sectorEnemies = [];
        const b = 60;
        enemies.forEach(e => {
            if (this.positionIndex == 0 && e.position.x >= 0 && e.position.x < this.tacticMap.center.x - b && e.position.y >= 0 && e.position.y < this.tacticMap.center.y - b) {
                sectorEnemies.push(e);
            } else if (this.positionIndex == 1 && e.position.x > this.tacticMap.center.x + b && e.position.y >= 0 && e.position.y < this.tacticMap.center.y - b) {
                sectorEnemies.push(e);
            } else if (this.positionIndex == 2 && e.position.x >= 0 && e.position.x < this.tacticMap.center.x - b && e.position.y > this.tacticMap.center.y + b) {
                sectorEnemies.push(e);
            } else if (this.positionIndex == 3 && e.position.x > this.tacticMap.center.x + b && e.position.y > this.tacticMap.center.y + b) {
                sectorEnemies.push(e);
            }
        });
        return sectorEnemies.length > 0 ? sectorEnemies : null;
    },

    findWeak: function (enemies) {
        let enemiesInSector = this.findEnemiesInSector(enemies);
        if (!enemiesInSector) {
            return null;
        }
        let target = null;
        enemiesInSector.forEach(e => {
            if (e.lives > 0 && e.lives <= this.bot.bullets * bulletDamage) {
                target = e;
            }
        });
        return target;
    },

    findTarget: function (enemies) {

        let enemiesInSector = this.findEnemiesInSector(enemies);
        if (!enemiesInSector) {
            return null;
        }
        let target = null;
        let enemyHealth = creatureMaxLives[2];
        enemiesInSector.forEach(e => {
            if (e.lives < enemyHealth && rayBetween(this.bot, e)) {
                enemyHealth = e.lives;
                target = e;
            }
        });
        return target;
    },

    prepareAttack: function (target) {

        const angle = angleBetween(this.bot, target);
        const distance = distanceBetween(this.bot, target);

        const d = Math.abs(differenceBetweenAngles(this.bot.angle, angle));
        const b = Math.PI / 35.0;

        if (this.bot.energy < shotEnergyCost) {
            this.message = 'Target: ' + target.name + '.\nReport: Low energy.';
            return this.idleBot();
        }
        if (distance > 450) {
            if (d < b) {
                this.message = 'Target: ' + target.name + '.\nStatus: Too far.';
                return this.idleBot();
            } else {
                this.message = 'Target: ' + target.name + '.\nReport: Turning.';
                return this.turnBot(angle);
            }
        } else {
            this.message = 'Target: ' + target.name + '.\nReport: Attacking.';
            if (d < b) {
                return this.shootBot();
            } else {
                return this.turnBot(angle);
            }
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
            if (rayBetween(this.bot, bullet) && d < temp && (!inSector || d < 200)) {
                targetBullet = bullet;
                temp = d;
            }
        });
        return targetBullet;
    },

    detectMode: function (enemies) {
        let suspiciousArray = [];
        let suspicious = null;
        let temp = ground.width + ground.height;
        const b = Math.PI / 20.0;

        enemies.forEach(e => {
            let dist = distanceBetween(this.bot, e);
            const angle = angleBetween(e, this.bot);
            const d = Math.abs(differenceBetweenAngles(e.angle, angle));
            if (rayBetween(this.bot, e) && e.bullets > 0 && dist < temp && d < b && dist < 500) {
                suspiciousArray.push(e);
                suspicious = e;
                temp = d;
            }
        });

        if (suspiciousArray.length < 1) {
            this.message = 'Report: Sector clear.';
            return this.idleBot();
        }

        const angle = angleBetween(suspicious, this.bot);
        const d = Math.abs(differenceBetweenAngles(suspicious.angle, angle));
        if (d < b) {
            if (d > Math.PI) {
                this.message = 'Target: ' + suspicious.name + '.\nStatus: Aggresive.';
                return this.moveBot(suspicious.angle - Math.PI / 2.0);
            } else {
                this.message = 'Target: ' + suspicious.name + '.\nStatus: Dangerous.';
                return this.moveBot(suspicious.angle + Math.PI / 2.0);
            }
        }
        this.message = 'Target: ' + suspicious.name + '.\nStatus: Suspicious.';
        return this.idleBot();
    },

    goToBullet: function (bullets, inSector) {
        const saveBullet = this.findBullet(bullets, inSector);
        if (saveBullet && this.bot.bullets < creatureMaxBullets[this.bot.level]) {
            this.message = 'Target: ' + saveBullet.id + '.\nStatus: Bullet.';
            const angle = angleBetween(this.bot, saveBullet);
            return this.moveBot(angle);
        } else {
            return null;
        }
    },

    getNearBulletsCount: function (bullets) {
        const nearZone = {
            minX: this.bot.position.x - this.tacticMap.near / 4,
            maxX: this.bot.position.x + this.tacticMap.near / 4,
            minY: this.bot.position.y - this.tacticMap.near / 4,
            maxY: this.bot.position.y + this.tacticMap.near / 4,
        }
        let bulletsCount = 0;

        bullets.forEach(bullet => {
            if (rayBetween(this.bot, bullet) &&
                bullet.position.x >= nearZone.minX && bullet.position.x <= nearZone.maxX &&
                bullet.position.y >= nearZone.minY && bullet.position.y <= nearZone.maxY
            ) {
                bulletsCount += 1;
            }
        });
        return bulletsCount;
    },
};