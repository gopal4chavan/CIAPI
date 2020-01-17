'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'CalendarEvents',
        'isMasterEvent'
      ),
      queryInterface.removeColumn(
        'CalendarEvents',
        'masterId'
      ),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'CalendarEvents',
        'isMasterEvent',
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        'CalendarEvents',
        'masterId',
        Sequelize.INTEGER
      ),
    ])
  }
};
