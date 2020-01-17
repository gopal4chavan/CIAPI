// TODO: MOVE ENTIRE File to service folder as outlook.service.js
const graph = require('@microsoft/microsoft-graph-client');
const Calendar = require('./index').Calendar;
const CalendarEvents = require('./index').CalendarEvents;
const util = require('../utils/util');
const CONSTANTS = require('../config/constants');
const recurrenceConverter = require('../helper/recurringPatternConverter');
const OutlookCalendarHelper = require('../helper/outlookCalendar.helper');

const credentials = {
  client: {
    id: process.env.OUTLOOK_CLIENT_ID,
    secret: process.env.OUTLOOK_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://login.microsoftonline.com',
    authorizePath: 'common/oauth2/v2.0/authorize',
    tokenPath: 'common/oauth2/v2.0/token'
  }
};

const oauth2 = require('simple-oauth2').create(credentials);

let MIN_DATE = new Date();
let MAX_DATE = new Date();
MIN_DATE.setMonth(MIN_DATE.getMonth() - 6);
MAX_DATE.setMonth(MAX_DATE.getMonth() + 12);
MIN_DATE = util.getUTCFormatDateTime(MIN_DATE);
MAX_DATE = util.getUTCFormatDateTime(MAX_DATE);



// ----------------------------------------------------------------------------------------//
// ---------------------------         PRIVATE METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

// Makes sure, we are not using expired token
// Refeshe's the token before 5 min of expiration and updates the Auth Client.
async function CheckAndRefreshAccessToken(calendar) {
  // Do we have an access token cached?
  const FIVE_MINUTES = 300000;
  const expiration = new Date(parseFloat(calendar.expiresAt - FIVE_MINUTES));
  let accessToken = calendar.accessToken
  const tokenObject = {
    'access_token': calendar.accessToken,
    'refresh_token': calendar.refreshToken
  };
  if(expiration < new Date()){
    try{
      const newToken = await oauth2.accessToken.create(tokenObject).refresh();
      // updating the calendar, with new token values, for access token, refresh token and expiration time
      await calendar.update({
        accessToken: newToken.token.access_token,
        refreshToken: newToken.token.refresh_token,
        expiresAt: newToken.token.expires_at
      });
      accessToken = newToken.token.access_token
    }catch(e){
      console.log(e);
    }
  }
  // Initialize Graph client
  const client = graph.Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
  return client
}


// Fetches the calendar list for user
async function fetchCalendarList(client, token, userId){
  const result = await client.api('/me/calendars').get();
  let calendars = result.value;
  let primaryCal = calendars.find((cal) => OutlookCalendarHelper.isPrimaryCalendar(cal));
  let primaryCalId = await insertCalendarDetails(primaryCal, token, userId, null);
  calendars.forEach(async (calendar) =>{
    if(!OutlookCalendarHelper.isPrimaryCalendar(calendar) && calendar.canEdit == true){
      await insertCalendarDetails(calendar, token, userId, primaryCalId);
    }
  })
}

// Inserts the calendar details into DB
async function insertCalendarDetails(calendar, token, userId, primaryCalId){
  try{
    let cal = await Calendar.findOrCreate({where: { calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.OUTLOOK,externalCalendarID: calendar.id}});
    cal = cal[0];
    if(cal[1] === false){
      // TODO: deleteExistingProxyCalendarsAndSecondaryCalendar
      // TODO: same for google events as well
    }
    if(OutlookCalendarHelper.isPrimaryCalendar(calendar)){
      await cal.update({
        calendarName: `${calendar.owner.name}(Outlook Calendar)`,
        alias: calendar.owner.address,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        isPrimary: true,
        userId: userId,
        calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY,
      });
      return cal.id
    }else{
      let calType = CONSTANTS.CALENDAR_TYPES.SECONDARY;
      if(calendar.name == CONSTANTS.PROXY_CALENDARS.GOOGLE){
        calType = CONSTANTS.CALENDAR_TYPES.PROXY
      }
      await cal.update({
        calendarName: `${calendar.name}(Outlook Calendar)`,
        alias: calendar.name,
        isPrimary: false,
        userId: userId,
        calendarType: calType,
        linkedCalendarId: primaryCalId
      })
    }
  }catch(e){
    console.log(e);
  }
}

// Returns the List of events
async function buildEventList(client, url){
  let events = []
  let response;
  let nextLinkUrl = url;
  do{
    try{
      response = await client.api(nextLinkUrl).top(100).get();
    }catch(e){
      console.log(e);
    }
    events = events.concat(response.value);
    nextLinkUrl = response["@odata.nextLink"]
  }while(nextLinkUrl != null);
  return events;
}

