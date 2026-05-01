import { defineMachine } from 'https://esm.sh/yay-machine';

// yay-machine requires:
// - initialState: { name: 'stateName' }
// - transitions as objects: { to: 'nextState' }
// - the export is the machine definition (call .newInstance().start() in game.js)

export const rpgMachine = defineMachine({
  initialState: { name: 'start' },
  enableCopyDataOnTransition: true,
  states: {
    start: {
      on: {
        SEA: { to: 'seaChoice' },
        LAND: { to: 'looters' }
      }
    },
    seaChoice: {
      on: {
        CREW: { to: 'found' },
        ABANDONED: { to: 'holeInBoat' }
      }
    },
    found: {
      on: {
        TRICK: { to: 'trickBoat' },
        FIGHT: { to: 'fightBoat' }
      }
    },
    holeInBoat: {
      on: {
        PATCH: { to: 'swim' },
        SWIM: { to: 'swim' }
      }
    },
    stealClothes: {
      on: {
        CONTINUEJOURNEY: { to: 'goalIsland' }
      }
    },
    stealBoat: {
      on: {
        CONTINUEJOURNEY: { to: 'holeInBoat' }
      }
    },
    fightBoat: {
      on: {
        WIN_BOAT: { to: 'stealBoat' },
        LOSE_MINUS_FIFTY: { to: 'walkPlank' }
      }
    },
    fightCastle: {
      on: {
        WIN_MINUS_TEN_ISLAND: { to: 'strollIn' },
        LOSE_DIE: { to: 'death' }
      }
    },
    fightLooters: {
      on: {
        WIN_LAND: { to: 'getInfo' }
      }
    },
    trickLooters: {
      on: {
        WINLAND: { to: 'getInfo' },
        LOSELAND: { to: 'death' }
      }
    },
    trickBoat: {
      on: {
        WINBOAT: { to: 'stealClothes' },
        LOSEBOAT: { to: 'fightBoat' }
      }
    },
    walkPlank: {
      on: {
        SWIM: { to: 'swim' }
      }
    },
    volcanoIsland: {
      on: {
        ENTERISLAND: { to: 'wildBeast' }
      }
    },
    wildBeast: {
      on: {
        WINORLOSE: { to: 'recover' }
      }
    },
    recover: {
      on: {
        CHOICEONE: { to: 'islandOptions' },
        CHOICEONE_FAIL: { to: 'recoverFail' },
        CHOICETWO: { to: 'islandOptions' },
        CHOICETHREE: { to: 'death' }
      }
    },
    recoverFail: {
      on: {
        LEAVE: { to: 'goalIsland' },
        LOSE: { to: 'death' }
      }
    },
    islandOptions: {
      on: {
        RECOVER: { to: 'recover' },
        LEAVE: { to: 'goalIsland' }
      }
    },
    goalIsland: {
      on: {
        CASTLE: { to: 'fightCastle' },
        CAVE: { to: 'secretPassage' }
      }
    },
    secretPassage: {
      on:  {
        DOORONE: { to: 'backEntrance'},
        DOORTWO: {to: 'backEntrance'}
      }
    },
    backEntrance: {
      on: {
        FOUNDPERSON: {to: 'fightRandom'}
      }
    },
    swim: {
      on: {
        SWIM_CLOSE: { to: 'volcanoIsland' },
        SWIM_FAR: { to: 'goalIsland' }
      }
    },
    strollIn: {
      on: {
        FOUNDPERSON: { to: 'fightRandom' }
      }
    },
    fightRandom: {
      on: {
        FIGHT_RUTHLESS: { to: 'victory' },
        FIGHT_CAREFUL: { to: 'victory' },
        FIGHT_RUTHLESS_FAIL: { to: 'death' },
        FIGHT_CAREFUL_FAIL: { to: 'death' }
      }
    },
    looters: {
      on: {
        FIGHT: { to: 'fightLooters' },
        TRICK: { to: 'trickLooters' },
        RUN: { to: 'waterEdge' }
      }
    },
    waterEdge: {
      on: {
        FIGHT: { to: 'fightLooters' },
        SWIM: { to: 'swim' }
      }
    },
    getInfo: {
      on: {
        SEACHOICE: { to: 'seaChoice' }
      }
    },
    death: {
      on: {
        RESTART: { to: 'start' }
      }
    },
    victory: {
      on: {
        RESTART: { to: 'start' }
      }
    },
    global: {
      LOAD_STATE: (context, event) => ({to: event.targetState})
    }
  }
});