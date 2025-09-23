// Constants
const SUITS = ["H", "D", "C", "S"]; // hearts, diamonds, clubs, spades
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]; // ace marked as highest
const SUIT_NAMES = {"H": "Hearts", "D": "Diamonds", "C": "Clubs", "S": "Spades"};
const SUIT_SYMBOLS = {"H": "♥", "D": "♦", "C": "♣", "S": "♠"};
const SUIT_COLORS = {"H": "red", "D": "red", "C": "black", "S": "black"};
const RANK_NAMES = {
    "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10", "J": "Jack", "Q": "Queen", "K": "King", "A": "Ace"
};
const HAND_TYPES = [
    "High Card", "One Pair", "Two Pair", "Three of a Kind", 
    "Straight", "Flush", "Full House", "Four of a Kind", 
    "Straight Flush", "Royal Flush"
];

// Card class
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

// Player class
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

// Application state
const state = {
    players: [],
    communityCards: [],
    deck: createDeck(),
    activeSuit: 'all',
    selectedPlayerId: 0, // 0 is you
    playerCount: 2,
    layoutType: 'circle'
};

// Create deck function
function createDeck() {
    const deck = [];
    for (let rank of RANKS) {
        for (let suit of SUITS) {
            deck.push(new Card(rank, suit));
        }
    }
    return deck;
}

// Initialize players
function initializePlayers(count) {
    // Create 'you' player
    const you = new Player(0, "YOU", 10, true);
    
    // Create other players
    const players = [you];
    for (let i = 1; i < count; i++) {
        players.push(new Player(i, `Player ${i}`, i, true));
    }
    
    return players;
}

// Save player details from modal
function savePlayerDetails() {
    const player = state.players[state.selectedPlayerId];
    if (!player) return;
    
    // Update player info
    player.name = document.getElementById('playerName').value || `Player ${player.id}`;
    player.active = document.querySelector('input[name="playerStatus"]:checked').value === 'active';
    player.cardsVisible = document.querySelector('input[name="cardVisibility"]:checked').value === 'visible';
    
    // Update UI
    renderPlayerPositions();
    document.querySelector('.selected-player-name').textContent = player.name;
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
    
    // Close modal
    playerEditModal.style.display = 'none';
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    state.players = initializePlayers(state.playerCount);
    
    // Initialize DOM references
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
    
    // Initialize the application
    initialize();
    
    function initialize() {
        renderPlayerPositions();
        renderCardDeck();
        renderCommunityCards();
        
        // Event listeners
        calculateButton.addEventListener('click', calculateProbability);
        resetButton.addEventListener('click', resetCards);
        
        // Player count slider
        playerCount.addEventListener('input', () => {
            const count = parseInt(playerCount.value);
            playerCountValue.textContent = count;
            updatePlayerCount(count);
        });
        
        // Player active toggle
        playerActiveToggle.addEventListener('change', () => {
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
        });
        
        // Card filter tabs
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                state.activeSuit = button.dataset.suit;
                renderCardDeck();
            });
        });
        
        // Help button
        infoButton.addEventListener('click', () => {
            helpModal.style.display = 'block';
        });
        
        // Close modals
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                helpModal.style.display = 'none';
                playerEditModal.style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
            if (event.target === playerEditModal) {
                playerEditModal.style.display = 'none';
            }
        });
        
        // Save player button
        savePlayerButton.addEventListener('click', savePlayerDetails);
        
        // Toggle theme
        toggleThemeButton.addEventListener('click', toggleTheme);
        
        // Toggle layout
        layoutButton.addEventListener('click', toggleLayout);
    }
    
    // Render player positions around the table
    function renderPlayerPositions() {
        const positionsContainer = document.querySelector('.player-positions');
        positionsContainer.innerHTML = '';
        
        state.players.forEach(player => {
            if (player.position <= state.playerCount || player.id === 0) {
                const position = document.createElement('div');
                position.className = `player-position position-${player.position}`;
                
                if (player.id === 0) {
                    position.classList.add('you');
                }
                
                if (!player.active) {
                    position.classList.add('folded');
                }
                
                position.innerHTML = `
                    <div class="player-label">${player.name}</div>
                    <div class=" player-cards" id="player${player.id}Cards"></div>
                `;
                
                position.addEventListener('click', () => openPlayerEditModal(player));
                
                positionsContainer.appendChild(position);
                
                // Render player cards
                renderPlayerCards(player);
            }
        });
    }
    
    // Render cards for a specific player
    // Render cards for a specific player
