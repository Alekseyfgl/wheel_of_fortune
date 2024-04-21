const BETS_ACCEPTED_TIME = 15000; // Время приема ставок
const DRAW_TIME = 5000; // время розыгрыша, т.е. выпадения числа
const PAYOUT_TIME = 1000; // время зачисление выигрыша в МС

export function mockDelay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export const enum OPERATION {
  ADD = "ADD",
  MINUS = "MINUS",
}

class GameWheel {
  public id: number = +new Date(); //лучше использовать UUID
  private sectors: number[] = [];
  private winningHistory: { playerId: number; winSize: number }[] = [];

  constructor() {
    this.initSectors();
  }

  /**
   * установить ставку и запустить розыгрыш(runSpoof), где время приема ставок $BETS_ACCEPTED_TIME
   * @param betSize - суммас ставки
   * @param sectorBet - сектор на который делаем ставку
   * @param player - участник
   */
  public setBet(betSize: number, sectorBet: number, player: Player) {
    setTimeout(
      () => this.runSpoof(betSize, sectorBet, player),
      BETS_ACCEPTED_TIME,
    );
  }

  /**
   *показать историю побед
   */
  public get getWinningHistory() {
    return this.winningHistory;
  }

  private initSectors() {
    this.addSector(2, 24);
    this.addSector(4, 12);
    this.addSector(6, 8);
    this.addSector(12, 4);
    this.addSector(16, 3);
    this.addSector(24, 2);
    this.addSector(48, 1);
  }

  /**
   * добавить N-количество секторов с определенным номером на рулетку
   * @param sector - номер сектора
   * @param amount - количество секторов на нашей рулетке
   */
  private addSector(sector: number, amount: number) {
    for (let i = 0; i < amount; i++) {
      this.sectors.push(sector);
    }
  }

  /**
   * запустить розыгрыш
   * @param betSize - сумма которую поставил участник
   * @param sectorBet - сектор на который участник поставил ставку
   * @param player - сам участник
   */
  private runSpoof(betSize: number, sectorBet: number, player: Player) {
    setTimeout(() => {
      const targetSector: number =
        this.sectors[Math.floor(Math.random() * this.sectors.length)];
      console.log(`Сектор который выпал на рулетке: ${targetSector}`);

      if (targetSector === sectorBet) {
        // если совпал сектор на рулетке с тем на который поставил участник
        const win: number = betSize * targetSector;
        setTimeout(() => {
          this.savePlayerWinning(win, player);
        }, PAYOUT_TIME);
      } else {
        // если сектор не совпал на рулетке с тем на который поставил участник
        setTimeout(() => {
          player.getWinnings(-betSize);
        }, PAYOUT_TIME);
      }
    }, DRAW_TIME);
  }

  /**
   * Сохранить историю выигрыша
   * @param winSize - сколько денег выиграл игрок
   * @param player - какой игрок выиграл
   */
  private savePlayerWinning(winSize: number, player: Player) {
    player.getWinnings(winSize);
    this.winningHistory.push({ winSize, playerId: player.id });
  }
}

class Player {
  public id: number = +new Date(); //лучше использовать UUID
  private balance: number;
  private betHistory: { bet: number; sectorBet: number; id: number }[] = [];

  constructor(startBalance: number) {
    this.balance = startBalance;
  }

  /**
   * Установить ставку как участник
   * @param betSize - ставка участника в денежном эквиваленте
   * @param sectorBet - сектор на который устастник поставил
   * @param gameWheel - игра в которой участвует участник
   */
  public setBet(betSize: number, sectorBet: number, gameWheel: GameWheel) {
    if (this.balance >= betSize) {
      this.betHistory.push({ bet: betSize, sectorBet, id: +new Date() });
      gameWheel.setBet(betSize, sectorBet, this);
    } else {
      console.log("Недостаточно средств для ставки");
    }
  }

  /**
   * Показать выигрыш или проигрыш игрока
   * @param winning - сумма которую игрок проиграл или выиграл
   */
  public getWinnings(winning: number) {
    if (winning < 0) {
      this.changeBalance(Math.abs(winning), OPERATION.MINUS);
      console.log(
        `Игрок проиграл: ${-winning}. Текущий баланс: ${this.getBalance}`,
      );
    } else {
      this.changeBalance(winning, OPERATION.ADD);
      console.log(
        `Игрок получил выигрыш: ${winning}. Текущий баланс: ${this.getBalance}`,
      );
    }
  }

  public skipBet() {
    console.log("Игрок пропустил ставку");
  }

  public get getBalance() {
    return this.balance;
  }

  public get getBetHistory() {
    return this.betHistory;
  }

  /**
   * Изменить баланс пользователя
   * @param count - сумма  которую надо изменить
   * @param operation тип операции
   */
  public changeBalance(count: number, operation: OPERATION) {
    if (operation === OPERATION.ADD) {
      return (this.balance += count);
    }

    if (operation === OPERATION.MINUS) {
      return (this.balance -= count);
    }
    return 0;
  }
}

// for logs
(async function () {
  const player = new Player(100);
  const gameWheel = new GameWheel();

  player.setBet(10, 2, gameWheel);

  //дождаться выполнения игры
  await mockDelay(BETS_ACCEPTED_TIME + 500);

  console.log(`Баланс игрока, после игры: ${player.getBalance}`);
  console.log(
    `История ставок игрока, после игры: ${JSON.stringify(
      player.getBetHistory,
    )}`,
  );
  console.log(
    `История выигрышей, после игры: ${JSON.stringify(
      gameWheel.getWinningHistory,
    )}`,
  );
})();
