br_bulletbull = {

    name: "BULLetBULL",

    kind: kinds.bull,

    author: "Urist",

    description: "The spinning one. BULLetBULL gathers enough bullets, then goes to the arena center and starts spinning like a balerina of death until some poor soul appears in his line of sight.",

    thinkAboutIt: function(self, enemies, bullets, objects, events) {

        if (typeof readyToFire == "undefined") {
            bullMesage = undefined;
            readyToFire = false;
            spam = 0;
            bullMesageSpam = 0;
        }

        if (bullMesage && bullMesageSpam === 0) {
            bullMesageSpam = 20;
        }else if (bullMesage && bullMesageSpam === 1){
            bullMesageSpam--;
            bullMesage = undefined;
        }else if (bullMesageSpam > 0){
            bullMesageSpam--;
        }

        const max = ground.width + ground.height;
        let safeBullet, dangerousBullet,
            safeBulletDist = max,
            dangerousBulletDist = max,
            center = {
                x: ground.width / 2,
                y: ground.height / 2
            };

        let doShooty = function(params){
            bullMesage = "Target acquired.";
            params.message = bullMesage;
            spam = 1;
            return {do: actions.shoot, params:params};
        }

        let doMove = function(params){
            spam = 0;
            params.message = bullMesage;
            return {do: actions.move, params: params};
        }

        let doEatan = function(params){
            params.message = bullMesage;
            return {do: actions.eat, params: params};
        }

        let doRotate = function(params){

            params.message = bullMesage;

            if (spam == 0) {
                spam = 1;
                bullMesage = "Turret mode: Activated.";
            }
            if(readyToFire){
                bullMesage = "Rage mode: Activated.";
            }
            params.message  = bullMesage;
            return {do: actions.rotate, params: params};
        }

        let doTurn = function(params){

            params.message = bullMesage;

            if (spam == 0) {
                spam = 1;
                bullMesage = "Turret mode: Activated.";
            }
            if(readyToFire){
                bullMesage = "Rage mode: Activated.";
            }
            params.message  = bullMesage;
            return {do: actions.turn, params: params};
        }

        let doNothing = function(params){
            params.message = bullMesage;
            return {do: actions.none, params: params};
        }

        let doJumpy = function(params){
            params.message = bullMesage;
            return {do: actions.jump, params: params};
        }

        let goToCenter = function() {
            // Determine center area
            let wh = ground.width / 8,
                hh = ground.height / 8;
            if (self.position.x < center.x - wh || self.position.x > center.x + wh ||
                self.position.y < center.y - hh || self.position.y > center.y + hh) {
                return doMove({angle: angleBetweenPoints(self.position, center)});
            } else {
                return prepareYourAnuses();
            }
        }

        let prepareYourAnuses = function() {
            if (self.bullets > 0 && self.energy) {
                let backlash = Math.PI / 20;
                let distance = 200;
                if (readyToFire) {
                    backlash = Math.PI / 10;
                    distance = 400;
                }
                let shoot = false;
                if (self.energy >= shotEnergyCost * self.bullets) {
                    enemies.forEach(e => {
                        let directionAngle = angleBetween(self, e);
                        let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
                        if (diff < backlash && distanceBetween(self, e) <= distance && rayBetween(self, e)) {
                            shoot = true;
                        }
                    });

                    if (shoot) {
                        if (self.bullets == 1) {

                            readyToFire = false;
                        }
                        clockwise = randomInt(0, 1);
                        return doShooty({});
                    }
                }
            }

            if (typeof clockwise == "undefined") {
                clockwise = randomInt(0, 1);
            }
            if(readyToFire){
                return doTurn({angle : normalizeAngle(self.angle +  (21.0 - (2.0 * (clockwise))) * Math.PI / 20.0)});
            }
            else{
                return doRotate({clockwise: clockwise})
            }
        }

        if (self.bullets == creatureMaxBullets[self.level]) {
            readyToFire = true;
        }

        // Looking for bullets
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            dist = distanceBetweenPoints(center, bullet.position);

            if (!bullet.dangerous && dist < safeBulletDist) {
                let messedUpEnemies = 0;
                enemies.forEach(enemy => {
                    if (distanceBetween(bullet, enemy) > distanceBetween(bullet, self)) {
                        messedUpEnemies += 1;
                    }
                });
                if (messedUpEnemies >= enemies.length -2 + self.bullets){
                    safeBulletDist = dist;
                    safeBullet = bullet;
                }
            }
        });

        if (safeBullet && !readyToFire) {
            let angle = angleBetween(self, safeBullet);
            return doMove({angle: angle});
        }

        // Do nothing if there's no anyone else
        if (self.bullets < 1 || enemies.length < 1) {
            return doNothing({});
        } else {

            return goToCenter();

        }

        return goToCenter();
    }
};
