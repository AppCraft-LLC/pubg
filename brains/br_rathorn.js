br_rathorn = {

    name: "RatHorn",

    kind: kinds.rhino,

    author: "BlackPeter",

    description: "The sleazy one. Waits for his opponents to run out of health just to deliver the final blow. Master of hit&run and runaway arts.",

    thinkAboutIt: function(self, enemies, bullets, objects, events) {

        const corners = [{x: 70, y: ground.height - 70}, {x: 70, y: 70}, {x: ground.width - 70, y: 70}, {x: ground.width - 70, y: ground.height - 70}];

        const max = ground.width + ground.height;
        let height = ground.height;
        let width = ground.width;
        let safeBullet, dangerousBullet,
            safeBulletDist = max,
            dangerousBulletDist = max,
            center = {
                x: ground.width / 2,
                y: ground.height / 2
            };
        if (typeof ratRun == "undefined") {
            ticksTillMoving = 50;
            ratRun = false;
            ratMessage = undefined;
            ratSpam = 0;
            ratMessageSpam = 0;
        }


        if (ratMessage && ratMessageSpam === 0) {
            ratMessageSpam = 20;
        } else if (ratMessage && ratMessageSpam === 1) {
            ratMessageSpam--;
            ratMessage = undefined;
        } else if (ratMessageSpam > 0) {
            ratMessageSpam--;
        }

        events.forEach(event => {
            if (event.type == 1) {
                if (event.payload[0].id == self.id) {
                    ratMessage = "Easy kill, " + event.payload[1].name;
                }
            }
        })

        let doShooty = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.shoot,
                params: params
            };
        }

        let doMove = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.move,
                params: params
            };
        }

        let doEatan = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.eat,
                params: params
            };
        }

        let doRotate = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.rotate,
                params: params
            };
        }

        let doNothing = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.none,
                params: params
            };
        }

        let doJumpy = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.jump,
                params: params
            };
        }

        let doTurn = function(params) {
            params.message = ratMessage ? ratMessage : params.message;
            return {
                do: actions.turn,
                params: params
            };
        }

        let shootAtEnemy = function(enemy, backlash) {
            let directionAngle = angleBetween(self, enemy);
            let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
            if (!rayBetween(self, enemy)){
                return doMove({
                    angle: directionAngle,
                    message: "You can run, but you can't hide."
                });
            }
            if (diff < backlash) {
                if (distanceBetween(self, enemy) > 300) {
                    return doMove({
                        angle: directionAngle
                    });
                }
                let killMessage = null;
                if (enemy.name.length >= 6) {
                    killMessage = enemy.name + "? More like Dead" + enemy.name.substring(enemy.name.length/2, enemy.name.length);
                }
                else{
                    killMessage = "You are dead, " + enemy.name;
                }
                return doShooty({
                    message: killMessage
                });
            } else {
                if (distanceBetween(self, enemy) < 300) {
                    return doTurn({
                        angle: directionAngle
                    });
                }
                return doMove({
                    angle: directionAngle,
                    message: "How are you, " + e.name + "?"
                });
            }
        };

        let hitAndRun = function() {
            // Find nearest enemy
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

            let backlash = Math.PI / 50.0;

            if (distanceBetween(self, enemy) < 200) {
                backlash = backlash * 3;
            }


            // Check enough energy for hunting
            if (self.energy > shotEnergyCost + 10) {
                let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
                if (diff < backlash) {
                    if (distanceBetween(self, enemy) > 300) {
                        return doMove({
                            angle: directionAngle,
                            message: "Crawling in the dark..."
                        });
                    }
                    ratRun = true;
                    danger = enemy;
                    ticksToRun = 15;
                    return doShooty({});
                } else {
                    if (distanceBetween(self, enemy) < 300 && distanceBetween(self, enemy) > 100) {
                        return doTurn({
                            clockwise: directionAngle
                        });
                    } else if (distanceBetween(self, enemy) <= 100) {
                        return doMove({
                            angle: Math.PI + directionAngle,
                            message: enemy.name + ", please back off"
                        });
                    }
                    return doMove({
                        angle: directionAngle,
                        message: "Too bad you can't see me, " + enemy.name
                    });
                }
            }
        }

        let runForYourLife = function() {
            if (ticksToRun == 1) {
                ratRun = false;
            }
            ticksToRun -= 1;
            return runThehellAway(danger)

        }

        let goToPreferablePosition = function(position1, position2, enemyPosition) {
            if (distanceBetweenPoints(position1, enemyPosition) > distanceBetweenPoints(position2, enemyPosition)) {
                return goToPosition(position1);
            }
            else{
                return goToPosition(position2);
            }
        }



        let runThehellAway = function(enemy) {
            let runAngle = angleBetween(self, enemy) + (Math.PI / 2.0) + Math.PI / 6;

            if (self.position.x + 70 > ground.width) {
                if(self.position.y + 70 > ground.height || self.position.y < 70){
                    return goToPreferablePosition(corners[0], corners[2], enemy.position);
                }
                return goToPreferablePosition(corners[2], corners[3], enemy.position);
            }

            if (self.position.x - 70 < 0) {
                if(self.position.y + 70 > ground.height || self.position.y < 70){
                    return goToPreferablePosition(corners[1], corners[3], enemy.position);
                }
                return goToPreferablePosition(corners[0], corners[1], enemy.position);
            }

            if (self.position.y - 70 < 0) {
                if(self.position.x + 70 > ground.width) {

                }
                return goToPreferablePosition(corners[1], corners[2], enemy.position);
            }

            if (self.position.y + 70 > ground.height) {
                return goToPreferablePosition(corners[0], corners[3], enemy.position);
            }

            return doMove({
                angle: runAngle,
                message: "Spare the little mouse, " + enemy.name + "."
            });
        }

        let goToPosition = function(position) {
            const angle = angleBetweenPoints(self.position, position);
            return doMove({angle: angle});
        }

        let stealth = function(enemy) {
            if ((distanceBetween(self, enemy) > 400 && enemy.lives < creatureMaxBullets[self.level] + 2 * bulletDamage) || (distanceBetween(self, enemy) > 300 && enemy.lives < creatureMaxBullets[self.level] + 1 * bulletDamage) || distanceBetween(self, enemy) > 500) {
                return goToPosition(weakestEnemy.position);
            }
            else{
                return doTurn({angle: angleBetween(self, enemy), message: "I'm looking at you, " + enemy.name})
            }
        }

        // Looking for bullets
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }

            if (!bullet.dangerous && dist < safeBulletDist) {
                let messedUpEnemies = 0;
                enemies.forEach(enemy => {
                    if (distanceBetween(bullet, enemy) > distanceBetween(bullet, self)) {
                        messedUpEnemies += 1;
                    }
                });
                if (messedUpEnemies >= enemies.length - 1) {
                    safeBulletDist = dist;
                    safeBullet = bullet;
                }
            }
        });

        let e = 0;
        let weakestEnemy = enemies[0];
        distance = max;
        let lives = self.bullets * bulletDamage;
        enemies.forEach(enemy => {
            if (enemy.lives < weakestEnemy.lives){
                weakestEnemy = enemy;
            }
            if (lives > enemy.lives) {
                e = enemy;
                distance = distanceBetween(self, enemy);
                lives = enemy.lives;
            } else if (lives == enemy.lives) {
                if (distance > distanceBetween(self, enemy)) {
                    distance = distanceBetween(self, enemy);
                    lives = enemy.lives;
                    e = enemy;
                }
            }
        })
        
        if (e != 0) {
            enemy = e;
            let backlash = Math.PI / 50.0;
            let directionAngle = angleBetween(self, e);
            if (distanceBetween(self, enemy) < 150) {
                backlash = Math.PI / 20
            }
            if (self.energy > shotEnergyCost + 10) {
                return shootAtEnemy(enemy, backlash);
            }
        }

        if (dangerousBullet && dangerousBulletDist < 200 && self.lives < 0.5 * creatureMaxLives[self.level]) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(self, dangerousBullet);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return doMove({
                    angle: bulletAngle + Math.PI / 2.0,
                    message: "Jumpy-jumpy"
                });
            }
        }

        if (self.lives < 0.4 * creatureMaxLives[self.level]) {
            if (self.bullets > 0 && self.energy >= eatBulletEnergyCost) {
                return doEatan({});
            }
        }

        // Consider save bullet
        if (safeBullet && self.bullets < creatureMaxBullets[self.level]) {
            ratRun = false;
            let angle = angleBetween(self, safeBullet);
            return doMove({
                angle: angle
            });
        }

        let dangerousEnemy = 0;
        let backlash = Math.PI / 4;
        enemies.forEach(enemy => {
            if (enemy.bullets > 0 && distanceBetween(self, enemy) < 500 && self.energy > creatureMaxEnergy[self.level] * 0.2 && Math.abs(angleBetween(enemy, self) - normalizeAngle(enemy.angle)) < backlash) {
                dangerousEnemy = enemy;
            }
        })
        if (dangerousEnemy){// && self.lives < creatureMaxLives[self.level] * 0.9) {
            return runThehellAway(dangerousEnemy);
        }

        if (ratRun) {
            return runForYourLife();
        }

        // Do nothing if there's no anyone else
        if (self.bullets < 1 || enemies.length < 1) {
            return doNothing({});
        } else {

            if (self.lives < creatureMaxLives[self.level] * 0.9 && self.energy == creatureMaxEnergy[self.level]) {
                return doEatan({message: "Yummi!"});
            } else if (self.energy == creatureMaxEnergy[self.level] && self.bullets == creatureMaxBullets[self.level]) {
                return hitAndRun();
            }
        }

        if (self.energy > creatureMaxEnergy[self.level] * 0.7) {
            return stealth(weakestEnemy);
        }
        return doNothing({});
    }

};
