import { OnInit, Component, inject, signal, computed } from '@angular/core';
import { HaApiService } from '../../services/api-service';
import { IApiResultEntityState, IAvailableScript } from '../../interfaces/api-result-entity-state';
import { LocalStorage } from '../../interfaces/enums';
import { Dock } from "../../components/dock/dock";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  imports: [Dock, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  protected readonly apiService = inject(HaApiService);

  protected allScripts = signal(Array<IAvailableScript>());
  protected scriptFilterValue = signal("");
  protected errorMessage: string = "";
  protected showError = signal(false);

  protected filteredScripts = computed(() => {
    return [...this.allScripts()].filter(s => s.Name.includes(this.scriptFilterValue()));
  });

  ngOnInit(): void {

    // if we have a current list of available scripts in browser storage, use that and don't retrieve from api.
    if (localStorage.getItem(LocalStorage.gnaAvailableScripts)) {
      this.allScripts.set(JSON.parse(localStorage.getItem(LocalStorage.gnaAvailableScripts)!));
    } else {
      this.refreshFromHa();
    }
  }

  toggleScriptAvailability(entityId: string) {
    let scripts = [...this.allScripts()];
    for (const script of scripts) {
      if (script.EntityId === entityId) {
        script.Active = !script.Active;
        break;
      }
    }
    this.allScripts.set(scripts);
    localStorage.setItem(LocalStorage.gnaAvailableScripts, JSON.stringify(scripts));
  }

  allowAll() {
    let scripts = [...this.allScripts()];
    for (const script of scripts) {
      script.Active = true;
    }
    this.allScripts.set(scripts);
    localStorage.setItem(LocalStorage.gnaAvailableScripts, JSON.stringify(scripts));
  }

  hideAll() {
    let scripts = [...this.allScripts()];
    for (const script of scripts) {
      script.Active = false;
    }
    this.allScripts.set(scripts);
    localStorage.setItem(LocalStorage.gnaAvailableScripts, JSON.stringify(scripts));
  }

  refreshFromHa() {
    this.allScripts.set([]);
    let scriptsToAdd: IAvailableScript[] = [];

    this.apiService.getStates().subscribe({
      next: (states: IApiResultEntityState[]) => {
        for (const state of states) {
          if (state.entity_id.startsWith('script')) {
            scriptsToAdd.push(
              {
                EntityId: state.entity_id,
                Name: state.attributes.friendly_name,
                Active: this.checkStoredActiveStateForEntity(state.entity_id)
              }
            );
            scriptsToAdd.sort((a, b) => a.Name.localeCompare(b.Name));
            this.allScripts.set(scriptsToAdd);
          }
        }

        localStorage.setItem('gna-available-scripts', JSON.stringify(this.allScripts()));
      },
      error: (err) => {
        this.errorMessage = "An error occurred retrieving scripts from Home Assistant. Check browser console for details.";
        console.log("Error in call from settings component to apiService.getStates:", err);
        this.showError.set(true);
      }
    });
  }

  checkStoredActiveStateForEntity(entityId: string): boolean {
    const storedStatesString = localStorage.getItem(LocalStorage.gnaAvailableScripts);
    if (!storedStatesString) return false;

    const storedStates: Array<IAvailableScript> = JSON.parse(storedStatesString);
    return storedStates?.find(s => s.EntityId === entityId)?.Active ?? false;
  }
}

