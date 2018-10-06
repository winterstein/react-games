package org.sogive.server;

import java.io.File;

import org.sogive.data.charity.ImportCharityDataFromCSV;
import org.sogive.data.loader.ImportOSCRData;

import com.winterwell.web.WebEx;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;
import com.winterwell.web.fields.SField;

public class ImportDataServlet implements IServlet {

	private static ImportOSCRData oscr;

	@Override
	public void process(WebRequest state) throws Exception {
		String dataset = state.getRequired(new SField("dataset"));
		if ("OSCR".equals(dataset)) {
			oscr = new ImportOSCRData();
			if (oscr.isRunning()) {
				throw new WebEx.E400("Repeat call");
			}
			oscr.run();
		}	
		if ("oldSpreadsheet".equalsIgnoreCase(dataset)) {
			File export = new File("data/charities.csv");
			new ImportCharityDataFromCSV(export).run();
		}
	}

}
