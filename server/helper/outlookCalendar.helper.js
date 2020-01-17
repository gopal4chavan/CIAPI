const util = require('../utils/util');
const CONSTANTS = require('../config/constants');

// ----------------------------------------------------------------------------------------//
// ---------------------------         PRIVATE METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

// FOR STORING IN DATABASE
// Return's the RSVP status of the user for the event
// @event - event for which the RSVP status is return
function userRsvpStatus(event){
  if(event.responseStatus){
    if(event.responseStatus.response == 'organizer'){
      rsvpStatus = 'Yes';
    }else{
      rsvpStatus = CONSTANTS.CALENDAR_INVITATION_RESPONSE.OUTLOOK[event.responseStatus.response];
    }
  }else{
    rsvpStatus = 'Yes';
  }
  return rsvpStatus;
}


// FOR OUTLOOK API REQUEST
// Return's Outlook acceptable formatted attendees list
// @attendees
function buildAttendeesList(attendees){
  let list = attendees.map(attendee => ({
      emailAddress: {
        address: attendee
      }
    })
  );
  return list;
}

// FOR STORING IN DATABASE
// Return's an array of attend for the event for storing in DB
// @event
function buildInsertableAttendeesArray(event){
  let attendeesArray = [];
  let attendeesList = (event.attendees || []);
  for(attendee of attendeesList){
    attendeesArray.push(attendee.emailAddress.address);
  }
  return attendeesArray;
}

// ----------------------------------------------------------------------------------------//
// ---------------------------         EXPOSED METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

function buildBatchRequest(cals){
  let request = [];
  let ind = 1;
  for(cal of cals){
    request.push({
      'id': ind,
      'method': 'DELETE',
      'url': `/me/calendars/${cal.externalCalendarID}`
    })
    ind = ind + 1;
  }
  requestBody = {
    'requests': request
  }
  return requestBody;
}

// Verifyes if given calendar is primary or not
function isPrimaryCalendar(calendar){
  return (calendar.name == "Calendar" && calendar.canEdit == true)
}

function buildInsertableEventObject(calendar, event, userId){
  let showAs = event.showAs == 'busy' ? 'busy' : 'free';
  
  let insertableCalendarEventObject = {
    externalEventId: event.id,
    domainType: CONSTANTS.CALENDAR_EVENT_DOMAIN_TYPES.OUTLOOK,
    calendarId: calendar.id,
    userId: userId,
    title: event.subject,
    description: event.body.content,
    location: event.location.displayName,
    // we are adding 'z' in the end to make sure that 
    // the Date parser consider this date as a UTC Timezone Date
    startTime: new Date(event.start.dateTime+'z'),
    endTime: new Date(event.end.dateTime+'z'),
    start: new Date(event.start.dateTime+'z'),
    end: new Date(event.end.dateTime+'z'),
    allDay: event.isAllDay,
    attendees: buildInsertableAttendeesArray(event),
    showAs: showAs,
    rsvpStatus: userRsvpStatus(event),
    organizerEmail: (event.organizer || {}).email,
    organizerName: (event.organizer || {}).display_name,
    eventType: event.type
  };
  return insertableCalendarEventObject
}


// FOR OUTLOOK API REQUEST
// Return's Outlook acceptable formatted event object
// @event
function buildEventObject(event){
  let showAs = event.showAs == 'busy' ? '2' : '0'
  let isRecurring = !!event.recurringEventRegex;
  let requestBody = {
    subject: event.title,
    body: {
      contentType: "HTML",
      content: event.description
    },
    start: {
      dateTime: util.getUTCFormatDateTime(event.startTime),
      timeZone: "UTC"
    },
    end: {
      dateTime: util.getUTCFormatDateTime(event.endTime),
      timeZone: "UTC"
    },
    location:{
        displayName: util.convertHtmlToText(event.location)
    },
    attendees: buildAttendeesList(event.attendees),
    recurrence: isRecurring ? event.recurringEventObject : null,
    showAs: showAs,
  }
  return requestBody;
}


function buildBatchRequestForEvents(events, calendar){
  let request = [];
  for(event of events){
    request.push({
      'id': event.id,
      'method': 'POST',
      'url': `/api/v2.0/me/calendars/${calendar.externalCalendarId}/events`,
      'event': buildEventObject(event)
    })
  }
  requestBody = {
    'requests': request
  }
  return requestBody;
}
module.exports = {
  buildBatchRequest: buildBatchRequest,
  buildInsertableEventObject: buildInsertableEventObject,
  isPrimaryCalendar: isPrimaryCalendar,
  buildEventObject: buildEventObject,
  buildBatchRequestForEvents: buildBatchRequestForEvents
}
