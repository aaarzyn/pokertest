/***
Texas Hold'em Poker Probability Calculator

This program takes in a series of cards provided and calculates your chance of having the best hand of the players. 
It depends on what cards you have, what cards are down, and how many people are playing.

It works specifically for texas hold 'em poker where you get two cards in your hand and three cards are placed down, then one more, 
then one last card, and you make the best hand of five using the total possible seven cards. 
***/



const SUITS = ["H", "D", "C", "S"]; // hearts, diamonds, clubs, and spades
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]; // ace marked as highest for high card reasons
// indexes 0 to 12 for 2 to 13/A
const SUIT_NAMES = {"H": "Hearts", "D": "Diamonds", "C": "Clubs", "S": "Spades"};
const SUIT_SYMBOLS = {"H": "♥", "D": "♦", "C":"♣", "S": "♠" };
const SUIT_COLORS = {"H": "red", "D": "red", "C": "black", "S": "black"};
const RANK_NAMES = {"2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10", "J": "Jack", "Q": "Queen", "K": "King", "A": "Ace"}; // # ace marked as highest for high card reasons
const HAND_TYPES = ["High Card", "One Pair", "Two Pair", "Three of a Kind",
    "Straight", "Flush", "Full House", "Four of a Kind",
    "Straight Flush", "Royal Flush"
];




// card 
class Card {
    constructor(rank, suit) {
        if (!RANKS.includes(rank)) {
            throw new Error(`Invalid rank: ${rank}`);
        }
        if (!SUITS.includes(suit)) {
            throw new Error(`Invalid suit: ${suit}`);
        }
     
        this.rank = rank;
        this.suit = suit;
        this.rankValue = RANKS.indexOf(rank);
    }
    
    toString() {
      return `${this.rank}${this.suit}`;
    }
  
    equals(other) {
        if (!other) return false;
      return this.rank === other.rank && this.suit === other.suit;
    }
}


// player
class Player {
    constructor(id, name = "", position = 0, active = true) {
        this.id = id;
        this.name = name || `Player ${id}`;
        this.position = position;
       this.cards = [];
        this.active = active;
        this.cardsVisible = false; // Whether opponent cards are visible
    }
    
    addCard(card) {
        if (this.cards.length < 2) {
            this.cards.push(card);
            return true;
        }
        return false;
    }
    
    removeCard(card) {
        this.cards = this.cards.filter(c => !c.equals(card));
    }
    
    clearCards() {
        this.cards = [];
    }
}

// app state
const state = {
    players: [],
 communityCards: [],
    deck: createDeck(),
    activeSuit: 'all',
    selectedPlayerId: 0, // 0 is you
    playerCount: 2,
    layoutType: 'circle'
};

// make deck
function createDeck() {
    const deck = [];
    for (let rank of RANKS) {
        for (let suit of SUITS) {
            deck.push(new Card(rank, suit));
        }
    }
    return deck;
}

// init players
function initializePlayers(count) {
    const players = [];
    // Create 'you' player first
    players.push(new Player(0, "YOU", 1, true));
    
    // Create other players
    for (let i = 1; i < count + 1; i++) {
        players.push(new Player(i, `Player ${i + 1}`, i + 1, true));
    }
    
    return players;
}


// init images of cards
function preloadCardImages() {
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            const img = new Image();
            img.src = `Suit=${SUIT_NAMES[suit]}, Number=${RANK_NAMES[rank]}.png`;
        }
    }
    
    // Special cards
    const backImg = new Image();
    backImg.src = 'Suit=Other, Number=Back Blue.png';
    
    const jokerImg = new Image();
    jokerImg.src = 'Suit=Other, Number=Joker.png';
}


