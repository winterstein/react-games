import React from 'react';
import ReactDOM from 'react-dom';

import { Jumbotron, Well, Button, Label } from 'react-bootstrap';

import SJTest, {assert} from 'sjtest';
import {XId, encURI, yessy} from 'wwutils';
import Login from 'you-again';
import printer from '../base/utils/printer.js';
import C from '../C';
import DataStore from '../base/plumbing/DataStore';
import ActionMan from '../plumbing/ActionMan';
import ServerIO from '../plumbing/ServerIO';
import { getId, getType } from '../base/data/DataClass';
import Basket from '../data/Basket';
import Event from '../data/charity/Event';
import NGO from '../data/charity/NGO';
import Ticket from '../data/charity/Ticket';
import Money from '../base/data/Money';
import FundRaiser from '../data/charity/FundRaiser';
import { SearchResults } from './SearchPage';
import Roles from '../base/Roles';
import Misc from '../base/components/Misc';
import { LoginWidgetEmbed } from '../base/components/LoginWidget';
import DonationWizard from './DonationWizard';
import Wizard, {WizardStage} from '../base/components/WizardProgressWidget';
import PaymentWidget from '../base/components/PaymentWidget';

/**
 * Sign up for an event!
 */
const RegisterPage = () => {
	let eventId = DataStore.getValue('location', 'path')[1];
	const pvEvent = ActionMan.getDataItem({type:C.TYPES.Event, id:eventId, status:C.KStatus.PUBLISHED});
	if ( ! pvEvent.value) return <Misc.Loading />;
	const event = pvEvent.value;

	// const wspath = ['widget', 'RegisterPage', eventId];
	// const widgetState = DataStore.getValue(wspath) || {};
	// const stagePath = ['location','params', 'registerStage'];
	// if (stage===0) { // start on 1
	// 	stage = 1;
	// 	DataStore.setValue(stagePath, stage, false);
	// }

	const pvbasket = ActionMan.getBasketPV();
	const basket = pvbasket.value;
	console.log('pvbasket', pvbasket);

	if (!basket) {
		return <Misc.Loading text='Retrieving your basket...' />;
	}

	const walkerDetailsOK = Basket.getItems(basket).reduce((done, ticket) => {
		return done && ticket.attendeeName && ticket.attendeeEmail && ticket.attendeeAddress;
	}, true);

	const longdate = event.date? Misc.LongDate({date:event.date}) : null;
	
	const basketPath = ActionMan.getBasketPath();

	const stagePath = ['location', 'params', 'registerStage'];

	const deleteBasket = e => {
		ActionMan.delete(C.TYPES.Basket, basket.id);
	};

	return (
		<div className=''>
			<div className='fullwidth-bg' style={{backgroundImage: `url(${event.backgroundImage || '/img/kiltwalk/KW_aberdeen_supporter_background.jpg'})`}} />
			{event.bannerImage? <img className='page-banner' src={event.bannerImage} alt='banner' /> : null}
			<h2 className='page-masthead'>
				<span className='event-name'>{event.name}</span>
				&nbsp;
				<br></br>
				<span className='event-date'>{longdate}</span>
			</h2>

			<Wizard stagePath={stagePath} nonavButtons >

				<WizardStage title='Tickets' 
					sufficient={basket && Basket.getItems(basket).length} 
					complete={basket && Basket.getItems(basket).length} 
				>
					<TicketTypes event={event} basket={basket} />
					<TicketInvoice event={event} basket={basket} />

					<button className="btn btn-default btn-sm pull-left" onClick={deleteBasket} >
						<Misc.Icon glyph='trash' />Empty Basket
					</button> 
				</WizardStage>

				<WizardStage title='Register' sufficient={Login.isLoggedIn()} complete={Login.isLoggedIn()} >
					<RegisterOrLoginTab stagePath={stagePath} />
				</WizardStage>
				
				<WizardStage title='Your Details' complete={walkerDetailsOK} sufficient={walkerDetailsOK} >
					<WalkerDetailsTab basket={basket} basketPath={basketPath} />
				</WizardStage>
						
				{event.pickCharity === false? null :
					<WizardStage title='Your Charity' complete={ !! Basket.charityId(basket)} >
						<CharityChoiceTab basket={basket} />
					</WizardStage>
				}
				
				{ ! yessy(event.extras)? null :
					<WizardStage title='Extras'>
						TODO Extras
						auto skip if none
					</WizardStage>
				}

				<WizardStage title='Checkout' next={false} >
					<CheckoutTab basket={basket} event={event} stagePath={stagePath} />
				</WizardStage>
				
				<WizardStage title='Confirmation' previous={false} >
					<Receipt basket={basket} event={event} />
					<ConfirmedTicketList basket={basket} event={event} />
				</WizardStage>
			</Wizard>

			{basket? <Misc.SavePublishDiscard type={C.TYPES.Basket} id={getId(basket)} hidden /> : null}

		</div>
	);
};