// Fetche's the primary calendar events
async function fetchPrimaryCalendarEvents(userId){
  
  let calendar = await Calendar.findByUserId(userId, CONSTANTS.CALENDAR_DOMAIN_TYPES.OUTLOOK);
  let client = await CheckAndRefreshAccessToken(calendar);
  let url = `/me/calendars/${calendar.externalCalendarID}/events`
  let events = await buildEventList(client, url);
  
  let eventsArray = [];
  await calendar.clearCalendarEvents();
  for(event of events){
    let isRecurring = !!event.recurrence;
    let calEvent = OutlookCalendarHelper.buildInsertableEventObject(calendar, event, userId);
    let otherProps = {};
    if(isRecurring){
      otherProps = {
        recurringEventRegex: recurrenceConverter.convertRecurringObjectToRegex(event.recurrence),
        recurringEventObject: JSON.stringify(event.recurrence)
      }
    }
    Object.assign(calEvent, otherProps);
    eventsArray.push(calEvent);
    if(isRecurring){
      let recurringInstances = await fetchRecurringInstances(calendar, calEvent, client, userId);
      eventsArray = eventsArray.concat(recurringInstances);
    }
  }
  try{
    await CalendarEvents.bulkCreate(eventsArray)
  }catch(e){
    console.log(e);
  }
}

// Fetches all the instances of the given master recurring event
async function fetchRecurringInstances(calendar, seriesMasterEvent, client, userId){
  try{
    let url = `/me/calendars/${calendar.externalCalendarID}/events/${seriesMasterEvent.externalEventId}/instances?startDateTime=${MIN_DATE}&endDateTime=${MAX_DATE}`;
    recurringInstances = await buildEventList(client, url);
    let calEvent;
    let allRecurringInstances = [];
    for(instance of recurringInstances){
      calEvent = OutlookCalendarHelper.buildInsertableEventObject(calendar, instance, userId);
      Object.assign(calEvent, {
        recurringEventRegex: null,
        recurringEventId: seriesMasterEvent.externalEventId
      })
      allRecurringInstances.push(calEvent);
    }
    return allRecurringInstances;
  }catch(e){
    console.log(e);
  }
}

// Removes all the list of proxy calendars for the given primary calendar
async function removeExternalProxyCalendar(userId, calendar, client){
  let cals = await Calendar.findAll({
    where: {
      userId: userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PROXY,
      calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.OUTLOOK,
      linkedCalendarId: calendar.id
    }
  });
  if(cals.length > 0){
    jsonRequest = OutlookCalendarHelper.buildBatchRequest(cals)
    try{
      result = await client.api('/$batch').post(jsonRequest);
    }catch(e){
      console.log(e);
    }
    console.log(result);
    for(cal of cals){
      await cal.destroy();
    }
  }
}

// After Authorization, outlook return's a auth_code, we can retrive the access token from that code
async function getTokenFromCode(auth_code) {
  try{
    let result = await oauth2.authorizationCode.getToken({
      code: auth_code,
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
      scope: process.env.APP_SCOPES
    });
    const token = oauth2.accessToken.create(result);
    return token.token;
  }catch(e){
    console.log(e);
  }
}

async function identifyAndUpdateRecurringInstances(recurringInstances, event, GoogleCal, userId, client, proxyCal){
  let [exceptionEvents, occurrenceEvents] = event.ExceptionAndOccuranceEvents(GoogleCal.id, userId);
  for(instance of recurringInstances){
    await identifyAndUpdateRecurringEvent(instance, exceptionEvents, occurrenceEvents, client, proxyCal);
  }
}

async function identifyAndUpdateRecurringEvent(instance, occurrenceEvents, exceptionEvents, client, proxyCal){
  let showAs = instance.showAs == 'busy' ? 'busy' : 'free';
  let correspondingInstanceEvent = occurrenceEvents.find(e => {
    return util.getUTCFormatDateTime(new Date(e.startTime)) == util.getUTCFormatDateTime((new Date(instance.start.dateTime+'z'))) &&
            util.getUTCFormatDateTime(new Date(e.endTime)) == util.getUTCFormatDateTime((new Date(instance.end.dateTime+'z'))) &&
            e.allDay == instance.allDay &&
            util.isLocAndDescSame(e.location, instance.location.displayName) &&
            util.isLocAndDescSame(e.description, instance.body.content) &&
            e.showAs == showAs
  });
  if(!!correspondingInstanceEvent && !!correspondingInstanceEvent.id){
    await correspondingInstanceEvent.update({proxyExternalEventId: instance.id})
  }else{
    correspondingInstanceEvent = exceptionEvents.find(e => {
    return util.getUTCFormatDate(new Date(e.startTime)) == util.getUTCFormatDate(new Date(instance.start.dateTime+'z')) &&
           util.getUTCFormatDate(new Date(e.endTime)) == util.getUTCFormatDate(new Date(instance.end.dateTime+'z'))
    });
    if(!!correspondingInstanceEvent && !!correspondingInstanceEvent.id){
      await correspondingInstanceEvent.update({proxyExternalEventId: instance.id})
      await SyncExternalProxyEventWithOriginalEvent(correspondingInstanceEvent, client, proxyCal);
    }else{
      await deleteExternalProxyEvent(instance, client, proxyCal);
    }
  }
}

