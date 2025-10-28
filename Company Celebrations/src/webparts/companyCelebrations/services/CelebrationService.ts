import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/items/get-all";
import "@pnp/sp/fields";
import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';
import { ICelebrationService } from './ICelebrationService';

export class CelebrationService implements ICelebrationService {
  private sp: SPFI;
  private listName: string;

  constructor(sp: SPFI, listName: string = "CompanyCelebrations") {
    this.sp = sp;
    this.listName = listName;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getList(): any {
    return this.sp.web.lists.getByTitle(this.listName);
  }

  public async ensureList(): Promise<boolean> {
    try {
      await this.getList().select("Title")();
      return true;
    } catch (error) {
      console.error("List does not exist:", error);
      return false;
    }
  }

  public async createList(): Promise<void> {
    try {
      // Check if list already exists
      const lists = await this.sp.web.lists();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingList = lists.filter((list: any) => list.Title === this.listName)[0];
      
      if (existingList) {
        throw new Error(`List '${this.listName}' already exists!`);
      }

      // Create the list
      const listAddResult = await this.sp.web.lists.add(this.listName, "Company celebration events including birthdays and special days", 100, false);
      
      // Add EventDate field - using internal name without space
      await listAddResult.list.fields.addDateTime("CelebrationDate", { 
        Title: "CelebrationDate", 
        Required: true 
      });
      
      // Add EventType field (Choice)
      await listAddResult.list.fields.addChoice("CelebrationType", {
        Title: "CelebrationType",
        Choices: ["Birthday", "Special Day"],
        EditFormat: 0, // Dropdown
        FillInChoice: false,
        Required: true
      });
      
      // Add Notes field
      await listAddResult.list.fields.addMultilineText("CelebrationNotes", {
        Title: "CelebrationNotes",
        RichText: false,
        NumberOfLines: 6,
        Required: false
      });

      console.log(`List '${this.listName}' created successfully!`);
    } catch (error) {
      console.error("Error creating list:", error);
      throw error;
    }
  }

  public async addSampleData(): Promise<void> {
    try {
      const today = new Date();
      const nextMonth = new Date(today.getTime());
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const sampleEvents = [
        {
          Title: "John Smith",
          CelebrationDate: new Date(today.getFullYear(), 2, 15).toISOString(), // March 15
          CelebrationType: "Birthday",
          CelebrationNotes: "Loves chocolate cake!"
        },
        {
          Title: "Sarah Johnson",
          CelebrationDate: new Date(today.getFullYear(), 5, 22).toISOString(), // June 22
          CelebrationType: "Birthday",
          CelebrationNotes: "Coffee enthusiast"
        },
        {
          Title: "Mike Wilson",
          CelebrationDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10).toISOString(),
          CelebrationType: "Birthday",
          CelebrationNotes: ""
        },
        {
          Title: "Company Anniversary",
          CelebrationDate: new Date(today.getFullYear(), 8, 1).toISOString(), // September 1
          CelebrationType: "Special Day",
          CelebrationNotes: "Founded in 2010 - celebrating 15 years!"
        },
        {
          Title: "Team Building Day",
          CelebrationDate: new Date(today.getFullYear(), 11, 15).toISOString(), // December 15
          CelebrationType: "Special Day",
          CelebrationNotes: "Annual team celebration"
        }
      ];

      const list = this.getList();
      
      for (const event of sampleEvents) {
        try {
          await list.items.add(event);
          console.log(`Added event: ${event.Title}`);
        } catch (itemError) {
          console.error(`Failed to add event ${event.Title}:`, itemError);
          throw itemError;
        }
      }

      console.log("Sample data added successfully!");
    } catch (error) {
      console.error("Error adding sample data:", error);
      throw error;
    }
  }

  public async getEvents(): Promise<ICelebrationEvent[]> {
    try {
      const items = await this.getList().items
        .select("Id", "Title", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
        .orderBy("CelebrationDate", true)();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return items.map((item: any) => this.mapToEvent(item));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to retrieve celebration events");
    }
  }

  public async getEventsByType(type: EventType): Promise<ICelebrationEvent[]> {
    try {
      const items = await this.getList().items
        .select("Id", "Title", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
        .filter(`CelebrationType eq '${type}'`)
        .orderBy("CelebrationDate", true)();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return items.map((item: any) => this.mapToEvent(item));
    } catch (error) {
      console.error("Error fetching events by type:", error);
      throw new Error("Failed to retrieve celebration events");
    }
  }

  public async addEvent(event: ICelebrationEventFormData): Promise<ICelebrationEvent> {
    try {
      const item = await this.getList().items.add({
        Title: event.Title,
        CelebrationDate: event.EventDate,
        CelebrationType: event.EventType,
        CelebrationNotes: event.Notes || ""
      });
      
      return this.mapToEvent(item.data);
    } catch (error) {
      console.error("Error adding event:", error);
      throw new Error("Failed to add celebration event");
    }
  }

  public async updateEvent(id: number, event: Partial<ICelebrationEventFormData>): Promise<void> {
    try {
      const updateData: Record<string, string | undefined> = {};
      if (event.Title !== undefined) updateData.Title = event.Title;
      if (event.EventDate !== undefined) updateData.CelebrationDate = event.EventDate;
      if (event.EventType !== undefined) updateData.CelebrationType = event.EventType;
      if (event.Notes !== undefined) updateData.CelebrationNotes = event.Notes;
      
      await this.getList().items.getById(id).update(updateData);
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update celebration event");
    }
  }

  public async deleteEvent(id: number): Promise<void> {
    try {
      await this.getList().items.getById(id).delete();
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete celebration event");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEvent(item: any): ICelebrationEvent {
    return {
      Id: item.Id,
      Title: item.Title,
      EventDate: item.CelebrationDate,
      EventType: item.CelebrationType,
      Notes: item.CelebrationNotes,
      Created: item.Created,
      Modified: item.Modified
    };
  }
}