/**
 * 
 */
const TicketTypes = ({event, basket}) => {
	Event.assIsa(event); Basket.assIsa(basket);
	if ( ! event.ticketTypes) {
		return <div className='alert alert-warning'>No tickets have been setup for this event. Please speak to the event organiser.</div>;
	}
	const nameToTickets = {};
	event.ticketTypes.forEach(tt => {
		const ticketsForName = nameToTickets[tt.name];
		if (ticketsForName && ticketsForName.types) {
			ticketsForName.types.push(tt);
		} else {
			nameToTickets[tt.name] = {
				...tt, // we'll want name, desc, etc - just use the first ticket type as our source of truth
				types: [tt]
			};
		}
	});

	const ticketGroups = Object.entries(nameToTickets).map(([name, info]) => (
		<TicketGroup key={JSON.stringify([name,info])} 
			basket={basket} {...info} />
	));

	return (
		<div>
			{ticketGroups}
		</div>
	);

};

/**
 * types: {Ticket[]}
 */
const TicketGroup = ({name, subtitle, types, basket}) => {
	return (
		<div className='ticket-group'>
			<center>
				<h3>{name} <small>{subtitle}</small></h3>
			</center>
			<hr />
			<ul className='ticket-group-types'>
				{ types.map(type => <RegisterTicket key={JSON.stringify(type)} ticketType={type} basket={basket} />) }
			</ul>
		</div>
	);
};

const RegisterTicket = ({ticketType, basket}) => {
	// TODO put cloned objects into the basket, so we can extra details to them (names & addresses) on a per-ticket basis	
	let tickets = basket ? Basket.getItems(basket).filter(tkt => getId(tkt) === getId(ticketType)) : [];

	const removeTicketAction = () => ActionMan.removeFromBasket(basket, tickets[tickets.length-1]);
	const addTicketAction = () => ActionMan.addToBasket(basket, ticketType);

	const addRemove = tickets.length ? (
		<div className='add-remove-controls btn-group' role="group" aria-label="add remove controls">
			<button type="button" className="btn btn-default btn-square" onClick={removeTicketAction}><Misc.Icon glyph='minus' /></button>
			<span className='ticket-count btn-text'>{tickets.length}</span>
			<button type="button" className="btn btn-default btn-square" onClick={addTicketAction}><Misc.Icon glyph='plus' /></button>
		</div>
	) : (
		<button className='btn btn-default btn-square add-first-ticket' onClick={addTicketAction}>Add</button>
	);

	const {name, description, price, attendeeIcon, kind} = ticketType;

	return (
		<li className='ticket-type'>
			<div className='decoration'>
				<img className='attendee-icon' src={attendeeIcon} alt='' />
			</div>
			<div className='info'>
				<div className='top-line'>
					<div className='type-kind'>{kind || ''} Registration</div>
					<div className='type-price'><Misc.Money amount={price} /></div>
				</div>
				<div className='description'>{description || ''}</div>
			</div>
			<div className='controls'>
				{addRemove}
			</div>
		</li>
	);
};

