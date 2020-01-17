var h2p = require('html2plaintext');

// ----------------------------------------------------------------------------------------//
// ---------------------------         PRIVATE METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

function getDateDetails(date){
  let day = formatValue(date.getUTCDate());
  let month = formatValue(date.getUTCMonth() + 1);
  let year = date.getUTCFullYear();
  let hours = formatValue(date.getUTCHours());
  let minutes = formatValue(date.getUTCMinutes());
  return {day: day, month: month, year: year, hours: hours, minutes: minutes};
}

function formatValue(value){
  return value < 10 ? ('0' + value) : value;
}

function isValueEmptyOrUndefined(val1, val2){
  return (val1 === undefined && val2 === undefined) || 
  (val1 === '' && val2 === undefined) || 
  (val1 === undefined && val2 === '')
}

// ----------------------------------------------------------------------------------------//
// ---------------------------         EXPOSED METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

// Converts HTML to simple text
function convertHtmlToText(html){
  return h2p(html);
}

// Returns 'YYYY-MM-DDTHH:MM:00' format DateTime in UTC TimeZone
function getUTCFormatDateTime(date){
  let dateDetails = getDateDetails(date);
  return `${dateDetails.year}-${dateDetails.month}-${dateDetails.day}T${dateDetails.hours}:${dateDetails.minutes}:00`
}

// Returns 'YYYY-MM-DD' format Date in UTC TimeZone
function getUTCFormatDate(date){
  let dateDetails = getDateDetails(date);
  return `${dateDetails.year}-${dateDetails.month}-${dateDetails.day}`
}

function getUTCFormatTime(date){
  let dateDetails = getDateDetails(date);
  return `${dateDetails.hours}:${dateDetails.minutes}:00`
}

function recurringRegexDateFormat(date, dateInTimeZone){
  return `${date[0]}${date[1]}${date[2]}T${formatValue(dateInTimeZone.getUTCHours())}${formatValue(dateInTimeZone.getUTCMinutes())}${formatValue(dateInTimeZone.getUTCSeconds())}Z`;
}

function isLocAndDescSame(val1, val2){
  if(isValueEmptyOrUndefined(val1, val2)){
    return true;
  }else if(val1 !== val2){
    return false;
  }
  return true;
}

module.exports = {
  getUTCFormatDateTime: getUTCFormatDateTime,
  convertHtmlToText: convertHtmlToText,
  getUTCFormatDate: getUTCFormatDate,
  getUTCFormatTime: getUTCFormatTime,
  recurringRegexDateFormat: recurringRegexDateFormat,
  isLocAndDescSame: isLocAndDescSame
}