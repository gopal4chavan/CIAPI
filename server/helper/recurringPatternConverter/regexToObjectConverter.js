const CONSTANTS = require('../../config/constants');
const time = require('time');
const util = require('../../utils/util');

function convertPatternRegexToObj(recurrenceRegex, startTime){
  let patternObj = {};
  switch(recurringType(recurrenceRegex)){
    case 'DAILY':
      patternObj = {
        type: 'daily'
      }
      break;
    case 'WEEKLY':
      patternObj = {
        type: 'weekly',
        daysOfWeek: convertweekDaysRegexToObj(recurrenceRegex),
        firstDayOfWeek: CONSTANTS.MAPPING_WEEK_DAYS['SU']
      }
      break;
    case 'MONTHLY':
      if(recurrenceRegex.includes(CONSTANTS.REGEX_PATTERN_KEYS.BYDAY)){
        // Means its a relativeMonthly Recurring Event
        let byDay = patternKeyValue(CONSTANTS.REGEX_PATTERN_KEYS.BYDAY, recurrenceRegex);
        patternObj = {
          type: 'relativeMonthly',
          daysOfWeek: [ CONSTANTS.MAPPING_WEEK_DAYS[byDay.slice(1)] ],
          index: CONSTANTS.INDEX[parseInt(byDay.slice(0,1), 10)]
        }
      }else{
        // Means its a absoluteMonthy Recurring Event
        patternObj = {
          type: 'absoluteMonthly',
          dayOfMonth: startTime.getDate()
        }
      }
      break;
    case 'YEARLY':
      // Google doesn't support Relative yearly recurring event, 
      // as this can be acheived by Relative monthly by setting invertal to 12
      patternObj = {
        type: 'absoluteYearly',
        dayOfMonth: [ startTime.getDate() ],
        month: startTime.getMonth() + 1
      }
      break;
  }
  patternObj.interval = getRecurringInterval(recurrenceRegex);
  return patternObj;
}

function convertRangeRegexToObj(recurrenceRegex, startTime){
  let range;
  if(recurrenceRegex.includes(CONSTANTS.REGEX_PATTERN_KEYS.COUNT)){
    let count = patternKeyValue(CONSTANTS.REGEX_PATTERN_KEYS.COUNT, recurrenceRegex);
    range = {
      type: 'numbered',
      numberOfOccurrences: count
    }
  }else if(recurrenceRegex.includes(CONSTANTS.REGEX_PATTERN_KEYS.UNTIL)){
    let date = dateObj(patternKeyValue(CONSTANTS.REGEX_PATTERN_KEYS.UNTIL, recurrenceRegex));
    range = {
      type: 'endDate',
      recurrenceTimeZone: 'UTC',
      endDate: util.getUTCFormatDate(date),
      startDate: util.getUTCFormatDate(startTime)
    }
  }
  return range
}



function dateObj(date){
  let year = date.slice(0, 4);
  let month = date.slice(4, 6);
  let day = date.slice(6, 8);
  let hours = date.slice(9, 11);
  let minutes = date.slice(11, 13);
  let seconds = date.slice(13, 15);
  let dateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
  return new time.Date(dateString);
}

function patternKeyValue(patternKey, pattern){
  let regex = new RegExp(patternKey + '[^;]*', 'g');
  return pattern.match(regex)[0].slice(patternKey.length);
}

function recurringType(pattern){
  return ['DAILY','WEEKLY','MONTHLY','YEARLY'].find(elem => pattern.includes(elem))
}

function getRecurringInterval(patternRegex){
  if(patternRegex.includes(CONSTANTS.REGEX_PATTERN_KEYS.INTERVAL)){
    return patternKeyValue(CONSTANTS.REGEX_PATTERN_KEYS.INTERVAL, patternRegex);
  }
  return 1;
}

function convertweekDaysRegexToObj(recurrenceRegex){
  let allWeekDays = 'BYDAY=MO,TU,WE,TH,FR'
  if(recurrenceRegex.includes(allWeekDays)){
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }else{
    let daysPattern = recurrenceRegex.match(/BYDAY=[^;]*/g)[0];
    let days = daysPattern.slice(6).split(',');
    let mappedDays = [];
    for(let day of days){
      mappedDays.push(CONSTANTS.MAPPING_WEEK_DAYS[day])
    }
    return mappedDays
  }
}

module.exports = {
  convert: function(recurrenceRegex, startTime){
    let recurrenceObject = {};
    recurrenceObject.pattern = convertPatternRegexToObj(recurrenceRegex, startTime);
    recurrenceObject.range = convertRangeRegexToObj(recurrenceRegex, startTime);
    return recurrenceObject;
  }
};