'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'CalendarEvents',
      'proxyExternalEventId',
      Sequelize.TEXT
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'CalendarEvents',
      'proxyExternalEventId'
    );
  }
};
