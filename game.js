import { rpgMachine } from './machine.js';

// Observer Interface
class Observer {
  update(gameState) {
    // To be implemented by concrete observers
  }
}

// GameState class to encapsulate state data
class GameState {
  constructor(stateName, playerHealth, opponentHealth, weapon, specialItem, armor, heroName, currentLocationOrigin, lastEvent) {
    this.stateName = stateName;
    this.playerHealth = playerHealth;
    this.opponentHealth = opponentHealth;
    this.weapon = weapon;
    this.specialItem = specialItem;
    this.armor = armor;
    this.heroName = heroName;
    this.currentLocationOrigin = currentLocationOrigin;
    this.lastEvent = lastEvent;
  }
}

// Game Class (Subject in Observer Pattern)
class Game {
  constructor() {
    this.machine = rpgMachine;
    this.instance = null;
    this.playerHealth = 100;
    this.opponentHealth = 100;
    this.currentLocationOrigin = '';
    this.weapon = '';
    this.specialItem = '';
    this.armor = '';
    this.heroName = '';
    this.weaponOptions = ['Sword', 'Sorcery', 'Ax', 'Bow and Arrow'];
    this.specialItemOptions = ['Water', 'Pet Monkey', 'Monocular'];
    this.armorOptions = ['Cloak', 'Plate', 'Glue'];
    this.observers = [];
    this.lastEvent = null;
    this.winningFightMove = null;
    this._resolvedFightEvent = null;
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notifyObservers() {
    const gameState = new GameState(
      this.getCurrentState(),
      this.playerHealth,
      this.opponentHealth,
      this.weapon,
      this.specialItem,
      this.armor,
      this.heroName,
      this.currentLocationOrigin,
      this.lastEvent
    );
    this.observers.forEach(observer => observer.update(gameState));
  }

  start(initialState = null) {
    if (initialState) {
      this.instance = this.machine.newInstance({ initialState }).start();
    } else {
      this.instance = this.machine.newInstance().start();
    }
    this.notifyObservers();
  }

  sendEvent(eventType) {
  this.lastEvent = eventType;
  this.applyEventEffects(eventType);
  
  if (this.instance) {
    if (eventType === 'RESTART') {
      this.instance = this.machine.newInstance().start();
      this.winningFightMove = null;
    } else {
      const machineEvent = this._resolvedFightEvent || eventType;
      this._resolvedFightEvent = null;
      this.instance.send({ type: machineEvent });
    }
  }
  
  this.save();
  this.notifyObservers();
}

  getCurrentState() {
    return this.instance ? this.instance.state.name : null;
  }

  getAvailableTransitions() {
    const stateName = this.getCurrentState();
    return transitions[stateName] || [];
  }

  applyEventEffects(eventType) {
    if (['FOUNDPERSON', 'WIN_MINUS_TEN_ISLAND'].includes(eventType)) {
      this.winningFightMove = Math.random() < 0.5 ? 'FIGHT_RUTHLESS' : 'FIGHT_CAREFUL';
    }
    switch (eventType) {
      case 'FIGHT_RUTHLESS':
      case 'FIGHT_CAREFUL': {
        const isWin = eventType === this.winningFightMove;
        this._resolvedFightEvent = isWin ? eventType : eventType + '_FAIL';
        break;
      }
      case 'LAND':
        this.currentLocationOrigin = 'land';
        break;
      case 'SEA':
        this.currentLocationOrigin = 'sea';
        break;
      case 'CHOICEONE':
      case 'CHOICETWO':
        const healthImprovement = Math.floor(Math.random() * 20) + 1;
        this.playerHealth = Math.min(100, this.playerHealth + healthImprovement);
        break;
      case 'BATTLE':
        let playerAttack = Math.floor(Math.random() * 20) + 1;
        let opponentAttack = Math.floor(Math.random() * 25) + 1;
        if (this.weapon === 'Sword' || this.weapon === 'Bow and Arrow') playerAttack += 5;

        let potentialHealthOpponent = Math.max(0, this.opponentHealth - playerAttack);
        let potentialHealthPlayer = Math.max(0, this.playerHealth - opponentAttack);

        if (potentialHealthOpponent === 0 && potentialHealthPlayer === 0) {
          this.opponentHealth = 0;
          this.playerHealth = 1;
        } else {
          this.playerHealth = potentialHealthPlayer;
          this.opponentHealth = potentialHealthOpponent;
        }
        break;
      case 'LOSE_MINUS_FIFTY':
        this.playerHealth = Math.max(0, this.playerHealth - 50);
        break;
      case 'WIN_MINUS_TEN_ISLAND':
        this.playerHealth = Math.max(0, this.playerHealth - 10);
        break;
      case 'WINORLOSE':
        this.playerHealth = Math.max(0, this.playerHealth - 20);
        break;
      case 'WIN_LAND':
      case 'WIN_BOAT':
      case 'WINLAND':
      case 'WINBOAT':
        this.playerHealth = Math.max(0, this.playerHealth - 2);
        break;
      case 'LOSEBOAT':
        this.playerHealth = Math.max(0, this.playerHealth - 10);
        break;
      case 'PATCH':
        this.playerHealth = Math.max(0, this.playerHealth - 5);
        break;
      case 'LOSELAND':
      case 'LOSE_DIE':
      case 'CHOICETHREE':
        this.playerHealth = 0;
        break;
      case 'RESTART':
        this.resetStats();
        break;
    }
  }

  resetStats() {
    this.playerHealth = 100;
    this.weapon = '';
    this.specialItem = '';
    this.armor = '';
    this.heroName = '';
    this.currentLocationOrigin = '';
  }

  save() {
    localStorage.setItem('rpgGameSave', JSON.stringify({
      stateName: this.instance.state,
      playerHealth: this.playerHealth,
      weapon: this.weapon,
      specialItem: this.specialItem,
      armor: this.armor,
      heroName: this.heroName,
      currentLocationOrigin: this.currentLocationOrigin
    }));
  }

  load() {
    const saved = localStorage.getItem('rpgGameSave');
    if (saved) {
      const data = JSON.parse(saved);
      this.playerHealth = data.playerHealth ?? 100;
      this.weapon = data.weapon ?? '';
      this.specialItem = data.specialItem ?? '';
      this.armor = data.armor ?? '';
      this.heroName = data.heroName ?? '';
      this.currentLocationOrigin = data.currentLocationOrigin ?? '';
      this.start(data.stateName);
    } else {
      this.start();
    }
  }

  isButtonDisabled(eventType) {
    switch (eventType) {
      case 'SWIM_FAR':
        return this.playerHealth <= 90;
      case 'WIN_MINUS_TEN_ISLAND':
        return !(this.weapon === 'Sword' || this.weapon === 'Bow and Arrow');
      case 'LOSE_DIE':
        return this.weapon === 'Sword' || this.weapon === 'Bow and Arrow';
      case 'WINBOAT':
        return this.weapon !== 'Sorcery';
      case 'LOSEBOAT':
        return this.weapon === 'Sorcery';
      case 'WIN_BOAT':
        return !(this.weapon === 'Sword' || this.weapon === 'Bow and Arrow');
      case 'LOSE_MINUS_FIFTY':
        return this.weapon === 'Sword' || this.weapon === 'Bow and Arrow';
      case 'LEAVE':
        return this.playerHealth < 90;

      default:
        return false;
    }
  }
}

// UI Class (Concrete Observer)
class UI extends Observer {
  constructor(game) {
    super();
    this.game = game;
    this.transitions = {
      start: ['SEA', 'LAND'],
      seaChoice: ['CREW', 'ABANDONED'],
      found: ['TRICK', 'FIGHT'],
      holeInBoat: ['PATCH', 'SWIM'],
      stealClothes: ['CONTINUEJOURNEY'],
      stealBoat: ['CONTINUEJOURNEY'],
      fightBoat: ['WIN_BOAT', 'LOSE_MINUS_FIFTY'],
      fightCastle: ['WIN_MINUS_TEN_ISLAND', 'LOSE_DIE'],
      fightLooters: ['WIN_LAND'],
      trickLooters: ['WINLAND', 'LOSELAND'],
      trickBoat: ['WINBOAT', 'LOSEBOAT'],
      walkPlank: ['PATCH', 'SWIM'],
      volcanoIsland: ['ENTERISLAND'],
      wildBeast: ['WINORLOSE'],
      recover: ['CHOICEONE', 'CHOICETWO', 'CHOICETHREE'],
      islandOptions: ['RECOVER', 'LEAVE'],
      goalIsland: ['CASTLE', 'CAVE'],
      swim: ['SWIM_CLOSE', 'SWIM_FAR'],
      strollIn: ['FOUNDPERSON'],
      fightRandom: ['FIGHT_RUTHLESS', 'FIGHT_CAREFUL'],
      looters: ['FIGHT', 'TRICK', 'RUN'],
      waterEdge: ['FIGHT', 'SWIM'],
      getInfo: ['SEACHOICE'],
      death: ['RESTART'],
      victory: ['RESTART'],
    };
    this.actionLabels = {
      SEA: "Travel by Sea",
      LAND: "Travel by Foot",
      CREW: "Sneak onto a Crew's Boat",
      ABANDONED: "Take an Abandoned Boat",
      TRICK: "Attempt to Trick Them",
      FIGHT: "Engage in Combat",
      CONTINUEJOURNEY: "Continue the Journey",
      WIN_MINUS_TEN_ISLAND: "Victory",
      WIN_LAND: "Fight the Looters",
      WIN_BOAT: "Seize the Vessel",
      LOSE_MINUS_FIFTY: "Overpowered and Captured",
      LOSE_DIE: "Meet Your End",
      WINLAND: "Successful Deception",
      LOSELAND: "The Ruse Fails",
      WINBOAT: "Successful Deception",
      LOSEBOAT: "The Ruse Fails",
      PATCH: "Patch the Leak",
      SWIM: "Dive into the Waves",
      SWIM_CLOSE: "Swim to the Volcano Island",
      SWIM_FAR: "Swim for the Distant Island",
      ENTERISLAND: "Step onto the Ashy Shore",
      WINORLOSE: "Survival of the Fittest",
      CHOICEONE: "Wait for the Right Moment",
      CHOICETWO: "Scavenge for Supplies",
      CHOICETHREE: "Sleep in Your Crafted Shelter",
      RECOVER: "Rest and Heal",
      LEAVE: "Depart the Island",
      CASTLE: "Approach the Castle Gates",
      CAVE: "Explore the Cave",
      DOORONE: "The Door to the Left",
      DOORTWO: "The Door to the Right",
      FOUNDPERSON: "Confront the Presence",
      WIN: "Victory",
      LOSE: "Defeat at the Finish Line",
      BATTLE: "Engage in Combat",
      RUN: "Flee Toward the Water's Edge",
      SEACHOICE: "Head to the Docks",
      RESTART: "Begin a New Hero's Journey",
      FIGHT_RUTHLESS: "Fight Ruthlessly",
      FIGHT_CAREFUL: "Fight Carefully"
    };
    this.visuals = {
      start: "assets/baloo_base.gif",
      //seaChoice: "assets/Placeholder-2.jpg",
      //looters: "assets/Placeholder-2.jpg"
    };
    this.weaponGifs = {
      'Sword': "assets/baloo_sword.gif",
      'Sorcery': "assets/baloo_sorcery.gif",
      'Ax': "assets/baloo_ax.gif",
      'Bow and Arrow': "assets/baloo_bow.gif"
    };
    this.landTypes = {
      start:        'start',
      looters:      'land',
      waterEdge:    'land',
      trickLooters: 'land',
      fightLooters: 'land',
      getInfo:      'land',
      seaChoice:    'sea',
      found:        'sea',
      holeInBoat:   'sea',
      fightBoat:    'sea',
      trickBoat:    'sea',
      stealBoat:    'sea',
      walkPlank:    'sea',
      swim:         'sea',
      volcanoIsland:'cave',
      wildBeast:    'cave',
      recover:      'cave',
      islandOptions:'cave',
      secretPassage:'cave',
      goalIsland:   'castle',
      fightCastle:  'castle',
      strollIn:     'castle',
      backEntrance: 'castle',
      fightRandom:  'castle',
      stealClothes: 'castle',
      victory:      'castle',
      death:        'castle'
    };
    document.getElementById('permanent-reset').onclick = () => {
  if (confirm("Are you sure you want to start over? All progress will be lost.")) {
    this.game.sendEvent('RESTART');
  }
};
  }