function renderPlayerCards(player) {
    const cardsContainer = document.getElementById(`player${player.id}Cards`);
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    // Determine if this player's cards should be visible
    const isYou = player.id === 0;
    const cardsVisible = isYou || player.cardsVisible;
    
    // Create two placeholders for cards
    for (let i = 0; i < 2; i++) {
        if (player.cards[i]) {
            if (cardsVisible) {
                // Show actual card if visible
                const card = player.cards[i];
                const cardElement = createCardElement(card, true);
                cardElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removePlayerCard(player, card);
                });
                cardsContainer.appendChild(cardElement);
            } else {
                // Show card back if not visible
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
    
    // Render card deck
    function renderCardDeck() {
        cardDeck.innerHTML = '';
        
        // Get all used cards
        const usedCards = [];
        state.players.forEach(player => {
            usedCards.push(...player.cards);
        });
        usedCards.push(...state.communityCards);
        
        // Filter available cards
        const availableCards = state.deck.filter(card => 
            !usedCards.some(usedCard => usedCard.equals(card))
        );
        
        // Filter by selected suit
        const filteredCards = state.activeSuit === 'all' 
            ? availableCards 
            : availableCards.filter(card => card.suit === state.activeSuit);
        
        // Render cards
        for (let card of filteredCards) {
            const cardElement = createCardElement(card);
            cardElement.addEventListener('click', () => selectCard(card));
            cardDeck.appendChild(cardElement);
        }
    }
    
    // Render community cards
    function renderCommunityCards() {
        communityCards.innerHTML = '';
        
        // Create five placeholders for community cards
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

        // Create a card back element
    function createCardBackElement(small = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card card-back${small ? ' small' : ''}`;
        
        // Use the blue card back image
        const imgElement = document.createElement('img');
        imgElement.src = 'Suit=Other, Number=Back Blue.png';
        imgElement.alt = 'Card Back';
        imgElement.className = 'card-img';
        
        imgElement.onerror = function() {
            // Fallback if no card back image
            cardElement.innerHTML = '';
            cardElement.classList.add('fallback-card-back');
        };
        
        cardElement.appendChild(imgElement);
        
        return cardElement;
    }
    // Create a card element
    function createCardElement(card, small = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card${small ? ' small' : ''}`;
        cardElement.classList.add('selected');
        
        const color = SUIT_COLORS[card.suit];
        const fontSize = small ? '12px' : '14px';
        const symbolSize = small ? '18px' : '24px';
        
        cardElement.innerHTML = `
            <div style="color: ${color}; position: absolute; top: 3px; left: 3px; font-size: ${fontSize};">${card.rank}</div>
            <div style="color: ${color}; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: ${symbolSize};">${SUIT_SYMBOLS[card.suit]}</div>
            <div style="color: ${color}; position: absolute; bottom: 3px; right: 3px; font-size: ${fontSize};">${card.rank}</div>
        `;
        
        return cardElement;
    }
    
    // Select a card
    function selectCard(card) {
        const player = state.players[state.selectedPlayerId];
        
        // If selecting for a player and they don't have 2 cards yet
        if (player && player.cards.length < 2) {
            player.addCard(card);
            renderPlayerCards(player);
            renderCardDeck();
        }
        // Otherwise add to community cards if not full
        else if (state.communityCards.length < 5) {
            state.communityCards.push(card);
            renderCommunityCards();
            renderCardDeck();
        }
        
        updateCalculateButton();
    }
    
    // Remove a community card
    function removeCard(card) {
        state.communityCards = state.communityCards.filter(c => !c.equals(card));
        renderCommunityCards();
        renderCardDeck();
        updateCalculateButton();
    }
    
    // Remove a player's card
    function removePlayerCard(player, card) {
        player.removeCard(card);
        renderPlayerCards(player);
        renderCardDeck();
        updateCalculateButton();
    }
    
    // Reset all cards
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
    
    // Update player count
    function updatePlayerCount(count) {
        state.playerCount = count;
        
        // Ensure we have enough players
        while (state.players.length <= count) {
            const newId = state.players.length;
            state.players.push(new Player(newId, `Player ${newId}`, newId, true));
        }
        
        renderPlayerPositions();
        updateCalculateButton();
    }
    
    // Update calculate button state
    function updateCalculateButton() {
        const you = state.players.find(p => p.id === 0);
        const hasYourCards = you && you.cards.length === 2;
        const hasCommunityCards = state.communityCards.length === 5;
        
        calculateButton.disabled = !(hasYourCards && hasCommunityCards);
    }
    
    // Open player edit modal
    function openPlayerEditModal(player) {
        // Set selected player
        state.selectedPlayerId = player.id;
        
        // Update selected player info in card selection area
        document.querySelector('.selected-player-name').textContent = player.name;
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
        
        // For standard players, open the edit modal
        if (player.id !== 0) {
            // Populate modal
            document.getElementById('playerName').value = player.name;
            document.querySelectorAll('input[name="playerStatus"]').forEach(radio => {
                if ((radio.value === 'active' && player.active) || 
                    (radio.value === 'folded' && !player.active)) {
                    radio.checked = true;
                }
            });
            
            // Show modal
            playerEditModal.style.display = 'block';
        }
    }
    
    // Save player details from modal
    function savePlayerDetails() {
        const player = state.players[state.selectedPlayerId];
        if (!player) return;
        
        // Update player info
        player.name = document.getElementById('playerName').value || `Player ${player.id}`;
        player.active = document.querySelector('input[name="playerStatus"]:checked').value === 'active';
        
        // Update UI
        renderPlayerPositions();
        document.querySelector('.selected-player-name').textContent = player.name;
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
        
        // Close modal
        playerEditModal.style.display = 'none';
    }
    
    // Toggle theme
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        const icon = toggleThemeButton.querySelector('i');
        if (document.body.classList.contains('light-theme')) {
            toggleThemeButton.innerHTML = '<i class="fas fa-sun"></i> Light';
        } else {
            toggleThemeButton.innerHTML = '<i class="fas fa-moon"></i> Dark';
        }
    }
    
    // Toggle table layout
    function toggleLayout() {
        state.layoutType = state.layoutType === 'circle' ? 'rectangle' : 'circle';
        document.querySelector('.poker-table').classList.toggle('rectangular');
        layoutButton.innerHTML = state.layoutType === 'circle' 
            ? '<i class="fas fa-table"></i> Layout'
            : '<i class="fas fa-circle"></i> Layout';
    }
    
    // Calculate probability
    function calculateProbability() {
        try {
            const you = state.players.find(p => p.id === 0);
            
            if (!you || you.cards.length !== 2) {
                throw new Error("You need exactly 2 cards in your hand.");
            }
            
            if (state.communityCards.length !== 5) {
                throw new Error("All 5 community cards must be provided.");
            }
            
            // Get active player count
            const activePlayers = state.players.filter(p => p.active && p.position <= state.playerCount);
            
            if (activePlayers.length < 2) {
                throw new Error("You need at least 2 active players.");
            }
            
            // Find best hand and evaluate
            const allCards = [...you.cards, ...state.communityCards];
            const bestHand = findBestFive(allCards);
            const handScore = handEvaluator(bestHand);
            const handType = HAND_TYPES[handScore[0]];
            
            // Calculate win probability based on known player cards and unknown cards
            let probability = calculateWinProbability(you.cards, state.communityCards, activePlayers);
            
            // Format cards for display
            const myHandStr = you.cards.map(card => `${card.rank}${card.suit}`).join(' ');
            const communityStr = state.communityCards.map(card => `${card.rank}${card.suit}`).join(' ');
            const bestHandStr = bestHand.map(card => `${card.rank}${card.suit}`).join(' ');
            
            // Create HTML for result
            let resultHTML = `<div class="results-header"><i class="fas fa-chart-line"></i> Hand Analysis</div>`;
            
            // Add hand details
            resultHTML += `
                <div class="result-details">
                    <p><strong>Your Hand:</strong> ${myHandStr}</p>
                    <p><strong>Community Cards:</strong> ${communityStr}</p>
                    <p><strong>Best Five-Card Hand:</strong> ${bestHandStr}`;
            
            // Add special styling for royal flush
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
            
            // Add opponent hands if visible
            const knownOpponents = activePlayers.filter(p => p.id !== 0 && p.cards.length === 2);
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
    
    // Hand evaluation functions
    function handEvaluator(cards) {
        if (cards.length !== 5) {
            throw new Error("Hand evaluator requires exactly 5 cards");
        }
        
        // Sort cards by rank value in descending order
        const sortedCards = [...cards].sort((a, b) => b.rankValue - a.rankValue);
        
        const ranks = sortedCards.map(card => card.rankValue);
        const suits = sortedCards.map(card => card.suit);
        
        // Count occurrences of each rank
        const rankCounts = {};
        for (let rank of ranks) {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        }
        
        // Check for flush
        const isFlush = new Set(suits).size === 1;
        
        // Check for straight
        let isStraight = false;
        let straightHigh = -1;
        
        if (new Set(ranks).size === 5 && Math.max(...ranks) - Math.min(...ranks) === 4) {
            isStraight = true;
            straightHigh = Math.max(...ranks);
        } 
        // Check for A-5 straight (special case)
        else if (JSON.stringify([...new Set(ranks )].sort((a, b) => a - b)) === JSON.stringify([0, 1, 2, 3, 12])) {
            isStraight = true;
            straightHigh = 3; // 5 is high card in A-5 straight
        }
        
        // Royal Flush - check for 10, J, Q, K, A all in the same suit
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
        const allCards = [...myCards, ...communityCards];
        const myBestHand = findBestFive(allCards);
        const myScore = handEvaluator(myBestHand);
        
        // Get all used cards
        const usedCards = [];
        activePlayers.forEach(player => {
            if (player.cards.length === 2) {
                usedCards.push(...player.cards);
            }
        });
        usedCards.push(...communityCards);
        
        // For known opponent hands, directly compare
        const knownOpponents = activePlayers.filter(p => p.id !== 0 && p.cards.length === 2);
        const unknownOpponentCount = activePlayers.length - knownOpponents.length - 1; // -1 for self
        
        let winAgainstKnown = true;
        for (let opponent of knownOpponents) {
            const opponentCards = [...opponent.cards, ...communityCards];
            const opponentBestHand = findBestFive(opponentCards);
            const opponentScore = handEvaluator(opponentBestHand);
            
            if (compareScores(myScore, opponentScore) < 0) {
                winAgainstKnown = false;
                break;
            }
        }
        
        // If we lose against a known opponent, probability is 0
        if (!winAgainstKnown) return 0;
        
        // For unknown opponents, use the hand strength to estimate probability
        const handStrength = Math.min(0.95, (myScore[0] + 1) / 10); // Scale from 0.1 to 0.95
        
        // Adjust for number of unknown opponents
        return Math.pow(handStrength, unknownOpponentCount);
    }
});
