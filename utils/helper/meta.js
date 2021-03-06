/*
*
*  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
*  Bangalore, India. All Rights Reserved.
*
*/

/*
 Metadata for parsing the date() { return this }, time, date_and_time and duration for various supported formats.
 Contains the properties which needs to be added to the date, time, date_and_time and duration objects
 as per the specification defined in
 "Table 53: Specific semantics of date, time and duration properties".

 Decision Model and Notation, v1.1.
 Page : 126
*/

/*
Note :
As some of the moment functions are overwritten with properties, native functions like moment.format() might not work.
In that case format function should also be overwritten to suit the requirements
*/

const metadata = {
  defaultTz: 'Etc/UTC',
  UTC: 'Etc/UTC',
  epoch: '1970-01-01',
  UTCTimePart: 'T00:00:00',
  time_ISO_8601: 'THH:mm:ssZ',
  date_ISO_8601: 'YYYY-MM-DD',
  time_IANA_tz: /([0-9]{2}):([0-9]{2}):([0-9]{2})(?:@(.+))+/,
  date_time_IANA_tz: /([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})(?:@(.+))+/,
  ymd_ISO_8601: /P([0-9]+Y)?([0-9]+M)?/,
  dtd_ISO_8601: /P([0-9]+D)?(T([0-9]+H)?([0-9]+M)?([0-9]+S)?)?/,
  types: {
    time: 'time',
    date: 'date',
    date_and_time: 'date_and_time',
    ymd: 'ymd',
    dtd: 'dtd',
  },
  properties: {
    year() { return this.year(); },
    month() { return this.month(); },
    day() { return this.date(); },
    hour() { return this.hour(); },
    minute() { return this.minute(); },
    second() { return this.second(); },
    time_offset() { return this.utcOffset(); },
    timezone() { return this.tz(); },
    years() { return this.years(); },
    months() { return this.months(); },
    days() { return this.days(); },
    hours() { return this.hours(); },
    minutes() { return this.minutes(); },
    seconds() { return this.seconds(); },
  },
};

module.exports = metadata;
