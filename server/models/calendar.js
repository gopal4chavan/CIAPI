'use strict';
const CONSTANTS = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Calendar = sequelize.define('Calendar', {
    calendarType: {
      type: DataTypes.STRING
    },
    calendarDomainType: {
      type: DataTypes.STRING
    },
    linkedCalendarId: {
      type: DataTypes.INTEGER
    },
    externalCalendarID: {
      type: DataTypes.STRING
    },
    accessToken:{
      type: DataTypes.TEXT
    },
    refreshToken:{
      type: DataTypes.TEXT
    },
    expiresAt: {
      type: DataTypes.DATE
    },
    alias: {
      type: DataTypes.STRING
    },
    isPrimary:{
      type: DataTypes.BOOLEAN
    },
    next_sync_token:{
      type: DataTypes.STRING
    },
    synced:{
      type: DataTypes.BOOLEAN
    },
    calendarName: {
      type: DataTypes.STRING
    }
  }, {});
  Calendar.associate = function(models) {
    Calendar.belongsTo(models.User,{
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    }),
    Calendar.hasMany(models.CalendarEvents,{
      foreignKey: 'calendarId',
      as: 'calendars',
    })
  };

  // Class Method to find user by ID
  Calendar.findByUserId = async function(userId, domainType){
    let calendar;
    try{
      calendar = await Calendar.findOne({
        where: {
          userId: userId,
          calendarDomainType: domainType,
          calendarType: CONSTANTS.CALENDAR_TYPES.PRIMARY
        }
      });
      if(!calendar){
        throw new Error("User doesn't have calendars");
      }
    }catch(e){
      throw new Error(e.message);
    }
    return calendar;
  };

  Calendar.prototype.clearCalendarEvents = async function(){
    try{
      await sequelize.models.CalendarEvents.destroy({
        where:{
          calendarId: this.id
        }
      });
    }catch(e){
      console.log(e);
    }
  }

  Calendar.prototype.exceptionAndOccuranceEvents = async function(seriesMasterEventRecurringId, userId){
    try{
      let events = await sequelize.models.CalendarEvents.findAll({
        where: {
          userId: userId,
          calendarId: this.id,
          recurringEventId: seriesMasterEventRecurringId,
          eventType: [CONSTANTS.CALENDAR_EVENT_TYPES.EXCEPTION, CONSTANTS.CALENDAR_EVENT_TYPES.OCCURRENCE]
        }
      });
      let exceptionEvents = events.filter(e => e.eventType == CONSTANTS.CALENDAR_EVENT_TYPES.EXCEPTION);
      let occurrenceEvents = events.filter(e => e.eventType == CONSTANTS.CALENDAR_EVENT_TYPES.OCCURRENCE);
      return [exceptionEvents, occurrenceEvents]
    }catch(e){
      console.log(e);
    }
  }

  return Calendar;
};

