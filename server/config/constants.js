const CALENDAR_DOMAIN_TYPES = {
  GOOGLE: 'google',
  OUTLOOK: 'outlook'
}
const CALENDAR_TYPES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  PROXY: 'proxy'
}
const PROXY_CALENDARS = {
  GOOGLE: 'googleProxy',
  OUTLOOK: 'outlookProxy'
}
const CALENDAR_EVENT_DOMAIN_TYPES = {
  GOOGLE: 'googleCalendarEvent',
  OUTLOOK: 'outlookCalendarEvent'
}
const CALENDAR_EVENT_TYPES = {
  SINGLE_INSTANCE: 'singleInstance',
  OCCURRENCE: 'occurrence',
  EXCEPTION: 'exception',
  SERIES_MASTER: 'seriesMaster',
}
const RSVPOPTIONS = ['Going?', 'Yes', 'Maybe', 'No'];
const CALENDAR_INVITATION_RESPONSE = {
  GOOGLE: {
    'needsAction': RSVPOPTIONS[0],
    'accepted': RSVPOPTIONS[1], 
    'tentative': RSVPOPTIONS[2], 
    'declined': RSVPOPTIONS[3] 
  },
  OUTLOOK: {
    'notResponded': RSVPOPTIONS[0],
    'accepted': RSVPOPTIONS[1],
    'tentativelyAccepted': RSVPOPTIONS[2],
    'declined': RSVPOPTIONS[3]
  }
}
const ALL_WEEK_DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

const MAPPING_WEEK_DAYS = {
  'SU': ALL_WEEK_DAYS[0],
  'MO': ALL_WEEK_DAYS[1],
  'TU': ALL_WEEK_DAYS[2],
  'WE': ALL_WEEK_DAYS[3],
  'TH': ALL_WEEK_DAYS[4],
  'FR': ALL_WEEK_DAYS[5],
  'SA': ALL_WEEK_DAYS[6]
}

const INDEX = ['last', 'first', 'second', 'third', 'fourth'];
const INDEX_MAP = {
  'first': 1,
  'second': 2,
  'third': 3,
  'fourth': 4,
  'last': 0,
}

const REGEX_PATTERN_KEYS = {
  FREQ: 'FREQ=',
  BYDAY: 'BYDAY=',
  INTERVAL: 'INTERVAL=',
  COUNT: 'COUNT=',
  UNTIL: 'UNTIL=',
}

module.exports = {
  CALENDAR_DOMAIN_TYPES: CALENDAR_DOMAIN_TYPES,
  CALENDAR_TYPES: CALENDAR_TYPES,
  PROXY_CALENDARS: PROXY_CALENDARS,
  CALENDAR_EVENT_DOMAIN_TYPES: CALENDAR_EVENT_DOMAIN_TYPES,
  CALENDAR_INVITATION_RESPONSE: CALENDAR_INVITATION_RESPONSE,
  RSVPOPTIONS: RSVPOPTIONS,
  ALL_WEEK_DAYS: ALL_WEEK_DAYS,
  CALENDAR_EVENT_TYPES: CALENDAR_EVENT_TYPES,
  MAPPING_WEEK_DAYS: MAPPING_WEEK_DAYS,
  REGEX_PATTERN_KEYS: REGEX_PATTERN_KEYS,
  INDEX: INDEX,
  INDEX_MAP: INDEX_MAP
}