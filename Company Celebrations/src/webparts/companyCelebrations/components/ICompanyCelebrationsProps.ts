import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ICelebrationService } from '../services/ICelebrationService';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

export interface ICompanyCelebrationsProps {
  context: WebPartContext;
  service: ICelebrationService;
  isDarkTheme: boolean;
  theme: IReadonlyTheme | undefined;
  hasTeamsContext: boolean;
  userDisplayName: string;
  listName: string;
  enableAddEvent: boolean;
  enableEditEvent: boolean;
  enableDeleteEvent: boolean;
}