  getContent(stateName, gameState) {
    content
    return content[stateName] ?? `Unknown state: ${stateName}`;
  }

  getContent(stateName, gameState) {
    const content = {
      start: `There is a thief in distant lands who has stolen your likeness. They have committed countless crimes, sullied your name, and emptied your life savings. Your mission is to find this thief and take back your life... Choose your path, brave soul.`,
      seaChoice: `You start near port. Nearby, there is ship unattended beside a pirate ship leaving for an unknown destination. Should you steal the unattended ship or stow away on the pirate's vessel?`,
      looters: `You make your way inward on a narrow path. You turn to your left and eyes peer through the brush; then to the right and another set lay upon you. You are being followed... As this revelation hits you, the looters move in closer for attack. What shall you do?`,
      waterEdge: `You make a break for it. These looters are no match for ${gameState.heroName}! You race away from any familiar lands and stumble across the waters edge. The looters quickly catch up... what shall you do now?`,
      trickLooters: `You attempt to deceive these fools posing as looters. Using your secret weapon, ${gameState.weapon} you attempt to beguile these looters for information. Let us see how they will respond...`,
      found: `The crew has found you on the boat. You now have the choice to either try to trick them or fight them. Choose wisely, for the choice you make may determine whether you survive or not.`,
      holeInBoat: `The abandoned boat you found has a hole in it making it not safe for travel. Your choice now is to try to patch the hole or you can decide to abandon ship and swim to your destination.`,
      stealClothes: `You have been successful in tricking the pirates by means of stealing their clothes. You are now seen as a member of their crew and are able to ride along with them to your destination.`,
      stealBoat: `You succeed in battle against the nefarious pirates with brute force. Now that the pirates have been dispatched, you take the ship for yourself and continue towards your destination.`,
      fightLooters: `You draw your weapon and choose to face the looters head on! Steel yourself, for it is time to fight!`,
      fightBoat: `The pirates have found you on the ship and know that you do not belong. They are preparing for a fight against you. You must do the same so that you can protect yourself and have any chance of staying on board the ship so you can get back your life.`,
      fightCastle: `Upon entering the castle, you enter a large gloomy hallway. As you take a step forward, a large Gargoyle soon descends upon you! All you can do is battle!`,
      trickBoat: `You attempt to deceive the pirates by matching their attire using your, ${gameState.weapon}! If they believe to be one of their own, you can hitch a ride... let's see if it works...`,
      walkPlank: `Unfortunately you've been bested by the pirates... Luckily they leave you alive, but you have to pay for your insolence they force you to walk the plank. How cruel.`,
      volcanoIsland: `You arrive at a peculiar island housing a lone volcano. The surroundings don't tell you very much, so it would be wise to investigate further.`,
      wildBeast: `You're alerted by the sound of a ghastly roar! You turn around and find yourself at the mercy of a wild beast! You draw your, ${gameState.weapon} and begin the fight for your life.`,
      recover: `After battling the beast, you must recover. Choose wisely how you will recover, for the wrong choice may lead to your demise.`,
      islandOptions: `Your respite on the island has given you strength. Should you choose to stay and recover more or do you feel ready to depart for the final stretch of your journey?`,
      secretPassage: `A secret passage appears in the depths of the cave. You venture inwards to discover two doors leading into the castle. What lurks beyond?`,
      backEntrance: `You open the door to find yourself deep within the castle walls, face to face with the thief that has stolen your likeness; this is what you have been waiting for.`,
      goalIsland: `The island, once nearly disguised by the mist, now stands before you in all its glory. Upon the island, you see a large castle and a cave entrance. You know that the thief is on this island, but where could they be hiding? Do you approach the castle head on or do you try to find a secret entrance around back?`,
      swim: `In the murky waters, two islands loom in the distance. The closer emits a faint plume of smoke, while the farther is nearly obscured by mist. Your arms ache with fatigue, and the waves grow more turbulent. Do you swim towards the volcanic island, hoping to find shelter, or do you push on towards the distant shore, risking exhaustion?`,
      strollIn: `The castle gates part for you with a dead behemoth at your feet. You step inside and find yourself in a dimly lit hallway. You begin to explore the castle and stumble across a figure in the shadows. As you approach, the figure steps forward and you see your own likeness. The thief who sullied your good name stands before you.`,
      fightRandom: `This is your chance, no, your destiny. You are face to face with the thief who has stolen your identity. This is the moment you have been preparing for. Do you have what it takes to win this fight and reclaim your life?`,
      getInfo: `Your battle, fought to the brink of death, has ended in victory. You offer your opponent a chance to survive in exchange for information pertaining to the thief you are after. Your opponent, beaten and breathless, recounts: "The villain you're after, they are on the far island. You need to get to the sea."`,
      death: `Your quest ends here. The darkness takes you with your goal unfulfilled. Your name will become infamous for the crimes you did not commit and your family will die penniless.`,
      victory: `Huzzah! You have reclaimed your identity and restored your life savings. Now you may start anew... hopefully people will forget about the crimes that your doppelganger committed.`
    };
    return content[stateName] ?? `Unknown state: ${stateName}`;
  }

