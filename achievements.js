// Chesser achievements: 40 topics x 3 = 120 achievements.
// Each entry is [name, description, stat, need]. It unlocks when the player's value for
// `stat` reaches `need`. app.js computes stat values and tracks unlocks. Loaded before app.js.
window.ACH_TOPICS = [
  { t: 'Moves', icon: '👣', a: [
    ['First Move', 'Make your first move', 'moves', 1],
    ['Mover', 'Make 100 moves', 'moves', 100],
    ['Move Machine', 'Make 1000 moves', 'moves', 1000] ] },
  { t: 'Games', icon: '🎮', a: [
    ['First Game', 'Play your first game', 'games', 1],
    ['Regular', 'Play 25 games', 'games', 25],
    ['Veteran', 'Play 100 games', 'games', 100] ] },
  { t: 'Wins', icon: '🏆', a: [
    ['First Win', 'Win a game', 'wins', 1],
    ['Winner', 'Win 10 games', 'wins', 10],
    ['Champion', 'Win 50 games', 'wins', 50] ] },
  { t: 'Captures', icon: '⚔️', a: [
    ['First Capture', 'Capture a piece', 'captures', 1],
    ['Hunter', 'Capture 50 pieces', 'captures', 50],
    ['Predator', 'Capture 300 pieces', 'captures', 300] ] },
  { t: 'Checks', icon: '➕', a: [
    ['Check!', 'Give a check', 'checks', 1],
    ['Pressure', 'Give 50 checks', 'checks', 50],
    ['Relentless', 'Give 200 checks', 'checks', 200] ] },
  { t: 'Checkmates', icon: '♚', a: [
    ['Checkmate!', 'Deliver a checkmate', 'checkmates', 1],
    ['Finisher', 'Deliver 10 checkmates', 'checkmates', 10],
    ['Executioner', 'Deliver 50 checkmates', 'checkmates', 50] ] },
  { t: 'Castling', icon: '🏰', a: [
    ['Castle Up', 'Castle once', 'castles', 1],
    ['Safe King', 'Castle 20 times', 'castles', 20],
    ['Fortress', 'Castle 100 times', 'castles', 100] ] },
  { t: 'Promotions', icon: '👑', a: [
    ['New Queen', 'Promote a pawn', 'promotions', 1],
    ['Promoter', 'Promote 10 pawns', 'promotions', 10],
    ['Royalty', 'Promote 50 pawns', 'promotions', 50] ] },
  { t: 'Speed', icon: '🏃', a: [
    ['Quick Win', 'Win in 20 moves or fewer', 'win20', 1],
    ['Speedy Win', 'Win in 15 moves or fewer', 'win15', 1],
    ['Blitz Win', 'Win in 10 moves or fewer', 'win10', 1] ] },
  { t: 'Mate Puzzles', icon: '♟️', a: [
    ['Mate Solver', 'Solve a mate puzzle', 'puz_mate', 1],
    ['Mate Master', 'Solve 25 mate puzzles', 'puz_mate', 25],
    ['Mate Legend', 'Solve 100 mate puzzles', 'puz_mate', 100] ] },
  { t: 'Tactic Puzzles', icon: '🎯', a: [
    ['Tactician', 'Solve a tactic puzzle', 'puz_tactic', 1],
    ['Sharp Eye', 'Solve 25 tactic puzzles', 'puz_tactic', 25],
    ['Tactics Legend', 'Solve 100 tactic puzzles', 'puz_tactic', 100] ] },
  { t: 'Endgame Puzzles', icon: '🔚', a: [
    ['Endgame Rookie', 'Solve an endgame puzzle', 'puz_endgame', 1],
    ['Endgame Pro', 'Solve 25 endgame puzzles', 'puz_endgame', 25],
    ['Endgame Legend', 'Solve 100 endgame puzzles', 'puz_endgame', 100] ] },
  { t: 'Puzzle Count', icon: '🧩', a: [
    ['Puzzler', 'Solve 10 puzzles', 'puz', 10],
    ['Puzzle Fan', 'Solve 100 puzzles', 'puz', 100],
    ['Puzzle Master', 'Solve 500 puzzles', 'puz', 500] ] },
  { t: 'Easy Puzzles', icon: '🟢', a: [
    ['Easy Start', 'Solve 10 easy puzzles', 'puz_easy', 10],
    ['Easy Fifty', 'Solve 50 easy puzzles', 'puz_easy', 50],
    ['Easy Master', 'Solve 150 easy puzzles', 'puz_easy', 150] ] },
  { t: 'Normal Puzzles', icon: '🟡', a: [
    ['Stepping Up', 'Solve 10 normal puzzles', 'puz_normal', 10],
    ['Normal Fifty', 'Solve 50 normal puzzles', 'puz_normal', 50],
    ['Normal Master', 'Solve 150 normal puzzles', 'puz_normal', 150] ] },
  { t: 'Hard Puzzles', icon: '🔴', a: [
    ['Brave', 'Solve 10 hard puzzles', 'puz_hard', 10],
    ['Tough Fifty', 'Solve 50 hard puzzles', 'puz_hard', 50],
    ['Hard Master', 'Solve 150 hard puzzles', 'puz_hard', 150] ] },
  { t: 'Clean Solves', icon: '✨', a: [
    ['No Hint', 'Solve a puzzle with no hint or mistake', 'puzClean', 1],
    ['Clean 25', 'Solve 25 puzzles cleanly', 'puzClean', 25],
    ['Flawless', 'Solve 100 puzzles cleanly', 'puzClean', 100] ] },
  { t: 'Puzzle Streak', icon: '🔥', a: [
    ['On a Roll', 'Get a 3 puzzle streak', 'puzStreakBest', 3],
    ['Hot Streak', 'Get a 10 puzzle streak', 'puzStreakBest', 10],
    ['Unstoppable', 'Get a 25 puzzle streak', 'puzStreakBest', 25] ] },
  { t: 'Daily Streak', icon: '📅', a: [
    ['Three Days', 'Reach a 3-day streak', 'streakBest', 3],
    ['Ten Days', 'Reach a 10-day streak', 'streakBest', 10],
    ['Thirty Days', 'Reach a 30-day streak', 'streakBest', 30] ] },
  { t: 'Bots', icon: '👾', a: [
    ['Bot Beater', 'Beat a bot', 'botsBeaten', 1],
    ['Bot Hunter', 'Beat 5 different bots', 'botsBeaten', 5],
    ['Bot Slayer', 'Beat 10 different bots', 'botsBeaten', 10] ] },
  { t: 'AI Wins', icon: '🤖', a: [
    ['Beat the AI', 'Win against the AI', 'winsAI', 1],
    ['AI Crusher', 'Win 10 AI games', 'winsAI', 10],
    ['AI Overlord', 'Win 30 AI games', 'winsAI', 30] ] },
  { t: 'Online', icon: '🌐', a: [
    ['Go Online', 'Play an online game', 'onlineGames', 1],
    ['Online Five', 'Play 5 online games', 'onlineGames', 5],
    ['Online Fifteen', 'Play 15 online games', 'onlineGames', 15] ] },
  { t: 'Friends', icon: '🤝', a: [
    ['Play a Friend', 'Play a pass-and-play game', 'friendsGames', 1],
    ['Friendly Five', 'Play 5 friend games', 'friendsGames', 5],
    ['Friendly Fifteen', 'Play 15 friend games', 'friendsGames', 15] ] },
  { t: 'Collection', icon: '🎁', a: [
    ['Collector', 'Collect 5 items', 'collection', 5],
    ['Hoarder', 'Collect 25 items', 'collection', 25],
    ['Curator', 'Collect 75 items', 'collection', 75] ] },
  { t: 'Rare Finds', icon: '💎', a: [
    ['Rare Find', 'Get a rare item or better', 'rares', 1],
    ['Rare Ten', 'Get 10 rare items or better', 'rares', 10],
    ['Legendary!', 'Get a legendary item', 'legendary', 1] ] },
  { t: 'Packs', icon: '📦', a: [
    ['Pack Opener', 'Open a pack', 'packs', 1],
    ['Pack Ten', 'Open 10 packs', 'packs', 10],
    ['Pack Fifty', 'Open 50 packs', 'packs', 50] ] },
  { t: 'Basics', icon: '🎓', a: [
    ['Student', 'Finish a basic skill', 'lessonsBasics', 1],
    ['Learner', 'Finish 5 basic skills', 'lessonsBasics', 5],
    ['Graduate', 'Finish all 10 basic skills', 'lessonsBasics', 10] ] },
  { t: 'Levels', icon: '🌟', a: [
    ['Level Up', 'Complete a level', 'levelsDone', 1],
    ['Two Levels', 'Complete 2 levels', 'levelsDone', 2],
    ['All Levels', 'Complete all 5 levels', 'levelsDone', 5] ] },
  { t: 'Tom Chats', icon: '💬', a: [
    ['Say Hi to Tom', 'Send Tom a message', 'tomChats', 1],
    ['Tom\'s Buddy', 'Send Tom 10 messages', 'tomChats', 10],
    ['Tom\'s BFF', 'Send Tom 50 messages', 'tomChats', 50] ] },
  { t: 'World Chat', icon: '🗣️', a: [
    ['Hello World', 'Send a world chat message', 'worldChats', 1],
    ['Chatterbox', 'Send 10 world messages', 'worldChats', 10],
    ['Social', 'Send 50 world messages', 'worldChats', 50] ] },
  { t: 'Analyzer', icon: '🔍', a: [
    ['Analyst', 'Analyze a position', 'analyzed', 1],
    ['Reviewer', 'Analyze 5 times', 'analyzed', 5],
    ['Deep Diver', 'Analyze 20 times', 'analyzed', 20] ] },
  { t: 'Rating', icon: '📈', a: [
    ['Rated', 'Play a rated game', 'rated', 1],
    ['Climber', 'Reach a 1100 rating', 'ratingPeak', 1100],
    ['Expert', 'Reach a 1400 rating', 'ratingPeak', 1400] ] },
  { t: 'Membership', icon: '🎖️', a: [
    ['Bronze', 'Become a Bronze member', 'tier', 1],
    ['Silver', 'Become a Silver member', 'tier', 2],
    ['Gold', 'Become a Gold member', 'tier', 3] ] },
  { t: 'Tom the GOAT', icon: '🦈', a: [
    ['Meet Tom', 'Play a game vs Tom', 'tomPlayed', 1],
    ['Rematch Tom', 'Play Tom 5 times', 'tomPlayed', 5],
    ['Tom Superfan', 'Play Tom 10 times', 'tomPlayed', 10] ] },
  { t: 'Explorer', icon: '🧭', a: [
    ['Curious', 'Try 3 game modes', 'modesPlayed', 3],
    ['Adventurer', 'Try 6 game modes', 'modesPlayed', 6],
    ['Explorer', 'Try all 9 modes', 'modesPlayed', 9] ] },
  { t: 'Draws', icon: '½', a: [
    ['Stalemate', 'Draw a game', 'draws', 1],
    ['Peaceful', 'Draw 5 games', 'draws', 5],
    ['Diplomat', 'Draw 20 games', 'draws', 20] ] },
  { t: 'Persistence', icon: '💪', a: [
    ['Keep Going', 'Play through 5 losses', 'losses', 5],
    ['Never Quit', 'Play through 25 losses', 'losses', 25],
    ['Resilient', 'Play through 100 losses', 'losses', 100] ] },
  { t: 'Marathon', icon: '🏅', a: [
    ['Marathon', 'Play 50 games', 'games', 50],
    ['Ultra Marathon', 'Play 150 games', 'games', 150],
    ['Iron Player', 'Play 300 games', 'games', 300] ] },
  { t: 'Well-Rounded', icon: '🌈', a: [
    ['Two Types', 'Solve 2 kinds of puzzle', 'puzTypes', 2],
    ['All Types', 'Solve all 3 kinds of puzzle', 'puzTypes', 3],
    ['Puzzle Pro', 'Solve 250 puzzles', 'puz', 250] ] },
  { t: 'Trophies', icon: '🏆', a: [
    ['Achiever', 'Unlock 25 achievements', 'unlocked', 25],
    ['Trophy Hunter', 'Unlock 60 achievements', 'unlocked', 60],
    ['Chesser Legend', 'Unlock 110 achievements', 'unlocked', 110] ] },
];
