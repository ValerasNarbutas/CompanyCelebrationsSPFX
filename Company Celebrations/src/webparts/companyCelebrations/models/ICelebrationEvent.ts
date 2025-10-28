export type EventType = 'Birthday' | 'Special Day';

export interface IPersonInfo {
  Id: number;
  Title: string; // Display name
  EMail?: string;
  Picture?: string; // Profile picture URL
}

export interface ICelebrationEvent {
  Id: number;
  Title: string; // For backward compatibility
  Person?: IPersonInfo; // New Person field
  EventDate: string; // ISO date string
  EventType: EventType;
  Notes?: string;
  Created?: string;
  Modified?: string;
}

export interface ICelebrationEventFormData {
  Title: string; // Will be used if Person is not selected
  PersonId?: number; // Person lookup ID
  EventDate: string;
  EventType: EventType;
  Notes?: string;
}

export interface IEventWithCountdown extends ICelebrationEvent {
  nextOccurrence: Date;
  daysUntil: number;
}