  update(gameState) {
    this.render(gameState);
  }

  render(gameState) {
    const stateName = gameState.stateName;
    const display = document.getElementById('game-text');
    const actionArea = document.getElementById('actions');
    const healthDisplay = document.getElementById('health');

    console.log(stateName);

    const visualImg = document.getElementById('visual-element');
    if (visualImg) {
      const weaponFallback = stateName !== 'start' && gameState.weapon
        ? (this.weaponGifs[gameState.weapon] || "assets/Placeholder-1.jpg")
        : "assets/Placeholder-1.jpg";
      visualImg.src = this.visuals[stateName] || weaponFallback;
      visualImg.alt = `Scene for ${stateName}`;
    }

    const landType = this.landTypes[stateName] || 'land';
    const gameBackground = document.getElementById('game-background');
    if (gameBackground) {
      gameBackground.style.setProperty('--bg-image', `url('assets/${landType}.jpg')`);
    }

    display.innerText = this.getContent(stateName, gameState);
    if (healthDisplay) healthDisplay.innerText = `❤️ Health: ${gameState.playerHealth}`;
    actionArea.innerHTML = '';

    const events = this.transitions[stateName] ?? [];
    events.forEach(eventType => {
      if (this.game.isButtonDisabled(eventType)) return;

      const btn = document.createElement('button');
      btn.innerText = this.actionLabels[eventType] ?? eventType;
      btn.onclick = () => this.handleButtonClick(eventType);
      actionArea.appendChild(btn);
    });

    if (stateName === 'start') {
      this.renderStartForm();
    }

    // Handle special texts based on lastEvent
    if (gameState.lastEvent === 'PATCH') {
      const patchText = document.createElement('p');
      patchText.innerText = "You attempt to patch the hole, but it's not a fix. The boat is still taking on water and you lose some health as you struggle to keep it afloat. You quickly realize that the water is your only option.";
      document.body.appendChild(patchText);
    }
    if (gameState.lastEvent === 'CHOICETHREE') {
      const choiceThree = document.createElement('p');
      choiceThree.innerText = "As you sleep, the island's notorious volcanic activity causes a sudden eruption. The resulting ash cloud engulfs you, leading to suffocation and an untimely demise.";
      document.querySelector("#game-text").appendChild(choiceThree);
    }
    if ((gameState.lastEvent === 'LEAVE' || gameState.lastEvent === 'STEALCLOTHES' || gameState.lastEvent === 'SWIM_FAR') && gameState.specialItem === 'Monocular') {
      const monocular = document.createElement('p');
      monocular.innerText = "Your Monocular reveals a hidden doorway within the cave! This must be the way!";
      document.querySelector("#game-text").appendChild(monocular);
    }
  }