const TicketInvoice = ({event, basket}) => {
	const idToRow = {};
	console.warn("basket", basket);
	// Group items of same type+kind into rows
	Basket.getItems(basket).forEach(item => {
		let row = idToRow[item.id];
		if (row) {
			row.count += 1;
			row.cost = Money.add(row.cost, item.price);
		} else {
			idToRow[item.id] = {
				item,
				label: (item.name || 'Ticket') + (item.kind? ' - '+item.kind : ''), // eg "The Wee Wander - Child"
				count: 1,
				cost: item.price,
			};
		}
	});

	const rows = Object.values(idToRow)
		.sort((a, b) => a.label < b.label);
	const rowElements = rows.map(rowData => <InvoiceRow key={JSON.stringify(rowData)} {...rowData} />);
	
	let total = Basket.getTotal(basket);

	// commented out 'cos (a) causes bugs with empty baskets, and (b) total should be total; anything else is confusing
	// // HACK: Don't include the tip in calculations when you're not showing it!
	// if (!showTip && basket.tip && Money.isa(basket.tip)) {
	// 	total = Money.sub(total, basket.tip);
	// }
	
	const tipRow = (basket.hasTip && Money.isa(basket.tip)) ? (
		<tr>
			<td className='desc-col'>Processing fee</td>
			<td className='amount-col'><Misc.Money amount={basket.tip} /></td>
		</tr>
	) : null;


	return (
		<div className='invoice'>			
			<table className='invoice-table'>
				<tbody>
					{rowElements}
					{ tipRow }
					<tr className='total-row'>
						<td className='desc-col' >Total</td>
						<td className='amount-col total-amount'><Misc.Money amount={total} /></td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

const InvoiceRow = ({item, label, count, cost}) => {
	return (
		<tr>
			<td className='desc-col'>{count} {label}</td>
			<td className='amount-col'><Misc.Money amount={cost} /></td>
		</tr>
	);
};

const RegisterOrLoginTab = ({stagePath}) => {
	// Advance to next stage on email login (no easy callback for social login)
	const onLogin = () => {
		let n = DataStore.getValue(stagePath) + 1;
		DataStore.setValue(stagePath, n);
	};

	if (Login.isLoggedIn()) {
		return (
			<div className='login-tab padded-block'>
				<Jumbotron>
					<p><Misc.Icon glyph='ok' className='text-success' /> You're logged in as <Label title={Login.getId()}>{Login.getUser().name || Login.getId()}</Label>.</p>
					<p>Not you? <Button onClick={() => Login.logout()}>Log out</Button></p>
				</Jumbotron>
			</div>
		);
	}
	return (
		<div className='login-tab padded-block'>
			<p>Please login or register your account.</p>
			<LoginWidgetEmbed services={['twitter']} onLogin={onLogin} />
		</div>
	);
};


const WalkerDetailsTab = ({basket, basketPath}) => {
	if ( ! basket) return null;
	assert(basketPath, "RegisterPage.jsx - WalkerDetailsTab: "+basketPath);
	// No sort on Tickets -- so that the editor can adjust ordering (eg by name / kind, alphabetical, or walk-length, or whatever)
	let items = Basket.getItems(basket); //.sort((a, b) => a.name > b.name);
	if ( ! items.length) return null;
	let ticket0 = items[0];
	let wdetails = items.map((ticket, ti) => {
		const ticketPath = [...basketPath, 'items', ti];
		return (<AttendeeDetails key={ti} ticket={ticket} i={ti} path={ticketPath} ticket0={ticket0} />);
	});
	return <div>{wdetails}</div>;
};

const AttendeeDetails = ({i, ticket, path, ticket0}) => {
	assert(DataStore.getValue(path) === null || DataStore.getValue(path) === ticket, "RegisterPage.js - "+path+" "+ticket+" "+DataStore.getValue(path));
	const noun = ticket.attendeeNoun || 'Attendee';
	// first ticket - fill in from user details
	if (i===0 && ! ticket.attendeeName && ! ticket.attendeeEmail && Login.isLoggedIn()) {
		const user = Login.getUser();
		ticket.attendeeName = user.name;
		ticket.attendeeEmail = Login.getEmail();
		console.log("set name,email from Login", ticket, user.xid);
		DataStore.setValue(path, ticket, false);
	}
	// other tickets - fill in from first ticket (default to "yes please")
	if (i>0 && ticket.sameAsFirst===undefined) ticket.sameAsFirst = true;
	let sameAsFirst = i>0 && ticket.sameAsFirst;
	if (sameAsFirst) {
		ticket.attendeeAddress = ticket0.attendeeAddress;
		ticket.team = ticket0.team;
	}
	return (
		<div>
			<center>		
				<h3>
				{ticket.name} 
				{ticket.kind? <span className='kind'> - {ticket.kind}</span> : null} 
				: <span>{noun} {i+1}</span>
				</h3>
			</center>
			<hr />
			<div className='AttendeeDetails'>			
				<Misc.PropControl type='text' item={ticket} path={path} prop='attendeeName' label={`${noun} Name`} />
				<Misc.PropControl type='text' item={ticket} path={path} prop='attendeeEmail' label='Email' />
				{ i!==0? <Misc.PropControl type='checkbox' path={path} prop='sameAsFirst' label='Same address and team as first person' /> : null}
				{ sameAsFirst? null : 
					<div>
						<Misc.PropControl type='textarea' path={path} prop='attendeeAddress' label='Address' />
						<Misc.PropControl type='text' item={ticket} path={path} prop='emergencyContact' label='Emergency contact phone number' />						
						<TeamControl ticket={ticket} path={path} />
					</div>
				}
			</div>
		</div>
	);
};

const TeamControl = ({ticket, path}) => {
	// does this event support teams?
	let event = Ticket.eventId(ticket)? DataStore.getData(C.KStatus.PUBLISHED, C.TYPES.Event, Ticket.eventId(ticket)) : null;
	if ( ! event) {
		console.warn("TeamControl - No event?! "+Ticket.eventId(ticket), ticket);
	}
	if (event && event.teams === false) {
		return null;
	}

	return (<Misc.Col2>
		<Misc.PropControl type='text' item={ticket} path={path} prop='team' label='Join Team (optional)' 
			help='Families or colleagues can fundraise as a team, with a Team Page here.' />
		<Misc.PropControl type='text' item={ticket} path={path} prop='team' label='Create Team (optional)' />
	</Misc.Col2>);
};

const CharityChoiceTab = ({basket}) => {
	if ( ! basket) return null;
	const bpath = ActionMan.getBasketPath();
	const charityId = Basket.charityId(basket);
	const recommended = ! charityId; // limit to recommended charities if the input is blank
	const pvCharities = DataStore.fetch(['widget','RegisterPage','pickCharity', charityId || '*'], 
		() => {
			return ServerIO.searchCharities({prefix: charityId, size: 20, recommended})
				.then(res => {
					let hits = res.cargo && res.cargo.hits;
					DataStore.setValue(['widget','RegisterPage','pickCharityPrevious'], hits);
					return hits;
				});
		}
	);
	// keep previous results around, so they're stable whilst the user is typing
	let results = pvCharities.resolved? pvCharities.value 
		: DataStore.getValue(['widget','RegisterPage','pickCharityPrevious']);
		// all={this.state.all} recommended={recommended}

	const onPick = charity => {
		NGO.assIsa(charity);
		DataStore.setValue(bpath.concat('charityId'), getId(charity));
	};

	return (<div>
		<div className='padded-block'>
			<p>
				Please choose a charity to support.
			</p>		
			<Misc.PropControl label='My Charity' item={basket} path={bpath} prop='charityId' />
		</div>
		<SearchResults results={results} query={charityId} recommended={ ! charityId} 
			onPick={onPick} CTA={PickCTA} tabs={false} download={false} loading={ ! pvCharities.resolved} />			
	</div>);
};

const PickCTA = ({item, onClick}) => {
	const bpath = ActionMan.getBasketPath();
	const basket = DataStore.getValue(bpath);
	if (Basket.charityId(basket)===getId(item)) {
		return (<div className='read-more btn btn-default active'>
			<Misc.Icon glyph='check' /> Selected
		</div>);
	}
	return (
		<button onClick={onClick} className='read-more btn btn-default'>
			<Misc.Icon glyph='unchecked' /> Select
		</button>
	);
};

/**
 * Login email, or ticket0, or null
 */
const getEmail = (basket) => {
	let e = Login.getEmail();
	if (e) return e;
	// from ticket0?
	let items = Basket.getItems(basket);
	if ( ! items.length) {
		console.warn("getEmail() No email :(", basket);
		return null; // fail!
	}
	return items[0].attendeeEmail;
};

const CheckoutTab = ({basket, event, stagePath}) => {
	if ( ! basket) return <Misc.Loading />;
	if ( ! basket.stripe) basket.stripe = {};

	// does onToken mean on-successful-payment-auth??
	const onToken = (token) => {
		basket.stripe = {
			...basket.stripe,
			...token
		};
		ActionMan.crud(C.TYPES.Basket, getId(basket), C.CRUDACTION.publish, basket)
			.then(res => {
				let n = Number.parseInt(DataStore.getValue(stagePath)) + 1;
				DataStore.setValue(stagePath, n);
				DataStore.setUrlValue('registerStage', n);
			}, err => {
				console.error(err); // TODO
			});
	};

	const email = getEmail();
	const bpath = ActionMan.getBasketPath();

	// tip removed from register page (as requested by Sanjay, march 2018)
	// // tip? Default to £1
	// if (basket.hasTip && basket.tip === undefined) {
	// 	basket.tip = Money.make({value:1});
	// }
	// 		<div className='padded-block'>
	// 			<Misc.PropControl type='checkbox' path={bpath} item={basket} prop='hasTip' 
	// 				label={`Include a tip to cover SoGive's operating costs?`} />
	// 			{basket.hasTip ? (
	// 				<Misc.PropControl type='Money' path={bpath} item={basket} prop='tip' label='Tip amount' />
	// 			) : ''}
	// 		</div>

	return (
		<div>
			<TicketInvoice basket={basket} />
			<div className='padded-block'>
				<PaymentWidget
					amount={Basket.getTotal(basket)}
					onToken={onToken}
					recipient={event.name} 
					email={email}
					username={Login.getId()}
				/>
			</div>
		</div>
	);
};

const Receipt = ({basket, event}) => {
	const items = Basket.getItems(basket);
	const ticket0 = items.length && items[0]; // TODO this is not necc the person who paid
	const stripe = basket.stripe;
	const card = stripe && stripe.card;
	// created will be numeric when returned direct from Stripe but String when retrieved from SoGive
	const createdDate = new Date(Number.parseInt(stripe && stripe.created * 1000));

	return (
		<div>
			<div className='padded-block'>
				<h3>Payment to SoGive Ltd.</h3>
				<p>Registered in England and Wales, company no. 09966206</p>
				{/*<p>Invoice no: TODO</p>*/}
				<p>Event: {event.name}</p>
				{stripe && stripe.created? <p>Payment date & time: {Misc.dateTimeString(createdDate)}</p> : null}				
				<p>Customer name: {ticket0 && ticket0.attendeeName}</p>
				{card? <p>Payment card: **** **** **** {card.last4}</p> : null}
				{basket.paymentId? <p>Payment ID: {basket.paymentId}</p> : null}
			</div>
			<TicketInvoice basket={basket} />
		</div>
	);
};

const ConfirmedTicketList = ({basket, event}) => {
	if ( ! basket) return null;
	let tickets = Basket.getItems(basket);
	return (
		<div className='ConfirmedTicketList'>
			{tickets.map( (ticket, ti) => <ConfirmedTicket key={ti} ticket={ticket} event={event} /> )}
		</div>
	);
};

const ConfirmedTicket = ({ticket, event}) => {
	if ( ! Ticket.eventId(ticket)) ticket.eventId = getId(event);
	// did the event specify a next page?
	if (ticket.postPurchaseLink) {
		let url = ticket.postPurchaseLink;
		let cta = ticket.postPurchaseCTA || url;
		return (<div className='clear padded-block'>
			<Misc.Col2>
				<h3>{ticket.attendeeName}</h3>			
				<div>
					<h3><a href={url}>{cta}</a></h3>
				</div>
			</Misc.Col2>
		</div>);		
	}
	// TODO how can we make a page for no email??
	// (a) use a temp id, and have a way for the user to claim it
	// (b) use the lead user's email, and have a way for them to access these other pages, and transfer them
	// Option (b) would allow for e.g. I set up my page and my Gran's page.
	// for now: no email = no page
	let frid = FundRaiser.getIdForTicket(ticket);	
	return (<div className='clear padded-block'>
		<Misc.Col2>
			<h3>{ticket.attendeeName}</h3>			
			<div>
				{ ticket.attendeeEmail? 
					<a className='btn btn-primary btn-lg' href={'#editFundraiser/'+encURI(frid)}>
						Setup Fund-Raising Page for {ticket.attendeeName}
					</a>
					: <p>No email provided</p>
				}
			</div>
		</Misc.Col2>
	</div>);
};

export default RegisterPage;
