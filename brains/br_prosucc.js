

br_prosucc = {
    
    name: "ProSUCC",

    kind: kinds.sprayer,

    author: "Survs",

    description: "Meme machine",
     goForSucc: function(self,enemy)
     {
        if (distanceBetween(self,enemy)>vampireDistance)
        {
            let angle=angleBetween(self,enemy);
            return {do: actions.move, params:{angle:angle, message:"w8ing 4 SUCC"}};
        }
        else
        {
          return this.SUCC(self,enemy);
        }
     },

     doNothing: function()
     {
        return {do: actions.none};
     },

     SUCC: function(self,enemy)
     {
        if (self.energy >= vampireEnergyCost)
        {
            return {do: actions.spell, params:{target:enemy, message:"SUCC"}};
        }
        // else
        // {
        //     return {do: actions.none, params:{message:"NONONO"}};
        // }
     },

     rotate: function(self,msg)
     {
        return {do: actions.rotate, params:{clockwise:true, message:msg}};
     },

     goForBullet: function(self,bullet,msg)
     {
        let angle=angleBetween(self,bullet);
        return {do: actions.move, params:{angle:angle, message:msg}};
     },

     heal: function(self)
     {
        return {do: actions.eat};
     },

     shootEnemy: function(self,msg)
     {
        return {do: actions.shoot, params:{message:msg}};
     },

     turnToEnemy: function(self,enemy,msg)
     {
        let angle=angleBetween(self,enemy);
        let diff=differenceBetweenAngles(self.angle,angle);
        diff=diff/Math.abs(diff);
        return {do: actions.turn, params:{angle:angle+0.1*diff}};
     },


    thinkAboutIt: function(self, enemies, bullets, objects, events) {
        var msg_wounded=["ЗА ЩОООО", "Wow wow\r\nizi boi"];
        let msg;
        events.forEach(ev =>{
            if (ev.type==eventTypes.wound && ev.payload[0].name==self.name)
            {
                let rnd=randomInt(0,msg_wounded.length-1);
                msg=msg_wounded[rnd];
            }
            if (ev.type==eventTypes.murder)
            {
                msg="GET REKT\r\n"+ev.payload[0].name;
            }
            if (ev.type==eventTypes.death)
            {
                msg="GET REKT\r\n"+ev.payload[0].name;
            }
        });
        const max = ground.width + ground.height;
        if (enemies.length==0)
        {
            return this.doNothing();
        }
        let enemy = enemies[0],
            enemyDist = max;
        enemies.forEach(e => {
            let dist = distanceBetween(self, e);
            if (dist < enemyDist) {
                enemyDist = dist;
                enemy = e;
            }
        });
        if (self.energy>eatBulletEnergyCost && self.lives<creatureMaxLives[self.level]*0.66 && self.bullets>0)
        {
            return this.heal(self);
        }
        if (self.level>0 && self.lives>creatureMaxLives[self.level]/2 &&  self.energy>vampireEnergyCost+10)
        {
            return this.goForSucc(self,enemy);
        }
        if (self.bullets>1 && ((self.energy>shotEnergyCost+20 && self.level==0) || self.energy>shotEnergyCost+50) && self.lives>creatureMaxLives[self.level]*0.5)
        {
            let flag=0;
            enemies.forEach(e => {
                if ((Math.abs(differenceBetweenAngles(self.angle, angleBetween(self,e)))<0.15 && rayBetween(self,e) && distanceBetween(self,e)<500.0) || (Math.abs(differenceBetweenAngles(self.angle, angleBetween(self,e)))<0.3 && rayBetween(self,e) && distanceBetween(self,e)<200.0))
                {
                    flag=1;
                }
            });
            if (flag==1)
            {
                return this.shootEnemy(self,msg);
            }
        }
        let bullet;
        if (bullets.length>0 && self.bullets<creatureMaxBullets[self.level])
        {
            bullet=bullets[0];
            let distForBullet=100000;
            bullets.forEach(bul => {
                if (bul.dangerous==false)
                {
                    let myDist=distanceBetween(self,bul);
                    let enemDist=myDist+1;
                    enemies.forEach(e =>{
                        let newEnemDist=distanceBetween(e, bul);
                        if (newEnemDist<enemDist) enemDist=newEnemDist;
                    });
                    if (myDist<enemDist && myDist<distForBullet)
                    {
                        bullet=bul;
                        distForBullet=myDist;
                    }
                }
            });
            if (distForBullet!=100000)
            {
                return this.goForBullet(self,bullet,msg);
            }
        }
        return this.turnToEnemy(self,enemy,msg);
    }
    
};
