import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Generic } from './pages/generic/generic';
import { Settings } from './pages/settings/settings';
import { Farkle } from './pages/farkle/farkle';
import { SkullKing } from './pages/skull-king/skull-king';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'generic', component: Generic },
    { path: 'farkle', component: Farkle },
    { path: 'skull-king', component: SkullKing },
    { path: 'settings', component: Settings }
];
