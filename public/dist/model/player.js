const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
export class Player {
    constructor(playerID, gameBoard, deck) {
        this.playCard = (spaceID, cardID) => {
            const card = this.getCardFromHandByID(cardID);
            if (!card)
                return false;
            if (!this.gameBoard.setCard(spaceID, card)) {
                return false;
            }
            else {
                this.hand = this.hand.filter((ele) => ele !== card);
                return true;
            }
        };
        this.undoPlayCard = (spaceID) => {
            const space = this.gameBoard.getSpace(spaceID);
            if (space) {
                const card = space.getCard();
                if (card) {
                    this.hand.push(card);
                    this.gameBoard.removeCardAndResolveBoard(spaceID);
                }
            }
        };
        this.drawCard = () => {
            const newCard = this.deck.drawCard();
            if (newCard) {
                this.hand.push(newCard);
                if (this.playerID !== 'Computer') {
                    if (this.sendCardDrawtoView) {
                        this.sendCardDrawtoView(newCard);
                    }
                }
            }
        };
        this.getAvailableTokenSpaces = () => {
            return this.gameBoard.getAvailableTokenSpaces(this.playerID);
        };
        this.placeToken = (spaceID) => {
            if (this.influenceTokens > 0) {
                this.influenceTokens--;
                return this.gameBoard.setPlayerToken(spaceID, this.playerID);
            }
            return false;
        };
        this.undoPlaceToken = (spaceID) => {
            this.influenceTokens++;
            console.log(`undoPlaceToken player method called on ${this.playerID}`);
            return this.gameBoard.removePlayerTokenAndResolveBoard(spaceID);
        };
        this.getInfluenceTokensNo = () => {
            return this.influenceTokens;
        };
        this.playerID = playerID;
        this.gameBoard = gameBoard;
        this.deck = deck;
        this.hand = [];
        this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
        console.log(`${this.playerID} created`);
    }
    drawStartingHand() {
        for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
            this.drawCard();
        }
    }
    getCardFromHandByID(cardID) {
        return this.hand.filter((card) => card.getId() === cardID)[0];
    }
    getHandArr() {
        return this.hand;
    }
    getHandSize() {
        return this.hand.length;
    }
    getScore() {
        return this.gameBoard.getPlayerScore(this.playerID);
    }
    bindSendCardPlayToView(sendCardPlaytoView) {
        this.sendCardPlaytoView = sendCardPlaytoView;
    }
    bindSendTokenPlayToView(sendTokenPlayToViewCB) {
        this.sendTokenPlayToView = sendTokenPlayToViewCB;
    }
    bindDrawCard(sendCardDrawtoView) {
        this.sendCardDrawtoView = sendCardDrawtoView;
    }
}
export class ComputerPlayer extends Player {
    constructor(playerID, gameBoard, deck, opponentID) {
        super(playerID, gameBoard, deck);
        this.computerTakeTurn = () => {
            var _a;
            const allMoves = this.getAllAvailableMoves();
            const topCardOnlyMove = allMoves.sort((a, b) => {
                return a.cardOnlyScore - b.cardOnlyScore;
            })[0];
            const topTokenMove = allMoves.sort((a, b) => {
                // two undefined values should be treated as equal ( 0 )
                if (typeof a.withTokenScore === 'undefined' &&
                    typeof b.withTokenScore === 'undefined')
                    return 0;
                // if a is undefined and b isn't a should have a lower index in the array
                else if (typeof a.withTokenScore === 'undefined')
                    return 1;
                // if b is undefined and a isn't a should have a higher index in the array
                else if (typeof b.withTokenScore === 'undefined')
                    return -1;
                // if both numbers are defined compare as normal
                else
                    return a.withTokenScore - b.withTokenScore;
            })[0];
            let finalChoice = topCardOnlyMove;
            // If the top score from placing a token is higher than from only placing a card,
            // choose the move that places a token as well as a card.
            // Otherwise only place a card. Minimum threshold for token placement
            //  was already tested in getAllAvailableMoves method, no need to test again.
            if (this.influenceTokens > 0) {
                if ((topTokenMove === null || topTokenMove === void 0 ? void 0 : topTokenMove.withTokenScore) &&
                    (topTokenMove === null || topTokenMove === void 0 ? void 0 : topTokenMove.SpaceToPlaceToken) &&
                    (topTokenMove === null || topTokenMove === void 0 ? void 0 : topTokenMove.withTokenScore) > topCardOnlyMove.cardOnlyScore) {
                    finalChoice = topTokenMove;
                    this.playCard(finalChoice.spaceToPlaceCard.getID(), finalChoice.cardToPlay.getId());
                    if (this.sendCardPlaytoView) {
                        this.sendCardPlaytoView(finalChoice.cardToPlay, finalChoice.spaceToPlaceCard);
                    }
                    console.log(`${this.playerID} played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`);
                    const spaceToPlaceToken = finalChoice.SpaceToPlaceToken;
                    if (spaceToPlaceToken) {
                        this.placeToken(spaceToPlaceToken.getID());
                        if (this.sendTokenPlayToView) {
                            this.sendTokenPlayToView(spaceToPlaceToken);
                        }
                        console.log(`${this.playerID} played a token to ${(_a = finalChoice.SpaceToPlaceToken) === null || _a === void 0 ? void 0 : _a.getID()}`);
                    }
                }
                else {
                    this.playCard(finalChoice.spaceToPlaceCard.getID(), finalChoice.cardToPlay.getId());
                    if (this.sendCardPlaytoView) {
                        this.sendCardPlaytoView(finalChoice.cardToPlay, finalChoice.spaceToPlaceCard);
                    }
                    console.log(`${this.playerID} played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`);
                }
            }
            this.drawCard();
        };
        this.opponentID = opponentID;
    }
    getAllAvailableMoves() {
        const currentHumanScore = this.gameBoard.getPlayerScore(this.opponentID);
        const currentComputerScore = this.gameBoard.getPlayerScore(this.playerID);
        const resultsArr = [];
        // sort cards in hand by value. If it's not possible to increase the
        // score this turn, then at least we will only play the lowest valued card
        const handArr = this.getHandArr().sort((a, b) => {
            return a.getValue() - b.getValue();
        });
        //for each card in computers hand,
        handArr.forEach((card) => {
            this.gameBoard.getAvailableSpaces().forEach((availCardSpace) => {
                // see what the change in score will be for each open space on the board
                this.gameBoard.setCard(availCardSpace.getID(), card);
                const changeInHumanScore = this.gameBoard.getPlayerScore(this.opponentID) - currentHumanScore;
                const changeInComputerScore = this.gameBoard.getPlayerScore(this.playerID) - currentComputerScore;
                const cardOnlyScore = changeInComputerScore - changeInHumanScore;
                const resultsObj = {
                    cardToPlay: card,
                    spaceToPlaceCard: availCardSpace,
                    cardOnlyScore: cardOnlyScore,
                    SpaceToPlaceToken: undefined,
                    withTokenScore: undefined
                };
                resultsArr.push(resultsObj);
                // then also check what the change in score will be when placing a token
                // in any space meeting the minimum requirements
                if (this.influenceTokens > 0) {
                    this.gameBoard
                        .getAvailableTokenSpaces(this.playerID)
                        .forEach((availTokenSpace) => {
                        var _a;
                        const CARD_VALUE_THRESHOLD = 5;
                        const SCORE_INCREASE_THRESHOLD = 3;
                        const adjustedCardValueThreshold = this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
                        const cardValue = (_a = availTokenSpace.getCard()) === null || _a === void 0 ? void 0 : _a.getValue();
                        if (cardValue && cardValue >= adjustedCardValueThreshold) {
                            this.gameBoard.setPlayerToken(availTokenSpace.getID(), this.playerID);
                            const tokenChangeInHumanScore = this.gameBoard.getPlayerScore(this.opponentID) -
                                currentHumanScore;
                            const tokenChangeInComputerScore = this.gameBoard.getPlayerScore(this.playerID) -
                                currentComputerScore;
                            const withTokenScore = tokenChangeInComputerScore - tokenChangeInHumanScore;
                            const adjustedScoreThreshold = this.adjustMinThreshold(SCORE_INCREASE_THRESHOLD);
                            if (withTokenScore >= cardOnlyScore + adjustedScoreThreshold) {
                                resultsObj['SpaceToPlaceToken'] = availTokenSpace;
                                resultsObj['withTokenScore'] = withTokenScore;
                            }
                            // reset score after each token removal
                            this.gameBoard.removePlayerTokenAndResolveBoard(availTokenSpace.getID());
                        }
                    });
                }
                // reset score after each card removal
                this.gameBoard.removeCardAndResolveBoard(availCardSpace.getID());
            });
        });
        return resultsArr;
    }
    // helper fn to adjust requirements for placing an influence
    // token as the game progresses
    adjustMinThreshold(hopedForAmt) {
        const spaceLeft = this.gameBoard.getAvailableSpaces().length;
        const sizeOfTheBoard = this.gameBoard.getBoardSize();
        const settledForNumber = Math.ceil(hopedForAmt * (spaceLeft / sizeOfTheBoard));
        return settledForNumber;
    }
}
