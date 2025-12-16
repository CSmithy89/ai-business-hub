/**
 * BM-CRM Module Installer
 * Handles custom installation logic
 */

module.exports = {
  /**
   * Run custom installation steps
   * @param {Object} options - Installation options
   * @returns {Promise<boolean>}
   */
  async install(options) {
    const { logger } = options;

    logger.log('Running BM-CRM custom installer...');
    logger.log('✅ CRM Configuration generated');
    logger.log('⚠️  REMINDER: You must run database migrations to create the crm_* tables.');
    logger.log('   Run: pnpm db:migrate');

    return true;
  }
};