// check load
document.addEventListener('DOMContentLoaded', () => {
    // init state
    state.players = initializePlayers(state.playerCount);
    
    // init doc refs
    const cardDeck = document.getElementById('cardDeck');
 const communityCards = document.getElementById('communityCards');
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
   const results = document.getElementById('results');
    const playerCount = document.getElementById('playerCount');
    const playerCountValue = document.getElementById('playerCountValue');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const playerActiveToggle = document.getElementById('playerActiveToggle');
    const infoButton = document.getElementById('infoButton');
    const helpModal = document.getElementById('helpModal');
    const playerEditModal = document.getElementById('playerEditModal');
    const closeModalButtons = document.querySelectorAll('.close-modal, .cancel-btn, .close-btn');
    const savePlayerButton = document.getElementById('savePlayerButton');
    const toggleThemeButton = document.getElementById('toggleThemeButton');
    const layoutButton = document.getElementById('layoutButton');

    initialize();
    
   function initialize() {
        preloadCardImages();
    state.players = initializePlayers(state.playerCount);
        renderPlayerPositions();
        renderCardDeck();
        renderCommunityCards();
        
        // my hand default
        updateSelectedPlayerInfo(state.players[0]);
        playerCount.value = state.playerCount;
        playerCountValue.textContent = state.playerCount;
     updatePlayerCount(state.playerCount);
        
        calculateButton.addEventListener('click', calculateProbability);
     resetButton.addEventListener('click', resetCards);
        
        // slider
        playerCount.addEventListener('input', () => {
         const count = parseInt(playerCount.value);
            playerCountValue.textContent = count;
            updatePlayerCount(count);
        });
      
        // active not active
        playerActiveToggle.addEventListener('change', () => {
            // not on self
            if (state.selectedPlayerId !== 0) {
                const statusLabel = document.querySelector('.status-label');
                if (playerActiveToggle.checked) {
                    statusLabel.textContent = 'Active';
                    statusLabel.classList.remove('folded');
                  statusLabel.classList.add('active');
                    state.players[state.selectedPlayerId].active = true;
                } else {
                    statusLabel.textContent = 'Folded';
                    statusLabel.classList.remove('active');
                    statusLabel.classList.add('folded');
                    state.players[state.selectedPlayerId].active = false;
                }
                renderPlayerPositions();
            }
        });
       
        // type filter
        tabButtons.forEach(button => {
          button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                state.activeSuit = button.dataset.suit;
                renderCardDeck();
          });
        });
      
        // help
        infoButton.addEventListener('click', () => {
            helpModal.style.display = 'block';
        });
        
        // closing
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
               helpModal.style.display = 'none';
                playerEditModal.style.display = 'none';
            });
        });
        
        // closing sep click
        window.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
            if (event.target === playerEditModal) {
                playerEditModal.style.display = 'none';
            }
        });
        
        // save
        savePlayerButton.addEventListener('click', savePlayerDetails);
        
        // theme toggle
        toggleThemeButton.addEventListener('click', toggleTheme);
        
        // layout toggle
        layoutButton.addEventListener('click', toggleLayout);
   }
    
    // update info in ui
    function updateSelectedPlayerInfo(player) {
        state.selectedPlayerId = player.id;
        document.querySelector('.selected-player-name').textContent = player.name;
        
        // opp active toggles
       const statusControlsContainer = document.querySelector('.player-status-controls');
        if (player.id === 0) {
          statusControlsContainer.style.display = 'none';
        } else {
         statusControlsContainer.style.display = 'flex';
           playerActiveToggle.checked = player.active;
            
         const statusLabel = document.querySelector('.status-label');
            if (player.active) {
             statusLabel.textContent = 'Active';
               statusLabel.classList.remove('folded');
               statusLabel.classList.add('active');
            } else {
                statusLabel.textContent = 'Folded';
             statusLabel.classList.remove('active');
                statusLabel.classList.add('folded');
            }
        }
    }
    
    // pos render
    function renderPlayerPositions() {
        const positionsContainer = document.querySelector('.player-positions');
        positionsContainer.innerHTML = '';
        const validPlayers = state.players.slice(0, state.playerCount);
        const youPlayer = validPlayers.find(p => p.id === 0);

        if (youPlayer) {
     const position = document.createElement('div');
        position.className = `player-position position-1`;
        position.classList.add('you');
        
        if (!youPlayer.active) {
            position.classList.add('folded');
        }
        
        position.innerHTML = `
            <div class="player-label">${youPlayer.name}</div>
            <div class="player-cards" id="player${youPlayer.id}Cards"></div>
        `;
        
       position.addEventListener('click', () => {
            updateSelectedPlayerInfo(youPlayer);
       });
        
        positionsContainer.appendChild(position);
        renderPlayerCards(youPlayer);
        }

        // Then handle opponent players
    const opponentPlayers = validPlayers.filter(p => p.id !== 0);
    
    opponentPlayers.forEach((player, index) => {
        const position = document.createElement('div');
        position.className = `player-position position-${index + 2}`;
        
        if (!player.active) {
         position.classList.add('folded');
        }
        
     position.innerHTML = `
            <div class="player-label">${player.name}</div>
            <div class="player-cards" id="player${player.id}Cards"></div>
        `;
        
        position.addEventListener('click', () => {
         updateSelectedPlayerInfo(player);
            
            if (player.id !== 0) {
               openPlayerEditModal(player);
            }
        });
        
        positionsContainer.appendChild(position);
        renderPlayerCards(player);
    });
}

    
    // player render
    function renderPlayerCards(player) {
        const cardsContainer = document.getElementById(`player${player.id}Cards`);
        if (!cardsContainer) return;
        
        cardsContainer.innerHTML = '';
        
        // vis check
        const isYou = player.id === 0;
        const cardsVisible = isYou || player.cardsVisible;
        
        // placeholders
        for (let i = 0; i < 2; i++) {
            if (player.cards[i]) {
              if (cardsVisible) {
                const card = player.cards[i];
                    const cardElement = createCardElement(card, true);
                    cardElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        removePlayerCard(player, card);
                    });
                   cardsContainer.appendChild(cardElement);
              } else {
               const cardBack = createCardBackElement(true);
                    cardsContainer.appendChild(cardBack);
              }
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder small';
                placeholder.textContent = '?';
                cardsContainer.appendChild(placeholder);
            }
        }
    }
    
   // card back
    function createCardBackElement(small = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card card-back${small ? ' small' : ''}`;
        
        const imgElement = document.createElement('img');
        imgElement.src = 'Suit=Other, Number=Back Blue.png';
        imgElement.alt = 'Card Back';
        imgElement.className = 'card-img';
        // backup
// init app
        imgElement.onerror = function() {
            cardElement.innerHTML = '';
            cardElement.classList.add('fallback-card-back');
        };
        
        cardElement.appendChild(imgElement);
        
        return cardElement;
    }
    
    // deck render
    
    function renderCardDeck() {
        cardDeck.innerHTML = '';
        
        // used
        const usedCards = [];
        state.players.forEach(player => {
            usedCards.push(...player.cards);
        });
        usedCards.push(...state.communityCards);
        
        // removed used
       const availableCards = state.deck.filter(card =>
            !usedCards.some(usedCard =>
                usedCard && usedCard.equals(card)
            )
       );
        
        // suit filter
      const filteredCards = state.activeSuit === 'all'
            ? availableCards
            : availableCards.filter(card => card.suit === state.activeSuit);
        
        // card set up
        for (let card of filteredCards) {
         const cardElement = createCardElement(card);
            cardElement.addEventListener('click', () => selectCard(card));
            cardDeck.appendChild(cardElement);
        }
    }
    
    // comm card set up
  function renderCommunityCards() {
        communityCards.innerHTML = '';
        
        // five placeholders for table
        for (let i = 0; i < 5; i++) {
            if (state.communityCards[i]) {
                const card = state.communityCards[i];
                const cardElement = createCardElement(card);
                cardElement.addEventListener('click', () => removeCard(card));
                communityCards.appendChild(cardElement);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
             placeholder.textContent = '?';
                communityCards.appendChild(placeholder);
            }
        }
        
        updateCalculateButton();
  }
    
    // img file use
    function createCardElement(card, small = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card${small ? ' small' : ''}`;
        cardElement.classList.add('selected');
        
        const suitName = SUIT_NAMES[card.suit];
        const rankName = RANK_NAMES[card.rank];
        
        // make elem
        const imgElement = document.createElement('img');
      imgElement.src = `Suit=${suitName}, Number=${rankName}.png`;
        imgElement.alt = `${card.rank}${card.suit}`;
        imgElement.className = 'card-img';
        
        // backup
        imgElement.onerror = function() {
            console.warn(`Failed to load image for ${card.rank}${card.suit}`);
         cardElement.innerHTML = '';
            
            const color = SUIT_COLORS[card.suit];
            const fontSize = small ? '12px' : '14px';
            const symbolSize = small ? '18px' : '24px';
            
            cardElement.innerHTML = `
                <div style="color: ${color}; position: absolute; top: 3px; left: 3px; font-size: ${fontSize};">${card.rank}</div> <div style="color: ${color}; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: ${symbolSize};">${SUIT_SYMBOLS[card.suit]}</div>
<div style="color: ${color}; position: absolute; bottom: 3px; right: 3px; font-size: ${fontSize};">${card.rank}</div>
            `;
        };
        
        cardElement.appendChild(imgElement);
        
        return cardElement;
    }
    
    

