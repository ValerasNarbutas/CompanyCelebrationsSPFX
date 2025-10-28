import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/items/get-all";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';
import { ICelebrationService } from './ICelebrationService';

export class CelebrationService implements ICelebrationService {
  private sp: SPFI;
  private listName: string;
  private webUrl: string;

  constructor(sp: SPFI, listName: string = "CompanyCelebrations", webUrl?: string) {
    this.sp = sp;
    this.listName = listName;
    this.webUrl = webUrl || '';
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

  private async checkFieldExists(fieldName: string): Promise<boolean> {
    try {
      await this.getList().fields.getByInternalNameOrTitle(fieldName)();
      return true;
    } catch {
      console.log(`Field ${fieldName} does not exist`);
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
      
      // Add Person field
      await listAddResult.list.fields.addUser("CelebrationPerson", {
        Title: "CelebrationPerson",
        Required: true,
        SelectionMode: 0 // 0 = single person, 1 = multiple people
      });
      
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
      
      // Only add Special Day events as sample data (no employee birthdays)
      const sampleEvents = [
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
        },
        {
          Title: "Summer Party",
          CelebrationDate: new Date(today.getFullYear(), 6, 20).toISOString(), // July 20
          CelebrationType: "Special Day",
          CelebrationNotes: "Annual summer company event"
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
      // Check if CelebrationPerson field exists
      const hasPersonField = await this.checkFieldExists("CelebrationPerson");
      
      let items;
      if (hasPersonField) {
        items = await this.getList().items
          .select("Id", "Title", "CelebrationPerson/Id", "CelebrationPerson/Title", "CelebrationPerson/EMail", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
          .expand("CelebrationPerson")
          .orderBy("CelebrationDate", true)();
      } else {
        items = await this.getList().items
          .select("Id", "Title", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
          .orderBy("CelebrationDate", true)();
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return items.map((item: any) => this.mapToEvent(item));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to retrieve celebration events");
    }
  }

  public async getEventsByType(type: EventType): Promise<ICelebrationEvent[]> {
    try {
      // Check if CelebrationPerson field exists
      const hasPersonField = await this.checkFieldExists("CelebrationPerson");
      
      let items;
      if (hasPersonField) {
        items = await this.getList().items
          .select("Id", "Title", "CelebrationPerson/Id", "CelebrationPerson/Title", "CelebrationPerson/EMail", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
          .expand("CelebrationPerson")
          .filter(`CelebrationType eq '${type}'`)
          .orderBy("CelebrationDate", true)();
      } else {
        items = await this.getList().items
          .select("Id", "Title", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
          .filter(`CelebrationType eq '${type}'`)
          .orderBy("CelebrationDate", true)();
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return items.map((item: any) => this.mapToEvent(item));
    } catch (error) {
      console.error("Error fetching events by type:", error);
      throw new Error("Failed to retrieve celebration events");
    }
  }

  public async addEvent(event: ICelebrationEventFormData): Promise<ICelebrationEvent> {
    try {
      // Check if CelebrationPerson field exists
      const hasPersonField = await this.checkFieldExists("CelebrationPerson");
      
      const itemData: Record<string, string | number> = {
        Title: event.Title,
        CelebrationDate: event.EventDate,
        CelebrationType: event.EventType,
        CelebrationNotes: event.Notes || ""
      };

      // Add PersonId if provided and field exists
      if (hasPersonField && event.PersonId) {
        itemData.CelebrationPersonId = event.PersonId;
      }

      const item = await this.getList().items.add(itemData);
      
      // Fetch the added item with Person info if field exists
      let addedItem;
      if (hasPersonField) {
        addedItem = await this.getList().items.getById(item.data.Id)
          .select("Id", "Title", "CelebrationPerson/Id", "CelebrationPerson/Title", "CelebrationPerson/EMail", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")
          .expand("CelebrationPerson")();
      } else {
        addedItem = await this.getList().items.getById(item.data.Id)
          .select("Id", "Title", "CelebrationDate", "CelebrationType", "CelebrationNotes", "Created", "Modified")();
      }
      
      return this.mapToEvent(addedItem);
    } catch (error) {
      console.error("Error adding event:", error);
      throw new Error("Failed to add celebration event");
    }
  }

  public async updateEvent(id: number, event: Partial<ICelebrationEventFormData>): Promise<void> {
    try {
      // Check if CelebrationPerson field exists
      const hasPersonField = await this.checkFieldExists("CelebrationPerson");
      
      const updateData: Record<string, string | number | undefined> = {};
      if (event.Title !== undefined) updateData.Title = event.Title;
      
      // Only update PersonId if field exists and value is provided
      if (hasPersonField && event.PersonId !== undefined) {
        updateData.CelebrationPersonId = event.PersonId;
      }
      
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
    const event: ICelebrationEvent = {
      Id: item.Id,
      Title: item.Title || (item.CelebrationPerson ? item.CelebrationPerson.Title : "Unknown"),
      EventDate: item.CelebrationDate,
      EventType: item.CelebrationType,
      Notes: item.CelebrationNotes,
      Created: item.Created,
      Modified: item.Modified
    };

    // Add Person info if available
    if (item.CelebrationPerson) {
      const photoUrl = this.webUrl 
        ? `${this.webUrl}/_layouts/15/userphoto.aspx?size=L&username=${item.CelebrationPerson.EMail}`
        : `/_layouts/15/userphoto.aspx?size=L&username=${item.CelebrationPerson.EMail}`;
      
      event.Person = {
        Id: item.CelebrationPerson.Id,
        Title: item.CelebrationPerson.Title,
        EMail: item.CelebrationPerson.EMail,
        Picture: photoUrl
      };
    }

    return event;
  }

  public async getUserPhotoUrl(email: string): Promise<string> {
    return this.webUrl
      ? `${this.webUrl}/_layouts/15/userphoto.aspx?size=L&username=${email}`
      : `/_layouts/15/userphoto.aspx?size=L&username=${email}`;
  }
}
