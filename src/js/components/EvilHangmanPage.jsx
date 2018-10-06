import React from 'react';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import _ from 'lodash';
import { XId, encURI } from 'wwutils';

import printer from '../base/utils/printer';
import C from '../C';
import ServerIO from '../plumbing/ServerIO';
import DataStore from '../base/plumbing/DataStore';
import Misc from '../base/components/Misc';
import PropControl from '../base/components/PropControl';

const gpath = ['game','hangman'];

/**
 * hangman where the word is changed if it can be to cost a life
 */
const EvilHangmanPage = () => {
	let gstate = DataStore.getValue(gpath) || DataStore.setValue(['game','hangman'], newGame);
	// TODO set new game
	// TODO load a dictionary
	let pvdict = DataStore.fetch(['misc','dict'],() => {
		return $.get('/data/dictionary.txt')
		.then(res => {
			console.log('dictres',res);
			let words = res.split(/\s+/);
			words = words.filter(w => w === w.toLowerCase() && w.indexOf("'")===-1);
			words = words.map(w => w.trim());
			return  words;
		});
	});
	gstate.candidateWords = ['abacus','beetle','jungle','jumper'];
	if ( ! gstate.status) {
		return (
			<NewGame />
		);
	}
	return (
		<div className="page EvilHangmanPage">
			<Guesses gstate={gstate} />
			<Gallows gstate={gstate} />
			<Word gstate={gstate} />

			<PropControl label='Guess a Letter' path={['game','hangman']} prop='letter' />
			<button className='btn btn-default' onClick={guessLetter}>Guess</button>

		</div>
	);
}; // ./EvilHangmanPage

const NewGame = () => {
	return (<div>
		<PropControl label='Word length' path={gpath} 
			prop='wordLength' type='select' options={[4,5,6,7,8]} />
		<PropControl label='Evil?' path={gpath} prop='evil' type='checkbox' />
		<button className='btn btn-default' onClick={newGame}>New Game</button>
	</div>);
};

const newGame = () => {
	let gstate = DataStore.getValue(gpath);
	gstate.guessed=[];
	gstate.misses=[];
	if ( ! gstate.wordLength) gstate.wordLength = 6;
	gstate.letters = [];
	for(let i=0; i<gstate.wordLength; i++) gstate.letters.push('?');
	if (gstate.evil) {
		// load dict
	} else {
		let i = Math.round(Math.random() * gstate.candidateWords.length);
		gstate.word = gstate.candidateWords[i];
	}	
	gstate.status = C.KStatus.PUBLISHED;
};

const guessLetter = e => {
	const gstate = DataStore.getValue(gpath);
	let letter = gstate.letter;
	if ( ! letter) return;
	if ( ! gstate.guessed) gstate.guessed = [];
	letter = letter.trim()[0]; // one character only
	gstate.guessed.push(letter);
	gstate.letter = null;
	// winnow down words
	// is the letter in?
	let ok = false;
	if (gstate.word) {
		for(let i=0; i<gstate.word.length; i++) {
			if (gstate.word[i] === letter) {
				gstate.letters[i] = letter;
				ok = true;
			}
		}
	}
	if ( ! ok) {
		gstate.misses.push(letter);
	}
	DataStore.update();
};

const Word = ({gstate}) => {
	let {guessed, letters} = gstate;
	return (<div>{letters}</div>);
};

const Guesses = ({gstate}) => {
	let {guessed, letters} = gstate;
	return (<div>{guessed}</div>);
};

const Gallows = ({gstate}) => {
	let {guessed, letters, misses} = gstate;
	return (<div>TODO Gallows: stage {misses.length}</div>);
};

export default EvilHangmanPage;

