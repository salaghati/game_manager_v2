'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    // Seed chi nhánh
    await queryInterface.bulkInsert('Branches', [{
      id: 1,
      name: 'Chi nhánh 1',
      address: '123 Đường ABC',
      phone: '0123456789',
      manager_name: 'Nguyễn Văn A',
      created_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // Seed 2 máy cho chi nhánh 1
    await queryInterface.bulkInsert('Machines', [
      {
        id: 1,
        machine_code: 'M001',
        name: 'Máy Game 1',
        branch_id: 1,
        current_points: 0,
        rate: 2,
        created_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        machine_code: 'M002',
        name: 'Máy Game 2',
        branch_id: 1,
        current_points: 0,
        rate: 2,
        created_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Seed user (password: 123456, hash demo)
    await queryInterface.bulkInsert('Users', [{
      id: 1,
      username: 'admin',
      password: '123456', // Mật khẩu thường, không hash
      full_name: 'Quản trị viên',
      branch_id: 1,
      role_id: 1,
      created_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Machines', null, {});
    await queryInterface.bulkDelete('Branches', null, {});
  }
};
