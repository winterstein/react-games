package org.sogive.data.user;

import com.winterwell.data.PersonLite;
import com.winterwell.utils.time.Time;
import com.winterwell.web.data.XId;

/**
 * 
 * @author daniel
 *
 */
public class JoinEvent {

	Time when;
	
	/**
	 * The user who joined
	 */
	XId who;
	
	/**
	 * The team / event / cabal they joined
	 */
	XId what;
	
	/**
	 * cache info like name & image on the person for fast display
	 */
	PersonLite person;
	
}