  handleButtonClick(eventType) {
    this.game.sendEvent(eventType);
  }

  renderStartForm() {
    // Outer box
    const formBox = document.createElement("div");
    formBox.className = "start-form-box";

    // Helper: creates a labelled radio group section inside a box
    const makeSection = (title, options, name, getValue, onChange) => {
      const section = document.createElement("div");
      section.className = "start-form-section";

      const heading = document.createElement("h5");
      heading.innerText = title;
      section.appendChild(heading);

      const radioGroup = document.createElement("div");
      radioGroup.className = "start-form-radio-group";

      options.forEach(option => {
        const wrapper = document.createElement("div");
        wrapper.className = "start-form-radio-item";

        const radioOption = document.createElement("input");
        radioOption.type = "radio";
        radioOption.name = name;
        radioOption.value = option;
        radioOption.id = `${name}-${option}`;
        radioOption.checked = getValue() === option;
        radioOption.onchange = () => onChange(option);

        const label = document.createElement("label");
        label.htmlFor = `${name}-${option}`;
        label.innerText = option;

        wrapper.appendChild(radioOption);
        wrapper.appendChild(label);
        radioGroup.appendChild(wrapper);
      });

      section.appendChild(radioGroup);
      return section;
    };

    // Username field
    const usernameSection = document.createElement("div");
    usernameSection.className = "start-form-section";
    const userLabel = document.createElement("label");
    userLabel.innerText = "Hero Name";
    userLabel.htmlFor = "userName";
    userLabel.className = "start-form-label";
    const user = document.createElement("input");
    user.name = "userName";
    user.id = "userName";
    user.className = "start-form-input";
    user.value = this.game.heroName;
    user.oninput = (e) => {
      this.game.heroName = e.target.value;
    };
    usernameSection.appendChild(userLabel);
    usernameSection.appendChild(user);
    formBox.appendChild(usernameSection);

    // Radio sections
    formBox.appendChild(makeSection(
      "Weapon", this.game.weaponOptions, "weapons",
      () => this.game.weapon, (val) => { this.game.weapon = val; }
    ));
    formBox.appendChild(makeSection(
      "Special Item", this.game.specialItemOptions, "specialItem",
      () => this.game.specialItem, (val) => { this.game.specialItem = val; }
    ));
    formBox.appendChild(makeSection(
      "Armor", this.game.armorOptions, "armor",
      () => this.game.armor, (val) => { this.game.armor = val; }
    ));

    document.querySelector("#game-text").appendChild(formBox);
  }
}

// Instantiate and setup
const game = new Game();
const ui = new UI(game);
game.addObserver(ui);
game.load();