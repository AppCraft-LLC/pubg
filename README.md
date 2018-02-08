# Programmer Unknown's BattleGround

PUBG (original [PUBG](https://www.playbattlegrounds.com), sorry for using your abbreviation, we just want to train our programming skills in this little game for coders and haven't plans to publish it on Steam in the future) is an automatic environment (actually battleground) where several alrogithms fight in the real time.

Each algorithm controls a creature (which can be bull, rhino, slug etc.) with an aim to grab bullets and hurt other creatures with it. By killing enemies your creature increases it's IQ, the smartest creatures lists in the leaderboard. Take a look at running PUBG [here](http://appcraft.pro/pubg/).

[![pubg](http://appcraft.pro/pubg/assets/pubg_scr_2.png)](http://appcraft.pro/pubg/)

## How it can be used

1. If you're learning programming you can use PUBG to train your projection (from abstract thoughts to certain commands) skill.

2. If you works in a team you can organize weekly battles and give pizza, beer or iPhone X to a winner.

3. If you're a teacher you can use PUBG as a small lab to demonstrate basic algorithms and applied samples of programming knowledge. It's much more interesting to make a brain for a creature rather than to draw a parabola on a screen (in most cases).

## Fast start

1. Download the latest build.

2. Open `/brains/br_edmund.js` file for editing, read comments in it and change creature's logic to desired behavior.

3. Open `/index.html` in your browser and see what you made. That's all.
If you see just gray background and nothing else then check the console: may be the reason is `security error dom exception 18` error (occurs in last Safari versions). That's because brains files are loaded dynamically. Try another browser (Chrome) in this case.

4. You can edit `cfg_sources` array in the `config.js` to exclude some brains by commenting them or add your own brain files.

5. You can also edit other consts in the `config.js` to change the rules of the game, e.g. set `shuffleBrains` to `false` to start the game with your brain first, or change `maxAliveCreatures` to battle with less or more enemies at the same time.

6. Read [documentation](https://github.com/AppCraft-LLC/pubg/wiki) to learn rules of the game, creatures specifications, examples and other details. Good luck !)

## License

PUBG is distributed under the [MIT license](https://github.com/AppCraft-LLC/pubg/blob/master/LICENSE.md).