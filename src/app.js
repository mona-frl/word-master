const wordOfDayURL = 'https://words.dev-apis.com/word-of-the-day?random=1'
const validWordURL = 'https://words.dev-apis.com/validate-word'
const letters = document.querySelectorAll('.letter-box');
const loadingDiv = document.querySelector('.loader');
const keyboard = document.querySelectorAll('.keyboard-letters')
//the size of the answer length | rounds
const ANSWER_LENGTH = 5;
const ROUNDS = 6;

let isLoading = true;
let done = false;

let currentGuess = '';
let currentRow = 0;
let currentParts;
let wordParts;


//when a key is pressed logs it to the keypressed variable & checks
//gets the word from the api and then register the key to start the game then handles the key
function init() {
    getWord()

    //event listener to the virtual keyboard
    for (let i = 0; i < keyboard.length; i++) {

        document.querySelectorAll(".keyboard-letters")[i].addEventListener('click', (e) => {
            const target = e.target;
            const targetID = e.target.id;

            keyAnimation(targetID);

            //if anywhere is clicked besides the buttons of keyboard letter, nothing happens
            if (!target.classList.contains("keyboard-letters")) {
                return
            }
            let key = target.innerText;
            if (key === 'DEL') {
                key = "Backspace";
            }
            if (key === "ENTER") {
                key = "Enter";
            }

            //"transforms the click into keydown so it triggers the rest of the functions"
            document.dispatchEvent(new KeyboardEvent("keydown", { 'key': key }))
        })
    }


    document.addEventListener('keydown', (event) => {
        //just to make sure it doesn't try to listen during loading or after the game is done
        if (done || isLoading) {
            return
        };

        //deals with the keys pressed and what to do
        const keyPressed = event.key;
        if (keyPressed === 'Backspace') {
            backspaceHandler();
        } else if (keyPressed === 'Enter') {
            addWordHandler();
        } else if (isLetter(keyPressed)) {
            letterHandler(keyPressed);
        }
    });
}

//handles the letter pressed
function letterHandler(letter) {
    //checks the size of the array and adds the letter to the current guess
    if (currentGuess.length < ANSWER_LENGTH) {
        currentGuess += letter;
    }
    else {
        //if the size is 5, handles to replace the last letter with the key pressed
        currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
    };

    //displays the letter
    letters[ANSWER_LENGTH * currentRow + currentGuess.length - 1].innerText = letter;
}

//handles the input
async function addWordHandler() {
    console.log()
    //when trying to press enter before the 5 boxes being filled gives an animation error
    if (currentGuess.length !== ANSWER_LENGTH) {
        markInvalid();
        popUpInvalidSize()
        return
    };

    //starts validating the word
    isLoading = true;
    loadingHandler(isLoading)

    //fetches the link, posts the guess and then return if valid or naw
    const res = await fetch(validWordURL, {
        method: 'POST',
        body: JSON.stringify({ word: currentGuess })
    });

    const resObj = await res.json();
    const validWord = resObj.validWord;

    isLoading = false;
    loadingHandler(isLoading);

    //when invalid returns with an animation error
    if (!validWord) {
        popUpInvalidWord()
        markInvalid();
        return;
    };

    //changes the guess to lowercase to avoid validation issues as the word & the validation are lowercase (wasted 2h here trying to fix a bug so don't ever forget to check lowercase/uppercase stuff)
    currentGuess = currentGuess.toLowerCase('');
    //splits the word into an array so we can validate piece by piece (as my dutch teacher say "knip knip knip")
    const guessParts = currentGuess.split('');
    //runs the map on the wordparts 
    const map = mapHandler(wordParts);

    //when the letter is in the right place, it will lower the value of that matching letter.
    for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
            //keyboard marking
            let target = guessParts[i].toUpperCase();
            document.getElementById(target).classList.remove('misplaced');
            document.getElementById(target).classList.add('correct');
            //adds the animation of correct to the right letter

            letters[currentRow * ANSWER_LENGTH + i].classList.add('correct');

            //lowers the number on the map so it doesn't give a misplaced animation in other letters, let's say if we have the word "pound", if we say "pools" it will only highlight the first o.
            map[guessParts[i]]--;
        }
    }
    //when the letter is misplaced or wrong it will run here
    for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
            //we handled above
        }
        //does the same as above but here, uses includes to check if there's a letter that belongs to the right word but in the wrong place
        else if (wordParts.includes(guessParts[i]) && map[guessParts[i]] > 0) {
            let target = guessParts[i].toUpperCase();
            document.getElementById(target).classList.add('misplaced');
            letters[currentRow * ANSWER_LENGTH + i].classList.add('misplaced');
            map[guessParts[i]]--;
        }
        else {
            let target = guessParts[i].toUpperCase();
            document.getElementById(target).classList.add('wrong');
            letters[currentRow * ANSWER_LENGTH + i].classList.add('wrong');
        }
    }
    // adds another row
    currentRow++;

    //deals with win or loss
    if (currentGuess === word) {
        popUpWin()
        done = true;
        return;
    }
    else if (currentRow === ROUNDS) {
        popUpLoss();
        done = true;
    }

    //empties the guess to start a new row
    currentGuess = '';

}

//handles backspace
function backspaceHandler() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    letters[ANSWER_LENGTH * currentRow + currentGuess.length].innerText = '';
}

//controls the loading 
function whenLoading() {
    loadingDiv.classList.toggle('show', isLoading);
}

//gets word
async function getWord() {
    isLoading = true;
    loadingHandler(isLoading)

    const response = await fetch(wordOfDayURL);
    const data = await response.json();
    word = data.word;
    wordParts = word.split('');
    isLoading = false;
    loadingHandler(isLoading)
}

//testing to see if it's a valid key;
function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

// animations
function keyAnimation(target) {
    document.getElementById(target).classList.add('pressed');
    setTimeout(() => document.getElementById(target).classList.remove('pressed'), 100);
}

function popUpWin() {
    document.querySelector('.win').classList.add('visible')
    setTimeout(() => document.querySelector('.win').classList.remove('visible'), 100000000);
}

function popUpLoss() {
    document.querySelector('#word').innerHTML = word;
    document.querySelector('.lose').classList.add('visible')
    setTimeout(() => document.querySelector('.lose').classList.remove('visible'), 100000000);
}

function popUpInvalidSize() {
    document.querySelector('.inv-size').classList.add('visible')
    setTimeout(() => document.querySelector('.inv-size').classList.remove('visible'), 1000);
}

function popUpInvalidWord() {
    document.querySelector('.inv-word').classList.add('visible')
    setTimeout(() => document.querySelector('.inv-word').classList.remove('visible'), 1000);
}

function highLight() {

}


//invalid animation
function markInvalid() {
    for (let i = 0; i < ANSWER_LENGTH; i++) {
        letters[currentRow * ANSWER_LENGTH + i].classList.add('invalid');
        setTimeout(() => letters[currentRow * ANSWER_LENGTH + i].classList.remove('invalid'), 100);
    }
}

//loading toggle
function loadingHandler(isLoading) {
    loadingDiv.classList.toggle('show', isLoading);
}

//map function to map through the letters and make sure it only highlights the right amount.
function mapHandler(array) {
    //creates the object
    const object = {};
    //for loop to run through the array of letters and verify the amount of letters and adds a number to the letter to then run against the guessed word and match around
    for (let i = 0; i < array.length; i++) {
        const letter = array[i];
        if (object[letter]) {
            object[letter]++;
        } else {
            object[letter] = 1;
        }
    }
    return object;
}

init();
