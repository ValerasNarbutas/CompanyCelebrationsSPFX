export type EventType = 'Birthday' | 'Special Day';

export interface ICelebrationEvent {
  Id: number;
  Title: string;
  EventDate: string; // ISO date string
  EventType: EventType;
  Notes?: string;
  Created?: string;
  Modified?: string;
}

export interface ICelebrationEventFormData {
  Title: string;
  EventDate: string;
  EventType: EventType;
  Notes?: string;
}

export interface IEventWithCountdown extends ICelebrationEvent {
  nextOccurrence: Date;
  daysUntil: number;
}
