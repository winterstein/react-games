package org.sogive.server;

import org.sogive.data.commercial.FundRaiser;

import com.winterwell.web.app.CrudServlet;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;

public class FundraiserServlet extends CrudServlet<FundRaiser> implements IServlet {

	public FundraiserServlet() {
		super(FundRaiser.class);
	}

}
