import { Component, inject } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { Dock } from "../../components/dock/dock";

@Component({
  selector: 'app-home',
  imports: [RouterLink, Dock],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {
  protected router = inject(Router);

  showScriptSettings(){
    this.router.navigateByUrl('settings');
  }
}
