'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DailyMachineAudits', 'end_of_day_coins', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Số xu cuối ngày'
    });

    await queryInterface.addColumn('DailyMachineAudits', 'coin_value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 1000,
      comment: 'Giá trị mỗi xu (VND)'
    });

    await queryInterface.addColumn('DailyMachineAudits', 'gift_cost', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Giá vốn mỗi gấu bông (VND)'
    });

    await queryInterface.addColumn('DailyMachineAudits', 'revenue', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Doanh thu = số xu cuối ngày * giá trị xu - (số gấu đầu ngày - số gấu cuối ngày) * giá vốn gấu'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DailyMachineAudits', 'end_of_day_coins');
    await queryInterface.removeColumn('DailyMachineAudits', 'coin_value');
    await queryInterface.removeColumn('DailyMachineAudits', 'gift_cost');
    await queryInterface.removeColumn('DailyMachineAudits', 'revenue');
  }
}; 