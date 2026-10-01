import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import logger from '../configs/logger.config';
import { serverConfig } from '../configs/server.config';
import SlotWindowRepository from '../repositories/SlotWindow.repository';

dayjs.extend(utc);
dayjs.extend(timezone);

const BUSINESS_TIMEZONE = 'Asia/Kolkata';

class SlotWindowService {
    constructor(private readonly slotWindowRepository: SlotWindowRepository) {}

    /**
     * Makes sure dates and slots exist from today (IST) up to SLOT_WINDOW_DAYS ahead.
     * Safe to run any number of times.
     */
    async extendSlotWindow(): Promise<void> {
        const today = dayjs().tz(BUSINESS_TIMEZONE);
        const fromDate = today.format('YYYY-MM-DD');
        const toDate = today.add(serverConfig.SLOT_WINDOW_DAYS, 'day').format('YYYY-MM-DD');

        const createdDates = await this.slotWindowRepository.createMissingBookingDates(fromDate, toDate);
        const createdSlots = await this.slotWindowRepository.createMissingDateTimeSlots(fromDate, toDate);

        logger.info('Slot window is up to date', { fromDate, toDate, createdDates, createdSlots });
    }
}

export default SlotWindowService;
