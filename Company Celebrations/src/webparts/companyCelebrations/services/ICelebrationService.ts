import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';

export interface ICelebrationService {
  /**
   * Retrieves all celebration events from SharePoint list
   */
  getEvents(): Promise<ICelebrationEvent[]>;
  
  /**
   * Retrieves events filtered by type
   */
  getEventsByType(type: EventType): Promise<ICelebrationEvent[]>;
  
  /**
   * Adds a new celebration event
   */
  addEvent(event: ICelebrationEventFormData): Promise<ICelebrationEvent>;
  
  /**
   * Updates an existing celebration event
   */
  updateEvent(id: number, event: Partial<ICelebrationEventFormData>): Promise<void>;
  
  /**
   * Deletes a celebration event
   */
  deleteEvent(id: number): Promise<void>;
  
  /**
   * Checks if the list exists
   */
  ensureList(): Promise<boolean>;
  
  /**
   * Creates the list with required columns
   */
  createList(): Promise<void>;
  
  /**
   * Adds sample data to the list
   */
  addSampleData(): Promise<void>;
}
