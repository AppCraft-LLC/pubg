br_dexter = {
    name: "MoreGun",
    kind: kinds.splitpus,
    author: "Sad108",
    description: "The revengeful one. His parents were brutally murdered. Killer was never found. Now Dexter Moregun is looking for the most infamous murderers to brutally murder them.",

    fatherPlumber: null,
    dexterMessage: null,
    page: 0,
    messageSpam: 0,
    rageMode: false,

    nextPage: function(storyOfLife) {
        if (this.messageSpam === 0) {
            this.messageSpam = 30;
            this.dexterMessage = storyOfLife[this.page++];
        } else {
            this.messageSpam--;
        }
    },

    doShooty: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.shoot,
            params: params
        };
    },

    doMove: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.move,
            params: params
        };
    },

    doEatan: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.eat,
            params: params
        };
    },

    doRotate: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.rotate,
            params: params
        };
    },

    doNothing: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.none,
            params: params
        };
    },

    doJumpy: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.jump,
            params: params
        };
    },

    doTurn: function(params) {
        params.message = this.dexterMessage;
        return {
            do: actions.turn,
            params: params
        };
    },

    shootAtEnemy: function(self, enemy) {
        let backlash = Math.PI / 50;
        if (distanceBetween(self, enemy) < 150) {
            backlash = Math.PI / 20;
        }
        let directionAngle = angleBetween(self, enemy);
        let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
        if (!rayBetween(self, enemy)){
            return this.doMove({
                angle: directionAngle,
            });
        }
        if (diff < backlash) {
            if (distanceBetween(self, enemy) > 300) {
                return this.doMove({
                    angle: directionAngle
                });
            }
            if(self.bullets == 1){
                this.rageMode = false;
            }
            return this.doShooty({});
        } else {
            if (distanceBetween(self, enemy) < 300) {
                return this.doTurn({
                    angle: directionAngle
                });
            }
            return this.doMove({
                angle: directionAngle,
            });
        }
    },

    arrayContains: function(array, id) {
        let result = false;
        array.forEach(element => {
            if(element.id === id) {
                result = true;
            }
        });
        return result;
    },

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

        let goToPosition = function(position) {
            const angle = angleBetweenPoints(self.position, position);
            return this.doMove({angle: angle});
        }

        if (!this.fatherPlumber) {
            if (enemies.length == 0) {
                return this.doNothing({});
            }
            let kills = 0;
            enemies.forEach(enemy =>{
                if (enemy.kills >= kills) {
                    this.fatherPlumber = enemy;
                    kills = enemy.kills;
                }
            });
        }



        const storyOfLife = [
            "Hello, my name is Dexter MoreGun.",
            "This is a story of my life:",
            "My childhood was happy and fun.",
            "I liked to play with my mom.",
            "My dad was harsh at times.",
            "I loved him. He taught me a lot.",
            "But these things always change.",
            "After my dad was brutally killed",
            "And my mom raped and killed",
            "My life was never like before.",
            "Police never found the murderer.",
            "Me neither. But god knows I tried.",
            "I still do. The pain never leaves.",
            "But I didn't want to talk about me.",
            "I want to talk about " + this.fatherPlumber.name + ".",
            "Not exactly talk about...",
            "I want to kill him. Torture him.",
            "Like he did many times before.",
            "Not many can kill and live with it.",
            "This man could. Until now.",
            "I cast this sin upon myself",
            "to cleanse this battlefield",
            "from that abomination.",
            "You can tell me I'm hypocrite.",
            "That I'm immoral. That I'm lunatic.",
            "That I can't choose who dies",
            "And who lives.",
            "But it doesn't matter to me.",
            "All that matters is " + this.fatherPlumber.name + ".",
            "His blood. Blood he must pay.",
            "For all his misdeeds.",
            "God rest his soul."
        ];

        if (!this.arrayContains(enemies, this.fatherPlumber.id)) {
            this.fatherPlumber = null;
            this.page = 0;
            this.messageSpam = 0;
            this.rageMode = false;
            return this.doNothing({});
        }

        this.nextPage(storyOfLife);

        // Looking for bullets
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            dist = distanceBetween(this.fatherPlumber, bullet)
            if (!bullet.dangerous && dist < safeBulletDist) {
                safeBulletDist = dist;
                safeBullet = bullet;
                }
            });

        if (dangerousBullet && dangerousBulletDist < 200 && self.lives < 0.5 * creatureMaxLives[self.level]) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(self, dangerousBullet);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return this.doMove({
                    angle: bulletAngle + Math.PI / 2.0,
                });
            }
        }

        if (self.lives < 0.4 * creatureMaxLives[self.level]) {
            if (self.bullets > 0 && self.energy >= eatBulletEnergyCost) {
                return this.doEatan({});
            }
        }

        if (self.bullets * bulletDamage >= this.fatherPlumber.lives) {
            return this.shootAtEnemy(self, this.fatherPlumber);
        }

        if (self.bullets == creatureMaxBullets[self.level] || this.rageMode) {
            this.rageMode = true;
            return this.shootAtEnemy(self, this.fatherPlumber);
        }

        // Consider save bullet
        if (safeBullet && self.bullets < creatureMaxBullets[self.level]) {
            let angle = angleBetween(self, safeBullet);
            return this.doMove({
                angle: angle
            });
        }

        return this.doNothing({});
    }

};
