// TODO: MOVE ENTIRE File to service folder as google.service.js
const {google} = require('googleapis');
const Calendar = require('./index').Calendar;
const CalendarEvents = require('./index').CalendarEvents;
const util = require('../utils/util');
const CONSTANTS = require('../config/constants');
const GoogleCalendarHelper = require('../helper/googleCalendar.helper');
const async = require('async');
const recurrenceConverter = require('../helper/recurringPatternConverter');
// const User = require('./index').User

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar'
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: "consent"
});

let MIN_DATE = new Date();
let MAX_DATE = new Date();
MIN_DATE.setMonth(MIN_DATE.getMonth() - 6);
MAX_DATE.setMonth(MAX_DATE.getMonth() + 12);
MIN_DATE = util.getUTCFormatDateTime(MIN_DATE)+"z";
MAX_DATE = util.getUTCFormatDateTime(MAX_DATE)+"z";


// ----------------------------------------------------------------------------------------//
// ---------------------------         PRIVATE METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//


// TODO: Instead of returning auth, return client
// Makes sure, we are not using expired token
// Refeshe's the token before 5 min of expiration and updates the Auth Client.
async function CheckAndRefreshAccessToken(calendar){
  const FIVE_MINUTES = 300000;
  const expiration = new Date(parseFloat(calendar.expiresAt - FIVE_MINUTES));
  let creds = {
    access_token: calendar.accessToken,
    refresh_token: calendar.refreshToken
  }
  oAuth2Client.setCredentials(creds);
  // time to refresh access token
  if(expiration < new Date()){
    const newToken = await oAuth2Client.refreshAccessToken();
      
    // updating the calendar, with new token values, for access token, refresh token and expiration time
    await calendar.update({
      accessToken: newToken.credentials.access_token,
      refreshToken: newToken.credentials.refresh_token,
      expiresAt: new Date(newToken.credentials.expiry_date)
    });

    // Update the oAuth client, with new credentials
    oAuth2Client.setCredentials(newToken.credentials);
  }
  return oAuth2Client;
}

// Makes an API call to Fetches the list of calendar for user
function fetchCalendarList(auth, token, userId){
  const calendar = google.calendar({version: 'v3', auth});
  calendar.calendarList.list({minAccessRole: 'owner'}, async (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const items = res.data.items;
    let primaryCal = items.find((calendar) => calendar.primary)
    let primaryCalId = await insertCalendarDetails(primaryCal, token, userId, null);
    items.forEach((calendar) => { 
      if(!calendar.primary){
        insertCalendarDetails(calendar, token, userId, primaryCalId) 
      }
    });
  });
}

