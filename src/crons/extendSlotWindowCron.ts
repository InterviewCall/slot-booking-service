import cron from 'node-cron';

import logger from '../configs/logger.config';
import SlotWindowRepository from '../repositories/SlotWindow.repository';
import SlotWindowService from '../services/SlotWindow.service';

const slotWindowService = new SlotWindowService(new SlotWindowRepository());

async function runExtendSlotWindow(): Promise<void> {
    try {
        await slotWindowService.extendSlotWindow();
    } catch (error) {
        logger.error('Failed to extend the slot window', { error });
    }
}

export function extendSlotWindowCron(): void {
    // Catch up immediately on boot (fresh deploy, or the server was down over midnight) ...
    void runExtendSlotWindow();

    // ... then top the window up every day just after midnight IST.
    cron.schedule('5 0 * * *', runExtendSlotWindow, { timezone: 'Asia/Kolkata' });
}
