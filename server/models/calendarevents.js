'use strict';
module.exports = (sequelize, DataTypes) => {
  const CalendarEvents = sequelize.define('CalendarEvents', {
    externalEventId: DataTypes.TEXT,
    proxyExternalEventId: DataTypes.TEXT,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    location: DataTypes.TEXT,
    startTime: DataTypes.DATE,
    startTimezone: DataTypes.STRING,
    endTime: DataTypes.DATE,
    endTimezone: DataTypes.STRING,
    organizerName: DataTypes.STRING,
    organizerEmail: DataTypes.STRING,
    allDay: DataTypes.BOOLEAN,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    attendees: DataTypes.ARRAY(DataTypes.STRING),
    rsvpStatus: DataTypes.STRING,
    showAs: DataTypes.STRING,
    recurringEventId: DataTypes.TEXT,
    recurringEventRegex: DataTypes.ARRAY(DataTypes.STRING),
    recurringEventObject: DataTypes.TEXT,
    eventType: DataTypes.STRING,
    domainType: DataTypes.STRING,
  }, {});
  CalendarEvents.associate = function(models) {
    // associations can be defined here
    CalendarEvents.belongsTo(models.User,{
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    }),
    CalendarEvents.belongsTo(models.Calendar,{
      foreignKey: 'calendarId',
      onDelete: 'CASCADE',
    })
  };
  return CalendarEvents;
};