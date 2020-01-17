'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('CalendarEvents','recurringEventId',Sequelize.TEXT)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('CalendarEvents','recurringEventId',Sequelize.INTEGER)
  }
};
