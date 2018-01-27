
br_pacifist = {
    
    name: "Pacifist",
    kind: kinds.moose,
    author: "Sonya",

    thinkAboutIt: function(self, enemies, bullets, objects, events) {

        // Just eat reachible bullets.
        // Don't kill anybody.

        // Message 
        let message = null;
        events.forEach(event => {
            if (event.type == eventTypes.wound && event.payload[0].name == self.name && Math.random() < 0.2) {
                message = "ТАК, БЛЭТ";
            }
        });

        // Eat bullet if self has one 
        if (self.bullets > 0) {
            return { do: actions.eat, params: { message : message } };
        }

        let safeBullet;
        const max = ground.width + ground.height;
        let safeBulletDist = max; 

        // Looking for most centered safe bullet
        let center = { x: ground.width / 2, y: ground.height / 2 };
        bullets.forEach(bullet => {
            let dist = distanceBetweenPoints(center, bullet.position);
            if (!bullet.dangerous && dist < safeBulletDist) {
                safeBulletDist = dist;
                safeBullet = bullet;
            }
        });

        // Grab the bullet
        if (safeBullet) {
            let angle = angleBetween(self, safeBullet);
            return { do: actions.move, params: { angle: angle, message : message } };
        }
        
        // Do nothing otherwise
        return { do: actions.none, params: { message : message } };
    }
    
};
