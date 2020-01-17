// TODO: Change this file as common recurringhelper file
// TODO: Once recurring Helper files works fine remove this file
// const CONSTANTS = require('../config/constants');
// const time = require('time');
// const TZConverter = require('windows-iana');
// const util = require('../utils/util')

// function recurringObject(event){
//   let recurringObj = {
//     'pattern': {},
//     'range': {} 
//   };
//   let index = ["one", "two", "three", "four", "five"];
//   let startTime = new Date(event.startTime);
//   switch(recurringType(event.recurringEventRegex[0])){
//     case 'DAILY':
//       hash['pattern']['type'] = 'daily';
//       break;
//     case 'WEEKLY':
//       hash['pattern']['type'] = 'weekly';
//       hash['pattern']['daysOfWeek'] = convertweekDaysRegexToObj(event);
//       break;
//     case 'MONTHLY':
//       day = startTime.getDate();
//       hash['pattern']['type'] = 'relativeMonthly';
//       hash['pattern']['daysOfWeek'] = [ CONSTANTS.ALL_WEEK_DAYS[startTime.getDay()] ];
//       hash['pattern']['index'] = index[(day/7 + (day%7 > 0 ? 1 : 0))];
//       break;
//     case 'YEARLY':
//       hash['pattern']['type'] = 'absoluteYearly';
//       hash['pattern']['dayOfMonth'] = [ startTime.getDate() ];
//       hash['pattern']['month'] = startTime.getMonth() + 1;
//       break;
//   }
//   hash['pattern']['interval'] = 1
//   hash['range'] = convertRangeRegexToObj(event);
// }

// function convertPatternRegexToObj(event){
//   let patternObj = {};
//   let patternRegex = event.recurringEventRegex[0];
//   let startTime = new Date(event.startTime);
//   switch(recurringType(patternRegex)){
//     case 'DAILY':
//       patternObj = {
//         type: 'daily'
//       }
//       break;
//     case 'WEEKLY':
//       patternObj = {
//         type: 'weekly',
//         daysOfWeek: convertweekDaysRegexToObj(event),
//         firstDayOfWeek: CONSTANTS.MAPPING_WEEK_DAYS['SU']
//       }
//       break;
//     case 'MONTHLY':
//       if(patternRegex.contains(CONSTANTS.REGEX_PATTERN_KEYS.BYDAY)){
//         // Means its a relativeMonthly Recurring Event
//         let byDay = patternKeyValue(CONSTANTS.REGEX_PATTERN_KEYS.BYDAY, patternRegex);
//         patternObj = {
//           type: 'relativeMonthly',
//           daysOfWeek: [ CONSTANTS.MAPPING_WEEK_DAYS[byDay.slice(1)] ],
//           index: CONSTANTS.INDEX[parseInt(byDay.slice(0,1), 10)]
//         }
//       }else{
//         // Means its a absoluteMonthy Recurring Event
//         patternObj = {
//           type: 'absoluteMonthly',
//           dayOfMonth: startTime.getDate()
//         }
//       }
//       break;
//     case 'YEARLY':
//       // Google doesn't support Relative yearly recurring event, as this can be acheived by Relative monthly by setting invertal to 12
//       patternObj = {
//         type: 'absoluteYearly',
//         dayOfMonth: [ startTime.getDate() ],
//         month: startTime.getMonth() + 1
//       }
//       break;
//   }
//   if(patternRegex.includes(CONSTANTS.REGEX_PATTERN_KEYS.INTERVAL)){
//     patternObj.interval = patternKeyValue(CONSTANTS.REGEX_PATTERN_KEYS.INTERVAL);
//   }else{
//     patternObj.interval = 1;
//   }
//   return patternObj;
// }

// function recurringType(pattern){
//   return ['DAILY','WEEKLY','MONTHLY','YEARLY'].find(elem => pattern.includes(elem))
// }

// function convertweekDaysRegexToObj(event){
//   let allWeekDays = 'BYDAY=MO,TU,WE,TH,FR'
//   if(event.recurringEventRegex[0].includes(allWeekDays)){
//     return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
//   }else{
//     let daysPattern = event.recurringEventRegex[0].match(/BYDAY=[^;]*/g)[0];
//     let days = daysPattern.slice(6).split(',');
//     let mappedDays = [];
//     for(let day of days){
//       mappedDays.push(CONSTANTS.MAPPING_WEEK_DAYS[day])
//     }
//     return mappedDays
//   }
// }

