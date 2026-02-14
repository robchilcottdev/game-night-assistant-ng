import { Component, output, input } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-dock',
  imports: [RouterLink],
  templateUrl: './dock.html',
  styleUrl: './dock.css',
})
export class Dock {
  reloadRequested = output<void>();
  settingsRequested = output<void>();
  appSettingsRequested = output<void>();
  infoRequested = output<void>();
  logRequested = output<void>();
  scriptSettingsRequested = output<void>();
  showHomeButton = input<boolean>(true);
  showReloadButton = input<boolean>(true);
  showLogButton = input<boolean>(true);
  showSettingsButton = input<boolean>(true);
  showScriptSettingsButton = input<boolean>(true);

  triggerReload(){
    this.reloadRequested.emit();
  }
  
  triggerInfo(){
    this.infoRequested.emit();
  }

  triggerLog(){
    this.logRequested.emit();
  }

  triggerSettings(){
    this.settingsRequested.emit();
  }

  triggerScriptSettings(){
    this.scriptSettingsRequested.emit();
  }

}
