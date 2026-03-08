# Daily Token Reset Feature

## Overview
The queue management system now automatically resets all token counters to zero every 24 hours (at the start of each new day). This ensures that each day starts with a fresh token sequence.

## How It Works

### Automatic Detection
- The system checks if a reset is needed whenever:
  1. A customer books a new token
  2. A staff member loads their queue dashboard

### Reset Process
When a new day is detected (based on the `last_reset_date` in the database):

1. **Token Counters Reset**
   - `last_issued_token` → 0
   - `current_serving_token` → 0
   - `last_reset_date` → Current date

2. **Old Tokens Cleanup**
   - Any tokens from previous days still in 'waiting' or 'serving' status are marked as 'completed'
   - This prevents leftover tokens from appearing in today's queue

### Database Changes
A new column `last_reset_date` was added to the `staff_queue` table:
```sql
ALTER TABLE staff_queue 
ADD COLUMN last_reset_date DATE DEFAULT CURRENT_DATE;
```

## Files Modified

### Backend Files
1. **Migration Script**: `backend/migrate_daily_reset.js`
   - Adds the `last_reset_date` column to existing databases

2. **Utility Function**: `backend/utils/queueReset.js`
   - `checkAndResetQueue(client, staffId)` - Checks and resets a single queue if needed
   - `resetAllQueues(pool)` - Resets all queues (useful for manual resets)

3. **Controllers Updated**:
   - `backend/controllers/publicController.js` - Added reset check in `bookToken()`
   - `backend/controllers/staffController.js` - Added reset check in `getStaffQueue()`

### Database Files
Updated all SQL schema files to include the new column:
- `database/schema.sql`
- `database/setup.sql`
- `database/complete_setup.sql`

## Usage

### Running the Migration
If you have an existing database, run the migration:
```bash
cd backend
node migrate_daily_reset.js
```

### Manual Reset (if needed)
You can manually trigger a reset for all queues:
```javascript
const { resetAllQueues } = require('./utils/queueReset');
const pool = require('./config/database');

async function manualReset() {
    const resetCount = await resetAllQueues(pool);
    console.log(`Reset ${resetCount} queues`);
}
```

## Technical Details

### Date Comparison
The system uses PostgreSQL's `CURRENT_DATE` to ensure consistent date handling:
- Timezone-aware date storage
- Compares only the date portion (not time)
- Format: `YYYY-MM-DD`

### Transaction Safety
All reset operations are wrapped in database transactions to ensure:
- Atomicity: Reset either completes fully or not at all
- Consistency: No partial resets or data corruption
- Isolation: No race conditions when multiple operations occur

### Performance
- Reset check adds minimal overhead (single query per operation)
- Reset happens once per day per staff
- Uses database locking (`FOR UPDATE`) to prevent race conditions

## Testing

### Simulate Next Day
To test the reset without waiting 24 hours:

1. **Manually change the date in database**:
```sql
UPDATE staff_queue SET last_reset_date = '2026-03-04' WHERE staff_id = 1;
```

2. **Trigger a reset**:
   - Book a new token, OR
   - Load the staff dashboard

3. **Verify reset**:
```sql
SELECT * FROM staff_queue WHERE staff_id = 1;
-- Should show last_issued_token = 0, current_serving_token = 0, last_reset_date = '2026-03-05'
```

## Benefits

✅ **Automatic** - No manual intervention required  
✅ **Consistent** - Same token sequence every day (1, 2, 3...)  
✅ **Clean** - No leftover tokens from previous days  
✅ **Reliable** - Transaction-based, no data loss  
✅ **Efficient** - Minimal performance impact  

## Future Enhancements

Possible improvements:
- Configurable reset time (e.g., 6 AM instead of midnight)
- Weekly/monthly reset options
- Reset notification logs
- Admin dashboard to view reset history