// function convertRecurringObjToRegex(recurrence){
//   let recurringRegex = [];
//   recurringRegex.push(`RRULE:FREQ=${convertPatternObjToRegex(recurrence.pattern)};INTERVAL=${recurrence.pattern.interval}${convertRangeObjToRegex(recurrence.range)}`);
//   return recurringRegex
// }

// function convertPatternObjToRegex(pattern){
//   switch(pattern.type) {
//     case 'daily':
//       return 'DAILY';
//     case 'weekly':
//       return `WEEKLY;BYDAY=${convertDaysOfWeekToRegex(pattern.daysOfWeek)}`;
//     case 'absoluteMonthly':
//       return'ABSOLUTEMONTHLY';
//     case 'relativeMonthly':
//       return `RELATIVEMONTHLY;BYDAY=${convertDaysOfWeekWithIndexToRegex(pattern.index, pattern.daysOfWeek)}`;
//     case 'absoluteYearly':
//       return 'ABSOLUTEYEARLY';
//     case 'relativeYearly':
//       return `RELATIVEYEARLY;BYDAY=${convertDaysOfWeekWithIndexToRegex(pattern.index, pattern.daysOfWeek)}`;      
//   }
// }

// function convertRangeObjToRegex(range){
//   switch(range.type){
//     case 'numbered':
//       return `;COUNT=${range.numberOfOccurrences}`;
//     case 'endDate':
//       let date = range.endDate.split('-');
//       let dateInTimeZone = new time.Date(date[0],date[1],date[2],TZConverter.findOneIana(range.recurrenceTimeZone));
//       return `;UNTIL=${util.recurringRegexDateFormat(date, dateInTimeZone)}`;
//     default:
//       return '';
//   }
// }

// function convertRangeRegexToObj(event){
//   let pattern = event.recurringEventRegex[0];
//   let range;
//   if(pattern.contains(CONSTANTS.REGEX_PATTERN_KEYS.COUNT)){
//     let regex = new RegExp(CONSTANTS.REGEX_PATTERN_KEYS.COUNT + '[^;]*', 'g');
//     let count = pattern.match(regex).slice(CONSTANTS.REGEX_PATTERN_KEYS.COUNT.length);
//     range = {
//       type: 'numbered',
//       numberOfOccurrences: count
//     }
//   }else if(pattern.contains(CONSTANTS.REGEX_PATTERN_KEYS.UNTIL)){
//     let regex = new RegExp(CONSTANTS.REGEX_PATTERN_KEYS.UNTIL + '[^;]*', 'g');
//     let date = dateObj(pattern.match(regex).slice(CONSTANTS.REGEX_PATTERN_KEYS.UNTIL.length));
//     let startDate = new time.date(event.startTime);
//     range = {
//       type: 'endDate',
//       recurrenceTimeZone: 'UTC',
//       endDate: util.getUTCFormatDate(date),
//       startDate: util.getUTCFormatDate(startDate)
//     }
//   }
//   return range
// }

// function dateObj(date){
//   let year = date.slice(0, 4);
//   let month = date.slice(4, 6);
//   let day = date.slice(6, 8);
//   let hours = date.slice(9, 11);
//   let minutes = date.slice(11, 13);
//   let seconds = date.slice(13, 15);
//   let dateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
//   return new time.Date(dateString);
// }


// function convertDaysOfWeekToRegex(days){
//   let res = '';
//   for(let day of days){
//     res += `${day.substr(0,2)},`.toUpperCase();
//   }
//   return res.substr(0, res.length-1);
// }

// function convertDaysOfWeekWithIndexToRegex(index, days){
//   let res = '';
//   index_map = {'First': 1, 'Second': 2, 'Third': 3, 'Fourth': 4, 'Last': 0};
//   for(day of days){
//     res += `${index_map[index]}${day.substr(0, 2).toUpperCase()},`;
//   }
//   return res.substr(0, res.length-1);
// }

// module.exports = {
//   convertRecurringObjToRegex: convertRecurringObjToRegex,
//   recurringObject: recurringObject
// }