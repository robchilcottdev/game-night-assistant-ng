import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IApiResultEntityState } from '../interfaces/api-result-entity-state';
import { of } from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HaApiService {
  protected readonly http = inject(HttpClient);

  getStates() {
    if (!environment.production) {
      const mockData: IApiResultEntityState[] = [];

      for (let i = 0; i < 101; i++) {
        mockData.push(
          {
            entity_id: `script.test${i}`,
            attributes: {
              friendly_name: `Test entity with reasonably long name no. ${i}`
            }
          },
        )
      };

      return of(mockData);
    }
    return this.http.get<IApiResultEntityState[]>(`./api/get-states`);
  }

  runScript(entityId: string) {
    return this.http.post('./api/run-script', { entityId: entityId });
  }
}
