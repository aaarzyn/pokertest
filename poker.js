// Constants
const SUITS = ["H", "D", "C", "S"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUIT_NAMES = {"H": "Hearts", "D": "Diamonds", "C": "Clubs", "S": "Spades"};
const RANK_NAMES = {
    "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", 
    "10": "10", "J": "Jack", "Q": "Queen", "K": "King", "A": "Ace"
};
const HAND_TYPES = ["High Card", "One Pair", "Two Pair", "Three of a Kind", 
                   "Straight", "Flush", "Full House", "Four of a Kind", 
                   "Straight Flush", "Royal Flush"];

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
        return this.rank === other.rank && this.suit === other.suit;
    }
}

// Application state
const state = {
    myHand: [],
    communityCards: [],
    deck: createDeck()
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
const cardDeck = document.getElementById('cardDeck');
const playerHand = document.getElementById('playerHand');
const communityCards = document.getElementById('communityCards');
const calculateButton = document.getElementById('calculateButton');
const resetButton = document.getElementById('resetButton');
const results = document.getElementById('results');
const playerCount = document.getElementById('playerCount');

// Initialize the application
function initialize() {
    renderCardDeck();
    renderPlayerHand();
    renderCommunityCards();
    
    calculateButton.addEventListener('click', calculateProbability);
    resetButton.addEventListener('click', resetCards);
}

// Render card deck
function renderCardDeck() {
    cardDeck.innerHTML = '';
    
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            const card = new Card(rank, suit);
            const cardElement = document.createElement('img');
            cardElement.classList.add('playing-card');
            cardElement.src = `cards/Suit=${SUIT_NAMES[suit]}, Number=${RANK_NAMES[rank]}.png`;
            cardElement.alt = `${rank}${suit}`;
            cardElement.dataset.rank = rank;
            cardElement.dataset.suit = suit;
            
            cardElement.addEventListener('click', () => selectCard(card, cardElement));
            cardDeck.appendChild(cardElement);
        }
    }
}

// Render player hand
function renderPlayerHand() {
    playerHand.innerHTML = '';
    
    // Create two placeholders for hand cards
    for (let i = 0; i < 2; i++) {
        const placeholder = document.createElement('div');
        placeholder.classList.add('card-placeholder');
        
        if (state.myHand[i]) {
            const card = state.myHand[i];
            const cardElement = document.createElement('img');
            cardElement.classList.add('playing-card');
            cardElement.src = `cards/Suit=${SUIT_NAMES[card.suit]}, Number=${RANK_NAMES[card.rank]}.png`;
            cardElement.alt = card.toString();
            cardElement.addEventListener('click', () => removeCard(card, 'hand'));
            placeholder.appendChild(cardElement);
        } else {
            placeholder.textContent = '?';
        }
        
        playerHand.appendChild(placeholder);
    }
}

// Render community cards
function renderCommunityCards() {
    communityCards.innerHTML = '';
    
    // Create five placeholders for community cards
    for (let i = 0; i < 5; i++) {
        const placeholder = document.createElement('div');
        placeholder.classList.add('card-placeholder');
        
        if (state.communityCards[i]) {
            const card = state.communityCards[i];
            const cardElement = document.createElement('img');
            cardElement.classList.add('playing-card');
            cardElement.src = `cards/Suit=${SUIT_NAMES[card.suit]}, Number=${RANK_NAMES[card.rank]}.png`;
            cardElement.alt = card.toString();
            cardElement.addEventListener('click', () => removeCard(card, 'community'));
            placeholder.appendChild(cardElement);
        } else {
            placeholder.textContent = '?';
        }
        
        communityCards.appendChild(placeholder);
    }
}

// Select a card
function selectCard(card, element) {
    // Check if card is already selected
    const isInHand = state.myHand.some(c => c.equals(card));
    const isInCommunity = state.communityCards.some(c => c.equals(card));
    
    if (isInHand || isInCommunity) {
        return; // Card already selected
    }
    
    // Add to hand if not full
    if (state.myHand.length < 2) {
        state.myHand.push(card);
        element.classList.add('selected');
        renderPlayerHand();
    }
    // Otherwise add to community cards if not full
    else if (state.communityCards.length < 5) {
        state.communityCards.push(card);
        element.classList.add('selected');
        renderCommunityCards();
    }
    
    // Enable calculate button if both hand and community cards are full
    if (state.myHand.length === 2 && state.communityCards.length === 5) {
        calculateButton.disabled = false;
    }
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
    
    // Update deck display
    const deckCards = cardDeck.querySelectorAll('.playing-card');
    deckCards.forEach(element => {
        const elementCard = new Card(element.dataset.rank, element.dataset.suit);
        if (elementCard.equals(card)) {
            element.classList.remove('selected');
        }
    });
    
    calculateButton.disabled = true;
}

// Reset cards
function resetCards() {
    state.myHand = [];
    state.communityCards = [];
    
    renderPlayerHand();
    renderCommunityCards();
    
    // Clear selected cards in deck
    const deckCards = cardDeck.querySelectorAll('.playing-card');
    deckCards.forEach(element => {
        element.classList.remove('selected');
    });
    
    results.innerHTML = '<p>Select your cards and the community cards to calculate your odds.</p>';
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
        
        // Implement poker probability calculation (would be a JavaScript port of your Python code)
        // For now, let's just display a sample result
        const bestHand = findBestFive([...state.myHand, ...state.communityCards]);
        const handScore = handEvaluator(bestHand);
        const handType = HAND_TYPES[handScore[0]];
        
        // Simplified probability calculation for demo
        const probability = Math.random(); // Replace with actual calculation
        
        let resultHTML = `
            <p><strong>Your Hand:</strong> ${state.myHand[0]} ${state.myHand[1]}</p>
            <p><strong>Community Cards:</strong> ${state.communityCards.join(' ')}</p>
            <p><strong>Best Five-Card Hand:</strong> ${bestHand.join(' ')} (<span class="hand-type">${handType}</span>)</p>
            <p><strong>Number of Players:</strong> ${players}</p>
            <p><strong>Probability of Winning:</strong> <span class="probability">${(probability * 100).toFixed(2)}%</span></p>
        `;
        
        results.innerHTML = resultHTML;
        
    } catch (error) {
        results.innerHTML = `<p class="text-danger">${error.message}</p>`;
    }
}

// Hand evaluation functions (port your Python code to JavaScript)
function handEvaluator(cards) {
    // This would be your hand evaluation logic ported to JavaScript
    // For now, returning a dummy value
    return [Math.floor(Math.random() * 10), []];
}

function findBestFive(cards) {
    // This would find the best 5-card hand from the 7 available cards
    // For now, just return the first 5 cards
    return cards.slice(0, 5);
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
