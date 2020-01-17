const util = require('../utils/util');
const CONSTANTS = require('../config/constants');

// ----------------------------------------------------------------------------------------//
// ---------------------------         PRIVATE METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

// FOR STORING IN DATABASE
// Return's the RSVP status of the user for the event
// @event - event for which the RSVP status is return
function userRsvpStatus(event){
  let selfAttendee = (event.attendees || []).filter((elem) => elem.self);
  let rsvpStatus;
  if(selfAttendee.length > 0){
    rsvpStatus = selfAttendee[0].responseStatus;
    rsvpStatus = CONSTANTS.CALENDAR_INVITATION_RESPONSE.GOOGLE[rsvpStatus];
  }else{
    rsvpStatus = 'Yes'
  }
  return rsvpStatus
}

// FOR STORING IN DATABASE
// Return's the startTime, endTime and allDay details for the event
// @event - event for which the startTime, endTime and allDay details are return
function getEventTimes(event){
  let startTime;
  let endTime;
  let allDay;

  if(!!(event.start || {}).dateTime){
    startTime = new Date(event.start.dateTime);
    endTime = new Date(event.end.dateTime);
    allDay = false;
  }else if(!!(event.start || {}).date){
    startTime = new Date(event.start.date);
    endTime = new Date(event.end.date);
    allDay = true;
  }else{
    startTime = new Date(2099,1,1);
    endTime = new Date(2099,1,1);
    allDay = false
  }
  return [new Date(startTime), new Date(endTime), allDay];
}

// FOR STORING IN DATABASE
// Return's an array of attend for the event for storing in DB
// @event
function buildInsertableAttendeesArray(event){
  let attendeesArray = [];
  let attendeesList = (event.attendees || []);
  for(attendee of attendeesList){
    attendeesArray.push(attendee.email);
  }
  return attendeesArray;
}


// FOR GOOGLE API REQUEST
// Return's Google acceptable formatted event date and time along with timezone
// @event
function timeHash(event){
  startHash = {};
  endHash = {};
  if(event.allDay){
    startHash = {
      'date': new Date(event.startTime).toISOString().slice(0,10),
      'timeZone': 'UTC',
    }
    endHash = {
      'date': new Date(event.endTime).toISOString().slice(0,10),
      'timeZone': 'UTC',
    }
  }else{
    startHash = {
      'dateTime': new Date(event.startTime).toISOString(),
      'timeZone': 'UTC',
    }
    endHash = {
      'dateTime': new Date(event.endTime).toISOString(),
      'timeZone': 'UTC',
    }
  }
  return [startHash, endHash];
}

// FOR GOOGLE API REQUEST
// Return's Google acceptable formatted attendees list
// @attendees
function buildAttendeesList(attendees){
  return attendees.map(attendee => ({'email': attendee}))
}

// ----------------------------------------------------------------------------------------//
// ---------------------------         EXPOSED METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//


// // TODO: Need to check all passible scenarios like attendees, timezone,  Notification time etc
// // FOR STORING IN DATABASE
// // Check's if the recurring event instance is an exception or not
// // @masterEvent - parent recurring event
// // @instance    - child recurring event
// // Note: This method doesn't check for all possible scenarios and could be faulty in those scenarios
// function isInstanceException(masterEvent, instance){
//   let [startTime, endTime, allDay] = getEventTimes(instance);
//   let showAs = instance.transparency == 'transparent' ? 'free' : 'busy';
//   if(util.getUTCFormatTime(new Date(masterEvent.startTime)) != util.getUTCFormatTime(startTime)){
//     return true;
//   }
//   if(util.getUTCFormatTime(new Date(masterEvent.endTime)) != util.getUTCFormatTime(endTime)){
//     return true;
//   }
//   if(masterEvent.allDay != allDay){
//     return true;
//   }
//   if(masterEvent.title != instance.summary){
//     return true;
//   }
//   if(masterEvent.showAs != showAs){
//     return true;
//   }
//   if(!isValueEmptyOrUndefined(masterEvent.location, instance.location)){
//     if(masterEvent.location !== instance.location){
//       return true
//     }
//   }
//   if(!isValueEmptyOrUndefined(masterEvent.description, instance.description)){
//     if(masterEvent.description !== instance.description){
//       return true
//     }
//   }
//   return false;
// }

// FOR GOOGLE API REQUEST
// Return's Google acceptable formatted event object
// @event
function buildEventObject(event){
  [startHash, endHash] = timeHash(event);
  let showAs = event.showAs == 'busy' ? 'opaque' : 'transparent';
  let requestBody = {
    'summary': event.title,
    'location': util.convertHtmlToText(event.location),
    'description': util.convertHtmlToText(event.description),
    'start': startHash,
    'end': endHash,
    'recurrence': event.recurringEventRegex,
    'attendees': buildAttendeesList(event.attendees),
    'transparency': showAs,
  }
  return requestBody;
}

// FOR STORING IN DATABASE
// Return's an event object for storing in DB
// @calendar - the calendar to which the event belongs
// @userId - userId for the event
// @event
function buildInsertableEventObject(calendar, event, userId){
  let showAs = event.transparency == 'transparent' ? 'free' : 'busy';
  let [startTime, endTime, allDay] = getEventTimes(event);

  let insertableCalendarEventObject = {
    externalEventId: event.id,
    domainType: CONSTANTS.CALENDAR_EVENT_DOMAIN_TYPES.GOOGLE,
    calendarId: calendar.id,
    userId: userId,
    title: event.summary,
    description: event.description,
    location: event.location,
    startTime: startTime,
    endTime: endTime,
    start: startTime,
    end: endTime,
    allDay: allDay,
    attendees: buildInsertableAttendeesArray(event),
    showAs: showAs,
    rsvpStatus: userRsvpStatus(event),
    organizerEmail: (event.organizer || {}).email,
    organizerName: (event.organizer || {}).display_name,
  };
  return insertableCalendarEventObject
}


module.exports = {
  buildEventObject: buildEventObject,
  buildInsertableEventObject: buildInsertableEventObject,
  getEventTimes: getEventTimes
}