import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Generic } from './pages/generic/generic';
import { Settings } from './pages/settings/settings';
import { Farkle } from './pages/farkle/farkle';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'generic', component: Generic },
    { path: 'farkle', component: Farkle },
    { path: 'settings', component: Settings }
];
