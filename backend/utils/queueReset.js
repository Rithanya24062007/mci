/**
 * Queue Reset Utility
 * Handles daily reset of queue counters at midnight
 */

/**
 * Check if queue needs to be reset for a new day and perform reset if needed
 * @param {Object} client - Database client (for transaction support)
 * @param {Number} staffId - Staff ID to check/reset
 * @returns {Promise<Boolean>} - Returns true if reset was performed
 */
async function checkAndResetQueue(client, staffId) {
    try {
        // Get current queue state
        const queueResult = await client.query(
            'SELECT last_reset_date FROM staff_queue WHERE staff_id = $1 FOR UPDATE',
            [staffId]
        );

        if (queueResult.rows.length === 0) {
            return false; // Queue doesn't exist
        }

        const lastResetDate = queueResult.rows[0].last_reset_date;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Check if we need to reset (last reset was before today)
        if (!lastResetDate || lastResetDate < today) {
            console.log(`Resetting queue for staff ${staffId} - Last reset: ${lastResetDate}, Today: ${today}`);
            
            // Reset the queue counters
            await client.query(
                `UPDATE staff_queue 
                 SET last_issued_token = 0, 
                     current_serving_token = 0, 
                     last_reset_date = CURRENT_DATE 
                 WHERE staff_id = $1`,
                [staffId]
            );

            // Mark any remaining tokens from previous day as completed
            await client.query(
                `UPDATE tokens 
                 SET status = 'completed', 
                     completed_at = CURRENT_TIMESTAMP 
                 WHERE staff_id = $1 
                 AND status IN ('waiting', 'serving')
                 AND DATE(created_at) < CURRENT_DATE`,
                [staffId]
            );

            console.log(`✓ Queue reset completed for staff ${staffId}`);
            return true;
        }

        return false; // No reset needed
    } catch (error) {
        console.error('Error in checkAndResetQueue:', error);
        throw error;
    }
}

/**
 * Reset all staff queues (useful for manual reset or scheduled jobs)
 * @param {Object} pool - Database pool
 * @returns {Promise<Number>} - Number of queues reset
 */
async function resetAllQueues(pool) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get all staff IDs
        const staffResult = await client.query('SELECT id FROM staff');
        const staffIds = staffResult.rows.map(row => row.id);

        let resetCount = 0;
        for (const staffId of staffIds) {
            const wasReset = await checkAndResetQueue(client, staffId);
            if (wasReset) resetCount++;
        }

        await client.query('COMMIT');
        return resetCount;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    checkAndResetQueue,
    resetAllQueues
};
