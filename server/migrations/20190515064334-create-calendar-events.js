'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CalendarEvents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      location: {
        type: Sequelize.TEXT
      },
      startTime: {
        type: Sequelize.DATE
      },
      startTimezone: {
        type: Sequelize.STRING
      },
      endTime: {
        type: Sequelize.DATE
      },
      endTimezone: {
        type: Sequelize.STRING
      },
      organizerName: {
        type: Sequelize.STRING
      },
      organizerEmail: {
        type: Sequelize.STRING
      },
      allDay: {
        type: Sequelize.BOOLEAN
      },
      start: {
        type: Sequelize.DATE
      },
      end: {
        type: Sequelize.DATE
      },
      attendees: {
        type: Sequelize.ARRAY(Sequelize.TEXT)
      },
      isMasterEvent: {
        type: Sequelize.BOOLEAN
      },
      masterId: {
        type: Sequelize.INTEGER
      },
      rsvpStatus: {
        type: Sequelize.STRING
      },
      showAs: {
        type: Sequelize.STRING
      },
      recurringEventId: {
        type: Sequelize.INTEGER
      },
      recurringEventRegex: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      userId:{
        type: Sequelize.INTEGER,
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id',
          as: 'userId',
        }
      },
      calendarId: {
        type: Sequelize.INTEGER,
        onDelete: 'CASCADE',
        references: {
          model: 'Calendars',
          key: 'id',
          as: 'calendarId',
        }
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CalendarEvents');
  }
};