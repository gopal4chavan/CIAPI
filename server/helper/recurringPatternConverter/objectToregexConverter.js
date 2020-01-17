const time = require('time');
const TZConverter = require('windows-iana');
const util = require('../../utils/util');

function convertPatternObjToRegex(pattern){
  let interval = pattern.interval;
  let res;
  switch(pattern.type) {
    case 'daily':
      res = `DAILY`;
      break;
    case 'weekly':
      res = `WEEKLY;BYDAY=${convertDaysOfWeekToRegex(pattern.daysOfWeek)}`;
      break;
    case 'absoluteMonthly':
      res ='MONTHLY';
      break;
    case 'relativeMonthly':
      res = `MONTHLY;BYDAY=${convertDaysOfWeekWithIndexToRegex(pattern.index, pattern.daysOfWeek)}`;
      break;
    case 'absoluteYearly':
      res = 'YEARLY';
      break;
    case 'relativeYearly':
      // relative Yearly is not directly supported by google
      // see this for more details
      // https://webapps.stackexchange.com/questions/66419/how-can-i-add-a-yearly-recurring-event-on-the-last-saturday-in-a-specific-month
      interval = 12;
      res = `MONTHLY;BYDAY=${convertDaysOfWeekWithIndexToRegex(pattern.index, pattern.daysOfWeek)}`;
      break;
  }
  res = res.concat(`;INTERVAL=${interval}`);
  return res;
}

function convertRangeObjToRegex(range){
  switch(range.type){
    case 'numbered':
      return `COUNT=${range.numberOfOccurrences}`;
    case 'endDate':
      let date = range.endDate.split('-');
      let dateInTimeZone = new time.Date(date[0],date[1],date[2],TZConverter.findOneIana(range.recurrenceTimeZone));
      return `UNTIL=${util.recurringRegexDateFormat(date, dateInTimeZone)}`;
    default:
      return '';
  }
}

function convertDaysOfWeekToRegex(days){
  let res = '';
  for(let day of days){
    res += `${day.substr(0,2)},`.toUpperCase();
  }
  return res.substr(0, res.length-1);
}

function convertDaysOfWeekWithIndexToRegex(index, days){
  let res = '';
  let index_map = {'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'last': 0};
  for(let day of days){
    res += `${index_map[index]}${day.substr(0, 2).toUpperCase()},`;
  }
  return res.substr(0, res.length-1);
}

module.exports = {
  convert: function(recurrenceObject){
    let recurringRegex = [];
    recurringRegex.push(`RRULE:FREQ=${convertPatternObjToRegex(recurrenceObject.pattern)};${convertRangeObjToRegex(recurrenceObject.range)}`);
    return recurringRegex
  }
};