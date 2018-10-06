import React from 'react';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import _ from 'lodash';
import { XId, encURI } from 'wwutils';

import printer from '../base/utils/printer';
// import C from '../C';
import ServerIO from '../plumbing/ServerIO';
import DataStore from '../base/plumbing/DataStore';
import Misc from '../base/components/Misc';
import PropControl from '../base/components/PropControl';

const gpath = ['game','hangman'];

/**
 * hangman where the word is changed if it can be to cost a life
 */
const EvilHangmanPage = () => {
	let newGame = {wordLength: 6, guessed:[], evil:false};
	let gstate = DataStore.getValue(gpath) || DataStore.setValue(['game','hangman'], newGame);
	if ( ! gstate.letters) {
		gstate.letters = [];
		for(let i=0; i<gstate.wordLength; i++) gstate.letters.push('?');
	}
	// TODO set new game
	// TODO load a dictionary
	gstate.candidateWords = ['abacus','beetle','jungle','jumper'];

	return (
		<div className="page EvilHangmanPage">
			<NewGame />
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
	gstate.letters = [];
	for(let i=0; i<gstate.wordLength; i++) gstate.letters.push('?');
	if (gstate.evil) {
		// load dict
	} else {
		let i = Math.round(Math.random() * gstate.candidateWords.length);
		gstate.word = gstate.candidateWords[i];
	}
};

const guessLetter = e => {
	const gstate = DataStore.getValue(gpath);
	const letter = gstate.letter;
	if ( ! letter) return;
	if ( ! gstate.guessed) gstate.guessed = [];
	gstate.guessed.push(letter);
	gstate.letter = null;
	// winnow down words
	// is the letter in?
	DataStore.update();
};

const Word = ({letters}) => {
	return (<div>{letters}</div>);
};

const Guesses = ({gstate}) => {
	let {guessed, letters} = gstate;
	return (<div>{guessed}</div>);
};

const Gallows = ({gstate}) => {
	let {guessed, letters} = gstate;
	let misses = guessed.filter(c => letters.indexOf(c) !== -1);
	return (<div>TODO Gallows: stage {misses.length}</div>);
};

export default EvilHangmanPage;