// card select

    function selectCard(card) {
        const player = state.players[state.selectedPlayerId];
        
        // check for two cards, add to player
       if (player && player.cards.length < 2) {
            player.addCard(card);
            renderPlayerCards(player);
            renderCardDeck();
       }
        // comm card backup
        else if (state.communityCards.length < 5) {
            state.communityCards.push(card);
         renderCommunityCards();
          renderCardDeck();
        }
        
        updateCalculateButton();
    }
    
    // comm card remove
    function removeCard(card) {
        state.communityCards = state.communityCards.filter(c => !c.equals(card));
       renderCommunityCards();
        renderCardDeck();
        updateCalculateButton();
    }
    
    // player card remove
  function removePlayerCard(player, card) {
        player.removeCard(card);
        renderPlayerCards(player);
        renderCardDeck();
        updateCalculateButton();
  }
    
    // card reset
    function resetCards() {
     state.players.forEach(player => player.clearCards());
        state.communityCards = [];
     
        renderPlayerPositions();
        renderCommunityCards();
        renderCardDeck();
        
        results.innerHTML = `
            <div class="results-header">
                <i class="fas fa-chart-line"></i> Hand Analysis
            </div>
            <p>Select your cards and the community cards to calculate your odds.</p>
        `;
      
     updateCalculateButton();
    }
    
    // player count update
    function updatePlayerCount(count) {

    const oldCount = state.playerCount;
        // Update state
    state.playerCount = count;
    
 // If we're reducing player count, preserve existing players but trim the array
    if (count < oldCount && state.players.length > count) {
        state.players = state.players.slice(0, count);
    }
    
    // If we're increasing player count, add new players
    while (state.players.length < count) {
        const newId = state.players.length;
        const newPosition = newId + 1;
        const newName = newId === 0 ? "YOU" : `Player ${newPosition}`;
        state.players.push(new Player(newId, newName, newPosition, true));
    }
    
    renderPlayerPositions();
    updateCalculateButton();
    }

    //button calc
    function updateCalculateButton() {
        const you = state.players.find(p => p.id === 0);
        const hasYourCards = you && you.cards.length === 2;
        const hasCommunityCards = state.communityCards.length === 5;
        
        calculateButton.disabled = !(hasYourCards && hasCommunityCards);
    }
    
    function openPlayerEditModal(player) {
        // edit
        if (player.id !== 0) {
            document.getElementById('playerName').value = player.name;
            
            document.querySelectorAll('input[name="playerStatus"]').forEach(radio => {
                if ((radio.value === 'active' && player.active) ||
                    (radio.value === 'folded' && !player.active)) {
                 radio.checked = true;
                    }
            });
          
            document.querySelectorAll('input[name="cardVisibility"]').forEach(radio => {
                if ((radio.value === 'visible' && player.cardsVisible) ||
                   (radio.value === 'hidden' && !player.cardsVisible)) {
                    radio.checked = true;
                   }
            });
            
            const modalCardSelection = document.getElementById('modalCardSelection');
            modalCardSelection.innerHTML = '';
            
            // placeholders
            for (let i = 0; i < 2; i++) {
                if (player.cards[i]) {
                    const card = player.cards[i];
                    const cardElement = createCardElement(card);
                    cardElement.addEventListener('click', () => {
                        player.removeCard(card);
                        openPlayerEditModal(player);
                    });
                    modalCardSelection.appendChild(cardElement);
                } else {
                   const placeholder = document.createElement('div');
                    placeholder.className = 'card-placeholder';
                 placeholder.textContent = '+';
                    placeholder.addEventListener('click', () => {
                        // Open card selection
                        showCardSelectionInModal(player, i);
                    });
                 modalCardSelection.appendChild(placeholder);
                }
            }
            
            playerEditModal.style.display = 'block';
        }
    }
    function showCardSelectionInModal(player, cardIndex) {
        const modalCardSelection = document.getElementById('modalCardSelection');
        modalCardSelection.innerHTML = '<h4>Select a card</h4>';
        
        const usedCards = [];
        state.players.forEach(p => {
            usedCards.push(...p.cards);
        });
        usedCards.push(...state.communityCards);
        const availableCards = state.deck.filter(card =>
            !usedCards.some(usedCard =>
                usedCard && usedCard.equals(card)
            )
        );
        
        const cardGrid = document.createElement('div');
        cardGrid.className = 'modal-card-grid';
        
        for (let card of availableCards) {
     const cardElement = createCardElement(card);
            cardElement.addEventListener('click', () => {
                player.addCard(card);
             openPlayerEditModal(player); // Refresh modal
            });
         cardGrid.appendChild(cardElement);
        }
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn cancel-btn mt-3';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            openPlayerEditModal(player); // Refresh modal without selecting
        });
        
        modalCardSelection.appendChild(cardGrid);
     modalCardSelection.appendChild(cancelButton);
    }
    function savePlayerDetails() {
// card select
        const player = state.players[state.selectedPlayerId];
        if (!player) return;
        if (player.id === 0) {
player.name = document.getElementById('playerName').value || "YOU"; }
else {
        player.name = document.getElementById('playerName').value || `Player ${player.id + 1}`;}
        player.active = document.querySelector('input[name="playerStatus"]:checked').value === 'active';
     player.cardsVisible = document.querySelector('input[name="cardVisibility"]:checked').value === 'visible';
        
        renderPlayerPositions();
        updateSelectedPlayerInfo(player);
        
       playerEditModal.style.display = 'none';
    }


