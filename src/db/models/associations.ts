import Booking from './Booking.model';
import BookingDate from './BookingDate.model';
import BookingTimeSlot from './BookingTimeSlot.model';
import DateTimeSlot from './DateTimeSlot.model';
import IdempotencyKey from './IdempotencyKey.model';

export function setupAssociations() {
    /**
   * Direct relationship:
   * One booking date has many date-time slots.
   */
    BookingDate.hasMany(DateTimeSlot, {
        foreignKey: 'bookingDateId',
        as: 'dateTimeSlots',
    });

    DateTimeSlot.belongsTo(BookingDate, {
        foreignKey: 'bookingDateId',
        as: 'bookingDate',
    });

    /**
   * Direct relationship:
   * One time slot appears in many date-time slots.
   */
    BookingTimeSlot.hasMany(DateTimeSlot, {
        foreignKey: 'bookingTimeSlotId',
        as: 'dateTimeSlots',
    });

    DateTimeSlot.belongsTo(BookingTimeSlot, {
        foreignKey: 'bookingTimeSlotId',
        as: 'timeSlot',
    });

    /**
   * Many-to-many relationship:
   * One date has many time slots.
   * One time slot belongs to many dates.
   */
    BookingDate.belongsToMany(BookingTimeSlot, {
        through: DateTimeSlot,
        foreignKey: 'bookingDateId',
        otherKey: 'bookingTimeSlotId',
        as: 'timeSlots',
    });

    BookingTimeSlot.belongsToMany(BookingDate, {
        through: DateTimeSlot,
        foreignKey: 'bookingTimeSlotId',
        otherKey: 'bookingDateId',
        as: 'bookingDates',
    });


    /**
   * BookingDate → DateTimeSlot
   */
    BookingDate.hasMany(DateTimeSlot, {
        foreignKey: 'bookingDateId',
        as: 'dateTimeSlots',
    });

    DateTimeSlot.belongsTo(BookingDate, {
        foreignKey: 'bookingDateId',
        as: 'bookingDate',
    });

    /**
   * BookingTimeSlot → DateTimeSlot
   */
    BookingTimeSlot.hasMany(DateTimeSlot, {
        foreignKey: 'bookingTimeSlotId',
        as: 'dateTimeSlots',
    });

    DateTimeSlot.belongsTo(BookingTimeSlot, {
        foreignKey: 'bookingTimeSlotId',
        as: 'timeSlot',
    });

    /**
   * Many-to-many relationship:
   * BookingDate ↔ BookingTimeSlot through DateTimeSlot
   */
    BookingDate.belongsToMany(BookingTimeSlot, {
        through: DateTimeSlot,
        foreignKey: 'bookingDateId',
        otherKey: 'bookingTimeSlotId',
        as: 'timeSlots',
    });

    BookingTimeSlot.belongsToMany(BookingDate, {
        through: DateTimeSlot,
        foreignKey: 'bookingTimeSlotId',
        otherKey: 'bookingDateId',
        as: 'bookingDates',
    });


    /**
   * DateTimeSlot → Booking
   *
   * Keep hasMany, not hasOne.
   * Why?
   * A slot may have one confirmed booking now,
   * but later if cancelled/rebooked, you may keep booking history.
   */
    DateTimeSlot.hasMany(Booking, {
        foreignKey: 'dateTimeSlotId',
        as: 'bookings',
    });

    Booking.belongsTo(DateTimeSlot, {
        foreignKey: 'dateTimeSlotId',
        as: 'dateTimeSlot',
    });


    /**
   * Booking → IdempotencyKey
   */
    Booking.hasOne(IdempotencyKey, {
        foreignKey: 'bookingId',
        as: 'idempotencyKey',
    });

    IdempotencyKey.belongsTo(Booking, {
        foreignKey: 'bookingId',
        as: 'booking',
    });
}