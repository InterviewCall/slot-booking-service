import BookingRepository from '../repositories/Booking.repository';
import CrmOutboxRepository from '../repositories/CrmOutbox.repository';
import CrmSyncService from './CrmSync.service';

// One sender for the whole process: the services queue into it, server.ts starts its retry loop.
const crmSync = new CrmSyncService(new CrmOutboxRepository(), new BookingRepository());

export default crmSync;
