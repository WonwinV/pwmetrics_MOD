// Copyright 2016 Google Inc. All Rights Reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE

import { SheetsConfig, MetricsResults, Oauth2Client, AuthorizeCredentials, GSheetsValuesToAppend } from '../../types/types';

const GoogleOauth = require('../oauth/google-oauth');
import * as gsheets  from './gsheets';

// @todo add 'import' after moving all stuff to typescript
const { getMessage } = require('../utils/messages');
const { METRICS } = require('../metrics/metrics');
const dns = require('dns');
var tcpp = require('tcp-ping');

const SHEET_TYPES = {
  'GOOGLE_SHEETS': 'GOOGLE_SHEETS'
};

export class Sheets {
  constructor(public config: SheetsConfig, public clientSecret: AuthorizeCredentials) {
    this.validateOptions(config, clientSecret);
  }

  validateOptions(config: SheetsConfig, clientSecret: AuthorizeCredentials) {
    if (!config || !Object.keys(config).length)
      throw new Error(getMessage('NO_GOOGLE_SHEET_OPTIONS'));

    const sheetType = config.type;
    if (!Object.keys(SHEET_TYPES).includes(sheetType)) {
      throw new Error(getMessage('NO_SHEET_TYPE', sheetType));
    }

    switch (sheetType) {
      case SHEET_TYPES.GOOGLE_SHEETS:
        if (!config.options.spreadsheetId || !config.options.tableName || !clientSecret)
          throw new Error(getMessage('NO_GOOGLE_SHEET_OPTIONS'));
        break;
      default:
        throw new Error(getMessage('NO_GOOGLE_SHEET_OPTIONS'));
    }
  }

  appendResults(results: Array<MetricsResults>) {
    switch (this.config.type) {
      case SHEET_TYPES.GOOGLE_SHEETS:
        return this.appendResultsToGSheets(results);
    }
  }

  async appendResultsToGSheets(results: Array<MetricsResults>) {
    let valuesToAppend: Array<GSheetsValuesToAppend> = [];
    results.forEach(data => {
      let ipppp = '';
      let pingg = 100;
      dns.lookup(data.requestedUrl, (err, address, family) => {
        console.log("HELLLOOO~~~~~~");
        ipppp = address;
      });
      tcpp.ping({ address: ipppp }, function(err, data) {
          pingg = data.avg;
      });
      let dateObj;
      const getTiming = (key: string) => data.timings.find(t => t.id === key).timing;
      try {
        dateObj = new Date(data.generatedTime);
      } catch (error) {
        //blah
      }
      pingg = 100;
      // order matters
      valuesToAppend.push([
        data.lighthouseVersion,
        data.requestedUrl,
        `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`,
        getTiming(METRICS.TTFCP),
        getTiming(METRICS.TTFMP),
        getTiming(METRICS.SI),
        getTiming(METRICS.TTFCPUIDLE),
        getTiming(METRICS.TTI),
        pingg
      ]);
    });

    try {
      const googleOauth = new GoogleOauth();
      const oauth: Oauth2Client = await googleOauth.authenticate(this.clientSecret);
      await gsheets.appendResults(oauth, valuesToAppend, this.config.options);
    } catch(error) {
      throw error;
    }
  }
}