// toggles


// theme toggle
    function toggleTheme() {
   document.body.classList.toggle('light-theme');
      const icon = toggleThemeButton.querySelector('i');
      if (document.body.classList.contains('light-theme')) {
            toggleThemeButton.innerHTML = '<i class="fas fa-sun"></i> Light';
      } else {
            toggleThemeButton.innerHTML = '<i class="fas fa-moon"></i> Dark';
      }
    }
    
    // layout toggle
    function toggleLayout() {
        state.layoutType = state.layoutType === 'circle' ? 'rectangle' : 'circle';
        document.querySelector('.poker-table').classList.toggle('rectangular');
        layoutButton.innerHTML = state.layoutType === 'circle' 
         ? '<i class="fas fa-table"></i> Layout'
            : '<i class="fas fa-circle"></i> Layout';
    }
   

// probability stuff
/***
Evaluates a 5-card poker hand to return score and tie-breaker information. 

Hand rankings by score
9: Royal Flush (straight, flush, AKQJ10)
8: Straight Flush (straight, flush, need to know what highest card value is)
7: Four of a Kind (all four same card rank, need to know value)
6: Full House (three of a kind, pair, need to know values of each)
5: Flush (all five one suit, need to know values)
4: Straight (five in a row, need to know high card)
3: Three of a Kind (three of same value, need to know value)
2: Two Pair (two pairs, need to know values)
1: One Pair (one pair, need to know value)
0: High Card (purely value based)

Returns a tuple (score, [tie_breakers])
***/ 
    function calculateProbability() {
        try {
            const you = state.players.find(p => p.id === 0);
            
            if (!you || you.cards.length !== 2) {
                throw new Error("You need exactly 2 cards in your hand.");
            }
            
            if (state.communityCards.length !== 5) {
                throw new Error("All 5 community cards must be provided.");
            }
            const activePlayers = state.players.filter(p => p.active && p.id < state.playerCount);
            
            if (activePlayers.length < 2) {
                throw new Error("You need at least 2 active players.");
            }
            

            const allCards = [...you.cards, ...state.communityCards];
            const bestHand = findBestFive(allCards);
            const handScore = handEvaluator(bestHand);
            const handType = HAND_TYPES[handScore[0]];
            
            let probability = calculateWinProbability(you.cards, state.communityCards, activePlayers);
            
            const myHandStr = you.cards.map(card => `${card.rank}${card.suit}`).join(' ');
            const communityStr = state.communityCards.map(card => `${card.rank}${card.suit}`).join(' ');
            const bestHandStr = bestHand.map(card => `${card.rank}${card.suit}`).join(' ');
            
            // result html
            let resultHTML = `<div class="results-header"><i class="fas fa-chart-line"></i> Hand Analysis</div>`;
          
            // hand details
            resultHTML += `
             <div class="result-details">
                    <p><strong>Your Hand:</strong> ${myHandStr}</p>
                    <p><strong>Community Cards:</strong> ${communityStr}</p>
                    <p><strong>Best Five-Card Hand:</strong> ${bestHandStr}`;
            
       // royal flush style
            if (handType === "Royal Flush") {
               resultHTML += ` (<span class="royal-flush">${handType}</span>)</p>`;
            } else {
              resultHTML += ` (<strong>${handType}</strong>)</p>`;
            }
            
            resultHTML += `
                    <p><strong>Active Players:</strong> ${activePlayers.length}</p>
                 <p><strong>Probability of Winning:</strong> <span style="color: gold; font-weight: bold; font-size: 1.2em;">${(probability * 100).toFixed(2)}%</span></p>
                </div>
            `;
            
            const knownOpponents = activePlayers.filter(p => p.id !== 0 && p.cards.length === 2 && p.cardsVisible);
            if (knownOpponents.length > 0) {
                resultHTML += `<div style="margin-top: 15px;"><strong>Known Opponent Hands:</strong></div>`;
                
              knownOpponents.forEach(opponent => {
                    const opponentCards = opponent.cards.map(card => `${card.rank}${card.suit}`).join(' ');
                    const opponentAllCards = [...opponent.cards, ...state.communityCards];
                  const opponentBestHand = findBestFive(opponentAllCards);
                    const opponentHandScore = handEvaluator(opponentBestHand);
                  const opponentHandType = HAND_TYPES[opponentHandScore[0]];
                    
                   const comparison = compareScores(handScore, opponentHandScore);
                    let outcomeText = '';
                 
                    if (comparison > 0) {
                     outcomeText = '<span style="color: var(--success-green);">(You Win)</span>';
                    } else if (comparison < 0) {
                       outcomeText = '<span style="color: var(--danger-red);">(You Lose)</span>';
                    } else {
                      outcomeText = '<span style="color: var(--warning-orange);">(Tie)</span>';
                    }
                    
                    resultHTML += `
                       <div class="result-details" style="margin-top: 10px;">
                        <p><strong>${opponent.name}:</strong> ${opponentCards} - ${opponentHandType} ${outcomeText}</p>
                      </div>
                    `;
              });
            }
            
            results.innerHTML = resultHTML;
            
        } catch (error) {
            results.innerHTML = `
                <div class="results-header"><i class="fas fa-exclamation-triangle"></i> Error</div>
                <p style="color: #ff6b6b;">${error.message}</p>
            `;
        }
    }
   
    function handEvaluator(cards) {
        if (cards.length !== 5) {
            throw new Error("Hand evaluator requires exactly 5 cards");
        }
        
        // sort cards by rank value in descending order
        const sortedCards = [...cards].sort((a, b) => b.rankValue - a.rankValue);
      
        const ranks = sortedCards.map(card => card.rankValue);
        const suits = sortedCards.map(card => card.suit);
       
        // count occurrences of each rank
        const rankCounts = {};
        for (let rank of ranks) {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        }
        
        // check for flush
        const isFlush = new Set(suits).size === 1;
        
        // check for straight
        let isStraight = false;
        let straightHigh = -1;
     
        if (new Set(ranks).size === 5 && Math.max(...ranks) - Math.min(...ranks) === 4) {
            isStraight = true;
            straightHigh = Math.max(...ranks);
        } 
        // check for A-5 straight (special case)
        else if (JSON.stringify([...new Set(ranks)].sort((a, b) => a - b)) === JSON.stringify([0, 1, 2, 3, 12])) {
            isStraight = true;
            straightHigh = 3; // 5 is high card in A-5 straight
        }
        
        // royal Flush, check for 10, J, Q, K, A all in the same suit
        if (isFlush) {
           const royalRanks = [8, 9, 10, 11, 12]; // 10, J, Q, K, A
            const hasAllRoyalRanks = royalRanks.every(rank => ranks.includes(rank));
            
            if (hasAllRoyalRanks) {
                return [9, []]; // Royal Flush
            }
        }
        
        // Straight Flush
        if (isStraight && isFlush) {
            return [8, [straightHigh]];
        }
        
        // Four of a Kind
        for (let rank in rankCounts) {
            if (rankCounts[rank] === 4) {
                const kicker = ranks.find(r => r !== parseInt(rank));
               return [7, [parseInt(rank), kicker]];
            }
        }
        
        // Full House
        let threeRank = null;
        let pairRank = null;
        for (let rank in rankCounts) {
            if (rankCounts[rank] === 3) {
               threeRank = parseInt(rank);
            } else if (rankCounts[rank] === 2) {
                pairRank = parseInt(rank);
            }
        }
        
        if (threeRank !== null && pairRank !== null) {
            return [6, [threeRank, pairRank]];
        }
      
        // Flush
        if (isFlush) {
          return [5, ranks];
        }
        
        // Straight
        if (isStraight) {
          return [4, [straightHigh]];
        }
        
        // Three of a Kind
      for (let rank in rankCounts) {
            if (rankCounts[rank] === 3) {
                const otherCards = ranks.filter(r => r !== parseInt(rank)).sort((a, b) => b - a);
               return [3, [parseInt(rank), ...otherCards]];
            }
      }
    
       // Two Pair
        const pairs = [];
        for (let rank in rankCounts) {
          if (rankCounts[rank] === 2) {
                pairs.push(parseInt(rank));
          }
        }
       
     if (pairs.length === 2) {
            pairs.sort((a, b) => b - a);
           const kicker = ranks.find(r => !pairs.includes(r));
            return [2, [...pairs, kicker]];
     }
       
        // One Pair
        for (let rank in rankCounts) {
            if (rankCounts[rank] === 2) {
                const otherCards = ranks.filter(r => r !== parseInt(rank)).sort((a, b) => b - a);
                return [1, [parseInt(rank), ...otherCards]];
            }
        }
       
        // High Card
        return [0, ranks.sort((a, b) => b - a)];
    }
    
    // Compare hand scores
    function compareScores(score1, score2) {
        // Compare hand types
        if (score1[0] > score2[0]) return 1;
        if (score1[0] < score2[0]) return -1;
        
       // Compare tiebreakers
        const tiebreakers1 = score1[1];
        const tiebreakers2 = score2[1];
        
        for (let i = 0; i < tiebreakers1.length; i++) {
            if (tiebreakers1[i] > tiebreakers2[i]) return 1;
            if (tiebreakers1[i] < tiebreakers2[i]) return -1;
        }
        
        return 0; // Hands are equal
    }
    
    // Find best 5-card hand from 7 cards
    function findBestFive(cards) {
        if (cards.length < 5) {
          throw new Error("Need at least 5 cards to make a hand");
        }
        
        let bestHand = null;
        let bestScore = [-1, []]; // Dummy low score
        
        // Generate all combinations of 5 cards from the provided cards
        const combinations = getCombinations(cards, 5);
        
        for (let combo of combinations) {
            const score = handEvaluator(combo);
                
                if (bestHand === null) {
                    bestHand = combo;
                    bestScore = score;
                } else {
                    const comparison = compareScores(score, bestScore);
                    if (comparison > 0) {
                            bestHand = combo;
                            bestScore = score;
                    }
                }
            }
        return bestHand;
    }
    
    // Generate combinations helper function
    function getCombinations(arr, size) {
     if (size > arr.length) return [];
        if (size === arr.length) return [arr];
        if (size === 1) return arr.map(item => [item]);
        
        return arr.reduce((acc, item, i) => {
           const remaining = arr.slice(i + 1);
            const combosWithItem = getCombinations(remaining, size - 1).map(combo => [item, ...combo]);
            return [...acc, ...combosWithItem];
        }, []);
    }
    
    // Calculate win probability
