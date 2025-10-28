import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneButton,
  PropertyPaneButtonType
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import CompanyCelebrations from './components/CompanyCelebrations';
import { ICompanyCelebrationsProps } from './components/ICompanyCelebrationsProps';

// PnPjs imports
import { spfi, SPFx } from "@pnp/sp";
import { CelebrationService } from './services/CelebrationService';

export interface ICompanyCelebrationsWebPartProps {
  listName: string;
  enableAddEvent: boolean;
  enableEditEvent: boolean;
  enableDeleteEvent: boolean;
}

export default class CompanyCelebrationsWebPart extends BaseClientSideWebPart<ICompanyCelebrationsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _currentTheme: IReadonlyTheme | undefined;
  private _service: CelebrationService | undefined;

  public render(): void {
    // Initialize PnPjs with SPFx context
    const sp = spfi().using(SPFx(this.context));
    this._service = new CelebrationService(sp, this.properties.listName || "CompanyCelebrations");

    const element: React.ReactElement<ICompanyCelebrationsProps> = React.createElement(
      CompanyCelebrations,
      {
        context: this.context,
        service: this._service,
        isDarkTheme: this._isDarkTheme,
        theme: this._currentTheme,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        listName: this.properties.listName || "CompanyCelebrations",
        enableAddEvent: this.properties.enableAddEvent !== false,
        enableEditEvent: this.properties.enableEditEvent !== false,
        enableDeleteEvent: this.properties.enableDeleteEvent !== false
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return super.onInit();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    this._currentTheme = currentTheme;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: "Configure your Company Celebrations web part"
          },
          groups: [
            {
              groupName: "List Settings",
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: 'SharePoint List Name',
                  description: 'Name of the SharePoint list to store celebrations',
                  value: 'CompanyCelebrations'
                }),
                PropertyPaneButton('createList', {
                  text: 'Create List with Sample Data',
                  buttonType: PropertyPaneButtonType.Primary,
                  onClick: this._onCreateList.bind(this)
                })
              ]
            },
            {
              groupName: "Permissions",
              groupFields: [
                PropertyPaneToggle('enableAddEvent', {
                  label: 'Allow users to add events',
                  checked: true
                }),
                PropertyPaneToggle('enableEditEvent', {
                  label: 'Allow users to edit events',
                  checked: true
                }),
                PropertyPaneToggle('enableDeleteEvent', {
                  label: 'Allow users to delete events',
                  checked: true
                })
              ]
            }
          ]
        }
      ]
    };
  }

  private async _onCreateList(): Promise<void> {
    if (!this._service) {
      alert('Service not initialized. Please refresh the page.');
      return;
    }

    try {
      const listName = this.properties.listName || "CompanyCelebrations";
      const confirmCreate = confirm(`This will create the list '${listName}' with sample data. Continue?`);
      
      if (!confirmCreate) {
        return;
      }

      await this._service.createList();
      await this._service.addSampleData();
      
      alert(`List '${listName}' created successfully with sample data!`);
      
      // Refresh the web part
      this.render();
    } catch (error) {
      console.error('Error creating list:', error);
      alert(`Error creating list: ${error.message || error}`);
    }
  }
}