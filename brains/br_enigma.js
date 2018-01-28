
br_enigma = {

    name: "Enigma",
    kind: kinds.miner,
    author: "BigData",
    description: "Infobot. He keeps his opponents informed about the weather in different cities all over the world and broadcasts actual bitcoins course",

    thinkAboutIt: function(self, enemies, bullets, objects, events) {

        if (!this.stuffGot) {
            this.stuffGot = true;
            this.getStuff();
        }

        let safeBullet, dangerousBullet;
        const max = ground.width + ground.height,
              center = { x: ground.width / 2, y: ground.height / 2 };
        let safeBulletDist = max,
            dangerousBulletDist = max,
            shouldJump = self.bullets == 0;

        // Looking for nearest bullets
        bullets.forEach(bullet => {
            let dist = distanceBetween(self, bullet);
            if (bullet.dangerous && dist < dangerousBulletDist) {
                dangerousBulletDist = dist;
                dangerousBullet = bullet;
            }
            
            dist = distanceBetween(self, bullet);
            let near = false;
            for (let i = 0; i < enemies.length; i++) {
                if (distanceBetween(enemies[i], bullet) < dist) {
                    near = true;
                    break;
                }
            }
            if (shouldJump) near == false;

            if (!bullet.dangerous && dist < safeBulletDist && !near) {
                safeBulletDist = dist;
                safeBullet = bullet;
            }
        });

        // Message 
        let message = null;
        if (++this.messageCounter > this.messageInterval && Math.random() < 0.9) {
            this.messageCounter = 0;
            if (this.messages.length > 1) {
                if (Math.random() < 0.2) message = this.messages[0]; // BTC > USD rate
                else message = this.messages[randomInt(1, this.messages.length - 1)];
            }
        }
        
        // Consider dangerous bullet first
        if (dangerousBullet && self.energy >= jumpEnergyCost) {
            let bulletAngle = Math.atan2(dangerousBullet.velocity.y, dangerousBullet.velocity.x);
            let collisionAngle = angleBetween(dangerousBullet, self);
            const backlash = Math.PI / 25.0;
            let diff = Math.abs(differenceBetweenAngles(bulletAngle, collisionAngle));
            if (diff < backlash) {
                return { do: actions.jump, params: { angle: bulletAngle + Math.PI / 2.0, message: message } };
            }
        }

        // Consider heal
        if (self.lives < creatureMaxLives[self.level] * 0.3) {
            return { do: self.energy >= eatBulletEnergyCost ? actions.eat : actions.none, params: { message: message } };
        }

        // Consider save bullet. Just nearest.
        if (safeBullet && self.bullets == 0) {
            let angle = angleBetween(self, safeBullet);
            return { do: actions.move , params: { angle: angle, message: message } };
        }

        // Check enough energy for hunting
        if (self.energy > shotEnergyCost + 5 /* for pursuit */ && self.bullets > 0) {
            let enemy,
                health = 1000;
            enemies.forEach(e => {
                if (e.lives < health && distanceBetween(self, e) > 150 && rayBetween(self, e)) {
                    enemy = e;
                    health = e.lives;
                }
            });
            if (enemy) {
                let directionAngle = angleBetween(self, enemy);
                if (distanceBetween(self, enemy) < 300) {
                    const backlash = Math.PI / 50.0;
                    let diff = Math.abs(differenceBetweenAngles(self.angle, directionAngle));
                    if (diff < backlash) {
                        return { do: actions.shoot, params: { message: message } };
                    }
                    else {
                        return { do: actions.turn, params: { angle: directionAngle, message: message } };
                    }    
                }
                else {
                    return { do: actions.move, params: { angle: directionAngle, message: message } };
                }
            }
        }       

        // Do nothing
        return { do: actions.none };
    },

    stuffGot: false,
    messages: [],
    messageCounter: 0,
    messageInterval: 30,

    jsonRequest: function(url, callback) {
        let req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "json";
        req.onload = callback;
        req.send();
    },

    getStuff: function() {

        // BTC rate
        this.jsonRequest("https://api.coindesk.com/v1/bpi/currentprice.json", (data) => {
            if (data.target.status === 200) {
                let info = data.target.response,
                    btc = info.bpi.USD.rate,
                    pos = btc.indexOf(".");
                if (pos >= 0) btc = btc.substr(0, pos)
                this.messages.unshift(`1 BTC = $${btc}`);
            }
        });
        
        // Weather
        let cities = ["Moscow", "Barcelona", "Berlin", "London", "Chicago", "Dubai", "Rome", "Toronto", "Sydney"];
        cities.forEach(city => {
            this.jsonRequest(`https://query.yahooapis.com/v1/public/yql?q=select%20item.condition%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${city}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`, (data) => {
                if (data.target.status === 200) {
                    let info = data.target.response,
                        f = parseInt(info.query.results.channel.item.condition.temp),
                        c = Math.round((f-32)*5/9),
                        cond = info.query.results.channel.item.condition.text;
                    this.messages.push(`It's ${c}°C in ${city} now`);
                    this.messages.push(`It's ${cond.toLowerCase()} in ${city} now`);
                }
            });            
        });
        
    }
    
};