function calculateWinProbability(myCards, communityCards, activePlayers) {
    // check card count
    if (myCards.length !== 2) {
        throw new Error("You need exactly two cards in your hand");
    }
    
    if (communityCards.length !== 5) {
        throw new Error("All 5 community cards must be known in current functionality");
    }
    
    // best hand with comm
    const myBestHand = findBestFive([...myCards, ...communityCards]);
    const myScore = handEvaluator(myBestHand);
    
    // remove known
    const fullDeck = createDeck();
    const knownCards = [...myCards, ...communityCards];
    const remainingDeck = fullDeck.filter(card => 
        !knownCards.some(known => known.rank === card.rank && known.suit === card.suit)
    );
   
    // calc possible hands
    const oppHandsCount = combination(remainingDeck.length, 2);
    
    let wins = 0;
    let ties = 0;
    
    // check my hand against all possible opponent hands
    const oppHandCombinations = getCombinations(remainingDeck, 2);
    
    for (let oppCards of oppHandCombinations) {
        const oppBestHand = findBestFive([...oppCards, ...communityCards]);
        const oppScore = handEvaluator(oppBestHand);
        const comparison = compareScores(myScore, oppScore);
   
        if (comparison > 0) { // Win
            wins++;
        } else if (comparison === 0) { // Tie
            ties++;
        }
    }
    
    // calculate chance against one opponent
    const winProbability = (wins + ties/2) / oppHandsCount;
    
    // calculate chance against multiple opponents
    const activeOpponentsCount = activePlayers.length - 1; // Subtract self
    return Math.pow(winProbability, activeOpponentsCount);
}

// combination formula: n choose k
function combination(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - (k - i));
        result /= i;
    }
    return result;
}


});
