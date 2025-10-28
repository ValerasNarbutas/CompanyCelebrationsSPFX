import { ICelebrationEvent, IEventWithCountdown } from '../models/ICelebrationEvent';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  parseISO,
  differenceInDays,
  isLeapYear,
  getYear
} from 'date-fns';

export function getMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return eachDayOfInterval({ start, end });
}

export function getEventsForDate(events: ICelebrationEvent[], date: Date): ICelebrationEvent[] {
  return events.filter(event => {
    const eventDate = parseISO(event.EventDate);
    return isSameDay(eventDate, date) || 
      (format(eventDate, 'MM-dd') === format(date, 'MM-dd'));
  });
}

export function getUpcomingEvents(events: ICelebrationEvent[], limit: number = 10): IEventWithCountdown[] {
  const today = new Date();
  const currentYear = getYear(today);
  
  const eventsWithNextOccurrence = events.map(event => {
    const eventDate = parseISO(event.EventDate);
    const month = eventDate.getMonth();
    const day = eventDate.getDate();
    
    let nextOccurrence = new Date(currentYear, month, day);
    
    // Handle leap year birthdays
    if (month === 1 && day === 29 && !isLeapYear(currentYear)) {
      nextOccurrence = new Date(currentYear, 1, 28);
    }
    
    // If the date has passed this year, move to next year
    if (nextOccurrence < today) {
      nextOccurrence = new Date(currentYear + 1, month, day);
      
      if (month === 1 && day === 29 && !isLeapYear(currentYear + 1)) {
        nextOccurrence = new Date(currentYear + 1, 1, 28);
      }
    }
    
    return {
      ...event,
      nextOccurrence,
      daysUntil: differenceInDays(nextOccurrence, today)
    };
  });
  
  return eventsWithNextOccurrence
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export function formatEventDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'MMMM d');
}
