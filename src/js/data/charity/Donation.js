import {assert} from 'sjtest';
import {isa, nonce, defineType} from '../../base/data/DataClass';
import C from '../../C';
import Money from '../../base/data/Money';
import DataStore from '../../base/plumbing/DataStore';
import {XId, blockProp} from 'wwutils';

/** impact utils */
const Donation = defineType(C.TYPES.Donation);
const This = Donation;
export default Donation;


Donation.strRepeat = rep => {
	const srep = {
		'OFF': 'one-off',
		'WEEK': 'weekly',
		'MONTH': 'monthly',
		'YEAR': 'annual'
	}[rep];
	return srep || rep;
};


// ref: https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
function isNumeric(value) {
	return ! isNaN(value - parseFloat(value));
}

/** crude duck type: needs an amount or total */
Donation.isa = (obj) => {
	if ( ! obj) return false;
	return isa(obj, C.TYPES.Donation) || obj.amount || obj.total;
};
Donation.assIsa = (obj) => {
	assert(Donation.isa(obj), "Donation.js - not a Donation "+obj);
	blockProp(obj, 'fundraiser', 'Donation.js - use Donation.fundRaiser()');
	return true;
};

Donation.getTotal = (don) => {
	// TODO + contributions - fees
	// TODO test
	let ttl = Donation.amount(don);
	if (don.contributions) {
		don.contributions.forEach(money => ttl = ttl+money);
	}
	if (don.fees) {
		don.fees.forEach(money => ttl = ttl-money);
	}
	return ttl;
};

/**
 * @param {?Donation} don 
 * @returns ?String can be null for anonymous donors
 */
Donation.donorName = don => {
	if ( ! don) return null;
	This.assIsa(don);
	// did they ask to be anonymous?
	if (don.anonymous) return null;
	if ( ! don.donor) return don.donorName; // draft
	return don.donor.name || (don.donor.id && XId.prettyName(don.donor.id)) || null;
};

/**
 * 
 * @param {Donation} don 
 * @returns {Money}
 */
Donation.amount = don => This.assIsa(don) && don.amount;

/**
 * @param {Donation} don 
 * @returns fundraiser ID or null
 */
Donation.fundRaiser = don => This.assIsa(don) && don.fundRaiser;

/**
 * @returns {String} the charity ID
 */
Donation.to = don => This.assIsa(don) && don.to;

/**
 * @param {
 * 	to: {?String} charity ID
 * 	amount: {?Money}
 * }
 */
Donation.make = (base = {}) => {
	let ma = {
		'@type': C.TYPES.Donation,
		/* The user's contribution (this is what the user pays; not what the charity recieves) */
		amount: Money.make(),
		id: nonce(),	
		...base
	};
	Donation.assIsa(ma);
	return ma;
};


/**
 * change the repeat constants into strings
 */
Donation.strRepeat = rep => {
	const srep = {
		'OFF': 'one-off',
		'DAY': 'day',
		'WEEK': 'weekly',
		'MONTH': 'monthly',
		'YEAR': 'annual'
	}[rep];
	return srep || rep;
};
