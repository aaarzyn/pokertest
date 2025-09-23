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

// Application state
const state = {
    myHand: [],
    communityCards: [],
    deck: createDeck(),
    activeSuit: 'all'
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

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM references
    const cardDeck = document.getElementById('cardDeck');
    const yourCards = document.getElementById('yourCards');
    const communityCards = document.getElementById('communityCards');
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const results = document.getElementById('results');
    const playerCount = document.getElementById('playerCount');
    const playerCountValue = document.getElementById('playerCountValue');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Initialize the application
    initialize();
    
    function initialize() {
        renderCardDeck();
        renderPlayerHand();
        renderCommunityCards();
        updatePlayerPositions();
        
        // Event listeners
        calculateButton.addEventListener('click', calculateProbability);
        resetButton.addEventListener('click', resetCards);
        
        // Player count slider
        playerCount.addEventListener('input', () => {
            playerCountValue.textContent = playerCount.value;
            updatePlayerPositions();
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
    }
    
    // Update player positions based on player count
    function updatePlayerPositions() {
        const count = parseInt(playerCount.value);
        const positions = document.querySelectorAll('.player-position');
        
        positions.forEach(position => {
            if (position.classList.contains('position-you')) {
                position.style.display = 'block'; // Always show your position
            } else {
                // Extract player number from the class
                const playerNum = parseInt(position.className.match(/position-(\d+)/)[1]);
                position.style.display = playerNum < count ? 'block' : 'none';
            }
        });
    }
    
    // Render card deck
    function renderCardDeck() {
        cardDeck.innerHTML = '';
        
        const filteredDeck = state.activeSuit === 'all' 
            ? state.deck 
            : state.deck.filter(card => card.suit === state.activeSuit);
        
        for (let card of filteredDeck) {
            const isInHand = state.myHand.some(c => c.equals(card));
            const isInCommunity = state.communityCards.some(c => c.equals(card));
            
            if (!isInHand && !isInCommunity) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.dataset.rank = card.rank;
                cardElement.dataset.suit = card.suit;
                
                // Create card display with rank and suit
                const color = SUIT_COLORS[card.suit];
                cardElement.innerHTML = `
                    <div style="color: ${color}; position: absolute; top: 5px; left: 5px; font-size: 14px;">${card.rank}</div>
                    <div style="color: ${color}; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px;">${SUIT_SYMBOLS[card.suit]}</div>
                    <div style="color: ${color}; position: absolute; bottom: 5px; right: 5px; font-size: 14px;">${card.rank}</div>
                `;
                
                cardElement.addEventListener('click', () => selectCard(card));
                cardDeck.appendChild(cardElement);
            }
        }
    }
    
    // Render player hand
    function renderPlayerHand() {
        yourCards.innerHTML = '';
        
        // Create two placeholders for hand cards
        for (let i = 0; i < 2; i++) {
            if (state.myHand[i]) {
                const card = state.myHand[i];
                const cardElement = createCardElement(card);
                cardElement.addEventListener('click', () => removeCard(card, 'hand'));
                yourCards.appendChild(cardElement);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                placeholder.textContent = '?';
                yourCards.appendChild(placeholder);
            }
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
                cardElement.addEventListener('click', () => removeCard(card, 'community'));
                communityCards.appendChild(cardElement);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                placeholder.textContent = '?';
                communityCards.appendChild(placeholder);
            }
        }
    }
    
    // Create a card element
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card selected';
        
        const color = SUIT_COLORS[card.suit];
        cardElement.innerHTML = `
            <div style="color: ${color}; position: absolute; top: 5px; left: 5px; font-size: 14px;">${card.rank}</div>
            <div style="color: ${color}; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px;">${SUIT_SYMBOLS[card.suit]}</div>
            <div style="color: ${color}; position: absolute; bottom: 5px; right: 5px; font-size: 14px;">${card.rank}</div>
        `;
        
        return cardElement;
    }
    
    // Select a card
    function selectCard(card) {
        // Add to hand if not full
        if (state.myHand.length < 2) {
            state.myHand.push(card);
            renderPlayerHand();
            renderCardDeck();
        }
        // Otherwise add to community cards if not full
        else if (state.communityCards.length < 5) {
            state.communityCards.push(card);
            renderCommunityCards();
            renderCardDeck();
        }
        
        // Enable calculate button if both hand and community cards are full
        calculateButton.disabled = !(state.myHand.length === 2 && state.communityCards.length === 5);
    }
    
    // Remove a card
    function removeCard(card, type) {
        if (type === 'hand') {
            state.myHand = state.myHand.filter(c => !c.equals(card));
            renderPlayerHand();
        } else if (type === 'community') {
            state.communityCards = state.communityCards.filter(c => !c.equals(card));
            renderCommunityCards();
        }
        
        renderCardDeck();
        calculateButton.disabled = true;
    }
    
    // Reset cards
    function resetCards() {
        state.myHand = [];
        state.communityCards = [];
        
        renderPlayerHand();
        renderCommunityCards();
        renderCardDeck();
        
        results.innerHTML = `
            <h2>Hand Analysis</h2>
            <p>Select your cards and the community cards to calculate your odds.</p>
        `;
        
        calculateButton.disabled = true;
    }
    
    // Calculate probability
    function calculateProbability() {
        try {
            if (state.myHand.length !== 2 || state.communityCards.length !== 5) {
                throw new Error("You need exactly 2 cards in your hand and 5 community cards.");
            }
            
            const players = parseInt(playerCount.value);
            if (isNaN(players) || players < 2 || players > 10) {
                throw new Error("Number of players must be between 2 and 10.");
            }
            
            // Find best hand and evaluate
            const allCards = [...state.myHand, ...state.communityCards];
            const bestHand = findBestFive(allCards);
            const handScore = handEvaluator(bestHand);
            const handType = HAND_TYPES[handScore[0]];
            
            // Calculate win probability
            const probability = probabilityCalculator(state.myHand, state.communityCards, players);
            
            // Format cards for display
            const myHandStr = state.myHand.map(card => `${card.rank}${card.suit}`).join(' ');
            const communityStr = state.communityCards.map(card => `${card.rank}${card.suit}`).join(' ');
            const bestHandStr = bestHand.map(card => `${card.rank}${card.suit}`).join(' ');
            
            // Create HTML for result
            let resultHTML = `<h2>Hand Analysis</h2>`;
            
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
                    <p><strong>Number of Players:</strong> ${players}</p>
                    <p><strong>Probability of Winning:</strong> <span style="color: gold; font-weight: bold; font-size: 1.2em;">${(probability * 100).toFixed(2)}%</span></p>
                </div>
            `;
            
            results.innerHTML = resultHTML;
            
        } catch (error) {
            results.innerHTML = `
                <h2>Error</h2>
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
        else if (JSON.stringify([...new Set(ranks)].sort((a, b) => a - b)) === JSON.stringify([0, 1, 2, 3, 12])) {
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
            const kicker = ranks.find(r => !pairs.includes(r)); return [2, [...pairs, kicker]];
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
    
    // Calculate probability (simplified version for demo)
    function probabilityCalculator(myHand, communityCards, playerCount) {
        // In a real implementation, this would do a Monte Carlo simulation
        // or calculate exact probabilities based on remaining cards
        
        // For demo purposes, calculate a representative probability based on hand strength
        const allCards = [...myHand, ...communityCards];
        const bestHand = findBestFive(allCards);
        const handScore = handEvaluator(bestHand)[0];
        
        // Base probabilities by hand type (adjusted for player count)
        const baseProbabilities = {
            9: 0.99,  // Royal Flush
            8: 0.95,  // Straight Flush
            7: 0.90,  // Four of a Kind
            6: 0.80,  // Full House
            5: 0.70,  // Flush
            4: 0.60,  // Straight
            3: 0.40,  // Three of a Kind
            2: 0.25,  // Two Pair
            1: 0.15,  // One Pair
            0: 0.05   // High Card
        };
        
        // Adjust for player count (more players = lower chance)
        const playerFactor = Math.pow(0.9, playerCount - 2); // 1 for 2 players, gets smaller with more
        
        return baseProbabilities[handScore] * playerFactor;
    }
});