// Inserts the calendar details into DB
async function insertCalendarDetails(calendar, token, userId, primaryCalId){
  try{
    let cal = await Calendar.findOrCreate({where: { calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.GOOGLE,externalCalendarID: calendar.id}});
    cal = cal[0];
    if(calendar.primary){
      await cal.update({
        alias: calendar.summary,
        calendarName: calendar.summary,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        isPrimary: true,
        expiresAt: new Date(token.expiry_date),
        userId: userId,
        calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY,
      });
      return cal.id
    }else{
      let calType = CONSTANTS.CALENDAR_TYPES.SECONDARY;
      if(calendar.summary == CONSTANTS.PROXY_CALENDARS.OUTLOOK){
        calType = CONSTANTS.CALENDAR_TYPES.PROXY
      }
      await cal.update({
        alias: calendar.summary,
        calendarName: calendar.summary,
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
async function buildEventList(calendar, auth, otherProps = {singleEvents: false}){
  let events = []
  let pageToken = null;
  const calendarClient = google.calendar({version: 'v3', auth: auth});
  let response;
  let requestObject = {
    calendarId: calendar.externalCalendarID,
    timeMin: MIN_DATE,
    timeMax: MAX_DATE
  }
  do{
    try{
      Object.assign(requestObject, otherProps, {pageToken: pageToken});
      if(otherProps.eventId){
        response = await calendarClient.events.instances(requestObject);
      }else{
        response = await calendarClient.events.list(requestObject);
      }
    }catch(e){
      console.log(e);
    }
    events = events.concat(response.data.items);
    pageToken = response.data.nextPageToken;
  }while(pageToken != null);

  await calendar.update({nextSyncToken: response.data.nextSyncToken});
  return events
}

// Fetche's the primary calendar events
async function fetchPrimaryCalendarEvents(userId){
  
  let calendar = await Calendar.findByUserId(userId, CONSTANTS.CALENDAR_DOMAIN_TYPES.GOOGLE);
  let auth = await CheckAndRefreshAccessToken(calendar);
  let events = await buildEventList(calendar, auth);
  let allRecurringInstances = []
  
  let eventsArray = [];
  await calendar.clearCalendarEvents();
  for(event of events){
    let isRecurring = !!event.recurrence;
    let calEvent = GoogleCalendarHelper.buildInsertableEventObject(calendar, event, userId);
    let otherProps = {
      eventType: CONSTANTS.CALENDAR_EVENT_TYPES.SINGLE_INSTANCE
    };
    if(isRecurring){
      otherProps = {
        recurringEventRegex: event.recurrence,
        eventType: CONSTANTS.CALENDAR_EVENT_TYPES.SERIES_MASTER,
        recurringEventObject: JSON.stringify(recurrenceConverter.convertRecurringRegexToObject(event.recurrence[0], calEvent.startTime))
      }
    }
    Object.assign(calEvent, otherProps);
    eventsArray.push(calEvent);
    if(isRecurring){
      let recurringInstances = await fetchRecurringInstances(calendar, calEvent, auth, userId);
      allRecurringInstances = allRecurringInstances.concat(recurringInstances);
    }
  }
  try{
    await CalendarEvents.bulkCreate(eventsArray);
    await insertRecurringEvents(allRecurringInstances);
  }catch(e){
    console.log(e);
  }
}

// Google doesn't provide details about a recurring event if its a occurance or exception
// We have to do it manually
async function insertRecurringEvents(allRecurringInstances){
  for(let instance of allRecurringInstances){
    try{
      let eventData = await CalendarEvents.findOrCreate({where: { externalEventId: instance.externalEventId}});
      if(eventData[1] === false){
        instance.eventType = CONSTANTS.CALENDAR_EVENT_TYPES.EXCEPTION;
      }
      let event = eventData[0];
      await event.update(instance);
    }catch(e){
      console.log(e);
    }
  }
}

// Fetches all the instances of the given master recurring event
async function fetchRecurringInstances(calendar, seriesMasterEvent, auth, userId){
  let allRecurringInstances = [];
  try{
    let recurringInstanceEvents = await buildEventList(calendar, auth ,{eventId: seriesMasterEvent.externalEventId});
    for(let instance of recurringInstanceEvents){
      let calEvent = GoogleCalendarHelper.buildInsertableEventObject(calendar, instance, userId);
      Object.assign(calEvent, {
        eventType: CONSTANTS.CALENDAR_EVENT_TYPES.OCCURRENCE,
        recurringEventRegex: null,
        recurringEventId: seriesMasterEvent.externalEventId
      })
      allRecurringInstances.push(calEvent);
    }
  }catch(e){
    console.log(e);
  }
  return allRecurringInstances;
}

// Removes all the list of proxy calendars for the given primary calendar
async function removeExternalProxyCalendar(userId, calendar, calendarClient){
  let cals = await Calendar.findAll({
    where: {
      userId: userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PROXY,
      calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.GOOGLE,
      linkedCalendarId: calendar.id
    }
  });
  if(cals.length > 0){
    async.eachSeries(cals, async function(cal){
      try{
        res = await calendarClient.calendars.delete({calendarId: cal.externalCalendarID});
      }catch(e){
        console.log(e);
      }
    })
    for(cal of cals){
      await cal.destroy();
    }
  }
}

async function identifyAndUpdateRecurringInstances(recurringInstances, SeriesMasterEvent, OutlookCal, userId, client, proxyCal){
  let [exceptionEvents, occurrenceEvents] = await OutlookCal.exceptionAndOccuranceEvents(SeriesMasterEvent.externalEventId, userId)
  for(instance of recurringInstances){
    await identifyAndUpdateRecurringEvent(instance, exceptionEvents, occurrenceEvents, client, proxyCal);
  }
}
async function identifyAndUpdateRecurringEvent(instance, exceptionEvents, occurrenceEvents, client, proxyCal){
  let [startTime, endTime, allDay] = GoogleCalendarHelper.getEventTimes(instance);
  let showAs = instance.transparency == 'transparent' ? 'free' : 'busy';
  let correspondingInstanceEvent = occurrenceEvents.find(e => {
    return util.getUTCFormatDateTime(new Date(e.startTime)) == util.getUTCFormatDateTime((startTime)) &&
            util.getUTCFormatDateTime(new Date(e.endTime)) == util.getUTCFormatDateTime((endTime)) &&
            e.allDay == allDay &&
            util.isLocAndDescSame(e.location, instance.location) &&
            util.isLocAndDescSame(e.description, instance.description) &&
            e.showAs == showAs
  });
  if(!!correspondingInstanceEvent && !!correspondingInstanceEvent.id){
    await correspondingInstanceEvent.update({proxyExternalEventId: instance.id})
  }else{
    correspondingInstanceEvent = exceptionEvents.find(e => {
      return util.getUTCFormatDate(new Date(e.startTime)) == util.getUTCFormatDate(startTime) &&
              util.getUTCFormatDate(new Date(e.endTime)) == util.getUTCFormatDate(endTime)
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
  // Update the secondary google calendar(proxy outlook calendar) event, to make it an exception recurring event
  try{
    res = await client.events.update({
      calendarId: proxyCal.externalCalendarID,
      eventId: correspondingInstanceEvent.proxyExternalEventId,
      resource : GoogleCalendarHelper.buildEventObject(correspondingInstanceEvent)
    });
  }catch(e){
    console.log(e);
  }
}

async function deleteExternalProxyEvent(instance, client, proxyCal){
  try{
    res = await client.events.delete({
      calendarId: proxyCal.externalCalendarID,
      eventId: instance.id
    });
  }catch(e){
    console.log(e);
  }
}
// ----------------------------------------------------------------------------------------//
// ---------------------------         EXPOSED METHODS            -------------------------//
// ----------------------------------------------------------------------------------------//

// Return's the google redirect url
function getAuthUrl(){
  return authUrl;
}

// Fetch the calendars list from google and inserts into DB
async function fetchCalendars(code, userId){
  try{
    // const response = await oAuth2Client.getToken(code)
    const {tokens} = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens);
    fetchCalendarList(oAuth2Client, tokens, userId);
  }catch(e){
    console.log(e);
  }
}

// Create a Proxy outlook calendar in google
async function createProxyOutlookCalendar(data){
  let response;
  try{
    let cal = await Calendar.findByUserId(data.userId, CONSTANTS.CALENDAR_DOMAIN_TYPES.GOOGLE);
    let auth = await CheckAndRefreshAccessToken(cal);
    const calendar = google.calendar({version: 'v3', auth});
    await removeExternalProxyCalendar(data.userId, cal, calendar);
    response = await calendar.calendars.insert({
      requestBody : {summary: 'outlookProxy'}
    });
    await insertCalendarDetails(response.data, null, data.userId, cal.id)
  }catch(e){
    console.log(e);
  }
  console.log(response);
}

// Update's the proxy outook calendar with original google calendar data
async function syncProxyOutlookCalendar(data){
  // Source Calendar
  let OutlookCal = await Calendar.find({
    where: {
      userId: data.userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY,
      calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.OUTLOOK
    }
  })

  // Source Calendar Events
  let events = await CalendarEvents.findAll({
    where:{
      userId: data.userId,
      calendarId: OutlookCal.id,
      eventType: [CONSTANTS.CALENDAR_EVENT_TYPES.SERIES_MASTER, CONSTANTS.CALENDAR_EVENT_TYPES.SINGLE_INSTANCE]
    }
  })

  // Destination Primary Calendar
  let cal = await Calendar.find({
    where: {
      userId: data.userId,
      calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY,
      calendarDomainType: CONSTANTS.CALENDAR_DOMAIN_TYPES.GOOGLE
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
  let auth = await CheckAndRefreshAccessToken(cal);
  const calendarClient = google.calendar({version: 'v3', auth});
  let recurringEventsList = [];
  for(let i = 0; i < events.length; i = i+100){
    let set = events.slice(i, i+100);
    await async.eachSeries(set, async function(event){
      try{
        res = await calendarClient.events.insert({
          calendarId: proxyCal.externalCalendarID,
          resource : GoogleCalendarHelper.buildEventObject(event)
        });
        await event.update({proxyExternalEventId: res.data.id});
        if(event.eventType == CONSTANTS.CALENDAR_EVENT_TYPES.SERIES_MASTER){
          recurringEventsList.push(event);
        }
      }catch(e){
        console.log(e);
      }
    })
  }
  for(let recurringEvent of recurringEventsList){
    // fetch all recurring events WRT to proxyOutlook calendar which is inside google calendar
    let recurringInstances = await calendarClient.events.instances({
      calendarId: proxyCal.externalCalendarID, 
      eventId: recurringEvent.proxyExternalEventId,
      timeMin: MIN_DATE,
      timeMax: MAX_DATE
    });
    recurringInstances = recurringInstances.data.items
    // identify and update the proxyOutlook calendar external event id
    await identifyAndUpdateRecurringInstances(recurringInstances, recurringEvent, OutlookCal, data.userId, calendarClient, proxyCal);
  }
}

async function syncCalendars(userId, syncCalendarSchedular){
  await fetchPrimaryCalendarEvents(userId);
  await syncCalendarSchedular.addSyncCalendarJobToQueue({userId: userId}, 'GOOGLE_PROXY');
}

module.exports = {
  authUrl: getAuthUrl,
  fetchCalendars: fetchCalendars,
  createProxyOutlookCalendar: createProxyOutlookCalendar,
  syncProxyOutlookCalendar: syncProxyOutlookCalendar,
  syncCalendars: syncCalendars
}
