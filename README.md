# Programmer Unknown's BattleGround

PUBG (original [PUBG](https://www.playbattlegrounds.com), sorry for using your abbreviation, we just want to train our programming skills in this little game for coders and haven't plans to publish it on Steam in the future) is an automatic environment (actually battleground) where several alrogithms fight in the real time.

Each algorithm controls a creature (which can be bull, rhino, slugs etc.) with an aim to grab bullets and hurt other creatures with it. By killing enemies your creature increases it's IQ, the smartest creatures lists in the leaderboard.

## Fast start

1. Download the latest build.

2. Open `/brains/br_edmund.js` file for editing, read comments in it and change creature's logic to desired behavior.

3. Open `/index.html` in your browser and see what you made. That's all.
If you see just gray background and nothing else then check the console: may be the reason is `security error dom exception 18` error (occurs in last Safari versions). That's because brains files are loaded dynamically. Try another browser (Chrome) in this case.

4. You can edit `cfg_sources` array in the `config.js` to exclude some brains by commenting them or add your own brain files.

5. You can also edit other consts in the `config.js` to change the rules of the game, e.g. set `shuffleBrains` to `false` to start the game with your brain first, or change `maxAliveCreatures` to battle with less or more enemies at the same time.

6. Try your skills fighting againts best brains. See [Leaderboard](http://appcraft.pro/pubg/docs/en/leaderboard.html) section of the [documentation](http://appcraft.pro/pubg/docs/en/index.html) for more details.

7. Read [documentation](http://appcraft.pro/pubg/docs/en/index.html) to learn rules of the game, creatures specifications, examples and other details. Good luck !)

## License

PUBG is distributed under the [MIT license](http://appcraft.pro/pubg/docs/en/license.html).