async function SyncExternalProxyEventWithOriginalEvent(correspondingInstanceEvent, client, proxyCal){
  try{
    let url = `/me/calendars/${proxyCal.externalCalendarID}/events/${correspondingInstanceEvent.proxyExternalEventId}`;
    await client.api(url).update({event : OutlookCalendarHelper.buildEventObject(correspondingInstanceEvent)});
  }catch(e){
    console.log(e);
  }
}

async function deleteExternalProxyEvent(instance, client, proxyCal){
  try{
    let url = `/me/calendars/${proxyCal.externalCalendarID}/events/${instance.id}`
    await client.api(url).delete();
  }catch(e){
    console.log(e);
  }
}
// ----------------------------------------------------------------------------------------//
// ---------------------------         EXPOSED METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//


// Return's the Outlook Authorization URL
function getAuthUrl() {
  const returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
    scope: process.env.OUTLOOK_APP_SCOPES
  });
  return returnVal;
}

// Fetches the list of calendars
async function fetchCalendars(code, userId){
  try{
    let accessToken = await getTokenFromCode(code);
    // Initialize Graph client
    const client = graph.Client.init({
      authProvider: (done) => {
        done(null, accessToken.access_token);
      }
    });
    await fetchCalendarList(client, accessToken, userId);
  }catch(e){
    console.log(e);
  }
}

// method to create a proxy google calendar into outlook calendar
async function createProxyGoogleCalendar(data){
  let response;
  try{
    let cal = await Calendar.findByUserId(data.userId, CONSTANTS.CALENDAR_DOMAIN_TYPES.OUTLOOK);
    let client = await CheckAndRefreshAccessToken(cal);
    await removeExternalProxyCalendar(data.userId, cal, client);
    response = await client.api('/me/calendars').post({name: "googleProxy"});
    await insertCalendarDetails(response, null, data.userId, cal.id)
  }catch(e){
    console.log(e);
  }
  console.log(response);
}

// Method to push original(primary) google calendar events to proxy google calendar
async function syncProxyGoogleCalendar(data){
  // Source Calendar
  let GoogleCal = await Calendar.find({
    where: {
      userId: data.userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY,
      calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.GOOGLE
    }
  })

  // Source Calendar Events
  let events = await CalendarEvents.findAll({
    where:{
      userId: data.userId,
      calendarId: GoogleCal.id,
      eventType: [CONSTANTS.CALENDAR_EVENT_TYPES.SERIES_MASTER, CONSTANTS.CALENDAR_EVENT_TYPES.SINGLE_INSTANCE]
    }
  })

  // Destination Primary Calendar
  let cal = await Calendar.find({
    where: {
      userId: data.userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY,
      calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.OUTLOOK
    }
  })

  // Destination Calendar
  let proxyCal = await Calendar.find({
    where: {
      userId: data.userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PROXY,
      linkedCalendarId: cal.id
    }
  })

  // check token and get calendarClient or auth
  let client = await CheckAndRefreshAccessToken(cal);

  for(let i = 0; i < events.length; i = i+100){
    let set = events.slice(i, i+100);
    try{
      let batchRequest = OutlookCalendarHelper.buildBatchRequestForEvents(set, proxyCal.externalCalendarID);
      let result = await client.api('/$batch').post(batchRequest);
      for(response of result.responses){
        let event = response.event;
        let localEvent = CalendarEvents.find({where:{id: response.id}});
        localEvent.update({proxyExternalEventId: event.id});
        if(!!event.recurrence){
          // fetch all recurring events WRT to proxyGoogle calendar which is inside outlook calendar
          let url = `/me/calendars/${proxyCal.externalCalendarID}/events/${localEvent.proxyExternalEventId}/instances?startDateTime=${MIN_DATE}&endDateTime=${MAX_DATE}`;
          let recurringInstances = await client.api(url).get();
          // identify and update the proxyGoogle calendar external event id
          identifyAndUpdateRecurringInstances(recurringInstances, localEvent, GoogleCal, data.userId, client, proxyCal);
        }
      }
    }catch(e){
      console.log(e);
    }
  }
}

async function syncCalendars(userId, syncCalendarSchedular){
  await fetchPrimaryCalendarEvents(userId);
  await syncCalendarSchedular.addSyncCalendarJobToQueue({userId: userId}, 'OUTLOOK_PROXY');
}


module.exports = {
  getAuthUrl: getAuthUrl,
  fetchCalendars: fetchCalendars,
  createProxyGoogleCalendar: createProxyGoogleCalendar,
  syncProxyGoogleCalendar: syncProxyGoogleCalendar,
  syncCalendars: syncCalendars,
}
